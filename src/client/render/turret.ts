import { getAsset } from '../assets';
import { DARK_GRAY, BLUE_ACCENT } from '../colors';
import { context, worldToScreen, RenderObject } from './common';
import { BasicTurretConfig } from '../../shared/weapon-configs';

export function renderTurret(me: RenderObject, turret: RenderObject) {
  const { x, y, direction, radius, remainingRatio, aimDirection } = turret;
  const r = radius || 20;
  const { canvasX, canvasY } = worldToScreen(me, turret);

  // Attack radius indicator
  context.beginPath();
  context.arc(canvasX, canvasY, BasicTurretConfig.ATTACK_RADIUS, 0, 2 * Math.PI);
  context.fillStyle = 'rgba(52, 152, 219, 0.06)';
  context.fill();

  // Base
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction!);
  context.drawImage(
    getAsset('turret-base.png'),
    -r,
    -r,
    r * 2,
    r * 2,
  );
  context.restore();

  // Head — sprite faces right
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(aimDirection || 0);
  context.drawImage(
    getAsset('turret-head.png'),
    -r,
    -r,
    r * 2,
    r * 2,
  );
  context.restore();

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
