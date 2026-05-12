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
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

window.addEventListener('resize', debounce(40, setCanvasDimensions));

const RENDER_DIST = MAP_SIZE / 2;

let animationFrameRequestId: number;
let showHitboxes = false;

function sqDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function isNear(me: { x: number; y: number }, obj: { x: number; y: number }): boolean {
  return sqDist(me, obj) < RENDER_DIST * RENDER_DIST;
}

function forEachNearby<T extends { x: number; y: number }>(
  me: { x: number; y: number },
  items: T[] | undefined,
  fn: (me: { x: number; y: number }, item: T) => void,
) {
  if (!items) return;
  items.forEach(item => {
    if (isNear(me, item)) fn(me, item);
  });
}

function render() {
  input.update();

  const { me, others, bullets, portals, angels, turrets } = getCurrentState();
  if (me) {
    renderBackground(me.x, me.y);

    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, MAP_SIZE, MAP_SIZE);

    if (portals) {
      portals.forEach(renderPortal.bind(null, me));
    }

    forEachNearby(me, turrets, renderTurret);
    forEachNearby(me, bullets, renderBullet);

    renderPlayer(me, me);
    forEachNearby(me, others, renderPlayer);

    forEachNearby(me, angels, renderAngel);

    if (showHitboxes) {
      forEachNearby(me, portals, renderHitbox);
      forEachNearby(me, others, renderHitbox);
      if (isNear(me, me)) renderHitbox(me, me);
    }

    renderMinimap(me, others!, portals!, angels!, turrets);
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
  hp?: number;
  maxHp?: number;
  remainingRatio?: number;
  aimDirection?: number;
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

function renderTurret(me: RenderObject, turret: RenderObject) {
  const { x, y, direction, radius, remainingRatio, aimDirection } = turret;
  const r = radius || 20;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  // Base
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction!);
  context.drawImage(
    getAsset('turret-base.png'),
    -r,
    -r,
    r * 2,
    r * 2,
  );
  context.restore();

  // Head — sprite faces right
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(aimDirection || 0);
  context.drawImage(
    getAsset('turret-head.png'),
    -r,
    -r,
    r * 2,
    r * 2,
  );
  context.restore();

  // Duration bar
  const barWidth = 30;
  const barHeight = 4;
  const barX = canvasX - barWidth / 2;
  const barY = canvasY + r + 5;

  context.fillStyle = '#333';
  context.fillRect(barX, barY, barWidth, barHeight);

  context.fillStyle = '#3498db';
  context.fillRect(barX, barY, barWidth * (remainingRatio || 0), barHeight);
}

function renderAngel(me: RenderObject, angel: RenderObject) {
  const { x, y, direction, hp, maxHp, radius } = angel;
  const r = radius || 20;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction!);
  context.drawImage(
    getAsset('angel.png'),
    -r,
    -r,
    r * 2,
    r * 2,
  );
  context.restore();

  // HP bar below angel
  const barWidth = 40;
  const barHeight = 5;
  const barX = canvasX - barWidth / 2;
  const barY = canvasY + r + 5;

  context.fillStyle = '#333';
  context.fillRect(barX, barY, barWidth, barHeight);

  context.fillStyle = '#e74c3c';
  context.fillRect(barX, barY, barWidth, barHeight);

  const hpRatio = Math.max(0, (hp || 0) / (maxHp || 1));
  context.fillStyle = '#2ecc71';
  context.fillRect(barX, barY, barWidth * hpRatio, barHeight);
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

function renderMinimap(me: RenderObject, others: RenderObject[], portals: RenderObject[], angels: RenderObject[], turrets?: RenderObject[]) {
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

  if (angels) {
    angels.forEach(angel => {
      const minimapAngelX = minimapX + angel.x * scale;
      const minimapAngelY = minimapY + angel.y * scale;
      context.fillStyle = 'yellow';
      context.beginPath();
      context.arc(minimapAngelX, minimapAngelY, 2, 0, 2 * Math.PI);
      context.fill();
    });
  }

  if (turrets) {
    turrets.forEach(turret => {
      const minimapTurretX = minimapX + turret.x * scale;
      const minimapTurretY = minimapY + turret.y * scale;
      context.fillStyle = '#4488ff';
      context.beginPath();
      context.arc(minimapTurretX, minimapTurretY, 2, 0, 2 * Math.PI);
      context.fill();
    });
  }

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
