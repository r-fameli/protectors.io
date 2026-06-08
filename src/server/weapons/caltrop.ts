import GameObject from "../object";
import { SpringerConfig } from "../../shared/weapon-configs";

class Caltrop extends GameObject {
  duration: number;
  effectiveTime: number;
  radius: number;
  damage: number;

  constructor(id: string, x: number, y: number, damageOverride?: number) {
    super(id, x, y, 0, 0);
    this.isMoving = false;
    this.effectiveTime = 0;
    this.duration = SpringerConfig.CALTROP_DURATION;
    this.radius = 24;
    this.damage = damageOverride !== undefined ? damageOverride : SpringerConfig.CALTROP_DAMAGE;
  }

  update(dt: number): boolean {
    this.effectiveTime += dt * 1000;
    return this.effectiveTime > this.duration;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      radius: this.radius,
    };
  }
}

export default Caltrop;
