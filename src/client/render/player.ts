import { getAsset } from '../assets';
import { context, PLAYER_RADIUS, worldToScreen, RenderObject } from './common';
import { WHITE } from '../colors';

export function renderPlayer(me: RenderObject, player: RenderObject) {
  const { x, y, direction, username } = player;
  const { canvasX, canvasY } = worldToScreen(me, player);

  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction!);
  context.drawImage(
    getAsset('player.png'),
    -PLAYER_RADIUS,
    -PLAYER_RADIUS,
    PLAYER_RADIUS * 2,
    PLAYER_RADIUS * 2,
  );
  context.restore();

  // Username label below sprite
  if (username) {
    context.fillStyle = WHITE;
    context.font = 'bold 12px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(username, canvasX, canvasY + PLAYER_RADIUS + 4);
  }
}
