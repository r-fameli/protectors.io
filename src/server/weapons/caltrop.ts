import GameObject from "../object";
import { SpringerConfig } from "../../shared/weapon-configs";

class Caltrop extends GameObject {
  spawnTime: number;
  duration: number;
  radius: number;
  damage: number;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 0, 0);
    this.isMoving = false;
    this.spawnTime = Date.now();
    this.duration = SpringerConfig.CALTROP_DURATION;
    this.radius = 24;
    this.damage = SpringerConfig.CALTROP_DAMAGE;
  }

  update(dt: number): boolean {
    return Date.now() - this.spawnTime > this.duration;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      radius: this.radius,
    };
  }
}

export default Caltrop;
