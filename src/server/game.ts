import Constants from "../shared/constants";
import Player from "./player";
import Portal from "./portal";
import Bullet from "./bullet";
import Mob from "./mobs/mob";
import Angel from "./mobs/angel";
import Paladin from "./mobs/paladin";
import Turret from "./weapons/turret";
import ExpOrb from "./exp-orb";
import { BasicTurretConfig } from "../shared/weapon-configs";
import { ANGEL as ANGEL_CONFIG, PALADIN as PALADIN_CONFIG } from "../shared/mob-configs";
import applyCollisions from "./collisions";

function randomBoundaryPosition(): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4);
  const pos = Math.random() * Constants.MAP_SIZE;
  switch (edge) {
    case 0: return { x: pos, y: 0 };
    case 1: return { x: Constants.MAP_SIZE, y: pos };
    case 2: return { x: pos, y: Constants.MAP_SIZE };
    default: return { x: 0, y: pos };
  }
}

class Game {
  sockets: Record<string, import("socket.io").Socket>;
  players: Record<string, Player>;
  portals: Portal[];
  bullets: Bullet[];
  mobs: Mob[];
  turrets: Turret[];
  expOrbs: ExpOrb[];
  lastUpdateTime: number;
  shouldSendUpdate: boolean;
  angelSpawnTimer: number;
  angelIdCounter: number;
  paladinSpawnTimer: number;
  paladinIdCounter: number;

  constructor() {
    this.sockets = {};
    this.players = {};
    this.portals = [];
    this.bullets = [];
    this.mobs = [];
    this.turrets = [];
    this.expOrbs = [];
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
    this.angelSpawnTimer = 0;
    this.angelIdCounter = 0;
    this.paladinSpawnTimer = 0;
    this.paladinIdCounter = 0;
    setInterval(this.update.bind(this), 1000 / 60);

    this.portals.push(new Portal('portal', Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2));
  }

  addPlayer(socket: import("socket.io").Socket, username: string) {
    this.sockets[socket.id] = socket;

    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    this.players[socket.id] = new Player(socket.id, username, x, y);
  }

  removePlayer(socket: import("socket.io").Socket) {
    delete this.sockets[socket.id];
    delete this.players[socket.id];

    // Reset game when all players leave
    if (Object.keys(this.sockets).length === 0) {
      this.resetGameState();
    }
  }

  handleInput(socket: import("socket.io").Socket, data: { direction?: number; isMoving?: boolean } | number) {
    if (this.players[socket.id]) {
      if (typeof data === 'number') {
        this.players[socket.id].setDirection(data);
        this.players[socket.id].setMoving(true);
      } else {
        if (data.direction !== undefined) {
          this.players[socket.id].setDirection(data.direction);
        }
        if (data.isMoving !== undefined) {
          this.players[socket.id].setMoving(data.isMoving);
        }
      }
    }
  }

  spawnAngel() {
    const pos = randomBoundaryPosition();
    this.angelIdCounter++;
    const angel = new Angel(
      `angel_${this.angelIdCounter}`,
      pos.x, pos.y,
      Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2,
    );
    this.mobs.push(angel);
  }

  spawnPaladin() {
    const pos = randomBoundaryPosition();
    this.paladinIdCounter++;
    const paladin = new Paladin(
      `paladin_${this.paladinIdCounter}`,
      pos.x, pos.y,
      Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2,
    );
    this.mobs.push(paladin);
  }

