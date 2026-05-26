import { getAsset } from '../assets';
import { DARK_GRAY, RED_HP, GREEN_HP } from '../colors';
import { context, worldToScreen, RenderObject } from './common';

const MOB_SPRITES: Record<string, string> = {
  lumberjack: 'mobs/lumberjack.png',
  chainsawer: 'mobs/chainsawer.png',
};

export function renderMob(me: RenderObject, mob: RenderObject) {
  const { x, y, direction, hp, maxHp, radius, mobType } = mob;
  const r = radius || 20;
  const { canvasX, canvasY } = worldToScreen(me, mob);
  const sprite = MOB_SPRITES[mobType || ''] || 'mobs/lumberjack.png';

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
