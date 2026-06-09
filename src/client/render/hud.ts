import { getAsset } from '../assets';
import { canvas, context } from './common';
import { PlayerState, WeaponState, WeaponType, UpgradeChoice } from '../state';
import { chooseUpgrade } from '../networking';
import { HUD_BG, COOLDOWN_TINT, BLUE_ACCENT, WHITE, DARK_GRAY } from '../colors';
import { DIFFICULTY_LABELS } from '../../shared/wave-configs';

const BOX_SIZE = 64;
const PADDING = 10;
const IMAGE_SIZE = 40;

const WEAPON_SPRITES: Record<WeaponType, string> = {
  turret: 'weapons/turret-base.png',
  springer: 'weapons/springer.png',
  spiderweb: 'weapons/spider.png',
  crossbow: 'weapons/crossbow.png',
};

const BAR_GAP = 2;

function renderCooldownBox(x: number, weapon: WeaponState) {
  const boxTop = PADDING;

  // Collect all active cooldowns for this weapon
  const bars: { progress: number }[] = [];
  const mainProg = Math.max(0, Math.min(1, 1 - weapon.cooldown / weapon.maxCooldown));
  if (mainProg > 0) bars.push({ progress: mainProg });

  const bonus: number[] = weapon.bonusCooldowns || [];
  for (const b of bonus) {
    const p = Math.max(0, Math.min(1, 1 - b / weapon.maxCooldown));
    if (p > 0) bars.push({ progress: p });
  }

  const n = bars.length;

  // Background
  context.fillStyle = HUD_BG;
  context.fillRect(x, boxTop, BOX_SIZE, BOX_SIZE);

  if (n === 0) {
    // No active cooldown — just show sprite
    const sprite = WEAPON_SPRITES[weapon.type];
    if (sprite) {
      const img = getAsset(sprite);
      context.drawImage(img, x + (BOX_SIZE - IMAGE_SIZE) / 2, boxTop + (BOX_SIZE - IMAGE_SIZE) / 2, IMAGE_SIZE, IMAGE_SIZE);
    }
    return;
  }

  // N vertical bars, each barWidth = (BOX_SIZE - (n-1) * BAR_GAP) / n
  const totalGap = (n - 1) * BAR_GAP;
  const barWidth = (BOX_SIZE - totalGap) / n;

  for (let i = 0; i < n; i++) {
    const barX = x + i * (barWidth + BAR_GAP);
    const fillH = BOX_SIZE * bars[i].progress;

    // Bar background track
    context.fillStyle = 'rgba(255, 255, 255, 0.05)';
    context.fillRect(barX, boxTop, barWidth, BOX_SIZE);

    // Bar fill (grows from bottom)
    context.fillStyle = COOLDOWN_TINT;
    context.fillRect(barX, boxTop + BOX_SIZE - fillH, barWidth, fillH);
  }

  // Weapon sprite centered
  const sprite = WEAPON_SPRITES[weapon.type];
  if (sprite) {
    const img = getAsset(sprite);
    const cx = x + BOX_SIZE / 2;
    const cy = boxTop + BOX_SIZE / 2;
    context.save();
    context.globalAlpha = 0.7;
    context.drawImage(img, cx - IMAGE_SIZE / 2, cy - IMAGE_SIZE / 2, IMAGE_SIZE, IMAGE_SIZE);
    context.restore();
  }
}

export function renderWeaponCooldowns(me: PlayerState) {
  (me.weapons || []).forEach((weapon, i) => {
    renderCooldownBox(PADDING + i * (BOX_SIZE + 8), weapon);
  });
}

/** Player level + XP bar, positioned below the tree HP bar at top-center. */
export function renderExpBar(me: PlayerState) {
  const barWidth = 200;
  const barHeight = 16;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 10 + 20 + 6; // below tree HP bar (tree barY=10, tree height=20, +6 gap)

  // Background
  context.fillStyle = HUD_BG;
  context.fillRect(barX, barY, barWidth, barHeight);

  // XP fill
  const ratio = Math.min(1, me.exp / me.nextLevelExp);
  if (ratio > 0) {
    context.fillStyle = BLUE_ACCENT;
    context.fillRect(barX, barY, barWidth * ratio, barHeight);
  }

  // Level text
  context.fillStyle = WHITE;
  context.font = 'bold 12px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(`Player Lvl. ${me.level}`, barX + barWidth / 2, barY + barHeight / 2);
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

/** Create/update upgrade choice buttons in the DOM upgrade panel. */
export function updateUpgradePanel(availableUpgrades: UpgradeChoice[]) {
  const container = document.getElementById('upgrade-choices')!;
  const keys = availableUpgrades.map(c => c.upgradeKey).join(',');
  if (keys === lastUpgradeKeys) return;
  lastUpgradeKeys = keys;

  container.innerHTML = '';
  availableUpgrades.forEach(choice => {
    const btn = document.createElement('button');
    const isPlayer = choice.weaponType === 'player';
    btn.className = isPlayer ? 'upgrade-btn upgrade-btn-player' : 'upgrade-btn';
    const isAcquire = choice.upgradeKey.startsWith('acquire_');
    const weaponName = choice.weaponType.charAt(0).toUpperCase() + choice.weaponType.slice(1);

    // Line 1: upgrade name + level
    const labelSpan = document.createElement('span');
    labelSpan.className = 'upgrade-label';
    if (isPlayer) {
      labelSpan.textContent = `${choice.label} Lvl. ${choice.level}`;
    } else {
      labelSpan.textContent = `${weaponName} Lvl. ${choice.level}`;
    }

    // Line 2: subtitle — upgrade title, "New Weapon", or blank for player upgrades
    const subSpan = document.createElement('span');
    subSpan.className = 'upgrade-subtitle';
    if (isPlayer) {
      subSpan.textContent = 'Player Upgrade';
    } else if (isAcquire) {
      subSpan.textContent = 'New Weapon';
    } else {
      subSpan.textContent = choice.label;
    }

    // Line 3: delta description
    const descSpan = document.createElement('span');
    descSpan.className = 'upgrade-desc';
    descSpan.textContent = choice.description;

    btn.appendChild(labelSpan);
    btn.appendChild(subSpan);
    btn.appendChild(descSpan);
    btn.addEventListener('click', () => chooseUpgrade(choice.upgradeKey));
    container.appendChild(btn);
  });
}
