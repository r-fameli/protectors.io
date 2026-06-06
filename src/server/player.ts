import GameObject from './object';
import Constants from '../shared/constants';
import { getWeaponConfig } from '../shared/weapon-configs';
import { CATCH_UP_MULT } from '../shared/wave-configs';
import {
  MAX_UPGRADE_LEVEL,
  WEAPON_UPGRADE_TREES,
  WEAPON_DESCRIPTIONS,
  BASE_STATS_FACTORIES,
  TurretStats,
  SpringerStats,
  SpiderwebStats,
  CrossbowStats,
} from '../shared/weapon-upgrades';

const EXP_BASE_THRESHOLD = 100;

type WeaponType = 'turret' | 'springer' | 'spiderweb' | 'crossbow';

interface WeaponState {
  type: WeaponType;
  cooldown: number;
  maxCooldown: number;
}

/** A choice presented to the player on level-up. */
export interface UpgradeChoice {
  upgradeKey: string;  // 'upgrade_turret' or 'acquire_springer'
  label: string;
  description: string;
  weaponType: string;
  level: number;
}

interface WeaponSlot {
  cooldown: number;
  idCounter: number;
}

/** Discriminated per-weapon stats storage. */
type WeaponStatsUnion =
  | { type: 'turret'; level: number; stats: TurretStats }
  | { type: 'springer'; level: number; stats: SpringerStats }
  | { type: 'spiderweb'; level: number; stats: SpiderwebStats }
  | { type: 'crossbow'; level: number; stats: CrossbowStats };

class Player extends GameObject {
  username: string;
  hp: number;
  score: number;
  weaponSlots: Record<string, WeaponSlot>;
  private weaponEntries: Record<string, WeaponStatsUnion>;
  exp: number;
  totalExpEarned: number;
  level: number;
  nextLevelExp: number;
  pendingUpgrades: number;
  /** Cache upgrade choices so they don't reshuffle every server tick. */
  private cachedUpgrades: UpgradeChoice[] | null = null;

  constructor(id: string, username: string, x: number, y: number) {
    super(id, x, y, Math.random() * 2 * Math.PI, Constants.PLAYER_SPEED);
    this.isMoving = false;
    this.username = username;
    this.hp = Constants.PLAYER_MAX_HP;
    this.score = 0;
    this.weaponSlots = {};
    this.weaponEntries = {};
    this.exp = 0;
    this.totalExpEarned = 0;
    this.level = 1;
    this.nextLevelExp = EXP_BASE_THRESHOLD;
    this.pendingUpgrades = 0;

    // Start with only the turret
    this.acquireWeapon('turret');
  }

  // ── Weapon state accessors ──

  /** Get the raw weapon entry (type + level + stats) for a given weapon type. */
  getWeaponEntry(type: string): WeaponStatsUnion | undefined {
    return this.weaponEntries[type];
  }

  /** Get turret stats with correct type narrowing. */
  getTurretStats(): TurretStats | undefined {
    const e = this.weaponEntries['turret'];
    return e?.type === 'turret' ? e.stats : undefined;
  }

  getSpringerStats(): SpringerStats | undefined {
    const e = this.weaponEntries['springer'];
    return e?.type === 'springer' ? e.stats : undefined;
  }

  getSpiderwebStats(): SpiderwebStats | undefined {
    const e = this.weaponEntries['spiderweb'];
    return e?.type === 'spiderweb' ? e.stats : undefined;
  }

  getCrossbowStats(): CrossbowStats | undefined {
    const e = this.weaponEntries['crossbow'];
    return e?.type === 'crossbow' ? e.stats : undefined;
  }

  // ── Upgrade system ──

  addExp(amount: number, avgLevel?: number) {
    if (avgLevel && this.level < avgLevel) {
      amount = Math.round(amount * (1 + (avgLevel - this.level) * CATCH_UP_MULT));
    }
    this.totalExpEarned += amount;
    this.exp += amount;
    while (this.exp >= this.nextLevelExp) {
      this.exp -= this.nextLevelExp;
      this.level++;
      this.nextLevelExp = Math.floor(EXP_BASE_THRESHOLD * Math.pow(1.08, this.level - 1));
      this.pendingUpgrades++;
      this.cachedUpgrades = null; // regenerate choices on next request
    }
  }

