import GameObject from "../object";
import { SpringerConfig } from "../../shared/weapon-configs";

class Springer extends GameObject {
  type: string;
  duration: number;
  effectiveTime: number;
  radius: number;
  attackRadius: number;
  caltropCooldown: number;
  /** How often caltrops fire (ms). Overridden by weapon upgrades. */
  caltropCdInterval: number;
  damageMultiplier: number;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 0, 0);
    this.type = 'springer';
    this.isMoving = false;
    this.effectiveTime = 0;
    this.duration = SpringerConfig.DURATION;
    this.radius = SpringerConfig.RADIUS;
    this.attackRadius = SpringerConfig.ATTACK_RADIUS;
    this.caltropCooldown = 0;
    this.caltropCdInterval = 3000;
    this.damageMultiplier = 1;
  }

  update(dt: number): boolean {
    this.effectiveTime += dt * 1000;
    return this.effectiveTime > this.duration;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      type: this.type,
      radius: this.radius,
      remainingRatio: Math.max(0, 1 - this.effectiveTime / this.duration),
    };
  }
}

export default Springer;
