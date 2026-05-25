import { getAsset } from '../assets';
import { DARK_GRAY, BLUE_ACCENT, WEAPON_RING } from '../colors';
import { context, worldToScreen, RenderObject } from './common';
import { BasicTurretConfig, SpringerConfig } from '../../shared/weapon-configs';

export function renderDeployable(me: RenderObject, obj: RenderObject) {
  const { type, x, y, direction, radius, remainingRatio, aimDirection } = obj;
  const r = radius || 20;
  const { canvasX, canvasY } = worldToScreen(me, obj);

  // Radius indicator
  if (type === 'turret') {
    context.beginPath();
    context.arc(canvasX, canvasY, BasicTurretConfig.ATTACK_RADIUS, 0, 2 * Math.PI);
    context.fillStyle = WEAPON_RING;
    context.fill();
  } else if (type === 'springer') {
    context.beginPath();
    context.arc(canvasX, canvasY, SpringerConfig.CALTROP_RADIUS, 0, 2 * Math.PI);
    context.fillStyle = WEAPON_RING;
    context.fill();
  }

  if (type === 'turret') {
    // Base
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(direction!);
    context.drawImage(
      getAsset('turret-base.png'),
      -r, -r,
      r * 2, r * 2,
    );
    context.restore();

    // Head
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(aimDirection || 0);
    context.drawImage(
      getAsset('turret-head.png'),
      -r, -r,
      r * 2, r * 2,
    );
    context.restore();
  } else if (type === 'springer') {
    context.save();
    context.translate(canvasX, canvasY);
    context.drawImage(
      getAsset('springer.png'),
      -r, -r,
      r * 2, r * 2,
    );
    context.restore();
  }

  // Duration bar
  const barWidth = 30;
  const barHeight = 4;
  const barX = canvasX - barWidth / 2;
  const barY = canvasY + r + 5;

  context.fillStyle = DARK_GRAY;
  context.fillRect(barX, barY, barWidth, barHeight);

  context.fillStyle = BLUE_ACCENT;
  context.fillRect(barX, barY, barWidth * (remainingRatio || 0), barHeight);
}
