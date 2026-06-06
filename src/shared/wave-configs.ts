/**
 * XP_PER_THRESHOLD: cumulative player XP needed to increase threat level by 1.
 * 1 lumberjack = 10 XP, 1 chainsawer = 30 XP, 1 loghouse = 100 XP,
 * 1 harvester = 50 XP, 1 foreman = 10 XP.
 * At ~300 XP per tier, threat rises ~1 tier per 30-40 kills early game.
 * Multiple players earn faster → threat rises faster → natural player-count scaling.
 */
export const XP_PER_THRESHOLD = 300;

/** Minimum seconds between sequential wave events (prevents stacking). */
export const MIN_WAVE_INTERVAL = 45;

/** Per-threat-level HP multiplier. threatLevel 3 = +20% HP. */
export const HP_SCALE_PER_THREAT = 0.10;

/** Per-threat-level speed multiplier. threatLevel 3 = +6% speed. */
export const SPEED_SCALE_PER_THREAT = 0.03;

/** Per-level catch-up XP bonus for underleveled players. */
export const CATCH_UP_MULT = 0.15;

/**
 * Continuous trickle configs. Each entry defines a mob type's spawn behavior.
 * `unlockThreat` — min threat level before this mob type starts spawning.
 * `spawnRing` — if true, spawn on a ring around the tree instead of map edge.
 *   Base interval shrinks with threat: actual = max(min, base / (1 + (threat-1)*0.15)).
 *   Spawn group size = baseGroup + floor((threat-1) / 2).
 */
export interface TrickleConfig {
  type: string;
  baseInterval: number;
  minInterval: number;
  unlockThreat: number;
  baseGroup: number;
  spawnRing: boolean;
}

export const TRICKLE_CONFIGS: TrickleConfig[] = [
  { type: 'lumberjack', baseInterval: 3,  minInterval: 0.8, unlockThreat: 1, baseGroup: 1, spawnRing: false },
  { type: 'chainsawer', baseInterval: 12, minInterval: 4,   unlockThreat: 2, baseGroup: 1, spawnRing: false },
  { type: 'foreman',    baseInterval: 20, minInterval: 8,   unlockThreat: 3, baseGroup: 1, spawnRing: false },
  { type: 'harvester',  baseInterval: 25, minInterval: 10,  unlockThreat: 4, baseGroup: 1, spawnRing: false },
  { type: 'loghouse',   baseInterval: 40, minInterval: 15,  unlockThreat: 3, baseGroup: 1, spawnRing: true },
];

export interface WaveCompositionEntry {
  type: string;
  count: number;
  /** If true, spawn at ring around tree; otherwise map boundary. */
  spawnRing?: boolean;
}

export interface WaveEvent {
  /** Cumulative XP needed before this wave can fire. */
  xpThreshold: number;
  /** Display label (e.g. "Wave 1"). */
  label: string;
  composition: WaveCompositionEntry[];
}

/**
 * Wave events: discrete spawn groups triggered when cumulative XP
 * reaches xpThreshold AND at least MIN_WAVE_INTERVAL has passed
 * since the last wave event. Each event fires at most once per game.
 */
export const WAVE_EVENTS: WaveEvent[] = [
  { xpThreshold: 500,  label: "Wave 1", composition: [
    { type: 'lumberjack', count: 8 },
    { type: 'chainsawer', count: 2 },
  ]},
  { xpThreshold: 1500, label: "Wave 2", composition: [
    { type: 'lumberjack', count: 12 },
    { type: 'chainsawer', count: 4 },
    { type: 'foreman', count: 1 },
  ]},
  { xpThreshold: 3500, label: "Wave 3", composition: [
    { type: 'lumberjack', count: 15 },
    { type: 'chainsawer', count: 6 },
    { type: 'foreman', count: 2 },
    { type: 'harvester', count: 1 },
  ]},
  { xpThreshold: 6000, label: "Wave 4", composition: [
    { type: 'lumberjack', count: 20 },
    { type: 'chainsawer', count: 8 },
    { type: 'foreman', count: 3 },
    { type: 'harvester', count: 2 },
    { type: 'loghouse', count: 1, spawnRing: true },
  ]},
  { xpThreshold: 10000, label: "Wave 5", composition: [
    { type: 'lumberjack', count: 25 },
    { type: 'chainsawer', count: 12 },
    { type: 'foreman', count: 4 },
    { type: 'harvester', count: 3 },
    { type: 'loghouse', count: 2, spawnRing: true },
  ]},
];

export const DIFFICULTY_LABELS = [
  'Easy', 'Medium', 'Hard', 'Very Hard', 'Insane', 'Insane',
];
