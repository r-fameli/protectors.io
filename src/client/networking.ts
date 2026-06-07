import io, { Socket } from "socket.io-client";
import { processGameUpdate, pushChatMessage } from "./state";

import Constants from "../shared/constants";

const socket: Socket = io();
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
    socket.on(Constants.MSG_TYPES.CHAT, (payload: { username: string; text: string }) => {
      pushChatMessage(payload);
    });
  });

export const play = (username: string) => {
  socket.emit(Constants.MSG_TYPES.JOIN_GAME, username);
};

export const updateDirection = (dir: number, isMoving: boolean) => {
  socket.emit(Constants.MSG_TYPES.INPUT, { direction: dir, isMoving });
};

export const chooseUpgrade = (upgradeKey: string) => {
  socket.emit(Constants.MSG_TYPES.CHOOSE_UPGRADE, upgradeKey);
};

export const sendChat = (text: string) => {
  socket.emit(Constants.MSG_TYPES.CHAT, text);
};
