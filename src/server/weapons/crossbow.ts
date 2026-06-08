import GameObject from "../object";
import { CrossbowConfig } from "../../shared/weapon-configs";

class Crossbow extends GameObject {
  type: string;
  duration: number;
  effectiveTime: number;
  radius: number;
  attackRadius: number;
  fireCooldown: number;
  fireCdInterval: number;
  aimDirection: number;
  damageMultiplier: number;
  /** Overridden by weapon upgrades. */
  arrowSpeed: number;
  arrowMaxTravel: number;

  constructor(id: string, x: number, y: number, dir: number) {
    super(id, x, y, dir, 0);
    this.type = 'crossbow';
    this.isMoving = false;
    this.effectiveTime = 0;
    this.duration = CrossbowConfig.DURATION;
    this.radius = CrossbowConfig.RADIUS;
    this.attackRadius = CrossbowConfig.ATTACK_RADIUS;
    this.fireCooldown = 0;
    this.fireCdInterval = CrossbowConfig.FIRE_COOLDOWN;
    this.aimDirection = dir;
    this.damageMultiplier = 1;
    this.arrowSpeed = CrossbowConfig.ARROW_SPEED;
    this.arrowMaxTravel = CrossbowConfig.ARROW_MAX_TRAVEL;
  }

  update(dt: number): boolean {
    this.effectiveTime += dt * 1000;
    return this.effectiveTime > this.duration;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      type: this.type,
      direction: this.direction,
      radius: this.radius,
      remainingRatio: Math.max(0, 1 - this.effectiveTime / this.duration),
      aimDirection: this.aimDirection,
    };
  }
}

export default Crossbow;
