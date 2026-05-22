import GameObject from "../object";
import { MobConfig } from "../../shared/mob-configs";

class Mob extends GameObject {
  hp: number;
  maxHp: number;
  targetX: number;
  targetY: number;
  radius: number;
  mobType: string;

  constructor(id: string, x: number, y: number, targetX: number, targetY: number, config: MobConfig, mobType: string) {
    super(id, x, y, 0, config.BASE_SPEED);
    this.hp = config.BASE_HEALTH;
    this.maxHp = config.BASE_HEALTH;
    this.targetX = targetX;
    this.targetY = targetY;
    this.radius = config.BASE_RADIUS;
    this.mobType = mobType;
  }

  update(dt: number): boolean {
    this.direction = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    super.update(dt);

    const dx = this.x - this.targetX;
    const dy = this.y - this.targetY;
    return (dx * dx + dy * dy) < 400;
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
