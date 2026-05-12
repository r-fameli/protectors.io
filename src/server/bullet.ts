import { randomUUID } from 'crypto';
import GameObject from './object';
import Constants from '../shared/constants';

class Bullet extends GameObject {
  parentID: string;
  damage: number;

  constructor(parentID: string, x: number, y: number, dir: number, damage: number = Constants.BULLET_DAMAGE) {
    super(randomUUID(), x, y, dir, Constants.BULLET_SPEED);
    this.parentID = parentID;
    this.damage = damage;
  }

  update(dt: number): boolean {
    super.update(dt);
    return this.x < 0 || this.x > Constants.MAP_SIZE || this.y < 0 || this.y > Constants.MAP_SIZE;
  }
}

export default Bullet;
