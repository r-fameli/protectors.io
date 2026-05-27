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
  COOLDOWN: 4000,
  DURATION: 40000,
  RADIUS: 20,
  ID_PREFIX: "turret",
  ATTACK_RADIUS: 200,
  FIRE_COOLDOWN: 3000,
  DAMAGE: 50,
};

export const SpringerConfig = {
  COOLDOWN: 5000,
  DURATION: 30000,
  RADIUS: 20,
  ID_PREFIX: "springer",
  ATTACK_RADIUS: 180,
  CALTROP_DURATION: 35000,
  CALTROP_DAMAGE: 70,
};

export const SpiderwebConfig = {
  COOLDOWN: 8000,
  DURATION: 30000,
  RADIUS: 20,
  ID_PREFIX: "spiderweb",
  ATTACK_RADIUS: 200,
  SLOW_MULTIPLIER: 0.4,
  SPIDER_DAMAGE: 25,
  SPIDER_ATTACK_INTERVAL: 1500,
  SPIDER_SPEED: 100,
};

export const WEAPON_ENTRIES: {
  type: string;
  config: BaseWeaponConfig;
}[] = [
  { type: "turret", config: BasicTurretConfig },
  { type: "springer", config: SpringerConfig },
  { type: "spiderweb", config: SpiderwebConfig },
];
