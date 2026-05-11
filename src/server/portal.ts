import GameObject from './object';

class Portal extends GameObject {
  radius: number;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 0, 0);
    this.radius = 100;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      radius: this.radius,
    };
  }
}

export default Portal;
