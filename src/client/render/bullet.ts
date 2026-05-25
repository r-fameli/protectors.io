import { getAsset } from '../assets';
import { context, BULLET_RADIUS, worldToScreen, RenderObject } from './common';

export function renderBullet(me: RenderObject, bullet: RenderObject) {
  const { canvasX, canvasY } = worldToScreen(me, bullet);

  context.drawImage(
    getAsset('projectiles/bullet.svg'),
    canvasX - BULLET_RADIUS,
    canvasY - BULLET_RADIUS,
    BULLET_RADIUS * 2,
    BULLET_RADIUS * 2,
  );
}
