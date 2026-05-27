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

export const HARVESTER: MobConfig & { BURST_DAMAGE: number } = {
    BASE_HEALTH: 1000,
    BASE_SPEED: 15,
    BASE_RADIUS: 60,
    BASE_SPAWN_INTERVAL: 20,
    XP_DROP: 50,
    BURST_DAMAGE: 300,
};

export const FOREMAN: MobConfig & {
    BUFF_RADIUS: number;
    BUFF_DURATION: number;
    BUFF_INTERVAL: number;
    BUFF_SPEED_MULTIPLIER: number;
} = {
    BASE_HEALTH: 100,
    BASE_SPEED: 50,
    BASE_RADIUS: 20,
    BASE_SPAWN_INTERVAL: 15,
    XP_DROP: 10,
    BUFF_RADIUS: 200,
    BUFF_DURATION: 4,
    BUFF_INTERVAL: 5,
    BUFF_SPEED_MULTIPLIER: 1.5,
};
