import Constants from "../shared/constants";
import Player from "./player";
import Portal from "./portal";
import Bullet from "./bullet";
import applyCollisions from "./collisions";

class Game {
  sockets: Record<string, import("socket.io").Socket>;
  players: Record<string, Player>;
  portals: Portal[];
  bullets: Bullet[];
  lastUpdateTime: number;
  shouldSendUpdate: boolean;

  constructor() {
    this.sockets = {};
    this.players = {};
    this.portals = [];
    this.bullets = [];
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
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

  update() {
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    const bulletsToRemove: Bullet[] = [];
    this.bullets.forEach((bullet) => {
      if (bullet.update(dt)) {
        bulletsToRemove.push(bullet);
      }
    });
    this.bullets = this.bullets.filter(
      (bullet) => !bulletsToRemove.includes(bullet),
    );

    Object.keys(this.sockets).forEach((playerID) => {
      const player = this.players[playerID];
      player.update(dt);
    });

    const destroyedBullets = applyCollisions(
      Object.values(this.players),
      this.bullets,
      this.portals,
    );
    destroyedBullets.forEach((b) => {
      if (this.players[b.parentID!]) {
        this.players[b.parentID!].onDealtDamage();
      }
    });
    this.bullets = this.bullets.filter(
      (bullet) => !destroyedBullets.includes(bullet),
    );

    Object.keys(this.sockets).forEach((playerID) => {
      const socket = this.sockets[playerID];
      const player = this.players[playerID];
      if (player.hp <= 0) {
        socket.emit(Constants.MSG_TYPES.GAME_OVER);
        this.removePlayer(socket);
      }
    });

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
    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      others: nearbyPlayers.map((p) => p.serializeForUpdate()),
      bullets: nearbyBullets.map((b) => b.serializeForUpdate()),
      portals: this.portals.map((p) => p.serializeForUpdate()),
    };
  }
}

export default Game;
