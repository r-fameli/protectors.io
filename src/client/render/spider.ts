import { getAsset } from '../assets';
import { context, worldToScreen, RenderObject } from './common';

export function renderSpider(me: RenderObject, spider: RenderObject) {
  const { x, y, direction, radius } = spider;
  const r = radius || 20;
  const { canvasX, canvasY } = worldToScreen(me, spider);

  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction || 0);
  context.drawImage(
    getAsset('weapons/spider.png'),
    -r, -r, r * 2, r * 2,
  );
  context.restore();
}
