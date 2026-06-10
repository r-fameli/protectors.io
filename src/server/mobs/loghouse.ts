import Mob from "./mob";
import Lumberjack from "./lumberjack";
import Chainsawer from "./chainsawer";
import Harvester from "./harvester";
import Foreman from "./foreman";
import { LOGHOUSE } from "../../shared/mob-configs";

const LUMBERJACK_SPAWN_INTERVAL = 3;

/** Weighted spawn table: for each threat threshold, weighted chance per mob type. */
interface SpawnTier {
  minThreat: number;
  entries: { type: string; weight: number }[];
}

const SPAWN_TABLE: SpawnTier[] = [
  { minThreat: 8, entries: [
    { type: 'lumberjack', weight: 40 },
    { type: 'chainsawer', weight: 25 },
    { type: 'harvester',  weight: 25 },
    { type: 'foreman',    weight: 10 },
  ]},
  { minThreat: 6, entries: [
    { type: 'lumberjack', weight: 50 },
    { type: 'chainsawer', weight: 30 },
    { type: 'harvester',  weight: 20 },
  ]},
  { minThreat: 4, entries: [
    { type: 'lumberjack', weight: 70 },
    { type: 'chainsawer', weight: 30 },
  ]},
  // Default: threat 1-3, only lumberjacks
  { minThreat: 1, entries: [
    { type: 'lumberjack', weight: 100 },
  ]},
];

/** Factory map: mob type string → constructor call. */
function createMob(type: string, id: string, x: number, y: number, tx: number, ty: number): Mob {
  switch (type) {
    case 'lumberjack': return new Lumberjack(id, x, y, tx, ty);
    case 'chainsawer': return new Chainsawer(id, x, y, tx, ty);
    case 'harvester':  return new Harvester(id, x, y, tx, ty);
    case 'foreman':    return new Foreman(id, x, y, tx, ty);
    default:           return new Lumberjack(id, x, y, tx, ty);
  }
}

/** Pick mob type from weighted entries for given threat level. */
function pickMobType(threatLevel: number): string {
  // Find highest matching tier
  let tier = SPAWN_TABLE[SPAWN_TABLE.length - 1];
  for (const t of SPAWN_TABLE) {
    if (threatLevel >= t.minThreat) tier = t;
  }
  const totalWeight = tier.entries.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of tier.entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.type;
  }
  return tier.entries[tier.entries.length - 1].type;
}

class Loghouse extends Mob {
  lumberjackTimer: number;

  constructor(id: string, x: number, y: number, targetX: number, targetY: number) {
    super(id, x, y, targetX, targetY, LOGHOUSE, 'loghouse');
    this.lumberjackTimer = 0;
  }

  // Stationary — never reaches the tree
  update(dt: number): boolean {
    return false;
  }

  /** Returns true when it's time to spawn mobs, and resets. */
  advanceLumberjackTimer(dt: number): boolean {
    this.lumberjackTimer += dt;
    if (this.lumberjackTimer >= LUMBERJACK_SPAWN_INTERVAL) {
      this.lumberjackTimer -= LUMBERJACK_SPAWN_INTERVAL;
      return true;
    }
    return false;
  }

  /**
   * Spawn a mob near this loghouse. Mob type scales with threat level
   * via weighted SPAWN_TABLE. Applies HP/speed scaling.
   */
  spawnMob(threatLevel: number, targetX: number, targetY: number): Mob {
    const angle = Math.random() * 2 * Math.PI;
    const dist = 40 + Math.random() * 30;
    const id = `${this.id}_spawn_${Math.random().toString(36).slice(2, 8)}`;
    const x = this.x + Math.cos(angle) * dist;
    const y = this.y + Math.sin(angle) * dist;

    const type = pickMobType(threatLevel);
    return createMob(type, id, x, y, targetX, targetY);
  }
}

export default Loghouse;
