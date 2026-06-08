import GameObject from "./object";
import Constants from "../shared/constants";
import { COLLECTIBLE_CONFIG } from "../shared/collectible-configs";

class Collectible extends GameObject {
  hp: number;
  maxHp: number;
  xpDrop: number;
  respawnTimer: number;
  radius: number;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 0, 0);
    this.isMoving = false;
    this.hp = COLLECTIBLE_CONFIG.HP;
    this.maxHp = COLLECTIBLE_CONFIG.HP;
    this.xpDrop = COLLECTIBLE_CONFIG.XP;
    this.respawnTimer = 0;
    this.radius = COLLECTIBLE_CONFIG.RADIUS;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
  }

  /** Alive while hp > 0. */
  get alive(): boolean {
    return this.hp > 0;
  }

  /**
   * Returns a random position that is:
   *  - at least MIN_DIST_FROM_TREE from tree center
   *  - at least MIN_DIST_FROM_EACH_OTHER from each position in `avoid`
   */
  static randomPosition(avoid: { x: number; y: number }[] = []): { x: number; y: number } {
    const center = Constants.MAP_SIZE / 2;
    const maxDist = Constants.MAP_SIZE / 2 - COLLECTIBLE_CONFIG.RADIUS - 10;
    const minDistSq = COLLECTIBLE_CONFIG.MIN_DIST_FROM_EACH_OTHER * COLLECTIBLE_CONFIG.MIN_DIST_FROM_EACH_OTHER;
    const minDist = COLLECTIBLE_CONFIG.MIN_DIST_FROM_TREE;

    for (let attempt = 0; attempt < 50; attempt++) {
      const dist = minDist + Math.random() * (maxDist - minDist);
      const angle = Math.random() * 2 * Math.PI;
      const px = center + Math.cos(angle) * dist;
      const py = center + Math.sin(angle) * dist;

      const tooClose = avoid.some(a => {
        const dx = a.x - px;
        const dy = a.y - py;
        return dx * dx + dy * dy < minDistSq;
      });

      if (!tooClose) {
        return { x: px, y: py };
      }
    }
    // Fallback
    const dist = minDist + Math.random() * (maxDist - minDist);
    const angle = Math.random() * 2 * Math.PI;
    return { x: center + Math.cos(angle) * dist, y: center + Math.sin(angle) * dist };
  }

  /** Ticks respawn timer when dead; revives when timer expires. */
  update(dt: number, avoidPositions?: { x: number; y: number }[]): void {
    if (this.alive) return;
    this.respawnTimer -= dt;
    if (this.respawnTimer <= 0) {
      const pos = Collectible.randomPosition(avoidPositions);
      this.x = pos.x;
      this.y = pos.y;
      this.hp = this.maxHp;
      this.respawnTimer = 0;
    }
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      radius: this.radius,
      hp: this.hp,
    };
  }
}

export default Collectible;
