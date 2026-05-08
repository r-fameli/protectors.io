// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#5-client-rendering
import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState } from './state';

const Constants = require('../shared/constants');

const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE } = Constants;

// Get the canvas graphics context
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
setCanvasDimensions();

function setCanvasDimensions() {
  // On small screens (e.g. phones), we want to "zoom out" so players can still see at least
  // 800 in-game units of width.
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

window.addEventListener('resize', debounce(40, setCanvasDimensions));

let animationFrameRequestId;
let showHitboxes = false;

function render() {
  const { me, others, bullets, castles } = getCurrentState();
  if (me) {
    // Draw background
    renderBackground(me.x, me.y);

    // Draw boundaries
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, MAP_SIZE, MAP_SIZE);

    // Draw all castles
    if (castles) {
      castles.forEach(renderCastle.bind(null, me));
    }

    // Draw all bullets
    bullets.forEach(renderBullet.bind(null, me));

    // Draw all players
    renderPlayer(me, me);
    others.forEach(renderPlayer.bind(null, me));

    // Draw hitboxes if enabled
    if (showHitboxes) {
      if (castles) {
        castles.forEach(renderHitbox.bind(null, me));
      }
      others.forEach(renderHitbox.bind(null, me));
      renderHitbox(me, me);
    }

    // Draw minimap
    renderMinimap(me, others, castles);
  }

  // Rerun this render function on the next frame
  animationFrameRequestId = requestAnimationFrame(render);
}

function renderBackground(x, y) {
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

// Renders Player at the given coordinates
function renderPlayer(me, player) {
  const { x, y, direction } = player;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  // Draw player
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction);
  context.drawImage(
    getAsset('player.png'),
    -PLAYER_RADIUS,
    -PLAYER_RADIUS,
    PLAYER_RADIUS * 2,
    PLAYER_RADIUS * 2,
  );
  context.restore();

  // Draw health bar
  context.fillStyle = 'white';
  context.fillRect(
    canvasX - PLAYER_RADIUS,
    canvasY + PLAYER_RADIUS + 8,
    PLAYER_RADIUS * 2,
    2,
  );
  context.fillStyle = 'red';
  context.fillRect(
    canvasX - PLAYER_RADIUS + PLAYER_RADIUS * 2 * player.hp / PLAYER_MAX_HP,
    canvasY + PLAYER_RADIUS + 8,
    PLAYER_RADIUS * 2 * (1 - player.hp / PLAYER_MAX_HP),
    2,
  );
}

function renderCastle(me, castle) {
  const { x, y } = castle;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  // Draw castle
  context.drawImage(
    getAsset('portal.png'),
    canvasX - 100,
    canvasY - 100,
    200,
    200,
  );
}

function renderHitbox(me, object) {
  const { x, y } = object;
  let radius = PLAYER_RADIUS;
  
  if (object.radius) {
    radius = object.radius;
  }

  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  // Draw hitbox outline
  context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
  context.stroke();
}

function renderBullet(me, bullet) {
  const { x, y } = bullet;
  context.drawImage(
    getAsset('bullet.svg'),
    canvas.width / 2 + x - me.x - BULLET_RADIUS,
    canvas.height / 2 + y - me.y - BULLET_RADIUS,
    BULLET_RADIUS * 2,
    BULLET_RADIUS * 2,
  );
}

function renderMinimap(me, others, castles) {
  const minimapSize = 150;
  const minimapX = canvas.width - minimapSize - 10;
  const minimapY = canvas.height - minimapSize - 10;
  const scale = minimapSize / MAP_SIZE;

  // Draw minimap background
  context.fillStyle = 'black';
  context.fillRect(minimapX, minimapY, minimapSize, minimapSize);

  // Draw minimap border
  context.strokeStyle = 'white';
  context.lineWidth = 2;
  context.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

  // Draw castle in center of minimap
  if (castles && castles.length > 0) {
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

  // Draw other players as green dots
  others.forEach(player => {
    const minimapPlayerX = minimapX + player.x * scale;
    const minimapPlayerY = minimapY + player.y * scale;
    
    context.fillStyle = 'green';
    context.beginPath();
    context.arc(minimapPlayerX, minimapPlayerY, 2, 0, 2 * Math.PI);
    context.fill();
  });

  // Draw player as white dot
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

  // Rerun this render function on the next frame
  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

animationFrameRequestId = requestAnimationFrame(renderMainMenu);

// Replaces main menu rendering with game rendering.
export function startRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(render);
}

// Replaces game rendering with main menu rendering.
export function stopRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

// Toggle hitbox visibility
export function toggleHitboxes() {
  showHitboxes = !showHitboxes;
}

// Check if hitboxes are currently visible
export function areHitboxesVisible() {
  return showHitboxes;
}