import Mob from "./mob";
import { CHAINSAWER } from "../../shared/mob-configs";

class Chainsawer extends Mob {
  constructor(id: string, x: number, y: number, targetX: number, targetY: number) {
    super(id, x, y, targetX, targetY, CHAINSAWER, 'chainsawer');
  }
}

export default Chainsawer;
