import { getAsset } from '../assets';
import { DARK_GRAY, BLUE_ACCENT, WEAPON_RING } from '../colors';
import { context, worldToScreen, RenderObject } from './common';
import { BasicTurretConfig, SpringerConfig, SpiderwebConfig } from '../../shared/weapon-configs';

const WEAPON_RADII: Record<string, number> = {
  turret: BasicTurretConfig.ATTACK_RADIUS,
  springer: SpringerConfig.ATTACK_RADIUS,
  spiderweb: SpiderwebConfig.ATTACK_RADIUS,
};

export function renderDeployable(me: RenderObject, obj: RenderObject) {
  const { type, x, y, direction, radius, remainingRatio, aimDirection } = obj;
  const r = radius || 20;
  const { canvasX, canvasY } = worldToScreen(me, obj);

  // Radius indicator
  const attackR = WEAPON_RADII[type || ''];
  if (attackR) {
    if (type === 'spiderweb') {
      // Spiderweb overlay instead of blue ring
      const webImg = getAsset('areas/spiderweb.png');
      if (webImg) {
        const size = attackR * 2;
        context.save();
        context.globalAlpha = 0.35;
        context.drawImage(webImg, canvasX - attackR, canvasY - attackR, size, size);
        context.restore();
      }
    } else {
      context.beginPath();
      context.arc(canvasX, canvasY, attackR, 0, 2 * Math.PI);
      context.fillStyle = WEAPON_RING;
      context.fill();
    }
  }

  if (type === 'turret') {
    // Base
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(direction!);
    context.drawImage(
      getAsset('weapons/turret-base.png'),
      -r, -r,
      r * 2, r * 2,
    );
    context.restore();

    // Head
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(aimDirection || 0);
    context.drawImage(
      getAsset('weapons/turret-head.png'),
      -r, -r,
      r * 2, r * 2,
    );
    context.restore();
  } else if (type === 'springer') {
    context.save();
    context.translate(canvasX, canvasY);
    context.drawImage(
      getAsset('weapons/springer.png'),
      -r, -r,
      r * 2, r * 2,
    );
    context.restore();
  } else if (type === 'spiderweb') {
    // No center sprite — only the radius overlay above
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
