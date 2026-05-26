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
    this.direction = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    const dx = this.x - this.targetX;
    const dy = this.y - this.targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const stopDist = Constants.TREE_RADIUS + this.radius;

    if (dist > stopDist) {
      this.isMoving = true;
      super.update(dt);
    } else {
      this.isMoving = false;
    }

    return false; // never removed on reaching the tree
  }

  takeDamage(amount: number) {
    this.hp -= amount;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      hp: this.hp,
      maxHp: this.maxHp,
      radius: this.radius,
      mobType: this.mobType,
    };
  }
}

export default Mob;
