/**
 * Player progression upgrades. Each entry defines one level of a progression tree.
 * These appear in the upgrade choice pool alongside weapon acquire/upgrade options.
 *
 * minThreat — minimum threat level before this upgrade can appear as a choice.
 * upgradeKey — used as the choice's upgradeKey prefix (e.g. 'player_movementSpeed_1').
 */
export interface PlayerUpgradeDef {
  upgradeKey: string;
  label: string;
  description: string;
  level: number;
  minThreat: number;
}

export const PLAYER_UPGRADES: PlayerUpgradeDef[] = [
  // ── Faster Movement ─────────────────────────────────────
  {
    upgradeKey: "movementSpeed",
    label: "Swift",
    description: "+10% movement speed",
    level: 1,
    minThreat: 2,
  },
  {
    upgradeKey: "movementSpeed",
    label: "Fleet",
    description: "+20% movement speed",
    level: 2,
    minThreat: 4,
  },
  {
    upgradeKey: "movementSpeed",
    label: "Blur",
    description: "+35% movement speed",
    level: 3,
    minThreat: 6,
  },

  // ── Cooldown Reduction ───────────────────────────────────
  {
    upgradeKey: "cooldownReduction",
    label: "Quick Hands",
    description: "-10% deploy cooldown",
    level: 1,
    minThreat: 1,
  },
  {
    upgradeKey: "cooldownReduction",
    label: "Rapid Deployment",
    description: "-20% deploy cooldown",
    level: 2,
    minThreat: 3,
  },
  {
    upgradeKey: "cooldownReduction",
    label: "Haste",
    description: "-30% deploy cooldown",
    level: 3,
    minThreat: 5,
  },

  // ── Bigger Range ─────────────────────────────────────────
  {
    upgradeKey: "biggerRange",
    label: "Extended Reach",
    description: "+8% attack radius",
    level: 1,
    minThreat: 2,
  },
  {
    upgradeKey: "biggerRange",
    label: "Long Shot",
    description: "+15% attack radius",
    level: 2,
    minThreat: 4,
  },
  {
    upgradeKey: "biggerRange",
    label: "Watchtower",
    description: "+25% attack radius",
    level: 3,
    minThreat: 6,
  },

  // ── Damage Up ────────────────────────────────────────────
  {
    upgradeKey: "damageUp",
    label: "Sharper",
    description: "+10% damage",
    level: 1,
    minThreat: 2,
  },
  {
    upgradeKey: "damageUp",
    label: "Deadly",
    description: "+20% damage",
    level: 2,
    minThreat: 4,
  },
  {
    upgradeKey: "damageUp",
    label: "Annihilator",
    description: "+35% damage",
    level: 3,
    minThreat: 6,
  },

  // ── Extra Weapon Slot ────────────────────────────────────
  {
    upgradeKey: "extraSlot",
    label: "Bandolier",
    description: "+1 weapon slot (max 5)",
    level: 1,
    minThreat: 3,
  },

  // ── Fortify ──────────────────────────────────────────────
  {
    upgradeKey: "fortify",
    label: "Sturdy",
    description: "+25% deployable duration",
    level: 1,
    minThreat: 2,
  },
  {
    upgradeKey: "fortify",
    label: "Reinforced",
    description: "+50% deployable duration",
    level: 2,
    minThreat: 4,
  },
  {
    upgradeKey: "fortify",
    label: "Eternal",
    description: "+100% deployable duration",
    level: 3,
    minThreat: 6,
  },

  // ── Pickup Radius ────────────────────────────────────────
  {
    upgradeKey: "pickupRadius",
    label: "Magnet",
    description: "+50% pickup range",
    level: 1,
    minThreat: 1,
  },
  {
    upgradeKey: "pickupRadius",
    label: "Vacuum",
    description: "+100% pickup range",
    level: 2,
    minThreat: 3,
  },

  // ── Cascade ────────────────────────────────────────────
  {
    upgradeKey: "cascade",
    label: "Cascade",
    description: "5% chance to trigger a bonus weapon cooldown on deploy",
    level: 1,
    minThreat: 2,
  },
  {
    upgradeKey: "cascade",
    label: "Cascade II",
    description: "10% chance to trigger a bonus weapon cooldown on deploy",
    level: 2,
    minThreat: 4,
  },
  {
    upgradeKey: "cascade",
    label: "Cascade III",
    description: "15% chance to trigger a bonus weapon cooldown on deploy",
    level: 3,
    minThreat: 6,
  },
  {
    upgradeKey: "cascade",
    label: "Cascade IV",
    description: "22% chance to trigger a bonus weapon cooldown on deploy",
    level: 4,
    minThreat: 8,
  },
];

/** Max levels per upgrade key (without 'player_' prefix). */
export const PLAYER_UPGRADE_MAX_LEVELS: Record<string, number> = {
  movementSpeed: 3,
  cooldownReduction: 3,
  biggerRange: 3,
  damageUp: 3,
  extraSlot: 1,
  fortify: 3,
  pickupRadius: 2,
  cascade: 4,
};

/** Stat tables: index = upgrade level, value = effect magnitude (level 0 = no upgrade). */

export const SPEED_MULTS = [1, 1.1, 1.2, 1.35];
export const CD_MULTS = [1, 0.9, 0.8, 0.7];
export const RANGE_MULTS = [1, 1.08, 1.15, 1.25];
export const DAMAGE_MULTS = [1, 1.1, 1.2, 1.35];
export const FORTIFY_MULTS = [1, 1.25, 1.5, 2];
export const PICKUP_RADIUS_MULTS = [1, 1.5, 2, 3];

export const CASCADE_CHANCES = [0, 0.05, 0.10, 0.15, 0.22];

/** Max parallel bonus cooldowns per weapon type from Cascade. */
export const MAX_BONUS_COOLDOWNS = 2;

/**
 * Weight multiplier for weapon-acquire choices (`acquire_springer`, etc.)
 * relative to other upgrade types (weight=1). Lower = less likely to appear.
 * 0.33 means acquire choices are ~3× less likely than a normal upgrade.
 */
export const ACQUIRE_WEIGHT = 0.33;
