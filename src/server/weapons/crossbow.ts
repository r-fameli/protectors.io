import GameObject from "../object";
import { CrossbowConfig } from "../../shared/weapon-configs";

class Crossbow extends GameObject {
  type: string;
  spawnTime: number;
  duration: number;
  radius: number;
  attackRadius: number;
  fireCooldown: number;
  fireCdInterval: number;
  aimDirection: number;
  damageMultiplier: number;

  constructor(id: string, x: number, y: number, dir: number) {
    super(id, x, y, dir, 0);
    this.type = 'crossbow';
    this.isMoving = false;
    this.spawnTime = Date.now();
    this.duration = CrossbowConfig.DURATION;
    this.radius = CrossbowConfig.RADIUS;
    this.attackRadius = CrossbowConfig.ATTACK_RADIUS;
    this.fireCooldown = 0;
    this.fireCdInterval = CrossbowConfig.FIRE_COOLDOWN;
    this.aimDirection = dir;
    this.damageMultiplier = 1;
  }

  update(dt: number): boolean {
    return Date.now() - this.spawnTime > this.duration;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      type: this.type,
      direction: this.direction,
      radius: this.radius,
      remainingRatio: Math.max(0, 1 - (Date.now() - this.spawnTime) / this.duration),
      aimDirection: this.aimDirection,
    };
  }
}

export default Crossbow;
