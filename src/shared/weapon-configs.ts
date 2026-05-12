export interface BaseWeaponConfig {
    COOLDOWN: number;
    DURATION: number;
    RADIUS: number;
}

export interface TurretConfig extends BaseWeaponConfig {
    ATTACK_RADIUS: number;
    FIRE_COOLDOWN: number;
    DAMAGE: number;
}

export const BasicTurretConfig: TurretConfig = {
    COOLDOWN: 2000,
    DURATION: 20000,
    RADIUS: 20,
    ATTACK_RADIUS: 200,
    FIRE_COOLDOWN: 3000,
    DAMAGE: 50,
};
