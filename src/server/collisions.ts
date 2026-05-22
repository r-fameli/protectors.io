import Constants from '../shared/constants';

interface Collidable {
  id: string;
  parentID?: string;
  x: number;
  y: number;
  radius?: number;
  damage?: number;
  distanceTo: (obj: Collidable) => number;
  takeDamage?: (amount: number) => void;
}

function applyCollisions(
  players: Collidable[],
  bullets: Collidable[],
  portals: Collidable[],
  mobs: Collidable[],
): Collidable[] {
  const destroyedBullets: Collidable[] = [];

  // Bullet vs mobs
  for (let i = 0; i < bullets.length; i++) {
    if (destroyedBullets.includes(bullets[i])) continue;
    for (let j = 0; j < mobs.length; j++) {
      const bullet = bullets[i];
      const mob = mobs[j];
      if (
        bullet.parentID !== mob.id &&
        mob.distanceTo(bullet) <= (mob.radius || 20) + Constants.BULLET_RADIUS
      ) {
        destroyedBullets.push(bullet);
        mob.takeDamage!(bullet.damage || Constants.BULLET_DAMAGE);
        break;
      }
    }
  }

  // Player vs portal push
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < portals.length; j++) {
      const player = players[i];
      const portal = portals[j];
      const distance = player.distanceTo(portal);

      if (distance < Constants.PLAYER_RADIUS + portal.radius!) {
        const angle = Math.atan2(player.y - portal.y, player.x - portal.x);
        const targetDistance = Constants.PLAYER_RADIUS + portal.radius!;
        player.x = portal.x + Math.cos(angle) * targetDistance;
        player.y = portal.y + Math.sin(angle) * targetDistance;
      }
    }
  }

  return destroyedBullets;
}

export default applyCollisions;
