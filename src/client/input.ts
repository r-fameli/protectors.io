import { getCurrentState } from "./state";
import { toggleHitboxes, areHitboxesVisible } from "./render";
import { updateDirection } from "./networking";

import Constants from "../shared/constants";

let lastPosition = { x: 0, y: 0 };
let targetPosition = { x: 0, y: 0 };
let direction = 0;
let lastServerUpdate = Date.now();
const keys: Record<string, boolean> = {};
let isMoving = false;

function onKeyDown(e: KeyboardEvent) {
  keys[e.key] = true;
}

function onKeyUp(e: KeyboardEvent) {
  keys[e.key] = false;
}

function update() {
  const state = getCurrentState();
  if (!state.me) return;

  if (keys["h"] || keys["H"]) {
    toggleHitboxes();
    console.log("Hitboxes", areHitboxesVisible() ? "enabled" : "disabled");
  }

  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["W"] || keys["ArrowUp"]) dy -= 1;
  if (keys["s"] || keys["S"] || keys["ArrowDown"]) dy += 1;
  if (keys["a"] || keys["A"] || keys["ArrowLeft"]) dx -= 1;
  if (keys["d"] || keys["D"] || keys["ArrowRight"]) dx += 1;

  const wasMoving = isMoving;
  isMoving = dx !== 0 || dy !== 0;

  if (isMoving) {
    direction = Math.atan2(dy, dx);
    updateDirection(direction, isMoving);
  } else if (wasMoving) {
    updateDirection(direction, false);
  }

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  targetPosition.x = state.me.x + dx * Constants.PLAYER_SPEED * 0.016;
  targetPosition.y = state.me.y + dy * Constants.PLAYER_SPEED * 0.016;

  targetPosition.x = Math.max(0, Math.min(Constants.MAP_SIZE, targetPosition.x));
  targetPosition.y = Math.max(0, Math.min(Constants.MAP_SIZE, targetPosition.y));

  const now = Date.now();
  const dt = (now - lastServerUpdate) / 1000;
  const lerpFactor = Math.min(dt * 10, 1);

  lastPosition.x += (targetPosition.x - lastPosition.x) * lerpFactor;
  lastPosition.y += (targetPosition.y - lastPosition.y) * lerpFactor;

  if (
    Math.abs(lastPosition.x - state.me.x) > 1 ||
    Math.abs(lastPosition.y - state.me.y) > 1
  ) {
    lastServerUpdate = now;
  }
}

function reset() {
  lastPosition = { x: 0, y: 0 };
  targetPosition = { x: 0, y: 0 };
  direction = 0;
  lastServerUpdate = Date.now();
}

export function startCapturingInput() {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
}

export function stopCapturingInput() {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
}

export default {
  update,
  reset,
};
