import io, { Socket } from "socket.io-client";
import { processGameUpdate } from "./state";

import Constants from "../shared/constants";

const socket: Socket = io(`ws://${window.location.host}`);
const connectedPromise = new Promise<void>((resolve) => {
  socket.on("connect", () => {
    console.log("Connected to server!");
    resolve();
  });
});

export const connect = (onGameOver?: (...args: unknown[]) => void) =>
  connectedPromise.then(() => {
    socket.on(Constants.MSG_TYPES.GAME_UPDATE, processGameUpdate);
    socket.on(Constants.MSG_TYPES.GAME_OVER, onGameOver!);
  });

export const play = (username: string) => {
  socket.emit(Constants.MSG_TYPES.JOIN_GAME, username);
};

export const updateDirection = (dir: number, isMoving: boolean) => {
  socket.emit(Constants.MSG_TYPES.INPUT, { direction: dir, isMoving });
};
