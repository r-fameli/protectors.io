import Mob from "./mob";
import { PALADIN } from "../../shared/mob-configs";

class Paladin extends Mob {
  constructor(id: string, x: number, y: number, targetX: number, targetY: number) {
    super(id, x, y, targetX, targetY, PALADIN, 'paladin');
  }
}

export default Paladin;
