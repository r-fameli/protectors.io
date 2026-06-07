import { debounce } from 'throttle-debounce';
import { getCurrentState, getChatMessages } from '../state';
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
import { renderWeaponCooldowns, renderExpBar, renderDifficultyBar, updateUpgradePanel } from './hud';

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
let prevHadPending = false;

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

  const { me, others, bullets, trees, mobs, deployables, caltrops, spiders, arrows, expOrbs, threatLevel, threatProgress } = getCurrentState();
  if (me) {
    // Upgrade panel — tab toggle + content state
    const panel = document.getElementById('upgrade-panel');
    const tab = document.getElementById('upgrade-tab');
    const title = document.getElementById('upgrade-title');
    const choices = document.getElementById('upgrade-choices');
    const emptyMsg = document.getElementById('upgrade-empty-msg');
    if (panel && tab && title && choices && emptyMsg) {
      // Wire up tab click once
      if (!tab.dataset.wired) {
        tab.dataset.wired = '1';
        tab.addEventListener('click', () => panel.classList.toggle('minimized'));
      }

      const hasPending = me.pendingUpgrades > 0;
      const hasChoices = (me.availableUpgrades?.length || 0) > 0;

      // Update tab text with pending count
      tab.textContent = hasPending ? `Upgrades (${me.pendingUpgrades})` : 'Upgrades';

      // Auto-minimize when all upgrades spent — do this BEFORE
      // content update so the body is hidden before we touch it.
      if (!hasPending && prevHadPending) {
        panel.classList.add('minimized');
      }
      // Auto-unminimize when fresh upgrades arrive
      if (hasPending && !prevHadPending) {
        panel.classList.remove('minimized');
      }
      prevHadPending = hasPending;

      // Populate choices or empty message
      if (hasPending && hasChoices) {
        choices.classList.remove('hidden');
        emptyMsg.classList.add('hidden');
        title.classList.remove('hidden');
        title.textContent = 'Choose an upgrade:';
        updateUpgradePanel(me.availableUpgrades!);
      } else if (hasPending && !hasChoices) {
        choices.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        title.classList.add('hidden');
        emptyMsg.textContent = 'No upgrades available — all upgrades have been exhausted.';
      } else {
        choices.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        title.classList.add('hidden');
        emptyMsg.textContent = 'No upgrades available.';
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
    renderDifficultyBar(threatLevel, threatProgress);
    if (trees && trees.length > 0) {
      renderTreeHP(me, trees[0]);
    }
    renderExpBar(me);
  }

  renderChatMessages();

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

let lastChatCount = 0;

const FADE_DELAY = 8;   // seconds before fade starts
const FADE_DURATION = 12; // seconds to go from opaque to transparent

/** Append new chat DOM elements + update opacity every frame. */
function renderChatMessages() {
  const msgs = getChatMessages();
  const container = document.getElementById('chat-messages');
  if (!container) return;

  // Append new messages
  if (msgs.length !== lastChatCount) {
    lastChatCount = msgs.length;
    while (container.children.length < msgs.length) {
      const msg = msgs[container.children.length];
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.dataset.timestamp = String(Date.now());
      if (msg.username === 'System') {
        div.classList.add('chat-system');
        div.textContent = msg.text;
      } else {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'chat-name';
        nameSpan.textContent = msg.username + ': ';
        div.appendChild(nameSpan);
        div.appendChild(document.createTextNode(msg.text));
      }
      container.appendChild(div);
    }
    // Trim excess
    while (container.children.length > msgs.length) {
      container.removeChild(container.firstChild!);
    }
    container.scrollTop = container.scrollHeight;
  }

  // Opacity fade — skip when chat input is open
  const chatInput = document.getElementById('chat-input');
  const isChatOpen = chatInput && !chatInput.classList.contains('hidden');
  const now = Date.now();

  for (const el of container.children) {
    const ts = (el as HTMLElement).dataset.timestamp;
    if (!ts) continue;
    const age = (now - Number(ts)) / 1000;
    if (isChatOpen || age < FADE_DELAY) {
      (el as HTMLElement).style.opacity = '1';
    } else {
      const fade = Math.max(0.2, 1 - (age - FADE_DELAY) / FADE_DURATION);
      (el as HTMLElement).style.opacity = String(fade);
    }
  }
}

// ── Boot ───────────────────────────────────────────────────

animationFrameRequestId = requestAnimationFrame(renderMainMenu);

// ── Public API ─────────────────────────────────────────────

export function startRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  lastChatCount = 0;
  // Clear old chat DOM so messages from previous game don't persist
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) chatContainer.innerHTML = '';
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
