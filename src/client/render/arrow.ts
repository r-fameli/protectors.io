import { getAsset } from '../assets';
import { context, worldToScreen, RenderObject } from './common';

export function renderArrow(me: RenderObject, arrow: RenderObject) {
  const { x, y, direction, radius } = arrow;
  const r = radius || 5;
  const { canvasX, canvasY } = worldToScreen(me, arrow);

  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction || 0);
  context.drawImage(
    getAsset('weapons/arrow.png'),
    -r * 2, -r, r * 4, r * 2,
  );
  context.restore();
}
