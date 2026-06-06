import { getAsset } from '../assets';
import { canvas, context, worldToScreen, RenderObject } from './common';
import { TREE_BG, RED_HP, GREEN_HP, WHITE, SHADE_COLOR } from '../colors';
import Constants from '../../shared/constants';

export function renderTree(me: RenderObject, tree: RenderObject) {
  const { radius } = tree;
  const treeR = radius || Constants.TREE_RADIUS;
  const { canvasX, canvasY } = worldToScreen(me, tree);

  // Shade circle around tree
  context.beginPath();
  context.arc(canvasX, canvasY, treeR * 3, 0, 2 * Math.PI);
  context.fillStyle = SHADE_COLOR;
  context.fill();

  context.drawImage(
    getAsset('objects/tree.png'),
    canvasX - treeR,
    canvasY - treeR,
    treeR * 2,
    treeR * 2,
  );
}

export function renderTreeHP(me: RenderObject, tree: RenderObject) {
  // Draw HP bar at top-center of screen for the tree
  const barWidth = 200;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 10;

  context.fillStyle = TREE_BG;
  context.fillRect(barX, barY, barWidth, barHeight);

  const ratio = Math.max(0, (tree.hp || 0) / (tree.maxHp || 1));
  context.fillStyle = RED_HP;
  context.fillRect(barX, barY, barWidth, barHeight);

  context.fillStyle = GREEN_HP;
  context.fillRect(barX, barY, barWidth * ratio, barHeight);

  // Text
  context.fillStyle = WHITE;
  context.font = 'bold 13px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(`Tree ${Math.ceil(tree.hp || 0)}/${tree.maxHp}`, canvas.width / 2, barY + barHeight / 2);
}
