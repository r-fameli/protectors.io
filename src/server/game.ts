import Constants from "../shared/constants";
import Player from "./player";
import Portal from "./portal";
import Bullet from "./bullet";
import Angel from "./mobs/angel";
import Turret from "./weapons/turret";
import { BasicTurretConfig } from "../shared/weapon-configs";
import { ANGEL as ANGEL_CONFIG } from "../shared/mob-configs";
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
  angels: Angel[];
  turrets: Turret[];
  lastUpdateTime: number;
  shouldSendUpdate: boolean;
  angelSpawnTimer: number;
  angelIdCounter: number;

  constructor() {
    this.sockets = {};
    this.players = {};
    this.portals = [];
    this.bullets = [];
    this.angels = [];
    this.turrets = [];
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
    this.angelSpawnTimer = 0;
    this.angelIdCounter = 0;
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
    this.angels.push(angel);
  }

  update() {
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Spawn angels
    this.angelSpawnTimer += dt;
    while (this.angelSpawnTimer >= ANGEL_CONFIG.BASE_SPAWN_INTERVAL) {
      this.angelSpawnTimer -= ANGEL_CONFIG.BASE_SPAWN_INTERVAL;
      this.spawnAngel();
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
        }
        // If blocked, cooldown stays <= 0 — retries next tick when space clears
      }
    });

    // Update angels — remove those that reached portal
    this.angels = this.angels.filter(angel => !angel.update(dt));

    // Remove expired turrets
    this.turrets = this.turrets.filter(t => !t.update(dt));

    // Turrets aim at closest angel + fire
    this.turrets.forEach(turret => {
      let closest: Angel | null = null;
      let closestDist = turret.attackRadius;
      for (const angel of this.angels) {
        if (angel.hp <= 0) continue;
        const d = turret.distanceTo(angel);
        if (d <= closestDist) {
          closestDist = d;
          closest = angel;
        }
      }
      turret.aimDirection = closest
        ? Math.atan2(closest.y - turret.y, closest.x - turret.x)
        : turret.direction;

      turret.fireCooldown -= dt * 1000;
      if (closest && turret.fireCooldown <= 0) {
        turret.fireCooldown += turret.fireCdInterval;
        this.bullets.push(new Bullet(turret.id, turret.x, turret.y, turret.aimDirection, BasicTurretConfig.DAMAGE));
      }
    });

    // Apply collisions
    const destroyedBullets = applyCollisions(
      Object.values(this.players),
      this.bullets,
      this.portals,
      this.angels,
    );

    // Remove angels killed by bullets
    this.angels = this.angels.filter(angel => angel.hp > 0);
    this.bullets = this.bullets.filter(
      (bullet) => !destroyedBullets.includes(bullet),
    );

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

  createUpdate(player: Player) {
    const nearbyPlayers = Object.values(this.players).filter(
      (p) => p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 2,
    );
    const nearbyBullets = this.bullets.filter(
      (b) => b.distanceTo(player) <= Constants.MAP_SIZE / 2,
    );
    const nearbyAngels = this.angels;
    const nearbyTurrets = this.turrets;
    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      others: nearbyPlayers.map((p) => p.serializeForUpdate()),
      bullets: nearbyBullets.map((b) => b.serializeForUpdate()),
      portals: this.portals.map((p) => p.serializeForUpdate()),
      angels: nearbyAngels.map((a) => a.serializeForUpdate()),
      turrets: nearbyTurrets.map((t) => t.serializeForUpdate()),
    };
  }
}

export default Game;