  update() {
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Don't simulate when no players are connected
    if (Object.keys(this.sockets).length === 0) return;

    // Spawn angels
    this.angelSpawnTimer += dt;
    while (this.angelSpawnTimer >= ANGEL_CONFIG.BASE_SPAWN_INTERVAL) {
      this.angelSpawnTimer -= ANGEL_CONFIG.BASE_SPAWN_INTERVAL;
      this.spawnAngel();
    }

    // Spawn paladins
    this.paladinSpawnTimer += dt;
    while (this.paladinSpawnTimer >= PALADIN_CONFIG.BASE_SPAWN_INTERVAL) {
      this.paladinSpawnTimer -= PALADIN_CONFIG.BASE_SPAWN_INTERVAL;
      this.spawnPaladin();
    }

    // Update bullets
    const bulletsToRemove: Bullet[] = [];
    this.bullets.forEach((bullet) => {
      if (bullet.update(dt)) {
        bulletsToRemove.push(bullet);
      }
    });
    this.bullets = this.bullets.filter(
      (bullet) => !bulletsToRemove.includes(bullet),
    );

    // Update players — place turrets on cooldown
    Object.keys(this.sockets).forEach((playerID) => {
      const player = this.players[playerID];
      player.update(dt);

      player.turretCooldown -= dt * 1000;
      if (player.turretCooldown <= 0) {
        const offset = Constants.PLAYER_RADIUS + BasicTurretConfig.RADIUS + 10;
        const tx = player.x + Math.cos(player.direction) * offset;
        const ty = player.y + Math.sin(player.direction) * offset;

        const blocked = this.turrets.some(t => {
          const dx = t.x - tx;
          const dy = t.y - ty;
          return (dx * dx + dy * dy) < (BasicTurretConfig.RADIUS * 2) ** 2;
        });

        if (!blocked) {
          player.turretCooldown += BasicTurretConfig.COOLDOWN;
          player.turretIdCounter++;
          this.turrets.push(new Turret(
            `${player.id}_turret_${player.turretIdCounter}`,
            tx, ty,
            player.direction,
            BasicTurretConfig,
          ));
        } else {
          // Blocked — reset cooldown to 0 so it pauses instead of
          // accumulating negative time that triggers a burst when space clears.
          player.turretCooldown = 0;
        }
      }
    });

    // Update mobs — damage portal when one reaches it
    const reachedMobs: Mob[] = [];
    this.mobs = this.mobs.filter(mob => {
      const reached = mob.update(dt);
      if (reached) reachedMobs.push(mob);
      return !reached;
    });
    reachedMobs.forEach(mob => {
      this.portals.forEach(p => p.takeDamage(mob.maxHp));
    });

    // Remove expired turrets
    this.turrets = this.turrets.filter(t => !t.update(dt));

    // Turrets aim at closest mob + fire
    this.turrets.forEach(turret => {
      interface Target { x: number; y: number; hp: number; }
      let closest: Target | null = null;
      let closestDist = turret.attackRadius;
      for (const mob of this.mobs) {
        if (mob.hp <= 0) continue;
        const d = turret.distanceTo(mob);
        if (d <= closestDist) {
          closestDist = d;
          closest = mob;
        }
      }
      turret.aimDirection = closest
        ? Math.atan2(closest.y - turret.y, closest.x - turret.x)
        : turret.direction;

      turret.fireCooldown -= dt * 1000;
      if (closest && turret.fireCooldown <= 0) {
        turret.fireCooldown = turret.fireCdInterval;
        this.bullets.push(new Bullet(turret.id, turret.x, turret.y, turret.aimDirection, BasicTurretConfig.DAMAGE));
      } else if (!closest) {
        // Idle — prevent negative accumulation that causes burst when target appears
        turret.fireCooldown = 0;
      }
    });

    // Apply collisions
    const destroyedBullets = applyCollisions(
      Object.values(this.players),
      this.bullets,
      this.portals,
      this.mobs,
    );

    // Remove mobs killed by bullets — drop exp orb at death location
    const deadMobs = this.mobs.filter(mob => mob.hp <= 0);
    deadMobs.forEach(mob => {
      this.expOrbs.push(new ExpOrb(`exp_${mob.id}`, mob.x, mob.y));
    });
    this.mobs = this.mobs.filter(mob => mob.hp > 0);
    this.bullets = this.bullets.filter(
      (bullet) => !destroyedBullets.includes(bullet),
    );

    // Exp orbs — attract toward nearest player and consume on contact
    const ATTRACT_RADIUS = 300;
    const ATTRACT_SPEED = 200;

    const consumedOrbs: ExpOrb[] = [];
    this.expOrbs.forEach(orb => {
      let closest: Player | null = null;
      let closestDist = ATTRACT_RADIUS;

      for (const player of Object.values(this.players)) {
        const dist = orb.distanceTo(player);
        if (dist < closestDist) {
          closestDist = dist;
          closest = player;
        }
      }

      if (closest) {
        const angle = Math.atan2(closest.y - orb.y, closest.x - orb.x);
        orb.x += Math.cos(angle) * ATTRACT_SPEED * dt;
        orb.y += Math.sin(angle) * ATTRACT_SPEED * dt;

        if (orb.distanceTo(closest) < Constants.PLAYER_RADIUS) {
          consumedOrbs.push(orb);
          closest.addExp(10);
        }
      }
    });
    this.expOrbs = this.expOrbs.filter(o => !consumedOrbs.includes(o));

    // Check game over — portal destroyed
    if (this.portals.some(p => p.hp <= 0)) {
      this.endGame();
      return;
    }

    // Send game updates
    if (this.shouldSendUpdate) {
      Object.keys(this.sockets).forEach((playerID) => {
        const socket = this.sockets[playerID];
        const player = this.players[playerID];
        socket.emit(
          Constants.MSG_TYPES.GAME_UPDATE,
          this.createUpdate(player),
        );
      });
      this.shouldSendUpdate = false;
    } else {
      this.shouldSendUpdate = true;
    }
  }

  resetGameState() {
    this.mobs = [];
    this.bullets = [];
    this.turrets = [];
    this.expOrbs = [];
    this.angelSpawnTimer = 0;
    this.angelIdCounter = 0;
    this.paladinSpawnTimer = 0;
    this.paladinIdCounter = 0;
    this.portals = [new Portal('portal', Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2)];
    this.shouldSendUpdate = false;
  }

  endGame() {
    // Notify all players
    Object.values(this.sockets).forEach(socket => {
      socket.emit(Constants.MSG_TYPES.GAME_OVER);
    });
    this.sockets = {};
    this.players = {};
    this.resetGameState();
  }

  createUpdate(player: Player) {
    const nearbyPlayers = Object.values(this.players).filter(
      (p) => p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 2,
    );
    const nearbyBullets = this.bullets.filter(
      (b) => b.distanceTo(player) <= Constants.MAP_SIZE / 2,
    );
    const nearbyMobs = this.mobs;
    const nearbyTurrets = this.turrets;
    const nearbyExpOrbs = this.expOrbs.filter(
      (e) => e.distanceTo(player) <= Constants.MAP_SIZE / 2,
    );
    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      others: nearbyPlayers.map((p) => p.serializeForUpdate()),
      bullets: nearbyBullets.map((b) => b.serializeForUpdate()),
      portals: this.portals.map((p) => p.serializeForUpdate()),
      mobs: nearbyMobs.map((m) => m.serializeForUpdate()),
      turrets: nearbyTurrets.map((t) => t.serializeForUpdate()),
      expOrbs: nearbyExpOrbs.map((e) => e.serializeForUpdate()),
    };
  }
}

export default Game;
