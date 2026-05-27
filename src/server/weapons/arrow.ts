import { randomUUID } from 'crypto';
import GameObject from '../object';
import Constants from '../../shared/constants';

class Arrow extends GameObject {
  parentID: string;
  damage: number;
  startX: number;
  startY: number;
  maxTravelDist: number;
  hitMobIds: Set<string>;
  radius: number;

  constructor(parentID: string, x: number, y: number, dir: number, damage: number, maxTravelDist: number, speed: number) {
    super(randomUUID(), x, y, dir, speed);
    this.parentID = parentID;
    this.damage = damage;
    this.startX = x;
    this.startY = y;
    this.maxTravelDist = maxTravelDist;
    this.hitMobIds = new Set();
    this.radius = 5;
  }

  update(dt: number): boolean {
    super.update(dt);
    const distTraveled = Math.sqrt(
      (this.x - this.startX) ** 2 + (this.y - this.startY) ** 2,
    );
    return distTraveled > this.maxTravelDist ||
      this.x < 0 || this.x > Constants.MAP_SIZE ||
      this.y < 0 || this.y > Constants.MAP_SIZE;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      radius: this.radius,
    };
  }
}

export default Arrow;
