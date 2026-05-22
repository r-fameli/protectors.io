import GameObject from "./object";

const EXP_ORB_RADIUS = 8;

class ExpOrb extends GameObject {
  radius: number;
  expValue: number;

  constructor(id: string, x: number, y: number, expValue: number) {
    super(id, x, y, 0, 0);
    this.isMoving = false;
    this.radius = EXP_ORB_RADIUS;
    this.expValue = expValue;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      radius: this.radius,
    };
  }
}

export default ExpOrb;
