import Mob from "./mob";
import { ANGEL } from "../../shared/mob-configs";

class Angel extends Mob {
  constructor(id: string, x: number, y: number, targetX: number, targetY: number) {
    super(id, x, y, targetX, targetY, ANGEL, 'angel');
  }
}

export default Angel;
