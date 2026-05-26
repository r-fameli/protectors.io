export interface MobConfig {
    BASE_HEALTH: number;
    BASE_SPEED: number;
    BASE_RADIUS: number;
    BASE_SPAWN_INTERVAL: number; // Seconds until next spawn
    XP_DROP: number;
}

export const LUMBERJACK: MobConfig = {
    BASE_HEALTH: 100,
    BASE_SPEED: 50,
    BASE_RADIUS: 20,
    BASE_SPAWN_INTERVAL: 2,
    XP_DROP: 10,
};

export const CHAINSAWER: MobConfig = {
    BASE_HEALTH: 250,
    BASE_SPEED: 35,
    BASE_RADIUS: 30,
    BASE_SPAWN_INTERVAL: 10,
    XP_DROP: 30,
};

export const LOGHOUSE: MobConfig = {
    BASE_HEALTH: 700,
    BASE_SPEED: 0,
    BASE_RADIUS: 60,
    BASE_SPAWN_INTERVAL: 30,
    XP_DROP: 100,
};
