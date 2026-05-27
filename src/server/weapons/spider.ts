import GameObject from "../object";

class Spider extends GameObject {
  parentWebId: string;
  attackCooldown: number;
  attackInterval: number;
  damage: number;
  damageMultiplier: number;
  speed: number;

  constructor(id: string, x: number, y: number, parentWebId: string, damage: number, attackInterval: number) {
    super(id, x, y, 0, 0);
    this.isMoving = false;
    this.parentWebId = parentWebId;
    this.attackCooldown = 0;
    this.attackInterval = attackInterval;
    this.damage = damage;
    this.damageMultiplier = 1;
    this.speed = 100;
  }

  update(dt: number): boolean {
    return false; // removal handled externally when web expires
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      radius: 20,
    };
  }
}

export default Spider;
