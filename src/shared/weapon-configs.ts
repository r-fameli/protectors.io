export interface BaseWeaponConfig {
  COOLDOWN: number;
  DURATION: number;
  RADIUS: number;
  ID_PREFIX: string;
}

export interface TurretConfig extends BaseWeaponConfig {
  ATTACK_RADIUS: number; // px
  FIRE_COOLDOWN: number; // ms
  DAMAGE: number;
  DURATION: number;
  COOLDOWN: number;
}

export const BasicTurretConfig: TurretConfig = {
  COOLDOWN: 2500,
  DURATION: 20000,
  RADIUS: 20,
  ID_PREFIX: "turret",
  ATTACK_RADIUS: 200,
  FIRE_COOLDOWN: 3000,
  DAMAGE: 50,
};

export const SpringerConfig = {
  COOLDOWN: 5000,
  DURATION: 20000,
  RADIUS: 20,
  ID_PREFIX: "springer",
  ATTACK_RADIUS: 180,
  CALTROP_DURATION: 35000,
  CALTROP_DAMAGE: 70,
};

export const CrossbowConfig = {
  COOLDOWN: 6000,
  DURATION: 30000,
  RADIUS: 20,
  ID_PREFIX: "crossbow",
  ATTACK_RADIUS: 250,
  FIRE_COOLDOWN: 5000,
  DAMAGE: 75,
  ARROW_SPEED: 600,
  ARROW_MAX_TRAVEL: 350,
};

export const SpiderwebConfig = {
  COOLDOWN: 7000,
  DURATION: 25000,
  RADIUS: 20,
  ID_PREFIX: "spiderweb",
  ATTACK_RADIUS: 200,
  SLOW_MULTIPLIER: 0.4,
  SPIDER_DAMAGE: 25,
  SPIDER_ATTACK_INTERVAL: 1500,
  SPIDER_SPEED: 100,
};

/**
 * Get base weapon config by type string. Returns the common fields
 * (COOLDOWN, DURATION, RADIUS, ID_PREFIX) needed for placement logic.
 */
export function getWeaponConfig(type: string): {
  COOLDOWN: number;
  DURATION: number;
  RADIUS: number;
  ID_PREFIX: string;
} {
  switch (type) {
    case "turret":
      return BasicTurretConfig;
    case "springer":
      return SpringerConfig;
    case "spiderweb":
      return SpiderwebConfig;
    case "crossbow":
      return CrossbowConfig;
    default:
      throw new Error(`Unknown weapon type: ${type}`);
  }
}
