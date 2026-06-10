import Mob from "./mob";
import { FOREMAN as FOREMAN_CONFIG } from "../../shared/mob-configs";
import Constants from "../../shared/constants";

const CLUSTER_RADIUS = 500;

class Foreman extends Mob {
  buffCooldownTimer: number;
  buffRadius: number;
  buffDuration: number;
  buffSpeedMultiplier: number;
  buffRingTimer: number = 0;
  wanderTargetX: number;
  wanderTargetY: number;

  constructor(id: string, x: number, y: number, targetX: number, targetY: number) {
    super(id, x, y, targetX, targetY, FOREMAN_CONFIG, 'foreman');
    this.buffCooldownTimer = FOREMAN_CONFIG.BUFF_INTERVAL!; // ready on first tick
    this.buffRadius = FOREMAN_CONFIG.BUFF_RADIUS!;
    this.buffDuration = FOREMAN_CONFIG.BUFF_DURATION!;
    this.buffSpeedMultiplier = FOREMAN_CONFIG.BUFF_SPEED_MULTIPLIER!;
    this.wanderTargetX = x;
    this.wanderTargetY = y;
  }

  // Don't seek tree — handled by updateBehavior
  update(dt: number): boolean {
    this.buffRingTimer = Math.max(0, this.buffRingTimer - dt);
    return false;
  }

  /** Move toward mob cluster + apply buffs. Called from game.ts after main update. */
  updateBehavior(dt: number, mobs: Mob[]) {
    const aliveMobs = mobs.filter(m => m !== this && m.hp > 0);

    // Find cluster center or nearest mob, or wander
    if (aliveMobs.length > 0) {
      const nearby = aliveMobs.filter(m => this.distanceTo(m) <= CLUSTER_RADIUS);
      if (nearby.length > 0) {
        // Move toward center of mass of nearby mobs
        this.targetX = nearby.reduce((sum, m) => sum + m.x, 0) / nearby.length;
        this.targetY = nearby.reduce((sum, m) => sum + m.y, 0) / nearby.length;
      } else {
        // Move toward nearest mob
        let nearest = aliveMobs[0];
        let nearestDist = this.distanceTo(nearest);
        for (let i = 1; i < aliveMobs.length; i++) {
          const d = this.distanceTo(aliveMobs[i]);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = aliveMobs[i];
          }
        }
        this.targetX = nearest.x;
        this.targetY = nearest.y;
      }

      // Move toward target
      this.direction = Math.atan2(this.targetY - this.y, this.targetX - this.x);
      this.isMoving = true;
      this.x += dt * this.speed * this.speedMultiplier * this.slowMultiplier * Math.cos(this.direction);
      this.y += dt * this.speed * this.speedMultiplier * this.slowMultiplier * Math.sin(this.direction);

      // Stop short of target mobs to avoid overlap
      const toTarget = Math.sqrt(
        (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2,
      );
      if (toTarget < this.radius + 40) {
        this.isMoving = false;
      }
    } else {
      // No mobs — wander randomly
      const toWander = Math.sqrt(
        (this.wanderTargetX - this.x) ** 2 + (this.wanderTargetY - this.y) ** 2,
      );
      if (toWander < this.radius + 50) {
        // Pick new wander target on map edge
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0:
            this.wanderTargetX = Math.random() * Constants.MAP_SIZE;
            this.wanderTargetY = 0;
            break;
          case 1:
            this.wanderTargetX = Constants.MAP_SIZE;
            this.wanderTargetY = Math.random() * Constants.MAP_SIZE;
            break;
          case 2:
            this.wanderTargetX = Math.random() * Constants.MAP_SIZE;
            this.wanderTargetY = Constants.MAP_SIZE;
            break;
          default:
            this.wanderTargetX = 0;
            this.wanderTargetY = Math.random() * Constants.MAP_SIZE;
            break;
        }
      }
      this.direction = Math.atan2(
        this.wanderTargetY - this.y,
        this.wanderTargetX - this.x,
      );
      this.isMoving = true;
      this.x += dt * this.speed * this.speedMultiplier * this.slowMultiplier * Math.cos(this.direction);
      this.y += dt * this.speed * this.speedMultiplier * this.slowMultiplier * Math.sin(this.direction);
    }

    // Apply buff on cooldown
    this.buffCooldownTimer -= dt;
    if (this.buffCooldownTimer <= 0) {
      this.buffCooldownTimer = FOREMAN_CONFIG.BUFF_INTERVAL!;
      this.buffRingTimer = 0.5; // show ring visual for 0.5s

      for (const mob of mobs) {
        if (mob === this || mob.hp <= 0) continue;
        if (this.distanceTo(mob) <= this.buffRadius) {
          mob.applyBuff(this.buffDuration, this.buffSpeedMultiplier);
        }
      }
    }
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      buffRingActive: this.buffRingTimer > 0,
    };
  }
}

export default Foreman;
