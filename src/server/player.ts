import GameObject from './object';
import Constants from '../shared/constants';
import { BasicTurretConfig, SpringerConfig } from '../shared/weapon-configs';

const EXP_BASE_THRESHOLD = 100;

type WeaponType = 'turret' | 'springer';

interface WeaponState {
  type: WeaponType;
  cooldown: number;
  maxCooldown: number;
}

class Player extends GameObject {
  username: string;
  hp: number;
  score: number;
  turretCooldown: number;
  turretIdCounter: number;
  springerCooldown: number;
  springerIdCounter: number;
  exp: number;
  level: number;
  nextLevelExp: number;

  constructor(id: string, username: string, x: number, y: number) {
    super(id, x, y, Math.random() * 2 * Math.PI, Constants.PLAYER_SPEED);
    this.username = username;
    this.hp = Constants.PLAYER_MAX_HP;
    this.score = 0;
    this.turretCooldown = 0;
    this.turretIdCounter = 0;
    this.springerCooldown = 0;
    this.springerIdCounter = 0;
    this.exp = 0;
    this.level = 1;
    this.nextLevelExp = EXP_BASE_THRESHOLD;
  }

  addExp(amount: number) {
    this.exp += amount;
    while (this.exp >= this.nextLevelExp) {
      this.exp -= this.nextLevelExp;
      this.level++;
      this.nextLevelExp = Math.floor(EXP_BASE_THRESHOLD * Math.pow(1.08, this.level - 1));
    }
  }

  update(dt: number) {
    super.update(dt);
    this.score += dt * Constants.SCORE_PER_SECOND;
    this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
    this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));
  }

  getWeapons(): WeaponState[] {
    // Hardcoding these weapons for now
    return [
      { type: 'turret', cooldown: this.turretCooldown, maxCooldown: BasicTurretConfig.COOLDOWN },
      { type: 'springer', cooldown: this.springerCooldown, maxCooldown: SpringerConfig.COOLDOWN },
    ];
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      hp: this.hp,
      weapons: this.getWeapons(),
      exp: this.exp,
      level: this.level,
      nextLevelExp: this.nextLevelExp,
    };
  }
}

export default Player;
