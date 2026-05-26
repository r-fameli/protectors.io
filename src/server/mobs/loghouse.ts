import Mob from "./mob";
import { LOGHOUSE } from "../../shared/mob-configs";

const LUMBERJACK_SPAWN_INTERVAL = 3;

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

  /** Returns true when it's time to spawn lumberjacks, and resets. */
  advanceLumberjackTimer(dt: number): boolean {
    this.lumberjackTimer += dt;
    if (this.lumberjackTimer >= LUMBERJACK_SPAWN_INTERVAL) {
      this.lumberjackTimer -= LUMBERJACK_SPAWN_INTERVAL;
      return true;
    }
    return false;
  }
}

export default Loghouse;
