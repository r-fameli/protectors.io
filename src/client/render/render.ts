import { debounce } from 'throttle-debounce';
import { getCurrentState } from '../state';
import input from '../input';

import { canvas, context, MAP_SIZE, RenderObject, isNear, forEachNearby } from './common';
import { HITBOX_STROKE, CANVAS_BLACK, BG_COLOR } from '../colors';
import { renderPlayer } from './player';
import { renderMob } from './mob';
import { renderDeployable } from './deployable';
import { renderCaltrop } from './caltrop';
import { renderSpider } from './spider';
import { renderArrow } from './arrow';
import { renderTree, renderTreeHP } from './tree';
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

function renderBackground() {
  context.fillStyle = BG_COLOR;
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

  const { me, others, bullets, trees, mobs, deployables, caltrops, spiders, arrows, expOrbs } = getCurrentState();
  if (me) {
    // Show upgrade panel when upgrades are pending
    const panel = document.getElementById('upgrade-panel');
    const buttons = panel?.querySelectorAll<HTMLButtonElement>('.upgrade-btn');
    if (panel && buttons) {
      if (me.pendingUpgrades > 0) {
        panel.classList.remove('hidden');

        // Update button labels with current upgrade values
        const labels: Record<string, { label: string; next: (level: number) => string }> = {
          cooldown: { label: 'Faster Cooldowns', next: (l: number) => `-${Math.round((1 - Math.pow(0.9, l + 1)) * 100)}%` },
          range: { label: 'Bigger Weapon Range', next: (l: number) => `+${Math.round(0.1 * (l + 1) * 100)}%` },
          damage: { label: 'Damage Increase', next: (l: number) => `+${Math.round(0.15 * (l + 1) * 100)}%` },
        };
        buttons.forEach(btn => {
          const type = btn.getAttribute('data-upgrade') as string;
          const info = labels[type];
          if (info) {
            const level = me.upgrades[type as keyof typeof me.upgrades] || 0;
            btn.textContent = `${info.label} ${info.next(level)}`;
          }
        });
      } else {
        panel.classList.add('hidden');
      }
    }
    renderBackground();

    // Map border
    context.strokeStyle = CANVAS_BLACK;
    context.lineWidth = 1;
    context.strokeRect(
      canvas.width / 2 - me.x,
      canvas.height / 2 - me.y,
      MAP_SIZE, MAP_SIZE,
    );

    if (trees) {
      trees.forEach(renderTree.bind(null, me));
    }

    forEachNearby(me, deployables, renderDeployable);
    forEachNearby(me, caltrops, renderCaltrop);
    forEachNearby(me, spiders, renderSpider);
    forEachNearby(me, arrows, renderArrow);
    forEachNearby(me, bullets, renderBullet);

    renderPlayer(me, me);
    forEachNearby(me, others, renderPlayer);

    forEachNearby(me, mobs, renderMob);
    forEachNearby(me, expOrbs, renderExpOrb);

    if (showHitboxes) {
      forEachNearby(me, trees, renderHitbox);
      forEachNearby(me, others, renderHitbox);
      if (isNear(me, me)) renderHitbox(me, me);
    }

    renderMinimap(me, others!, trees!, mobs || [], deployables || []);
    renderWeaponCooldowns(me);
    renderExpBar(me);
    if (trees && trees.length > 0) {
      renderTreeHP(me, trees[0]);
    }
  }

  animationFrameRequestId = requestAnimationFrame(render);
}

// ── Main menu background ───────────────────────────────────

function renderMainMenu() {
  const t = Date.now() / 7500;
  const x = MAP_SIZE / 2 + 800 * Math.cos(t);
  const y = MAP_SIZE / 2 + 800 * Math.sin(t);
  renderBackground();

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
