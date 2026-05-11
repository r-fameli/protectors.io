import GameObject from './object';
import Constants from '../shared/constants';

class Player extends GameObject {
  username: string;
  hp: number;
  score: number;

  constructor(id: string, username: string, x: number, y: number) {
    super(id, x, y, Math.random() * 2 * Math.PI, Constants.PLAYER_SPEED);
    this.username = username;
    this.hp = Constants.PLAYER_MAX_HP;
    this.score = 0;
  }

  update(dt: number) {
    super.update(dt);
    this.score += dt * Constants.SCORE_PER_SECOND;
    this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
    this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));
    return null;
  }

  takeBulletDamage() {
    this.hp -= Constants.BULLET_DAMAGE;
  }

  onDealtDamage() {
    this.score += Constants.SCORE_BULLET_HIT;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      hp: this.hp,
    };
  }
}

export default Player;
