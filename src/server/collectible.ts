import GameObject from "./object";
import Constants from "../shared/constants";
import { COLLECTIBLE_CONFIG } from "../shared/collectible-configs";

type CollectibleVariant = 'xp' | 'treeorb';

class Collectible extends GameObject {
  hp: number;
  maxHp: number;
  xpDrop: number;
  healAmount: number;
  respawnTimer: number;
  radius: number;
  variant: CollectibleVariant;
  /** When a tree orb is collected, it transits toward the tree. */
  private transiting: boolean;
  private transitTargetX: number;
  private transitTargetY: number;
  private transitSpeed: number;

  constructor(id: string, x: number, y: number, variant: CollectibleVariant = 'xp') {
    super(id, x, y, 0, 0);
    this.isMoving = false;
    this.variant = variant;

    if (variant === 'treeorb') {
      this.radius = COLLECTIBLE_CONFIG.TREE_ORB_RADIUS;
      this.hp = 1;
      this.maxHp = 1;
      this.healAmount = COLLECTIBLE_CONFIG.TREE_ORB_HEAL;
      this.xpDrop = 0;
      this.respawnTimer = 0;
      this.transiting = false;
      this.transitTargetX = 0;
      this.transitTargetY = 0;
      this.transitSpeed = COLLECTIBLE_CONFIG.TREE_ORB_SPEED;
    } else {
      this.radius = COLLECTIBLE_CONFIG.RADIUS;
      this.hp = COLLECTIBLE_CONFIG.HP;
      this.maxHp = COLLECTIBLE_CONFIG.HP;
      this.xpDrop = COLLECTIBLE_CONFIG.XP_REWARD;
      this.healAmount = 0;
      this.respawnTimer = 0;
      this.transiting = false;
      this.transitTargetX = 0;
      this.transitTargetY = 0;
      this.transitSpeed = 0;
    }
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  /** Start transit for tree orb — moves toward tree center. */
  startTransit(): void {
    if (this.variant !== 'treeorb') return;
    this.transiting = true;
    this.transitTargetX = Constants.MAP_SIZE / 2;
    this.transitTargetY = Constants.MAP_SIZE / 2;
    this.hp = 0; // mark as dead so it won't be collected again
  }

  get isTransiting(): boolean {
    return this.transiting;
  }

  /** End transit (tree orb arrived at tree) — enters dead/respawn cycle. */
  endTransit(): void {
    this.transiting = false;
    this.hp = 0;
  }

  /** Returns a random position away from tree and existing collectibles. */
  static randomPosition(avoid: { x: number; y: number }[] = [], rad: number = COLLECTIBLE_CONFIG.RADIUS): { x: number; y: number } {
    const center = Constants.MAP_SIZE / 2;
    const maxDist = Constants.MAP_SIZE / 2 - rad - 10;
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

      if (!tooClose) return { x: px, y: py };
    }
    const dist = minDist + Math.random() * (maxDist - minDist);
    const angle = Math.random() * 2 * Math.PI;
    return { x: center + Math.cos(angle) * dist, y: center + Math.sin(angle) * dist };
  }

  /** Move tree orb toward tree; respawn dead collectibles. */
  update(dt: number, avoidPositions?: { x: number; y: number }[]): void {
    // Transit: move toward tree. No early return — hasArrivedAtTree detects arrival.
    if (this.transiting) {
      const dx = this.transitTargetX - this.x;
      const dy = this.transitTargetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const step = Math.min(this.transitSpeed * dt, dist);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
      return;
    }

    // Dead — tick respawn
    if (this.alive) return;
    this.respawnTimer -= dt;
    if (this.respawnTimer <= 0) {
      const pos = Collectible.randomPosition(avoidPositions, this.radius);
      this.x = pos.x;
      this.y = pos.y;
      this.hp = this.maxHp;
      this.respawnTimer = 0;
    }
  }

  /** Has a transiting tree orb arrived at the tree? */
  get hasArrivedAtTree(): boolean {
    if (!this.transiting) return false;
    const dx = this.transitTargetX - this.x;
    const dy = this.transitTargetY - this.y;
    return Math.sqrt(dx * dx + dy * dy) < Constants.TREE_RADIUS;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      radius: this.radius,
      // Report hp = 1 while transiting so client renders it (server hp=0 prevents re-collection)
      hp: this.transiting ? 1 : this.hp,
      variant: this.variant,
      isTransiting: this.transiting,
    };
  }
}

export default Collectible;
