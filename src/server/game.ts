import Constants from "../shared/constants";
import Player from "./player";
import Tree from "./tree";
import Bullet from "./bullet";
import Mob from "./mobs/mob";
import Angel from "./mobs/angel";
import Paladin from "./mobs/paladin";
import Turret from "./weapons/turret";
import Springer from "./weapons/springer";
import Caltrop from "./weapons/caltrop";
import ExpOrb from "./exp-orb";
import { BasicTurretConfig, SpringerConfig } from "../shared/weapon-configs";
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
  trees: Tree[];
  bullets: Bullet[];
  mobs: Mob[];
  deployables: (Turret | Springer)[];
  caltrops: Caltrop[];
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
    this.trees = [];
    this.bullets = [];
    this.mobs = [];
    this.deployables = [];
    this.caltrops = [];
    this.expOrbs = [];
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
    this.angelSpawnTimer = 0;
    this.angelIdCounter = 0;
    this.paladinSpawnTimer = 0;
    this.paladinIdCounter = 0;
    setInterval(this.update.bind(this), 1000 / 60);

    this.trees.push(new Tree('tree', Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2));
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

  private tryPlaceDeployable(
    dt: number,
    player: Player,
    cd: () => number,
    setCd: (v: number) => void,
    incCounter: () => number,
    config: { RADIUS: number; COOLDOWN: number; ID_PREFIX: string },
    create: (id: string, x: number, y: number) => Turret | Springer,
  ) {
    let cooldown = cd();
    cooldown -= dt * 1000;
    if (cooldown <= 0) {
      const offset = Constants.PLAYER_RADIUS + config.RADIUS + 10;
      const px = player.x + Math.cos(player.direction) * offset;
      const py = player.y + Math.sin(player.direction) * offset;

      const blocked = this.deployables.some(d => {
        const dx = d.x - px;
        const dy = d.y - py;
        return (dx * dx + dy * dy) < (config.RADIUS * 2) ** 2;
      });

      if (!blocked) {
        cooldown += config.COOLDOWN;
        const id = incCounter();
        this.deployables.push(create(`${player.id}_${config.ID_PREFIX}_${id}`, px, py));
      } else {
        cooldown = 0;
      }
    }
    setCd(cooldown);
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

    // Update players — place deployables on cooldown
    Object.keys(this.sockets).forEach((playerID) => {
      const player = this.players[playerID];
      player.update(dt);

      this.tryPlaceDeployable(dt, player,
        () => player.turretCooldown,
        v => { player.turretCooldown = v; },
        () => ++player.turretIdCounter,
        BasicTurretConfig,
        (id, x, y) => new Turret(id, x, y, player.direction, BasicTurretConfig),
      );

      this.tryPlaceDeployable(dt, player,
        () => player.springerCooldown,
        v => { player.springerCooldown = v; },
        () => ++player.springerIdCounter,
        SpringerConfig,
        (id, x, y) => new Springer(id, x, y),
      );
    });

    // Update mobs — damage tree when one reaches it
    const reachedMobs: Mob[] = [];
    this.mobs = this.mobs.filter(mob => {
      const reached = mob.update(dt);
      if (reached) reachedMobs.push(mob);
      return !reached;
    });
    reachedMobs.forEach(mob => {
      this.trees.forEach(p => p.takeDamage(mob.maxHp));
    });

    // Remove expired deployables
    this.deployables = this.deployables.filter(d => !d.update(dt));

    // Turrets aim at closest mob + fire
    this.deployables.filter((d): d is Turret => d.type === 'turret').forEach(turret => {
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
        turret.fireCooldown = 0;
      }
    });

    // Springers deploy caltrops on cooldown
    this.deployables.filter((d): d is Springer => d.type === 'springer').forEach(springer => {
      springer.caltropCooldown -= dt * 1000;
      if (springer.caltropCooldown <= 0) {
        springer.caltropCooldown += 3000;
        const angle = Math.random() * 2 * Math.PI;
        const dist = Math.random() * springer.caltropRadius;
        const cx = springer.x + Math.cos(angle) * dist;
        const cy = springer.y + Math.sin(angle) * dist;
        this.caltrops.push(new Caltrop(
          `${springer.id}_caltrop_${Date.now()}`,
          cx, cy,
        ));
      }
    });

    // Remove expired caltrops
    this.caltrops = this.caltrops.filter(c => !c.update(dt));

    // Apply collisions
    const { destroyedBullets, destroyedCaltrops } = applyCollisions(
      Object.values(this.players),
      this.bullets,
      this.trees,
      this.mobs,
      this.caltrops,
    );

    // Remove mobs killed by bullets — drop exp orb at death location
    const deadMobs = this.mobs.filter(mob => mob.hp <= 0);
    deadMobs.forEach(mob => {
      this.expOrbs.push(new ExpOrb(`exp_${mob.id}`, mob.x, mob.y, mob.xpDrop));
    });
    this.mobs = this.mobs.filter(mob => mob.hp > 0);
    this.bullets = this.bullets.filter(
      (bullet) => !destroyedBullets.includes(bullet),
    );
    this.caltrops = this.caltrops.filter(
      (caltrop) => !destroyedCaltrops.includes(caltrop),
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
          closest.addExp(orb.expValue);
        }
      }
    });
    this.expOrbs = this.expOrbs.filter(o => !consumedOrbs.includes(o));

    // Check game over — tree destroyed
    if (this.trees.some(p => p.hp <= 0)) {
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
    this.deployables = [];
    this.caltrops = [];
    this.expOrbs = [];
    this.angelSpawnTimer = 0;
    this.angelIdCounter = 0;
    this.paladinSpawnTimer = 0;
    this.paladinIdCounter = 0;
    this.trees = [new Tree('tree', Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2)];
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
    const nearbyDeployables = this.deployables;
    const nearbyCaltrops = this.caltrops;
    const nearbyExpOrbs = this.expOrbs.filter(
      (e) => e.distanceTo(player) <= Constants.MAP_SIZE / 2,
    );
    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      others: nearbyPlayers.map((p) => p.serializeForUpdate()),
      bullets: nearbyBullets.map((b) => b.serializeForUpdate()),
      trees: this.trees.map((p) => p.serializeForUpdate()),
      mobs: nearbyMobs.map((m) => m.serializeForUpdate()),
      deployables: nearbyDeployables.map((d) => d.serializeForUpdate()),
      caltrops: nearbyCaltrops.map((c) => c.serializeForUpdate()),
      expOrbs: nearbyExpOrbs.map((e) => e.serializeForUpdate()),
    };
  }
}

export default Game;
