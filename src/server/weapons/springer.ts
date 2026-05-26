import GameObject from "../object";
import { SpringerConfig } from "../../shared/weapon-configs";

class Springer extends GameObject {
  type: string;
  spawnTime: number;
  duration: number;
  radius: number;
  attackRadius: number;
  caltropCooldown: number;
  damageMultiplier: number;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 0, 0);
    this.type = 'springer';
    this.isMoving = false;
    this.spawnTime = Date.now();
    this.duration = SpringerConfig.DURATION;
    this.radius = SpringerConfig.RADIUS;
    this.attackRadius = SpringerConfig.ATTACK_RADIUS;
    this.caltropCooldown = 0;
    this.damageMultiplier = 1;
  }

  update(dt: number): boolean {
    return Date.now() - this.spawnTime > this.duration;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      type: this.type,
      radius: this.radius,
      remainingRatio: Math.max(0, 1 - (Date.now() - this.spawnTime) / this.duration),
    };
  }
}

export default Springer;
