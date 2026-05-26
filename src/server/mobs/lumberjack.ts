import Mob from "./mob";
import { LUMBERJACK } from "../../shared/mob-configs";

class Lumberjack extends Mob {
  constructor(id: string, x: number, y: number, targetX: number, targetY: number) {
    super(id, x, y, targetX, targetY, LUMBERJACK, 'lumberjack');
  }
}

export default Lumberjack;