  /** Handle an upgrade choice from the client. */
  applyUpgrade(upgradeKey: string): boolean {
    if (this.pendingUpgrades <= 0) return false;
    this.cachedUpgrades = null; // choices will change after this

    if (upgradeKey.startsWith('acquire_')) {
      const weaponType = upgradeKey.slice('acquire_'.length);
      this.acquireWeapon(weaponType);
      this.pendingUpgrades--;
      return true;
    }

    if (upgradeKey.startsWith('upgrade_')) {
      const weaponType = upgradeKey.slice('upgrade_'.length);
      this.upgradeWeapon(weaponType);
      this.pendingUpgrades--;
      return true;
    }

    return false;
  }

  /** Add a new weapon type (first time). Creates slot + base stats. */
  private acquireWeapon(type: string): void {
    if (this.weaponEntries[type]) return; // already owned
    if (Object.keys(this.weaponSlots).length >= 4) return; // slots full

    this.weaponSlots[type] = { cooldown: 0, idCounter: 0 };
    const factory = BASE_STATS_FACTORIES[type];
    if (!factory) return;

    const entry: WeaponStatsUnion = { type: type as WeaponType, level: 1, stats: factory() } as WeaponStatsUnion;
    this.weaponEntries[type] = entry;
  }

  /** Apply the next upgrade for an owned weapon type. */
  private upgradeWeapon(type: string): void {
    const entry = this.weaponEntries[type];
    if (!entry) return;
    if (entry.level >= MAX_UPGRADE_LEVEL) return;

    const tree = WEAPON_UPGRADE_TREES[type];
    if (!tree) return;
    const def = tree[entry.level - 1]; // level 1 → tree[0] (first upgrade), level 2 → tree[1]
    if (!def) return;

    def.apply(entry.stats);
    entry.level++;
  }

  /** Build list of up to 3 upgrade choices for the client. Cached until upgrade applied. */
  getAvailableUpgrades(): UpgradeChoice[] {
    if (this.cachedUpgrades) return this.cachedUpgrades;

    const choices: UpgradeChoice[] = [];
    const slotCount = Object.keys(this.weaponSlots).length;

    // 1. Acquire options (weapons not owned, slots < 4)
    if (slotCount < 4) {
      for (const type of ['springer', 'spiderweb', 'crossbow']) {
        if (this.weaponEntries[type]) continue;
        choices.push({
          upgradeKey: `acquire_${type}`,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          description: WEAPON_DESCRIPTIONS[type] || '',
          weaponType: type,
          level: 1,
        });
      }
    }

    // 2. Upgrade options for owned weapons
    for (const [type, entry] of Object.entries(this.weaponEntries)) {
      if (entry.level >= MAX_UPGRADE_LEVEL) continue;
      const tree = WEAPON_UPGRADE_TREES[type];
      if (!tree) continue;
      const def = tree[entry.level - 1]; // level 1 → tree[0] (first upgrade)
      if (!def) continue;

      choices.push({
        upgradeKey: `upgrade_${type}`,
        label: def.label,
        description: def.formatDescription(entry.stats),
        weaponType: type,
        level: entry.level + 1, // target level after upgrade
      });
    }

    // Shuffle and pick up to 3
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    this.cachedUpgrades = choices.slice(0, 3);
    return this.cachedUpgrades;
  }

  // ── Serialization ──

  getWeapons(): WeaponState[] {
    return Object.keys(this.weaponEntries).map(type => ({
      type: type as WeaponType,
      cooldown: this.weaponSlots[type]?.cooldown || 0,
      maxCooldown: getWeaponConfig(type).COOLDOWN,
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
      pendingUpgrades: this.pendingUpgrades,
      availableUpgrades: this.pendingUpgrades > 0 ? this.getAvailableUpgrades() : [],
    };
  }
}

export default Player;
