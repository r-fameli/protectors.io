import { getAsset } from '../assets';
import { context, worldToScreen, RenderObject } from './common';

export function renderCaltrop(me: RenderObject, caltrop: RenderObject) {
  const { radius } = caltrop;
  const r = radius || 8;
  const { canvasX, canvasY } = worldToScreen(me, caltrop);

  context.drawImage(
    getAsset('projectiles/caltrop.png'),
    canvasX - r,
    canvasY - r,
    r * 2,
    r * 2,
  );
}
