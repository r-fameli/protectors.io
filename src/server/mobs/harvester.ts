import Mob from "./mob";
import { HARVESTER } from "../../shared/mob-configs";

class Harvester extends Mob {
  constructor(id: string, x: number, y: number, targetX: number, targetY: number) {
    super(id, x, y, targetX, targetY, HARVESTER, 'harvester');
  }
}

export default Harvester;
