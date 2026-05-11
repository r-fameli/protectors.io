import shortid from 'shortid';
import GameObject from './object';
import Constants from '../shared/constants';

class Bullet extends GameObject {
  parentID: string;

  constructor(parentID: string, x: number, y: number, dir: number) {
    super(shortid(), x, y, dir, Constants.BULLET_SPEED);
    this.parentID = parentID;
  }

  update(dt: number): boolean {
    super.update(dt);
    return this.x < 0 || this.x > Constants.MAP_SIZE || this.y < 0 || this.y > Constants.MAP_SIZE;
  }
}

export default Bullet;
