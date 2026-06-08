import { context, worldToScreen, RenderObject } from './common';
import { COLLECTIBLE_CONFIG } from '../../shared/collectible-configs';

const PULSE_SPEED = 3;

export function renderCollectible(me: RenderObject, obj: RenderObject) {
  const { x, y, hp } = obj;
  if (hp === undefined || hp <= 0) return;

  const { canvasX, canvasY } = worldToScreen(me, obj);
  const r = obj.radius || COLLECTIBLE_CONFIG.RADIUS;

  // Glow
  const pulse = 1 + 0.15 * Math.sin(Date.now() / 1000 * PULSE_SPEED);
  context.save();
  context.globalAlpha = 0.3;
  context.fillStyle = '#e67e22';
  context.beginPath();
  context.arc(canvasX, canvasY, r * pulse * 1.5, 0, Math.PI * 2);
  context.fill();
  context.restore();

  // Diamond shape
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(Date.now() / 1000 * PULSE_SPEED * 0.5);
  context.fillStyle = '#e67e22';
  context.beginPath();
  context.moveTo(0, -r * pulse);
  context.lineTo(r * pulse, 0);
  context.lineTo(0, r * pulse);
  context.lineTo(-r * pulse, 0);
  context.closePath();
  context.fill();

  // Inner highlight
  context.fillStyle = '#f39c12';
  context.beginPath();
  context.moveTo(0, -r * pulse * 0.5);
  context.lineTo(r * pulse * 0.5, 0);
  context.lineTo(0, r * pulse * 0.5);
  context.lineTo(-r * pulse * 0.5, 0);
  context.closePath();
  context.fill();
  context.restore();
}
