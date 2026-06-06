/**
 * Weapon upgrade system. Each weapon type has its own stats interface
 * (no shared fields across types) and an ordered upgrade tree.
 *
 * Tuning knobs in UPGRADE_TUNING make balance tweaks easy.
 * Add level 4+ entries to the tree arrays — apply() can set boolean flags
 * or new numeric fields for non-stat upgrades (triple shot, two spiders, etc.).
 */
import {
  BasicTurretConfig,
  SpringerConfig,
  SpiderwebConfig,
  CrossbowConfig,
} from "./weapon-configs";

// ── Tuning knobs ──────────────────────────────────────────

export const UPGRADE_TUNING = {
  FIRE_COOLDOWN_MULT: 0.85, // -15% fire interval per level
  DAMAGE_MULT: 1.2, // +20% damage per level
  ATTACK_RADIUS_MULT: 1.1, // +10% attack radius per level
  CALTROP_COOLDOWN_MULT: 0.8, // -20% caltrop placement interval
  CALTROP_DAMAGE_MULT: 1.2, // +20% caltrop damage
  ARROW_SPEED_MULT: 1.15, // +15% arrow speed
  ARROW_MAX_TRAVEL_MULT: 1.2, // +20% arrow max travel
  SPIDER_DAMAGE_MULT: 1.2, // +20% spider damage
  SPIDER_ATTACK_INTERVAL_MULT: 0.85, // -15% spider attack interval
  SLOW_MULT: 0.8, // slow multiplier lower = stronger slow
};

/** Max weapon level (1 = base/acquired, 2/3/4 = upgrade tiers). */
export const MAX_UPGRADE_LEVEL = 4;

// ── Per-weapon stat interfaces ────────────────────────────

export interface TurretStats {
  fireCdInterval: number;
  attackRadius: number;
  damageMult: number;
}

export interface SpringerStats {
  attackRadius: number;
  damageMult: number;
  caltropCooldown: number;
}

export interface SpiderwebStats {
  attackRadius: number;
  damageMult: number;
  slowMultiplier: number;
  spiderDamage: number;
  spiderAttackInterval: number;
}

export interface CrossbowStats {
  attackRadius: number;
  damageMult: number;
  arrowSpeed: number;
  arrowMaxTravel: number;
  fireCdInterval: number;
}

// ── Upgrade definition ────────────────────────────────────

export interface WeaponUpgradeDef<S> {
  weaponType: string;
  label: string;
  /** Given current stats, produce description string with delta, e.g. "Fire rate: 3.0s → 2.6s" */
  formatDescription: (current: S) => string;
  level: number;
  /** Mutate stats in-place. Called after formatDescription so preview shows before-values. */
  apply: (stats: S) => void;
}

// ── Upgrade trees ─────────────────────────────────────────

export const TURRET_UPGRADES: WeaponUpgradeDef<TurretStats>[] = [
  {
    weaponType: "turret",
    level: 2,
    label: "Faster Turret",
    formatDescription: (s) =>
      `Fire rate: ${(s.fireCdInterval / 1000).toFixed(1)}s → ${((s.fireCdInterval * UPGRADE_TUNING.FIRE_COOLDOWN_MULT) / 1000).toFixed(1)}s`,
    apply: (s) => {
      s.fireCdInterval = Math.round(
        s.fireCdInterval * UPGRADE_TUNING.FIRE_COOLDOWN_MULT,
      );
    },
  },
  {
    weaponType: "turret",
    level: 3,
    label: "Stronger Turret",
    formatDescription: (s) =>
      `Damage: x${s.damageMult.toFixed(1)} → x${(s.damageMult * UPGRADE_TUNING.DAMAGE_MULT).toFixed(1)}`,
    apply: (s) => {
      s.damageMult *= UPGRADE_TUNING.DAMAGE_MULT;
    },
  },
  {
    weaponType: "turret",
    level: 4,
    label: "Wider Range",
    formatDescription: (s) =>
      `Range: ${s.attackRadius} → ${Math.round(s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT)}`,
    apply: (s) => {
      s.attackRadius = Math.round(
        s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT,
      );
    },
  },
];

export const SPRINGER_UPGRADES: WeaponUpgradeDef<SpringerStats>[] = [
  {
    weaponType: "springer",
    level: 2,
    label: "Faster Caltrops",
    formatDescription: (s) =>
      `Caltrop rate: ${(s.caltropCooldown / 1000).toFixed(1)}s → ${((s.caltropCooldown * UPGRADE_TUNING.CALTROP_COOLDOWN_MULT) / 1000).toFixed(1)}s`,
    apply: (s) => {
      s.caltropCooldown = Math.round(
        s.caltropCooldown * UPGRADE_TUNING.CALTROP_COOLDOWN_MULT,
      );
    },
  },
  {
    weaponType: "springer",
    level: 3,
    label: "Wider Caltrop Area",
    formatDescription: (s) =>
      `Range: ${s.attackRadius} → ${Math.round(s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT)}`,
    apply: (s) => {
      s.attackRadius = Math.round(
        s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT,
      );
    },
  },
  {
    weaponType: "springer",
    level: 4,
    label: "Sharpened Caltrops",
    formatDescription: (s) =>
      `Damage: x${s.damageMult.toFixed(1)} → x${(s.damageMult * UPGRADE_TUNING.CALTROP_DAMAGE_MULT).toFixed(1)}`,
    apply: (s) => {
      s.damageMult *= UPGRADE_TUNING.CALTROP_DAMAGE_MULT;
    },
  },
];

