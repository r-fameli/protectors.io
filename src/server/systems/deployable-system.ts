import Mob from "../mobs/mob";
import Bullet from "../bullet";
import Player from "../player";
import Turret from "../weapons/turret";
import Crossbow from "../weapons/crossbow";
import Springer from "../weapons/springer";
import Spiderweb from "../weapons/spiderweb";
import Spider from "../weapons/spider";
import Arrow from "../weapons/arrow";
import Caltrop from "../weapons/caltrop";
import { BasicTurretConfig, CrossbowConfig, SpringerConfig, SpiderwebConfig } from "../../shared/weapon-configs";

/** Union of all deployable types. Extended as new weapons added. */
export type AnyDeployable = Turret | Springer | Spiderweb | Crossbow;

/** Reset slow, apply spiderweb slows to mobs within web radius. */
export function applySpiderwebSlow(mobs: Mob[], deployables: AnyDeployable[]): void {
  mobs.forEach(m => { m.slowMultiplier = 1; });
  for (const d of deployables) {
    if (d.type !== 'spiderweb') continue;
    const web = d as Spiderweb;
    for (const mob of mobs) {
      if (mob.hp <= 0) continue;
      if (web.distanceTo(mob) < web.attackRadius + (mob.radius || 0)) {
        mob.slowMultiplier = web.slowMultiplier;
      }
    }
  }
}

/** Remove spiders whose web expired, manage spider lifecycle per web. */
export function updateSpiders(dt: number, mobs: Mob[], deployables: AnyDeployable[], spiders: Spider[]): Spider[] {
  const activeWebIds = new Set(
    deployables.filter(d => d.type === 'spiderweb').map(d => d.id),
  );
  const result = spiders.filter(s => activeWebIds.has(s.parentWebId));

  for (const d of deployables) {
    if (d.type !== 'spiderweb') continue;
    const web = d as Spiderweb;

    let spider = result.find(s => s.parentWebId === web.id);
    if (!spider) {
      spider = new Spider(
        `${web.id}_spider`,
        web.x, web.y,
        web.id,
        Math.round(web.spiderDamage * web.damageMultiplier),
        web.spiderAttackInterval,
      );
      result.push(spider);
    }

    // Find nearest alive mob within web radius
    let target: Mob | null = null;
    let closestDist = web.attackRadius;
    for (const mob of mobs) {
      if (mob.hp <= 0) continue;
      const dist = web.distanceTo(mob);
      if (dist <= closestDist) {
        closestDist = dist;
        target = mob;
      }
    }

    if (target) {
      const dir = Math.atan2(target.y - spider.y, target.x - spider.x);
      const newX = spider.x + dt * spider.speed * Math.cos(dir);
      const newY = spider.y + dt * spider.speed * Math.sin(dir);
      const distFromCenter = Math.sqrt((newX - web.x) ** 2 + (newY - web.y) ** 2);
      if (distFromCenter <= web.attackRadius) {
        spider.x = newX;
        spider.y = newY;
      } else {
        const edgeAngle = Math.atan2(newY - web.y, newX - web.x);
        spider.x = web.x + Math.cos(edgeAngle) * web.attackRadius * 0.95;
        spider.y = web.y + Math.sin(edgeAngle) * web.attackRadius * 0.95;
      }
      spider.direction = dir;
      spider.isMoving = true;

      const spiderToTarget = spider.distanceTo(target);
      const attackRange = 25 + (target.radius || 20);
      if (spiderToTarget < attackRange) {
        spider.attackCooldown -= dt * 1000;
        if (spider.attackCooldown <= 0) {
          spider.attackCooldown += spider.attackInterval;
          target.takeDamage(spider.damage * spider.damageMultiplier);
        }
      }
    } else {
      spider.isMoving = false;
    }
  }

  return result;
}

/** Turrets aim at closest mob + fire bullets. */
export function updateTurrets(dt: number, mobs: Mob[], deployables: AnyDeployable[], bullets: Bullet[]): void {
  for (const d of deployables) {
    if (d.type !== 'turret') continue;
    const turret = d as Turret;

    let closest: Mob | null = null;
    let closestDist = turret.attackRadius;
    for (const mob of mobs) {
      if (mob.hp <= 0) continue;
      const dist = turret.distanceTo(mob);
      if (dist <= closestDist) {
        closestDist = dist;
        closest = mob;
      }
    }
    turret.aimDirection = closest
      ? Math.atan2(closest.y - turret.y, closest.x - turret.x)
      : turret.direction;

    turret.fireCooldown -= dt * 1000;
    if (closest && turret.fireCooldown <= 0) {
      turret.fireCooldown = turret.fireCdInterval;
      bullets.push(new Bullet(
        turret.id, turret.x, turret.y,
        turret.aimDirection,
        Math.round(BasicTurretConfig.DAMAGE * turret.damageMultiplier),
      ));
    } else if (!closest) {
      turret.fireCooldown = 0;
    }
  }
}

