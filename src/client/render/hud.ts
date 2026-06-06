import { getAsset } from '../assets';
import { canvas, context } from './common';
import { PlayerState, WeaponState, WeaponType, UpgradeChoice } from '../state';
import { chooseUpgrade } from '../networking';
import { HUD_BG, COOLDOWN_TINT, BLUE_ACCENT, WHITE, DARK_GRAY } from '../colors';
import { DIFFICULTY_LABELS } from '../../shared/wave-configs';

const BOX_SIZE = 64;
const PADDING = 10;
const IMAGE_SIZE = 40;

const EXP_BAR_HEIGHT = 20;
const EXP_BAR_BOTTOM = 10;

const WEAPON_SPRITES: Record<WeaponType, string> = {
  turret: 'weapons/turret-base.png',
  springer: 'weapons/springer.png',
  spiderweb: 'weapons/spider.png',
  crossbow: 'weapons/crossbow.png',
};

function renderCooldownBox(x: number, weapon: WeaponState) {
  context.fillStyle = HUD_BG;
  context.fillRect(x, PADDING, BOX_SIZE, BOX_SIZE);

  const progress = Math.max(0, Math.min(1, 1 - weapon.cooldown / weapon.maxCooldown));
  if (progress > 0) {
    const tintHeight = BOX_SIZE * progress;
    context.fillStyle = COOLDOWN_TINT;
    context.fillRect(x, PADDING + BOX_SIZE - tintHeight, BOX_SIZE, tintHeight);
  }

  const sprite = WEAPON_SPRITES[weapon.type];
  if (sprite) {
    const img = getAsset(sprite);
    const imgOffset = (BOX_SIZE - IMAGE_SIZE) / 2;
    context.drawImage(img, x + imgOffset, PADDING + imgOffset, IMAGE_SIZE, IMAGE_SIZE);
  }
}

export function renderWeaponCooldowns(me: PlayerState) {
  (me.weapons || []).forEach((weapon, i) => {
    renderCooldownBox(PADDING + i * (BOX_SIZE + 8), weapon);
  });
}

export function renderExpBar(me: PlayerState) {
  const barX = PADDING;
  const barY = canvas.height - EXP_BAR_HEIGHT - EXP_BAR_BOTTOM;
  const barWidth = Math.floor(canvas.width / 4);

  // Background
  context.fillStyle = HUD_BG;
  context.fillRect(barX, barY, barWidth, EXP_BAR_HEIGHT);

  // Fill
  const ratio = Math.min(1, me.exp / me.nextLevelExp);
  if (ratio > 0) {
    context.fillStyle = BLUE_ACCENT;
    context.fillRect(barX, barY, barWidth * ratio, EXP_BAR_HEIGHT);
  }

  // Level text
  context.fillStyle = WHITE;
  context.font = 'bold 14px monospace';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText(`Lvl ${me.level}`, barX + 6, barY + EXP_BAR_HEIGHT / 2);
}

const DIFF_BAR_WIDTH = 160;
const DIFF_BAR_HEIGHT = 22;

/**
 * Render Risk of Rain-style difficulty bar in top-right corner.
 * Bar fills from left to right as threat level rises.
 * Labels: Easy → Medium → Hard → Very Hard → Insane.
 * At threat 6+ bar stays full red with "Insane" label.
 */
export function renderDifficultyBar(threatLevel: number | undefined, threatProgress: number | undefined) {
  const tl = threatLevel || 1;
  const tp = threatProgress || 0;
  // Continuous fill: full level + current XP progress toward next level, capped at 6
  const fill = Math.min(1, ((tl - 1) + tp) / 6);
  const barX = canvas.width - DIFF_BAR_WIDTH - PADDING;
  const labelY = PADDING;
  const barY = PADDING + 16;

  // "Threat Level" label above bar
  context.fillStyle = WHITE;
  context.font = 'bold 11px monospace';
  context.textAlign = 'right';
  context.textBaseline = 'top';
  context.fillText('Threat Level', barX + DIFF_BAR_WIDTH, labelY);

  // Background
  context.fillStyle = HUD_BG;
  context.fillRect(barX, barY, DIFF_BAR_WIDTH, DIFF_BAR_HEIGHT);

  // Fill — green → yellow → orange → red gradient
  const r = Math.min(255, Math.round(fill * 2 * 255));
  const g = Math.min(255, Math.round((1 - fill) * 2 * 255));
  context.fillStyle = `rgb(${r}, ${g}, 40)`;
  context.fillRect(barX, barY, DIFF_BAR_WIDTH * fill, DIFF_BAR_HEIGHT);

  // Tick marks at each difficulty threshold (Medium, Hard, ..., Insane)
  for (let i = 1; i < DIFFICULTY_LABELS.length; i++) {
    const tickX = barX + (DIFF_BAR_WIDTH * i) / DIFFICULTY_LABELS.length;
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(tickX, barY + 2);
    context.lineTo(tickX, barY + DIFF_BAR_HEIGHT - 2);
    context.stroke();
  }

  // Border
  context.strokeStyle = DARK_GRAY;
  context.lineWidth = 1;
  context.strokeRect(barX, barY, DIFF_BAR_WIDTH, DIFF_BAR_HEIGHT);

  // Difficulty label (Easy/Medium/etc.) centered inside bar
  const labelIndex = Math.min(Math.floor(fill * (DIFFICULTY_LABELS.length - 1)), DIFFICULTY_LABELS.length - 1);
  const label = DIFFICULTY_LABELS[labelIndex];

  context.fillStyle = WHITE;
  context.font = 'bold 13px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, barX + DIFF_BAR_WIDTH / 2, barY + DIFF_BAR_HEIGHT / 2);
}

let lastUpgradeKeys: string | null = null;

/** Reset upgrade panel cache (e.g., on panel hide or game restart). */
export function resetUpgradePanelCache(): void {
  lastUpgradeKeys = null;
}

/** Create/update upgrade choice buttons in the DOM upgrade panel. */
export function updateUpgradePanel(availableUpgrades: UpgradeChoice[]) {
  const container = document.getElementById('upgrade-choices')!;
  const keys = availableUpgrades.map(c => c.upgradeKey).join(',');
  if (keys === lastUpgradeKeys) return;
  lastUpgradeKeys = keys;

  container.innerHTML = '';
  availableUpgrades.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'upgrade-label';
    labelSpan.textContent = choice.label;

    const levelSpan = document.createElement('span');
    levelSpan.className = 'upgrade-weapon-level';
    levelSpan.textContent = `${choice.weaponType.charAt(0).toUpperCase() + choice.weaponType.slice(1)} Lvl. ${choice.level}`;

    const descSpan = document.createElement('span');
    descSpan.className = 'upgrade-desc';
    descSpan.textContent = choice.description;

    btn.appendChild(labelSpan);
    btn.appendChild(levelSpan);
    btn.appendChild(descSpan);
    btn.addEventListener('click', () => chooseUpgrade(choice.upgradeKey));
    container.appendChild(btn);
  });
}
