import GameObject from "../object";
import { SpiderwebConfig } from "../../shared/weapon-configs";

class Spiderweb extends GameObject {
  type: string;
  spawnTime: number;
  duration: number;
  radius: number;
  attackRadius: number;
  slowMultiplier: number;
  damageMultiplier: number;
  /** Base spider damage. Multiplied by damageMultiplier at attack time. Overridden by upgrades. */
  spiderDamage: number;
  /** Spider attack interval (ms). Overridden by upgrades. */
  spiderAttackInterval: number;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 0, 0);
    this.type = 'spiderweb';
    this.isMoving = false;
    this.spawnTime = Date.now();
    this.duration = SpiderwebConfig.DURATION;
    this.radius = SpiderwebConfig.RADIUS;
    this.attackRadius = SpiderwebConfig.ATTACK_RADIUS;
    this.slowMultiplier = SpiderwebConfig.SLOW_MULTIPLIER;
    this.damageMultiplier = 1;
    this.spiderDamage = SpiderwebConfig.SPIDER_DAMAGE;
    this.spiderAttackInterval = SpiderwebConfig.SPIDER_ATTACK_INTERVAL;
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

export default Spiderweb;
