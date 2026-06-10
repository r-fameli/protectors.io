import Constants from "../shared/constants";
import Player from "./player";
import Tree from "./tree";
import Bullet from "./bullet";
import Mob from "./mobs/mob";
import Lumberjack from "./mobs/lumberjack";
import Chainsawer from "./mobs/chainsawer";
import Loghouse from "./mobs/loghouse";
import Foreman from "./mobs/foreman";
import Harvester from "./mobs/harvester";
import Turret from "./weapons/turret";
import Springer from "./weapons/springer";
import Spiderweb from "./weapons/spiderweb";
import Crossbow from "./weapons/crossbow";
import Arrow from "./weapons/arrow";
import Spider from "./weapons/spider";
import Caltrop from "./weapons/caltrop";
import ExpOrb from "./exp-orb";
import Collectible from "./collectible";
import { COLLECTIBLE_CONFIG } from "../shared/collectible-configs";
import { MAX_BONUS_COOLDOWNS } from "../shared/player-upgrades";
import { BasicTurretConfig, getWeaponConfig } from "../shared/weapon-configs";
import { HARVESTER as HARVESTER_CONFIG } from "../shared/mob-configs";
import { TIME_PER_THRESHOLD } from "../shared/wave-configs";
import applyCollisions from "./collisions";
import WaveManager from "./systems/wave-manager";

import {
  applySpiderwebSlow,
  updateSpiders,
  updateTurrets,
  updateCrossbows,
  updateSpringers,
  updateArrows,
  applyWeaponState,
} from "./systems/deployable-system";

class Game {
  sockets: Record<string, import("socket.io").Socket>;
  players: Record<string, Player>;
  trees: Tree[];
  bullets: Bullet[];
  mobs: Mob[];
  deployables: (Turret | Springer | Spiderweb | Crossbow)[];
  caltrops: Caltrop[];
  expOrbs: ExpOrb[];
  collectibles: Collectible[];
  lastUpdateTime: number;
  shouldSendUpdate: boolean;
  waveManager: WaveManager;
  speedMultiplier: number;
  spiders: Spider[];
  arrows: Arrow[];

  constructor() {
    this.sockets = {};
    this.players = {};
    this.trees = [];
    this.bullets = [];
    this.mobs = [];
    this.deployables = [];
    this.caltrops = [];
    this.spiders = [];
    this.arrows = [];
    this.expOrbs = [];
    this.collectibles = [];
    this.spawnCollectibles();
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
    this.speedMultiplier = 1;
    this.waveManager = new WaveManager();
    const center = Constants.MAP_SIZE / 2;
    this.waveManager.registerMobType('lumberjack', (id, x, y) => new Lumberjack(id, x, y, center, center));
    this.waveManager.registerMobType('chainsawer', (id, x, y) => new Chainsawer(id, x, y, center, center));
    this.waveManager.registerMobType('foreman', (id, x, y) => new Foreman(id, x, y, center, center));
    this.waveManager.registerMobType('loghouse', (id, x, y) => new Loghouse(id, x, y, x, y));
    this.waveManager.registerMobType('harvester', (id, x, y) => new Harvester(id, x, y, center, center));
    setInterval(this.update.bind(this), 1000 / 60);

    this.trees.push(new Tree('tree', Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2));
  }

  addPlayer(socket: import("socket.io").Socket, username: string) {
    this.sockets[socket.id] = socket;

    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    this.players[socket.id] = new Player(socket.id, username, x, y);
  }

