import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState } from './state';
import input from './input';

import Constants from '../shared/constants';

const { PLAYER_RADIUS, BULLET_RADIUS, MAP_SIZE } = Constants;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;
setCanvasDimensions();

function setCanvasDimensions() {
  // On small screens (e.g. phones), we want to "zoom out" so players can still see at least
  // 800 in-game units of width.
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

window.addEventListener('resize', debounce(40, setCanvasDimensions));

let animationFrameRequestId: number;
let showHitboxes = false;

function render() {
  input.update();

  const { me, others, bullets, portals } = getCurrentState();
  if (me) {
    renderBackground(me.x, me.y);

    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, MAP_SIZE, MAP_SIZE);

    if (portals) {
      portals.forEach(renderPortal.bind(null, me));
    }

    bullets!.forEach(renderBullet.bind(null, me));

    renderPlayer(me, me);
    others!.forEach(renderPlayer.bind(null, me));

    if (showHitboxes) {
      if (portals) {
        portals.forEach(renderHitbox.bind(null, me));
      }
      others!.forEach(renderHitbox.bind(null, me));
      renderHitbox(me, me);
    }

    renderMinimap(me, others!, portals!);
  }

  animationFrameRequestId = requestAnimationFrame(render);
}

function renderBackground(x: number, y: number) {
  const backgroundX = MAP_SIZE / 2 - x + canvas.width / 2;
  const backgroundY = MAP_SIZE / 2 - y + canvas.height / 2;
  const backgroundGradient = context.createRadialGradient(
    backgroundX,
    backgroundY,
    MAP_SIZE / 10,
    backgroundX,
    backgroundY,
    MAP_SIZE / 2,
  );
  backgroundGradient.addColorStop(0, 'black');
  backgroundGradient.addColorStop(1, 'gray');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

interface RenderObject {
  x: number;
  y: number;
  direction?: number;
  radius?: number;
}

function renderPlayer(me: RenderObject, player: RenderObject) {
  const { x, y, direction } = player;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction!);
  context.drawImage(
    getAsset('player.png'),
    -PLAYER_RADIUS,
    -PLAYER_RADIUS,
    PLAYER_RADIUS * 2,
    PLAYER_RADIUS * 2,
  );
  context.restore();
}

function renderPortal(me: RenderObject, portal: RenderObject) {
  const { x, y } = portal;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  context.drawImage(
    getAsset('portal.png'),
    canvasX - 100,
    canvasY - 100,
    200,
    200,
  );
}

function renderHitbox(me: RenderObject, object: RenderObject) {
  const { x, y } = object;
  let radius = PLAYER_RADIUS;

  if (object.radius) {
    radius = object.radius;
  }

  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
  context.stroke();
}

function renderBullet(me: RenderObject, bullet: RenderObject) {
  const { x, y } = bullet;
  context.drawImage(
    getAsset('bullet.svg'),
    canvas.width / 2 + x - me.x - BULLET_RADIUS,
    canvas.height / 2 + y - me.y - BULLET_RADIUS,
    BULLET_RADIUS * 2,
    BULLET_RADIUS * 2,
  );
}

function renderMinimap(me: RenderObject, others: RenderObject[], portals: RenderObject[]) {
  const minimapSize = 150;
  const minimapX = canvas.width - minimapSize - 10;
  const minimapY = canvas.height - minimapSize - 10;
  const scale = minimapSize / MAP_SIZE;

  context.fillStyle = 'black';
  context.fillRect(minimapX, minimapY, minimapSize, minimapSize);

  context.strokeStyle = 'white';
  context.lineWidth = 2;
  context.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

  if (portals && portals.length > 0) {
    context.fillStyle = 'blue';
    context.beginPath();
    context.arc(
      minimapX + minimapSize / 2,
      minimapY + minimapSize / 2,
      5,
      0,
      2 * Math.PI
    );
    context.fill();
  }

  others.forEach(player => {
    const minimapPlayerX = minimapX + player.x * scale;
    const minimapPlayerY = minimapY + player.y * scale;

    context.fillStyle = 'green';
    context.beginPath();
    context.arc(minimapPlayerX, minimapPlayerY, 2, 0, 2 * Math.PI);
    context.fill();
  });

  const minimapPlayerX = minimapX + me.x * scale;
  const minimapPlayerY = minimapY + me.y * scale;

  context.fillStyle = 'white';
  context.beginPath();
  context.arc(minimapPlayerX, minimapPlayerY, 3, 0, 2 * Math.PI);
  context.fill();
}

function renderMainMenu() {
  const t = Date.now() / 7500;
  const x = MAP_SIZE / 2 + 800 * Math.cos(t);
  const y = MAP_SIZE / 2 + 800 * Math.sin(t);
  renderBackground(x, y);

  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

animationFrameRequestId = requestAnimationFrame(renderMainMenu);

export function startRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(render);
}

export function stopRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

export function toggleHitboxes() {
  showHitboxes = !showHitboxes;
}

export function areHitboxesVisible(): boolean {
  return showHitboxes;
}
