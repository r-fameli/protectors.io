import GameObject from "../object";
import Constants from "../../shared/constants";
import { MobConfig } from "../../shared/mob-configs";

class Mob extends GameObject {
  hp: number;
  maxHp: number;
  targetX: number;
  targetY: number;
  radius: number;
  mobType: string;
  xpDrop: number;
  buffTimer: number = 0;
  speedMultiplier: number = 1;
  slowMultiplier: number = 1;

  constructor(id: string, x: number, y: number, targetX: number, targetY: number, config: MobConfig, mobType: string) {
    super(id, x, y, 0, config.BASE_SPEED);
    this.hp = config.BASE_HEALTH;
    this.maxHp = config.BASE_HEALTH;
    this.targetX = targetX;
    this.targetY = targetY;
    this.radius = config.BASE_RADIUS;
    this.mobType = mobType;
    this.xpDrop = config.XP_DROP;
  }

  update(dt: number): boolean {
    // Tick buff timer, revert speed on expiry
    if (this.buffTimer > 0) {
      this.buffTimer -= dt;
      if (this.buffTimer <= 0) {
        this.buffTimer = 0;
        this.speedMultiplier = 1;
      }
    }

    this.direction = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    const dx = this.x - this.targetX;
    const dy = this.y - this.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const stopDist = Constants.TREE_RADIUS + this.radius;

    if (dist > stopDist) {
      this.isMoving = true;
      this.x += dt * this.speed * this.speedMultiplier * this.slowMultiplier * Math.cos(this.direction);
      this.y += dt * this.speed * this.speedMultiplier * this.slowMultiplier * Math.sin(this.direction);
    } else {
      this.isMoving = false;
    }

    return false; // never removed on reaching the tree
  }

  takeDamage(amount: number) {
    this.hp -= amount;
  }

  /** Apply a temporary speed buff. Overwrites any existing buff. */
  applyBuff(duration: number, multiplier: number) {
    this.buffTimer = duration;
    this.speedMultiplier = multiplier;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      hp: this.hp,
      maxHp: this.maxHp,
      radius: this.radius,
      mobType: this.mobType,
      buffed: this.buffTimer > 0,
    };
  }
}

export default Mob;
