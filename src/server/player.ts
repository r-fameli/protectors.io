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
import {
  PLAYER_UPGRADES,
  SPEED_MULTS,
  CD_MULTS,
  RANGE_MULTS,
  DAMAGE_MULTS,
  FORTIFY_MULTS,
  PICKUP_RADIUS_MULTS,
  CASCADE_CHANCES,
} from '../shared/player-upgrades';

const EXP_BASE_THRESHOLD = 100;

type WeaponType = 'turret' | 'springer' | 'spiderweb' | 'crossbow';

interface WeaponState {
  type: WeaponType;
  cooldown: number;
  maxCooldown: number;
}

/** A choice presented to the player on level-up. */
export interface UpgradeChoice {
  upgradeKey: string;  // 'upgrade_turret' or 'acquire_springer' or 'player_movementSpeed_2'
  label: string;
  description: string;
  weaponType: string;
  level: number;
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
  /** Ordered queue of owned weapon types. Round-robin deploy index. */
  deployQueue: string[];
  deployIndex: number;
  /** Shared deploy cooldown timer (ms remaining). */
  deployCooldown: number;
  /** Per-weapon id counters for naming deployed instances. */
  private weaponCounters: Record<string, number>;
  private weaponEntries: Record<string, WeaponStatsUnion>;
  /** Bonus cooldowns from Cascade. Per weapon type, independent timers (ms each), max MAX_BONUS_COOLDOWNS. */
  bonusCooldowns: Record<string, number[]> = {};

  /** Player progression upgrade levels (0 = unacquired). */
  playerUpgrades: Record<string, number> = {};

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
    this.deployQueue = [];
    this.deployIndex = 0;
    this.deployCooldown = 0;
    this.weaponCounters = {};
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

  getWeaponEntry(type: string): WeaponStatsUnion | undefined {
    return this.weaponEntries[type];
  }

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

  // ── Player progression multipliers ──

  get speedMultiplier(): number {
    return SPEED_MULTS[this.playerUpgrades['player_movementSpeed'] || 0];
  }

  get deployCdMultiplier(): number {
    return CD_MULTS[this.playerUpgrades['player_cooldownReduction'] || 0];
  }

  get rangeMultiplier(): number {
    return RANGE_MULTS[this.playerUpgrades['player_biggerRange'] || 0];
  }

  get damageMultiplier(): number {
    return DAMAGE_MULTS[this.playerUpgrades['player_damageUp'] || 0];
  }

  get maxSlots(): number {
    return 4 + (this.playerUpgrades['player_extraSlot'] || 0);
  }

  get fortifyMultiplier(): number {
    return FORTIFY_MULTS[this.playerUpgrades['player_fortify'] || 0];
  }

  get pickupRangeMultiplier(): number {
    return PICKUP_RADIUS_MULTS[this.playerUpgrades['player_pickupRadius'] || 0];
  }

  get cascadeChance(): number {
    return CASCADE_CHANCES[this.playerUpgrades['player_cascade'] || 0];
  }

