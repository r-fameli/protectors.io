import Constants from "../../shared/constants";
import Mob from "../mobs/mob";
import {
  TIME_PER_THRESHOLD,
  MIN_WAVE_INTERVAL,
  HP_SCALE_PER_THREAT,
  SPEED_SCALE_PER_THREAT,
  TRICKLE_CONFIGS,
  WAVE_EVENTS,
  TrickleConfig,
  WaveEvent,
  WaveCompositionEntry,
} from "../../shared/wave-configs";

/** Internal timer tracking for one trickle mob type. */
interface ContinuousTimer {
  type: string;
  timer: number;
  counter: number;
  baseInterval: number;
  minInterval: number;
  unlockThreat: number;
  baseGroup: number;
  spawnRing: boolean;
}

/** Internal wave event with fire-once flag. */
interface WaveEventState {
  timeThreshold: number;
  label: string;
  composition: WaveCompositionEntry[];
  triggered: boolean;
}

function randomBoundaryPosition(): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4);
  const pos = Math.random() * Constants.MAP_SIZE;
  switch (edge) {
    case 0: return { x: pos, y: 0 };
    case 1: return { x: Constants.MAP_SIZE, y: pos };
    case 2: return { x: pos, y: Constants.MAP_SIZE };
    default: return { x: 0, y: pos };
  }
}

class WaveManager {
  private factories: Map<string, (id: string, x: number, y: number) => Mob>;
  private continuousTimers: ContinuousTimer[];
  private waveEvents: WaveEventState[];
  private _threatLevel: number;
  private totalPlayerTime: number;
  private lastWaveEventTime: number;
  private gameStartTime: number;

  constructor() {
    this.factories = new Map();
    this._threatLevel = 1;
    this.totalPlayerTime = 0;
    this.lastWaveEventTime = 0;
    this.gameStartTime = Date.now();

    // Initialize continuous timers from shared configs
    this.continuousTimers = TRICKLE_CONFIGS.map((cfg: TrickleConfig) => ({
      type: cfg.type,
      timer: 0,
      counter: 0,
      baseInterval: cfg.baseInterval,
      minInterval: cfg.minInterval,
      unlockThreat: cfg.unlockThreat,
      baseGroup: cfg.baseGroup,
      spawnRing: cfg.spawnRing,
    }));

    // Initialize wave events from shared configs
    this.waveEvents = WAVE_EVENTS.map((evt: WaveEvent) => ({
      timeThreshold: evt.timeThreshold,
      label: evt.label,
      composition: evt.composition,
      triggered: false,
    }));
  }

  registerMobType(type: string, factory: (id: string, x: number, y: number) => Mob): void {
    this.factories.set(type, factory);
  }

  getThreatLevel(): number {
    return this._threatLevel;
  }

  /** Set threat level to an arbitrary value (for testing via /threat command). */
  setThreatLevel(target: number): void {
    this.totalPlayerTime = Math.max(0, (target - 1)) * TIME_PER_THRESHOLD;
    this._threatLevel = 1 + Math.floor(this.totalPlayerTime / TIME_PER_THRESHOLD);
  }

  /** Total player-seconds accumulated this game (sum of dt per connected player). */
  getTotalPlayerTime(): number {
    return this.totalPlayerTime;
  }

  /**
   * Main update. Called every game tick.
   * @param dt Delta time in seconds.
   * @param mobs Mutable mobs array to push spawned mobs into.
   * @param playerCount Number of currently connected players.
   */
  update(dt: number, mobs: Mob[], playerCount: number): void {
    // 1. Accumulate player-time and compute threat level
    this.totalPlayerTime += dt * playerCount;
    this._threatLevel = 1 + Math.floor(this.totalPlayerTime / TIME_PER_THRESHOLD);

    // 2. Continuous trickle spawns
    for (const timer of this.continuousTimers) {
      if (this._threatLevel < timer.unlockThreat) {
        timer.timer = 0;
        continue;
      }

      // Scale interval: base shrinks as threat rises (15% faster interval per threat level)
      const interval = Math.max(
        timer.minInterval,
        timer.baseInterval / (1 + (this._threatLevel - 1) * 0.15),
      );

      timer.timer += dt;
      while (timer.timer >= interval) {
        timer.timer -= interval;
        timer.counter++;

        // Spawn a group of mobs (1 extra per 2 threat levels above 1)
        const groupSize = timer.baseGroup + Math.floor((this._threatLevel - 1) / 2);
        for (let i = 0; i < groupSize; i++) {
          const pos = this.getSpawnPosition(timer.spawnRing);
          const factory = this.factories.get(timer.type);
          if (!factory) continue;
          const mob = factory(`${timer.type}_${timer.counter}_${i}`, pos.x, pos.y);
          this.applyThreatScaling(mob);
          mobs.push(mob);
        }
      }
    }

    // 3. Wave events — fire when total player-time threshold met + cooldown elapsed
    const elapsed = (Date.now() - this.gameStartTime) / 1000;

    for (const event of this.waveEvents) {
      if (event.triggered) continue;
      if (this.totalPlayerTime < event.timeThreshold) continue;
      if (elapsed - this.lastWaveEventTime < MIN_WAVE_INTERVAL) continue;

      event.triggered = true;
      this.lastWaveEventTime = elapsed;
      console.log(`[WaveManager] ${event.label} triggered at threat ${this._threatLevel}, time=${Math.round(this.totalPlayerTime)}s`);

      for (const entry of event.composition) {
        const factory = this.factories.get(entry.type);
        if (!factory) continue;

        // Scale wave mob count by threat level (+1 per 2 threat levels)
        const scaledCount = entry.count + Math.floor(this._threatLevel * 0.5);
        for (let i = 0; i < scaledCount; i++) {
          const pos = this.getSpawnPosition(!!entry.spawnRing);
          const mob = factory(`${entry.type}_${event.label}_${i}`, pos.x, pos.y);
          this.applyThreatScaling(mob);
          mobs.push(mob);
        }
      }
    }
  }

  reset(): void {
    this._threatLevel = 1;
    this.totalPlayerTime = 0;
    this.lastWaveEventTime = 0;
    this.gameStartTime = Date.now();
    for (const timer of this.continuousTimers) {
      timer.timer = 0;
      timer.counter = 0;
    }
    for (const event of this.waveEvents) {
      event.triggered = false;
    }
  }

  /** Mob HP/speed scale by threat level. HP rounded for display; speed kept as float. */
  applyThreatScaling(mob: Mob): void {
    const hpMult = 1 + (this._threatLevel - 1) * HP_SCALE_PER_THREAT;
    const spdMult = 1 + (this._threatLevel - 1) * SPEED_SCALE_PER_THREAT;
    mob.maxHp = Math.round(mob.maxHp * hpMult);
    mob.hp = mob.maxHp;
    mob.speed = mob.speed * spdMult;
  }

  /** Ring position for loghouses, boundary for everything else. */
  private getSpawnPosition(useRing: boolean): { x: number; y: number } {
    if (useRing) {
      const center = Constants.MAP_SIZE / 2;
      const minDist = Constants.MAP_SIZE * 0.35;
      const maxDist = Constants.MAP_SIZE * 0.45;
      const angle = Math.random() * 2 * Math.PI;
      const dist = minDist + Math.random() * (maxDist - minDist);
      return { x: center + Math.cos(angle) * dist, y: center + Math.sin(angle) * dist };
    }
    return randomBoundaryPosition();
  }
}

export default WaveManager;