  /** Spawn XP collectibles + tree orbs with spacing. */
  private spawnCollectibles(): void {
    const positions: { x: number; y: number }[] = [];
    const playerCount = Object.keys(this.players).length;
    const xpCount = COLLECTIBLE_CONFIG.XP_BASE_COUNT + playerCount * COLLECTIBLE_CONFIG.XP_PER_PLAYER;
    for (let i = 0; i < xpCount; i++) {
      const pos = Collectible.randomPosition(positions);
      positions.push(pos);
      this.collectibles.push(new Collectible(`collectible_xp_${i}`, pos.x, pos.y, 'xp'));
    }
    for (let i = 0; i < COLLECTIBLE_CONFIG.TREE_ORB_BASE_COUNT; i++) {
      const pos = Collectible.randomPosition(positions, COLLECTIBLE_CONFIG.TREE_ORB_RADIUS);
      positions.push(pos);
      this.collectibles.push(new Collectible(`collectible_tree_${i}`, pos.x, pos.y, 'treeorb'));
    }
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

  handleUpgrade(socket: import("socket.io").Socket, upgradeKey: string) {
    const player = this.players[socket.id];
    if (player && player.pendingUpgrades > 0) {
      player.applyUpgrade(upgradeKey);
    }
  }

  private static readonly PLACEMENT_ANGLES = [
    0,
    Math.PI / 8,
    -Math.PI / 8,
    Math.PI / 4,
    -Math.PI / 4,
  ];

  /** Try to place a weapon. Returns true on success. */
  private tryPlaceWeapon(player: Player, weaponType: string): boolean {
    const config = getWeaponConfig(weaponType);
    const offset = Constants.PLAYER_RADIUS + config.RADIUS + 10;

    for (const angleOffset of Game.PLACEMENT_ANGLES) {
      const px = player.x + Math.cos(player.direction + angleOffset) * offset;
      const py = player.y + Math.sin(player.direction + angleOffset) * offset;

      const blocked = this.deployables.some(d => {
        const dx = d.x - px;
        const dy = d.y - py;
        return (dx * dx + dy * dy) < (config.RADIUS * 2) ** 2;
      });

      if (!blocked) {
        const seq = player.nextDeployId(weaponType);
        const id = `${player.id}_${config.ID_PREFIX}_${seq}`;
        const d = this.createDeployable(weaponType, id, px, py, player.direction);
        applyWeaponState(d, weaponType, player);
        this.applyPlayerMultipliers(d, weaponType, player);
        (d as any).duration = Math.round((d as any).duration * player.fortifyMultiplier);
        this.deployables.push(d);
        return true;
      }
    }
    return false;
  }

  private createDeployable(type: string, id: string, x: number, y: number, dir: number): Turret | Springer | Spiderweb | Crossbow {
    switch (type) {
      case 'turret': return new Turret(id, x, y, dir, BasicTurretConfig);
      case 'springer': return new Springer(id, x, y);
      case 'spiderweb': return new Spiderweb(id, x, y);
      case 'crossbow': return new Crossbow(id, x, y, dir);
      default: throw new Error(`Unknown deployable type: ${type}`);
    }
  }

  /** Apply global player progression multipliers (range, damage) to a new deployable. */
  private applyPlayerMultipliers(d: Turret | Springer | Spiderweb | Crossbow, type: string, player: Player): void {
    switch (type) {
      case 'turret': {
        const t = d as Turret;
        t.attackRadius = Math.round(t.attackRadius * player.rangeMultiplier);
        t.damageMultiplier *= player.damageMultiplier;
        break;
      }
      case 'springer': {
        const s = d as Springer;
        s.attackRadius = Math.round(s.attackRadius * player.rangeMultiplier);
        s.damageMultiplier *= player.damageMultiplier;
        break;
      }
      case 'spiderweb': {
        const w = d as Spiderweb;
        w.attackRadius = Math.round(w.attackRadius * player.rangeMultiplier);
        w.damageMultiplier *= player.damageMultiplier;
        break;
      }
      case 'crossbow': {
        const c = d as Crossbow;
        c.attackRadius = Math.round(c.attackRadius * player.rangeMultiplier);
        c.damageMultiplier *= player.damageMultiplier;
        break;
      }
    }
  }

  update() {
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000 * this.speedMultiplier;
    this.lastUpdateTime = now;

    // Don't simulate when no players are connected
    if (Object.keys(this.sockets).length === 0) return;

    const playerList = Object.values(this.players);

    // Continuous trickle + wave events (scales with player count)
    this.waveManager.update(dt, this.mobs, playerList.length);

    // Deployable behaviors
    applySpiderwebSlow(this.mobs, this.deployables);

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

    // Update players — independent per-weapon cooldowns + cascade bonus cooldowns
    Object.keys(this.sockets).forEach((playerID) => {
      const player = this.players[playerID];
      player.update(dt);

      const ownedTypes = Object.keys(player.weaponSlots);
      if (ownedTypes.length === 0) return;

      // ── Independent per-weapon cooldowns ──
      for (const wtype of ownedTypes) {
        const slot = player.weaponSlots[wtype];
        slot.cooldown -= dt * 1000 * player.deployCdMultiplier;

        if (slot.cooldown <= 0) {
          const placed = this.tryPlaceWeapon(player, wtype);

          if (placed) {
            slot.cooldown = getWeaponConfig(wtype).COOLDOWN;

            // Cascade — chance to start a bonus cooldown on a random owned weapon
            if (Math.random() < player.cascadeChance) {
              const candidates = ownedTypes.filter(w =>
                (player.bonusCooldowns[w] || []).length < MAX_BONUS_COOLDOWNS
              );
              if (candidates.length > 0) {
                const pick = candidates[Math.floor(Math.random() * candidates.length)];
                if (!player.bonusCooldowns[pick]) player.bonusCooldowns[pick] = [];
                player.bonusCooldowns[pick].push(getWeaponConfig(pick).COOLDOWN);
              }
            }
          } else {
            slot.cooldown = 0; // retry next frame
          }
        }
      }

      // ── Bonus cooldowns (Cascade) — tick and deploy independently ──
      for (const wtype of ownedTypes) {
        const timers = player.bonusCooldowns[wtype];
        if (!timers || timers.length === 0) continue;

        for (let i = timers.length - 1; i >= 0; i--) {
          timers[i] -= dt * 1000 * player.deployCdMultiplier;
          if (timers[i] <= 0) {
            timers.splice(i, 1);
            this.tryPlaceWeapon(player, wtype);
          }
        }
      }
    });

    // Update mobs — move toward tree, deal DOT at tree edge
    this.mobs.forEach(mob => mob.update(dt));

    // Mobs at the tree edge deal damage over time
    this.trees.forEach(tree => {
      this.mobs.forEach(mob => {
        if (mob.hp <= 0) return;
        const dx = mob.x - tree.x;
        const dy = mob.y - tree.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < Constants.TREE_RADIUS + mob.radius) {
          if (mob.mobType === 'harvester') {
            tree.takeDamage(HARVESTER_CONFIG.BURST_DAMAGE);
            mob.hp = 0;
          } else {
            tree.takeDamage(mob.maxHp * dt * 0.1);
          }
        }
      });
    });

    // Loghouses spawn mobs around them (type scales with threat level)
    const loghouseThreat = this.waveManager.getThreatLevel();
    this.mobs.filter((m): m is Loghouse => m.mobType === 'loghouse' && m.hp > 0).forEach(loghouse => {
      if (loghouse.advanceLumberjackTimer(dt)) {
        const count = Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const mob = loghouse.spawnMob(loghouseThreat, Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2);
          this.mobs.push(mob);
        }
      }
    });

