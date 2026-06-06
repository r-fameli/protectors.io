# Instructions for coding agents

## Coding principles

- Create abstractions when it's likely that re-use will be necessary in the future. Ask for permission if unsure.
  - As an example. If I'm creating an Angel mob class, it may be helpful to create a Mob class to inherit from first, if one does not exist already.
- Code with extensibility and sustainability in mind. Create new folders where it may be helpful to separate logic as the project grows in scale.
- Ensure that performance is being done well at each step.

## Preferences

- Be as concise as possible without losing technical clarity. Speak in caveman when possible.
- Remove unused variables, imports, and interface fields. If a field is declared but never read through that type, delete it.

## Specific to this repo's architecture

### Shared & Constants

- Colors → `colors.ts` only. Import where needed.
- Shared constants → `shared/` folder.
- Weapon configs (`shared/weapon-configs.ts`) use `ID_PREFIX`, `COOLDOWN`, `DURATION`, `RADIUS`, `ATTACK_RADIUS`.
- Mob configs (`shared/mob-configs.ts`) define HP, speed, radius, spawn interval.

### Deployable System

- Single `deployables[]` holds `Turret` + `Springer` instances.
- Discriminated by `type` field. Both share `attackRadius`, `damageMultiplier`.
- Placement uses `tryPlaceDeployable(dt, player, getter, setter, incCounter, config, factory)`.
- Blocking checks iterate all deployables regardless of type.

### Mob System

- Single `mobs: Mob[]` array — all mob types unified.
- `Mob` base class with `mobType` string discriminator.
- Subclasses: `Lumberjack`, `Chainsawer`, `Loghouse` (stationary, spawns lumberjacks every 3s).
- Mobs stop at tree edge (`TREE_RADIUS + mob.radius`) and deal DOT: `maxHp * dt * 0.1`.
- Mobs never removed on reaching tree — only when killed.

### Upgrade System

- Applied per-player at deployable creation time.
- **Cooldown**: `×0.9^level` (10% faster/level)
- **Range**: `+10%` per level (affects `attackRadius`)
- **Damage**: `+15%` per level (stored as `damageMultiplier`)

### Tree

- Central object. `TREE_RADIUS: 200`, `TREE_MAX_HP: 1000`.
- Game over when tree HP ≤ 0. Server emits `GAME_OVER`, client stops input, shows play menu. `endGame()` resets everything.

## Gotchas

- **`interpolateObject`** in `state.ts` does numeric math on all keys — arrays/strings get corrupted. Mobs use `next.mobs || []` (no interpolation) to protect `mobType`.
- **`any` casts forbidden** — use intersection types or common fields on union types.
- **`tryPlaceDeployable` pattern** requires getter/setter/incCounter per deployable type + config + factory. New deployables follow this.
- **All inline colors** must go in `colors.ts`. No color literals in components.

## About assets

- All sprites are uploaded facing right.
