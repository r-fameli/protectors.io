import { getAsset } from '../assets';
import { DARK_GRAY, RED_HP, GREEN_HP } from '../colors';
import { context, worldToScreen, RenderObject } from './common';
import { FOREMAN as FOREMAN_CONFIG } from '../../shared/mob-configs';

const MOB_SPRITES: Record<string, string> = {
  lumberjack: 'mobs/lumberjack.png',
  chainsawer: 'mobs/chainsawer.png',
  loghouse: 'mobs/loghouse.png',
  foreman: 'mobs/foreman.png',
};

export function renderMob(me: RenderObject, mob: RenderObject) {
  const { x, y, direction, hp, maxHp, radius, mobType, buffed, buffRingActive } = mob;
  const r = radius || 20;
  const { canvasX, canvasY } = worldToScreen(me, mob);
  const sprite = MOB_SPRITES[mobType || ''] || 'mobs/lumberjack.png';

  // Golden aura for buffed mobs
  if (buffed) {
    context.beginPath();
    context.arc(canvasX, canvasY, r * 1.5, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 215, 0, 0.25)';
    context.fill();
    context.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    context.lineWidth = 2;
    context.stroke();
  }

  // Buff radius ring on Foreman when buff fires
  if (buffRingActive && mobType === 'foreman') {
    context.beginPath();
    context.arc(canvasX, canvasY, FOREMAN_CONFIG.BUFF_RADIUS, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    context.lineWidth = 3;
    context.stroke();
    context.beginPath();
    context.arc(canvasX, canvasY, FOREMAN_CONFIG.BUFF_RADIUS, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 215, 0, 0.08)';
    context.fill();
  }

  // Sprite
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction!);
  context.drawImage(
    getAsset(sprite),
    -r,
    -r,
    r * 2,
    r * 2,
  );
  context.restore();

  // HP bar
  const barWidth = 40;
  const barHeight = 5;
  const barX = canvasX - barWidth / 2;
  const barY = canvasY + r + 5;

  context.fillStyle = DARK_GRAY;
  context.fillRect(barX, barY, barWidth, barHeight);

  context.fillStyle = RED_HP;
  context.fillRect(barX, barY, barWidth, barHeight);

  const hpRatio = Math.max(0, (hp || 0) / (maxHp || 1));
  context.fillStyle = GREEN_HP;
  context.fillRect(barX, barY, barWidth * hpRatio, barHeight);
}
