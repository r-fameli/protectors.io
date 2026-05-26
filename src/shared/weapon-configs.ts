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
    ID_PREFIX: 'turret',
    ATTACK_RADIUS: 200,
    FIRE_COOLDOWN: 3000,
    DAMAGE: 50,
};

export const SpringerConfig = {
    COOLDOWN: 5000,
    DURATION: 30000,
    RADIUS: 20,
    ID_PREFIX: 'springer',
    ATTACK_RADIUS: 180,
    CALTROP_DURATION: 35000,
    CALTROP_DAMAGE: 70,
};
