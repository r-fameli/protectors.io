import Constants from "../../shared/constants";
import Mob from "../mobs/mob";

type PositionFn = () => { x: number; y: number };

interface SpawnEntry {
  prefix: string;
  timer: number;
  counter: number;
  interval: number;
  factory: (id: string, x: number, y: number) => Mob;
  getPosition: PositionFn;
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

export class MobSpawner {
  private entries: SpawnEntry[] = [];

  register(
    prefix: string,
    interval: number,
    factory: (id: string, x: number, y: number) => Mob,
    getPosition?: PositionFn,
  ): void {
    this.entries.push({
      prefix,
      timer: 0,
      counter: 0,
      interval,
      factory,
      getPosition: getPosition || randomBoundaryPosition,
    });
  }

  update(dt: number, mobs: Mob[]): void {
    for (const entry of this.entries) {
      entry.timer += dt;
      while (entry.timer >= entry.interval) {
        entry.timer -= entry.interval;
        entry.counter++;
        const pos = entry.getPosition();
        const mob = entry.factory(`${entry.prefix}_${entry.counter}`, pos.x, pos.y);
        mobs.push(mob);
      }
    }
  }

  reset(): void {
    for (const entry of this.entries) {
      entry.timer = 0;
      entry.counter = 0;
    }
  }
}