    // Foremen move toward mob clusters + apply buffs
    this.mobs.filter(m => m.mobType === 'foreman' && m.hp > 0).forEach(foreman => {
      (foreman as Foreman).updateBehavior(dt, this.mobs);
    });

    // Update collectibles — tick respawn timers, move transiting tree orbs, pass alive positions for spacing
    const alivePositions = this.collectibles.filter(c => c.alive).map(c => ({ x: c.x, y: c.y }));
    this.collectibles.forEach(c => c.update(dt, alivePositions));

    // Tree orbs that arrived at the tree — heal the tree and start respawn
    for (const c of this.collectibles) {
      if (c.variant === 'treeorb' && c.hasArrivedAtTree) {
        if (this.trees.length > 0) {
          this.trees[0].healOrIncrease(c.healAmount, 20);
        }
        c.respawnTimer = COLLECTIBLE_CONFIG.TREE_ORB_RESPAWN;
        c.endTransit();
      }
    }

    // Remove expired deployables
    this.deployables = this.deployables.filter(d => !d.update(dt));
    this.caltrops = this.caltrops.filter(c => !c.update(dt));

    // Deployable behaviors
    this.spiders = updateSpiders(dt, this.mobs, this.deployables, this.spiders);
    updateTurrets(dt, this.mobs, this.deployables, this.bullets);
    updateCrossbows(dt, this.mobs, this.deployables, this.arrows);
    updateSpringers(dt, this.deployables, this.caltrops);
    this.arrows = updateArrows(dt, this.mobs, this.arrows);

