import GameObject from "../object";
import { TurretConfig } from "../../shared/weapon-configs";

class Turret extends GameObject {
  type: string;
  duration: number;
  effectiveTime: number;
  radius: number;
  fireCooldown: number;
  attackRadius: number;
  fireCdInterval: number;
  aimDirection: number;
  damageMultiplier: number;

  constructor(id: string, x: number, y: number, dir: number, config: TurretConfig) {
    super(id, x, y, dir, 0);
    this.type = 'turret';
    this.isMoving = false;
    this.effectiveTime = 0;
    this.duration = config.DURATION;
    this.radius = config.RADIUS;
    this.fireCooldown = 0;
    this.attackRadius = config.ATTACK_RADIUS;
    this.fireCdInterval = config.FIRE_COOLDOWN;
    this.aimDirection = dir;
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
      direction: this.direction,
      radius: this.radius,
      remainingRatio: Math.max(0, 1 - this.effectiveTime / this.duration),
      aimDirection: this.aimDirection,
    };
  }
}

export default Turret;
