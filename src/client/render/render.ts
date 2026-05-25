import { debounce } from 'throttle-debounce';
import { getCurrentState } from '../state';
import input from '../input';

import { canvas, context, MAP_SIZE, RenderObject, isNear, forEachNearby } from './common';
import { HITBOX_STROKE, CANVAS_BLACK, GRADIENT_CENTER, GRADIENT_EDGE } from '../colors';
import { renderPlayer } from './player';
import { renderMob } from './mob';
import { renderDeployable } from './deployable';
import { renderCaltrop } from './caltrop';
import { renderPortal, renderPortalHP } from './portal';
import { renderBullet } from './bullet';
import { renderExpOrb } from './exp-orb';
import { renderMinimap } from './minimap';
import { renderWeaponCooldowns, renderExpBar } from './hud';

// ── Canvas setup ──────────────────────────────────────────

function setCanvasDimensions() {
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

setCanvasDimensions();
window.addEventListener('resize', debounce(40, setCanvasDimensions));

// ── State ──────────────────────────────────────────────────

let animationFrameRequestId: number;
let showHitboxes = false;

// ── Background ─────────────────────────────────────────────

function renderBackground(x: number, y: number) {
  const backgroundX = MAP_SIZE / 2 - x + canvas.width / 2;
  const backgroundY = MAP_SIZE / 2 - y + canvas.height / 2;
  const backgroundGradient = context.createRadialGradient(
    backgroundX, backgroundY, MAP_SIZE / 10,
    backgroundX, backgroundY, MAP_SIZE / 2,
  );
  backgroundGradient.addColorStop(0, GRADIENT_CENTER);
  backgroundGradient.addColorStop(0.4, GRADIENT_EDGE);
  backgroundGradient.addColorStop(1, GRADIENT_EDGE);
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

// ── Hitbox overlay ─────────────────────────────────────────

function renderHitbox(me: RenderObject, object: RenderObject) {
  const { x, y } = object;
  const radius = object.radius || 40;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  context.strokeStyle = HITBOX_STROKE;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
  context.stroke();
}

// ── Main render loop ───────────────────────────────────────

function render() {
  input.update();

  const { me, others, bullets, portals, mobs, deployables, caltrops, expOrbs } = getCurrentState();
  if (me) {
    renderBackground(me.x, me.y);

    // Map border
    context.strokeStyle = CANVAS_BLACK;
    context.lineWidth = 1;
    context.strokeRect(
      canvas.width / 2 - me.x,
      canvas.height / 2 - me.y,
      MAP_SIZE, MAP_SIZE,
    );

    if (portals) {
      portals.forEach(renderPortal.bind(null, me));
    }

    forEachNearby(me, deployables, renderDeployable);
    forEachNearby(me, caltrops, renderCaltrop);
    forEachNearby(me, bullets, renderBullet);

    renderPlayer(me, me);
    forEachNearby(me, others, renderPlayer);

    forEachNearby(me, mobs, renderMob);
    forEachNearby(me, expOrbs, renderExpOrb);

    if (showHitboxes) {
      forEachNearby(me, portals, renderHitbox);
      forEachNearby(me, others, renderHitbox);
      if (isNear(me, me)) renderHitbox(me, me);
    }

    renderMinimap(me, others!, portals!, mobs || [], deployables || []);
    renderWeaponCooldowns(me);
    renderExpBar(me);
    if (portals && portals.length > 0) {
      renderPortalHP(me, portals[0]);
    }
  }

  animationFrameRequestId = requestAnimationFrame(render);
}

// ── Main menu background ───────────────────────────────────

function renderMainMenu() {
  const t = Date.now() / 7500;
  const x = MAP_SIZE / 2 + 800 * Math.cos(t);
  const y = MAP_SIZE / 2 + 800 * Math.sin(t);
  renderBackground(x, y);

  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

// ── Boot ───────────────────────────────────────────────────

animationFrameRequestId = requestAnimationFrame(renderMainMenu);

// ── Public API ─────────────────────────────────────────────

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
