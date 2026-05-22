import { context } from './common';
import { MAP_SIZE, RenderObject } from './common';
import { CANVAS_BLACK, CANVAS_WHITE, CANVAS_BLUE, CANVAS_GREEN, CANVAS_YELLOW, MINIMAP_TURRET, RED_HP } from '../colors';

const MOB_MINIMAP_COLORS: Record<string, string> = {
  angel: CANVAS_YELLOW,
  paladin: RED_HP,
};

export function renderMinimap(
  me: RenderObject,
  others: RenderObject[],
  portals: RenderObject[],
  mobs: RenderObject[],
  turrets?: RenderObject[],
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
  if (portals && portals.length > 0) {
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
      context.fillStyle = MOB_MINIMAP_COLORS[mob.mobType || ''] || CANVAS_YELLOW;
      context.beginPath();
      context.arc(
        minimapX + mob.x * scale,
        minimapY + mob.y * scale,
        2, 0, 2 * Math.PI,
      );
      context.fill();
    });
  }

  // Turrets
  if (turrets) {
    turrets.forEach(turret => {
      context.fillStyle = MINIMAP_TURRET;
      context.beginPath();
      context.arc(
        minimapX + turret.x * scale,
        minimapY + turret.y * scale,
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
