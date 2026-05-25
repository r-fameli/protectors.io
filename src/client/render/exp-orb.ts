import { getAsset } from '../assets';
import { context, worldToScreen, RenderObject } from './common';

export function renderExpOrb(me: RenderObject, orb: RenderObject) {
  const { radius } = orb;
  const r = radius || 8;
  const { canvasX, canvasY } = worldToScreen(me, orb);

  context.drawImage(
    getAsset('objects/exp.png'),
    canvasX - r,
    canvasY - r,
    r * 2,
    r * 2,
  );
}
