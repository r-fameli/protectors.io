import Constants from '../shared/constants';

interface Collidable {
  id: string;
  parentID?: string;
  x: number;
  y: number;
  radius?: number;
  damage?: number;
  hp?: number;
  distanceTo: (obj: Collidable) => number;
  takeDamage?: (amount: number) => void;
}

interface CollisionResult {
  destroyedBullets: Collidable[];
  destroyedCaltrops: Collidable[];
  collectedCollectibles: Collidable[];
}

function applyCollisions(
  players: Collidable[],
  bullets: Collidable[],
  trees: Collidable[],
  mobs: Collidable[],
  caltrops: Collidable[],
  collectibles: Collidable[],
): CollisionResult {
  const destroyedBullets: Collidable[] = [];
  const destroyedCaltrops: Collidable[] = [];
  const collectedCollectibles: Collidable[] = [];

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

  // Caltrop vs mobs
  for (let i = 0; i < caltrops.length; i++) {
    if (destroyedCaltrops.includes(caltrops[i])) continue;
    for (let j = 0; j < mobs.length; j++) {
      const caltrop = caltrops[i];
      const mob = mobs[j];
      if (
        mob.distanceTo(caltrop) <= (mob.radius || 20) + (caltrop.radius || 8)
      ) {
        destroyedCaltrops.push(caltrop);
        mob.takeDamage!(caltrop.damage || 70);
        break;
      }
    }
  }

  // Player vs tree push
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < trees.length; j++) {
      const player = players[i];
      const tree = trees[j];
      const distance = player.distanceTo(tree);

      if (distance < Constants.PLAYER_RADIUS + tree.radius!) {
        const angle = Math.atan2(player.y - tree.y, player.x - tree.x);
        const targetDistance = Constants.PLAYER_RADIUS + tree.radius!;
        player.x = tree.x + Math.cos(angle) * targetDistance;
        player.y = tree.y + Math.sin(angle) * targetDistance;
      }
    }
  }

  // Player vs collectibles — collect on overlap
  if (collectibles) {
    for (const col of collectibles) {
      if (col.hp === undefined || col.hp <= 0) continue;
      for (const player of players) {
        if (col.distanceTo(player) <= (col.radius || 20) + Constants.PLAYER_RADIUS) {
          collectedCollectibles.push(col);
          col.takeDamage!(col.hp || 1);
          break;
        }
      }
    }
  }

  return { destroyedBullets, destroyedCaltrops, collectedCollectibles };
}

export default applyCollisions;
