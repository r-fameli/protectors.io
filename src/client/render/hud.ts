import { getAsset } from '../assets';
import { canvas, context } from './common';
import { PlayerState, WeaponState, WeaponType } from '../state';
import { HUD_BG, COOLDOWN_TINT, BLUE_ACCENT, WHITE } from '../colors';

const BOX_SIZE = 64;
const PADDING = 10;
const IMAGE_SIZE = 40;

const EXP_BAR_HEIGHT = 20;
const EXP_BAR_BOTTOM = 10;

const WEAPON_SPRITES: Record<WeaponType, string> = {
  turret: 'weapons/turret-base.png',
  springer: 'weapons/springer.png',
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
