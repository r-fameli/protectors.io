import { context } from './common';
import { MAP_SIZE, RenderObject } from './common';
import { CANVAS_BLACK, CANVAS_WHITE, CANVAS_BLUE, CANVAS_GREEN, CANVAS_YELLOW, CANVAS_RED, MINIMAP_TURRET } from '../colors';

export function renderMinimap(
  me: RenderObject,
  others: RenderObject[],
  trees: RenderObject[],
  mobs: RenderObject[],
  deployables?: RenderObject[],
  collectibles?: RenderObject[],
) {
  const minimapSize = 150;
  const minimapX = context.canvas.width - minimapSize - 10;
  const minimapY = context.canvas.height - minimapSize - 10;
  const scale = minimapSize / MAP_SIZE;

  // Background
  context.fillStyle = CANVAS_BLACK;
  context.fillRect(minimapX, minimapY, minimapSize, minimapSize);

  context.strokeStyle = CANVAS_WHITE;
  context.lineWidth = 2;
  context.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

  // Portal
  if (trees && trees.length > 0) {
    context.fillStyle = CANVAS_BLUE;
    context.beginPath();
    context.arc(
      minimapX + minimapSize / 2,
      minimapY + minimapSize / 2,
      5, 0, 2 * Math.PI,
    );
    context.fill();
  }

  // Other players
  others.forEach(player => {
    context.fillStyle = CANVAS_GREEN;
    context.beginPath();
    context.arc(
      minimapX + player.x * scale,
      minimapY + player.y * scale,
      2, 0, 2 * Math.PI,
    );
    context.fill();
  });

  // Mobs
  if (mobs) {
    mobs.forEach(mob => {
      context.fillStyle = CANVAS_RED;
      context.beginPath();
      context.arc(
        minimapX + mob.x * scale,
        minimapY + mob.y * scale,
        2, 0, 2 * Math.PI,
      );
      context.fill();
    });
  }

  // Deployables
  if (deployables) {
    deployables.forEach(d => {
      context.fillStyle = MINIMAP_TURRET;
      context.beginPath();
      context.arc(
        minimapX + d.x * scale,
        minimapY + d.y * scale,
        2, 0, 2 * Math.PI,
      );
      context.fill();
    });
  }

  // Collectibles (only active ones)
  if (collectibles) {
    collectibles.forEach(c => {
      if (c.hp === undefined || c.hp <= 0) return;
      context.fillStyle = CANVAS_YELLOW;
      context.beginPath();
      context.arc(
        minimapX + c.x * scale,
        minimapY + c.y * scale,
        2, 0, 2 * Math.PI,
      );
      context.fill();
    });
  }

  // Local player
  context.fillStyle = CANVAS_WHITE;
  context.beginPath();
  context.arc(
    minimapX + me.x * scale,
    minimapY + me.y * scale,
    3, 0, 2 * Math.PI,
  );
  context.fill();
}
