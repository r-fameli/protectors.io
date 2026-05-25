import GameObject from './object';
import Constants from '../shared/constants';

class Tree extends GameObject {
  radius: number;
  hp: number;
  maxHp: number;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 0, 0);
    this.radius = 200;
    this.hp = Constants.TREE_MAX_HP;
    this.maxHp = Constants.TREE_MAX_HP;
  }

  takeDamage(amount: number) {
    this.hp -= amount;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      radius: this.radius,
      hp: this.hp,
      maxHp: this.maxHp,
    };
  }
}

export default Tree;
