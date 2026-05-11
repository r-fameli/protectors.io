class GameObject {
  id: string;
  x: number;
  y: number;
  direction: number;
  speed: number;
  isMoving: boolean;

  constructor(id: string, x: number, y: number, dir: number, speed: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = dir;
    this.speed = speed;
    this.isMoving = true;
  }

  update(dt: number) {
    if (this.isMoving) {
      this.x += dt * this.speed * Math.cos(this.direction);
      this.y += dt * this.speed * Math.sin(this.direction);
    }
  }

  distanceTo(object: { x: number; y: number }): number {
    const dx = this.x - object.x;
    const dy = this.y - object.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setDirection(dir: number) {
    this.direction = dir;
  }

  setMoving(moving: boolean) {
    this.isMoving = moving;
  }

  serializeForUpdate(): { id: string; x: number; y: number } {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
}

export default GameObject;
