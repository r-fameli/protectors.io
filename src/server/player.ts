import GameObject from './object';
import Constants from '../shared/constants';
import { WEAPON_ENTRIES } from '../shared/weapon-configs';

const EXP_BASE_THRESHOLD = 100;

type WeaponType = 'turret' | 'springer' | 'spiderweb';

interface WeaponState {
  type: WeaponType;
  cooldown: number;
  maxCooldown: number;
}

interface UpgradeLevels {
  cooldown: number;
  range: number;
  damage: number;
}

interface WeaponSlot {
  cooldown: number;
  idCounter: number;
}

class Player extends GameObject {
  username: string;
  hp: number;
  score: number;
  weaponSlots: Record<string, WeaponSlot>;
  exp: number;
  level: number;
  nextLevelExp: number;
  upgrades: UpgradeLevels;
  pendingUpgrades: number;

  constructor(id: string, username: string, x: number, y: number) {
    super(id, x, y, Math.random() * 2 * Math.PI, Constants.PLAYER_SPEED);
    this.isMoving = false;
    this.username = username;
    this.hp = Constants.PLAYER_MAX_HP;
    this.score = 0;
    this.weaponSlots = {};
    for (const w of WEAPON_ENTRIES) {
      this.weaponSlots[w.type] = { cooldown: 0, idCounter: 0 };
    }
    this.exp = 0;
    this.level = 1;
    this.nextLevelExp = EXP_BASE_THRESHOLD;
    this.upgrades = { cooldown: 0, range: 0, damage: 0 };
    this.pendingUpgrades = 0;
  }

  addExp(amount: number) {
    this.exp += amount;
    while (this.exp >= this.nextLevelExp) {
      this.exp -= this.nextLevelExp;
      this.level++;
      this.nextLevelExp = Math.floor(EXP_BASE_THRESHOLD * Math.pow(1.08, this.level - 1));
      this.pendingUpgrades++;
    }
  }

  applyUpgrade(type: 'cooldown' | 'range' | 'damage') {
    if (this.pendingUpgrades > 0) {
      this.upgrades[type]++;
      this.pendingUpgrades--;
    }
  }

  /** Cooldown multiplier (lower = faster). */
  get cooldownMultiplier(): number { return Math.pow(0.9, this.upgrades.cooldown); }
  /** Range multiplier. */
  get rangeMultiplier(): number { return 1 + 0.1 * this.upgrades.range; }
  /** Damage multiplier. */
  get damageMultiplier(): number { return 1 + 0.15 * this.upgrades.damage; }

  update(dt: number) {
    super.update(dt);
    this.score += dt * Constants.SCORE_PER_SECOND;
    this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
    this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));
  }

  getWeapons(): WeaponState[] {
    return WEAPON_ENTRIES.map(w => ({
      type: w.type as WeaponType,
      cooldown: this.weaponSlots[w.type]?.cooldown || 0,
      maxCooldown: w.config.COOLDOWN,
    }));
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
      upgrades: this.upgrades,
      pendingUpgrades: this.pendingUpgrades,
    };
  }
}

export default Player;