export const SPIDERWEB_UPGRADES: WeaponUpgradeDef<SpiderwebStats>[] = [
  {
    weaponType: "spiderweb",
    level: 2,
    label: "Deadly Spiders",
    formatDescription: (s) =>
      `Spider damage: ${s.spiderDamage} → ${Math.round(s.spiderDamage * UPGRADE_TUNING.SPIDER_DAMAGE_MULT)}`,
    apply: (s) => {
      s.spiderDamage = Math.round(
        s.spiderDamage * UPGRADE_TUNING.SPIDER_DAMAGE_MULT,
      );
    },
  },
  {
    weaponType: "spiderweb",
    level: 3,
    label: "Sticky Web",
    formatDescription: (s) =>
      `Slow: ${Math.round((1 - s.slowMultiplier) * 100)}% → ${Math.round((1 - s.slowMultiplier * UPGRADE_TUNING.SLOW_MULT) * 100)}%. Range: ${s.attackRadius} → ${Math.round(s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT)}`,
    apply: (s) => {
      s.slowMultiplier *= UPGRADE_TUNING.SLOW_MULT;
      s.attackRadius = Math.round(
        s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT,
      );
    },
  },
  {
    weaponType: "spiderweb",
    level: 4,
    label: "Aggressive Spiders",
    formatDescription: (s) =>
      `Spider attack interval: ${(s.spiderAttackInterval / 1000).toFixed(1)}s → ${((s.spiderAttackInterval * UPGRADE_TUNING.SPIDER_ATTACK_INTERVAL_MULT) / 1000).toFixed(1)}s`,
    apply: (s) => {
      s.spiderAttackInterval = Math.round(
        s.spiderAttackInterval * UPGRADE_TUNING.SPIDER_ATTACK_INTERVAL_MULT,
      );
    },
  },
];

export const CROSSBOW_UPGRADES: WeaponUpgradeDef<CrossbowStats>[] = [
  {
    weaponType: "crossbow",
    level: 2,
    label: "Longer Reach",
    formatDescription: (s) =>
      `Range: ${s.attackRadius} → ${Math.round(s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT)}. Travel: ${s.arrowMaxTravel} → ${Math.round(s.arrowMaxTravel * UPGRADE_TUNING.ARROW_MAX_TRAVEL_MULT)}`,
    apply: (s) => {
      s.attackRadius = Math.round(
        s.attackRadius * UPGRADE_TUNING.ATTACK_RADIUS_MULT,
      );
      s.arrowMaxTravel = Math.round(
        s.arrowMaxTravel * UPGRADE_TUNING.ARROW_MAX_TRAVEL_MULT,
      );
    },
  },
  {
    weaponType: "crossbow",
    level: 3,
    label: "Faster Crossbow",
    formatDescription: (s) =>
      `Fire rate: ${(s.fireCdInterval / 1000).toFixed(1)}s → ${((s.fireCdInterval * UPGRADE_TUNING.FIRE_COOLDOWN_MULT) / 1000).toFixed(1)}s`,
    apply: (s) => {
      s.fireCdInterval = Math.round(
        s.fireCdInterval * UPGRADE_TUNING.FIRE_COOLDOWN_MULT,
      );
    },
  },
  {
    weaponType: "crossbow",
    level: 4,
    label: "Piercing Bolts",
    formatDescription: (s) =>
      `Damage: x${s.damageMult.toFixed(1)} → x${(s.damageMult * UPGRADE_TUNING.DAMAGE_MULT).toFixed(1)}`,
    apply: (s) => {
      s.damageMult *= UPGRADE_TUNING.DAMAGE_MULT;
    },
  },
];

export const WEAPON_UPGRADE_TREES: Record<string, WeaponUpgradeDef<any>[]> = {
  turret: TURRET_UPGRADES,
  springer: SPRINGER_UPGRADES,
  spiderweb: SPIDERWEB_UPGRADES,
  crossbow: CROSSBOW_UPGRADES,
};

// ── Weapon descriptions (shown when acquiring new weapon) ──

export const WEAPON_DESCRIPTIONS: Record<string, string> = {
  springer: "Deploys caltrop traps that damage enemies walking through them.",
  spiderweb: "Slows enemies in a radius and spawns a spider to attack them.",
  crossbow: "Fires piercing arrows that hit every enemy in a line.",
};

// ── Base stats factories ──────────────────────────────────

export function createBaseTurretStats(): TurretStats {
  return {
    fireCdInterval: BasicTurretConfig.FIRE_COOLDOWN,
    attackRadius: BasicTurretConfig.ATTACK_RADIUS,
    damageMult: 1,
  };
}

export function createBaseSpringerStats(): SpringerStats {
  return {
    attackRadius: SpringerConfig.ATTACK_RADIUS,
    damageMult: 1,
    caltropCooldown: 3000, // hardcoded in updateSpringers
  };
}

export function createBaseSpiderwebStats(): SpiderwebStats {
  return {
    attackRadius: SpiderwebConfig.ATTACK_RADIUS,
    damageMult: 1,
    slowMultiplier: SpiderwebConfig.SLOW_MULTIPLIER,
    spiderDamage: SpiderwebConfig.SPIDER_DAMAGE,
    spiderAttackInterval: SpiderwebConfig.SPIDER_ATTACK_INTERVAL,
  };
}

export function createBaseCrossbowStats(): CrossbowStats {
  return {
    attackRadius: CrossbowConfig.ATTACK_RADIUS,
    damageMult: 1,
    arrowSpeed: CrossbowConfig.ARROW_SPEED,
    arrowMaxTravel: CrossbowConfig.ARROW_MAX_TRAVEL,
    fireCdInterval: CrossbowConfig.FIRE_COOLDOWN,
  };
}

export const BASE_STATS_FACTORIES: Record<string, () => any> = {
  turret: createBaseTurretStats,
  springer: createBaseSpringerStats,
  spiderweb: createBaseSpiderwebStats,
  crossbow: createBaseCrossbowStats,
};
