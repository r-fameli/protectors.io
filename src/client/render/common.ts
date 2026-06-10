import Constants from '../../shared/constants';

const { PLAYER_RADIUS, BULLET_RADIUS, MAP_SIZE } = Constants;
const RENDER_DIST = MAP_SIZE / 2;

export const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
export const context = canvas.getContext('2d')!;

export { PLAYER_RADIUS, BULLET_RADIUS, MAP_SIZE };

export interface RenderObject {
  x: number;
  y: number;
  direction?: number;
  radius?: number;
  hp?: number;
  maxHp?: number;
  username?: string;
  remainingRatio?: number;
  aimDirection?: number;
  mobType?: string;
  type?: string;
  variant?: string;
  isTransiting?: boolean;
  buffed?: boolean;
  buffRingActive?: boolean;
}

/** Convert world coords to canvas coords relative to the local player. */
export function worldToScreen(
  me: RenderObject,
  obj: RenderObject,
): { canvasX: number; canvasY: number } {
  return {
    canvasX: canvas.width / 2 + obj.x - me.x,
    canvasY: canvas.height / 2 + obj.y - me.y,
  };
}

function sqDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function isNear(me: { x: number; y: number }, obj: { x: number; y: number }): boolean {
  return sqDist(me, obj) < RENDER_DIST * RENDER_DIST;
}

export function forEachNearby<T extends { x: number; y: number }>(
  me: { x: number; y: number },
  items: T[] | undefined,
  fn: (me: { x: number; y: number }, item: T) => void,
) {
  if (!items) return;
  items.forEach(item => {
    if (isNear(me, item)) fn(me, item);
  });
}