    // Apply collisions
    const { destroyedBullets, destroyedCaltrops, collectedCollectibles } = applyCollisions(
      Object.values(this.players),
      this.bullets,
      this.trees,
      this.mobs,
      this.caltrops,
      this.collectibles,
    );

    // Remove mobs killed by bullets — drop exp orb at death location
    const deadMobs = this.mobs.filter(mob => mob.hp <= 0);
    deadMobs.forEach(mob => {
      this.expOrbs.push(new ExpOrb(`exp_${mob.id}`, mob.x, mob.y, mob.xpDrop));
    });
    this.mobs = this.mobs.filter(mob => mob.hp > 0);

    // Collectibles collected by player overlap
    for (const col of collectedCollectibles) {
      const c = this.collectibles.find(c2 => c2.id === col.id);
      if (!c) continue;
      if (c.variant === 'treeorb') {
        c.startTransit();
      } else {
        this.expOrbs.push(new ExpOrb(`exp_${c.id}_${Date.now()}`, c.x, c.y, c.xpDrop));
        c.respawnTimer = COLLECTIBLE_CONFIG.XP_RESPAWN;
      }
    }
    this.bullets = this.bullets.filter(
      (bullet) => !destroyedBullets.includes(bullet),
    );
    this.caltrops = this.caltrops.filter(
      (caltrop) => !destroyedCaltrops.includes(caltrop),
    );

    // Exp orbs — attract toward nearest player and consume on contact
    const ATTRACT_BASE_RADIUS = 150;
    const ATTRACT_SPEED = 500;

    // Compute average level for catch-up bonus (underleveled players earn extra XP)
    const avgLevel = playerList.reduce((sum, p) => sum + p.level, 0) / playerList.length;

    const consumedOrbs: ExpOrb[] = [];
    this.expOrbs.forEach(orb => {
      let closest: Player | null = null;
      let closestDist = 0;

      for (const player of playerList) {
        const dist = orb.distanceTo(player);
        const playerRange = ATTRACT_BASE_RADIUS * player.pickupRangeMultiplier;
        if (dist < playerRange && (closest === null || dist < closestDist)) {
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
          closest.addExp(orb.expValue, avgLevel);
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
    this.spiders = [];
    this.arrows = [];
    this.expOrbs = [];
    this.speedMultiplier = 1;
    this.collectibles = [];
    this.spawnCollectibles();
    this.waveManager.reset();
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
      me: player.serializeForUpdate(this.waveManager.getThreatLevel()),
      others: nearbyPlayers.map((p) => p.serializeForUpdate(this.waveManager.getThreatLevel())),
      bullets: nearbyBullets.map((b) => b.serializeForUpdate()),
      trees: this.trees.map((p) => p.serializeForUpdate()),
      mobs: nearbyMobs.map((m) => m.serializeForUpdate()),
      deployables: nearbyDeployables.map((d) => d.serializeForUpdate()),
      caltrops: nearbyCaltrops.map((c) => c.serializeForUpdate()),
      spiders: this.spiders.map((s) => s.serializeForUpdate()),
      arrows: this.arrows.map((a) => a.serializeForUpdate()),
      expOrbs: nearbyExpOrbs.map((e) => e.serializeForUpdate()),
      collectibles: this.collectibles.map((c) => c.serializeForUpdate()),
      threatLevel: this.waveManager.getThreatLevel(),
      threatProgress: (this.waveManager.getTotalPlayerTime() % TIME_PER_THRESHOLD) / TIME_PER_THRESHOLD,
      speedMultiplier: this.speedMultiplier,
    };
  }
}

export default Game;
