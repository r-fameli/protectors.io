export interface BaseWeaponConfig {
    COOLDOWN: number;
    DURATION: number;
    RADIUS: number;
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
    ATTACK_RADIUS: 200,
    FIRE_COOLDOWN: 3000,
    DAMAGE: 50,
};