  update(dt: number) {
    if (this.isMoving) {
      const xDir = Math.cos(this.direction);
      const yDir = Math.sin(this.direction);
      this.x += dt * Constants.PLAYER_SPEED * this.speedMultiplier * xDir;
      this.y += dt * Constants.PLAYER_SPEED * this.speedMultiplier * yDir;
    }
    this.score += dt * Constants.SCORE_PER_SECOND;
    this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
    this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));
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
      this.cachedUpgrades = null;
    }
  }

  /** Handle an upgrade choice from the client. */
  applyUpgrade(upgradeKey: string): boolean {
    if (this.pendingUpgrades <= 0) return false;
    this.cachedUpgrades = null;

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

    if (upgradeKey.startsWith('player_')) {
      const upgradeKeyName = upgradeKey;
      this.applyPlayerUpgrade(upgradeKeyName);
      this.pendingUpgrades--;
      return true;
    }

    return false;
  }

  /** Apply a player upgrade. Key format: `player_{upgradeKey}_{level}`. Stores highest level earned. */
  private applyPlayerUpgrade(key: string): void {
    const parts = key.split('_');
    const level = parseInt(parts[parts.length - 1], 10);
    const baseKey = parts.slice(0, -1).join('_');
    this.playerUpgrades[baseKey] = Math.max(this.playerUpgrades[baseKey] || 0, level);
  }

  /** Add a new weapon type (first time). Appends to deploy queue. */
  private acquireWeapon(type: string): void {
    if (this.weaponEntries[type]) return;
    if (this.deployQueue.length >= this.maxSlots) return;

    this.deployQueue.push(type);
    this.weaponCounters[type] = 0;
    const factory = BASE_STATS_FACTORIES[type];
    if (!factory) return;

    const entry: WeaponStatsUnion = { type: type as WeaponType, level: 1, stats: factory() } as WeaponStatsUnion;
    this.weaponEntries[type] = entry;
  }

  /** Max out all upgrades (weapon + player). Called by /upgrademe cheat. */
  maxOutAllUpgrades(): void {
    // Acquire all weapons
    for (const w of ['springer', 'spiderweb', 'crossbow']) {
      if (!this.weaponEntries[w]) this.acquireWeapon(w);
    }
    // Max all weapon upgrades
    for (const w of Object.keys(this.weaponEntries)) {
      while (this.weaponEntries[w] && (this.weaponEntries[w] as any).level < MAX_UPGRADE_LEVEL) {
        this.upgradeWeapon(w);
      }
    }
    // Max all player progression upgrades
    const playerMaxLevels: Record<string, number> = {
      movementSpeed: 3, cooldownReduction: 3, biggerRange: 3, damageUp: 3,
      extraSlot: 1, fortify: 3, pickupRadius: 2, cascade: 4,
    };
    for (const [key, maxLvl] of Object.entries(playerMaxLevels)) {
      const baseKey = `player_${key}`;
      this.playerUpgrades[baseKey] = maxLvl;
    }
    // Clear pending upgrades
    this.pendingUpgrades = 0;
    this.cachedUpgrades = null;
  }

  /** Apply the next upgrade for an owned weapon type. */
  private upgradeWeapon(type: string): void {
    const entry = this.weaponEntries[type];
    if (!entry) return;
    if (entry.level >= MAX_UPGRADE_LEVEL) return;

    const tree = WEAPON_UPGRADE_TREES[type];
    if (!tree) return;
    const def = tree[entry.level - 1];
    if (!def) return;

    def.apply(entry.stats);
    entry.level++;
  }

  /** Build list of up to 3 upgrade choices for the client. */
  getAvailableUpgrades(threatLevel?: number): UpgradeChoice[] {
    if (this.cachedUpgrades) return this.cachedUpgrades;

    const choices: UpgradeChoice[] = [];
    const weaponCount = this.deployQueue.length;

    // 1. Acquire weapon options
    if (weaponCount < this.maxSlots) {
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
      const def = tree[entry.level - 1];
      if (!def) continue;

      choices.push({
        upgradeKey: `upgrade_${type}`,
        label: def.label,
        description: def.formatDescription(entry.stats),
        weaponType: type,
        level: entry.level + 1,
      });
    }

    // 3. Player progression upgrades (filtered by threat level and progress level)
    const tl = threatLevel || 1;
    for (const def of PLAYER_UPGRADES) {
      const baseKey = `player_${def.upgradeKey}`;
      // Skip if already have this or a higher level of this upgrade
      if ((this.playerUpgrades[baseKey] || 0) >= def.level) continue;
      if (tl < def.minThreat) continue;
      // Only show the next available level (skip if def.level is not exactly current+1)
      if ((this.playerUpgrades[baseKey] || 0) !== def.level - 1) continue;

      choices.push({
        upgradeKey: `${baseKey}_${def.level}`,
        label: def.label,
        description: def.description,
        weaponType: 'player',
        level: def.level,
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

  /** Increment and return a unique sequence number for a deployed weapon instance. */
  nextDeployId(weaponType: string): number {
    this.weaponCounters[weaponType] = (this.weaponCounters[weaponType] || 0) + 1;
    return this.weaponCounters[weaponType];
  }

  // ── Serialization ──

  getWeapons(): WeaponState[] {
    return this.deployQueue.map(type => ({
      type: type as WeaponType,
      cooldown: type === this.deployQueue[this.deployIndex] ? this.deployCooldown : 0,
      maxCooldown: getWeaponConfig(type).COOLDOWN,
      bonusCooldowns: this.bonusCooldowns[type] || [],
    }));
  }

  serializeForUpdate(threatLevel?: number) {
    return {
      ...super.serializeForUpdate(),
      username: this.username,
      direction: this.direction,
      hp: this.hp,
      weapons: this.getWeapons(),
      exp: this.exp,
      level: this.level,
      nextLevelExp: this.nextLevelExp,
      pendingUpgrades: this.pendingUpgrades,
      availableUpgrades: this.pendingUpgrades > 0 ? this.getAvailableUpgrades(threatLevel) : [],
    };
  }
}

export default Player;
