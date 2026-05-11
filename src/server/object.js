class Object {
  constructor(id, x, y, dir, speed) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = dir;
    this.speed = speed;
    this.isMoving = true;  // Default to moving for bullets and other objects
  }

  update(dt) {
    if (this.isMoving) {
      this.x += dt * this.speed * Math.cos(this.direction);
      this.y += dt * this.speed * Math.sin(this.direction);
    }
  }

  distanceTo(object) {
    const dx = this.x - object.x;
    const dy = this.y - object.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setDirection(dir) {
    this.direction = dir;
  }

  setMoving(isMoving) {
    this.isMoving = isMoving;
  }

  serializeForUpdate() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
}

module.exports = Object;