/** Crossbows aim at closest mob + fire piercing arrows. */
export function updateCrossbows(dt: number, mobs: Mob[], deployables: AnyDeployable[], arrows: Arrow[]): void {
  for (const d of deployables) {
    if (d.type !== 'crossbow') continue;
    const crossbow = d as Crossbow;

    let closest: Mob | null = null;
    let closestDist = crossbow.attackRadius;
    for (const mob of mobs) {
      if (mob.hp <= 0) continue;
      const dist = crossbow.distanceTo(mob);
      if (dist <= closestDist) {
        closestDist = dist;
        closest = mob;
      }
    }
    crossbow.aimDirection = closest
      ? Math.atan2(closest.y - crossbow.y, closest.x - crossbow.x)
      : crossbow.direction;

    crossbow.fireCooldown -= dt * 1000;
    if (closest && crossbow.fireCooldown <= 0) {
      crossbow.fireCooldown = crossbow.fireCdInterval;
      arrows.push(new Arrow(
        crossbow.id, crossbow.x, crossbow.y,
        crossbow.aimDirection,
        Math.round(CrossbowConfig.DAMAGE * crossbow.damageMultiplier),
        crossbow.arrowMaxTravel || CrossbowConfig.ARROW_MAX_TRAVEL,
        crossbow.arrowSpeed || CrossbowConfig.ARROW_SPEED,
      ));
    } else if (!closest) {
      crossbow.fireCooldown = 0;
    }
  }
}

/** Springers deploy caltrops on cooldown. */
export function updateSpringers(dt: number, deployables: AnyDeployable[], caltrops: Caltrop[]): void {
  for (const d of deployables) {
    if (d.type !== 'springer') continue;
    const springer = d as Springer;

    springer.caltropCooldown -= dt * 1000;
    if (springer.caltropCooldown <= 0) {
      springer.caltropCooldown += springer.caltropCdInterval;
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.random() * springer.attackRadius;
      const cx = springer.x + Math.cos(angle) * dist;
      const cy = springer.y + Math.sin(angle) * dist;
      caltrops.push(new Caltrop(
        `${springer.id}_caltrop_${Date.now()}`,
        cx, cy,
        Math.round(SpringerConfig.CALTROP_DAMAGE * springer.damageMultiplier),
      ));
    }
  }
}

/** Update arrows, remove expired, apply piercing damage to mobs. */
export function updateArrows(dt: number, mobs: Mob[], arrows: Arrow[]): Arrow[] {
  const toRemove: Arrow[] = [];
  for (const arrow of arrows) {
    if (arrow.update(dt)) {
      toRemove.push(arrow);
      continue;
    }
    // Piercing collision — damages each mob once per arrow
    for (const mob of mobs) {
      if (mob.hp <= 0) continue;
      if (arrow.hitMobIds.has(mob.id)) continue;
      if (mob.distanceTo(arrow) <= (mob.radius || 20) + arrow.radius) {
        arrow.hitMobIds.add(mob.id);
        mob.takeDamage(arrow.damage);
      }
    }
  }
  return arrows.filter(a => !toRemove.includes(a));
}

/**
 * Override a freshly-created deployable with the player's per-weapon upgrade stats.
 * Switches on weapon type to narrow the deployable and stats to the correct types.
 */
export function applyWeaponState(d: AnyDeployable, type: string, player: Player): void {
  const entry = player.getWeaponEntry(type);
  if (!entry) return;

  switch (type) {
    case 'turret': {
      if (entry.type !== 'turret') return;
      const t = d as Turret;
      t.fireCdInterval = entry.stats.fireCdInterval;
      t.attackRadius = entry.stats.attackRadius;
      t.damageMultiplier = entry.stats.damageMult;
      break;
    }
    case 'springer': {
      if (entry.type !== 'springer') return;
      const s = d as Springer;
      s.attackRadius = entry.stats.attackRadius;
      s.damageMultiplier = entry.stats.damageMult;
      s.caltropCdInterval = entry.stats.caltropCooldown;
      break;
    }
    case 'spiderweb': {
      if (entry.type !== 'spiderweb') return;
      const w = d as Spiderweb;
      w.attackRadius = entry.stats.attackRadius;
      w.damageMultiplier = entry.stats.damageMult;
      w.slowMultiplier = entry.stats.slowMultiplier;
      w.spiderDamage = entry.stats.spiderDamage;
      w.spiderAttackInterval = entry.stats.spiderAttackInterval;
      break;
    }
    case 'crossbow': {
      if (entry.type !== 'crossbow') return;
      const c = d as Crossbow;
      c.fireCdInterval = entry.stats.fireCdInterval;
      c.attackRadius = entry.stats.attackRadius;
      c.damageMultiplier = entry.stats.damageMult;
      c.arrowSpeed = entry.stats.arrowSpeed;
      c.arrowMaxTravel = entry.stats.arrowMaxTravel;
      break;
    }
  }
}
