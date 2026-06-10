import { getCurrentState } from "./state";
import { toggleHitboxes, areHitboxesVisible } from "./render/render";
import { updateDirection, sendChat } from "./networking";

let direction = 0;
const keys: Record<string, boolean> = {};
let isMoving = false;
let chatOpen = false;

function toggleUpgradePanel(): void {
  const panel = document.getElementById('upgrade-panel');
  if (!panel) return;
  if (panel.classList.contains('minimized')) {
    panel.classList.remove('minimized');
  } else {
    panel.classList.add('minimized');
  }
}

function onKeyDown(e: KeyboardEvent) {
  // Toggle chat on Enter — stop player and clear keys so no stale
  // movement state persists while chat is open or after closing.
  if (e.key === "Enter" && !chatOpen) {
    chatOpen = true;
    e.preventDefault();
    const input = document.getElementById("chat-input") as HTMLInputElement;
    if (input) {
      input.classList.remove("hidden");
      input.focus();
    }
    updateDirection(direction, false);
    for (const k of Object.keys(keys)) keys[k] = false;
    return;
  }

  // If chat is open, only handle Escape
  if (chatOpen) {
    if (e.key === "Escape") {
      chatOpen = false;
      e.preventDefault();
      const input = document.getElementById("chat-input") as HTMLInputElement;
      if (input) {
        input.classList.add("hidden");
        input.value = "";
        input.blur();
      }
    }
    return;
  }

  // Tab toggles upgrade panel minimized state
  if (e.key === "Tab") {
    e.preventDefault();
    toggleUpgradePanel();
    return;
  }

  // Number keys 1-3 select upgrade choices
  const num = parseInt(e.key);
  if (num >= 1 && num <= 3) {
    const panel = document.getElementById('upgrade-panel');
    if (panel && !panel.classList.contains('minimized')) {
      const buttons = panel.querySelectorAll<HTMLButtonElement>('.upgrade-btn');
      const btn = buttons[num - 1];
      if (btn) {
        e.preventDefault();
        btn.click();
        return;
      }
    }
  }

  keys[e.key] = true;
}

function onKeyUp(e: KeyboardEvent) {
  if (chatOpen) return;
  keys[e.key] = false;
}

function update() {
  if (chatOpen) return;

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
}

function reset() {
  direction = 0;
  chatOpen = false;
}

// Wire up chat input send on Enter
function onChatKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    const input = e.target as HTMLInputElement;
    const text = input.value.trim();
    if (text) {
      sendChat(text);
    }
    input.value = "";
    input.classList.add("hidden");
    input.blur();
    chatOpen = false;
    e.preventDefault();
    e.stopPropagation(); // prevent window handler from re-opening chat
  }
}

function onWindowBlur() {
  for (const k of Object.keys(keys)) keys[k] = false;
  if (isMoving) {
    isMoving = false;
    updateDirection(direction, false);
  }
}

export function startCapturingInput() {
  // Clear any stale key state from previous session
  for (const k of Object.keys(keys)) keys[k] = false;
  isMoving = false;

  // Defer to next microtask so any in-flight Enter from the start
  // screen finishes propagation before we start listening.
  setTimeout(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);
    const chatInput = document.getElementById("chat-input");
    if (chatInput) chatInput.addEventListener("keydown", onChatKeyDown);
  }, 0);
}

export function stopCapturingInput() {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("blur", onWindowBlur);
  const chatInput = document.getElementById("chat-input");
  if (chatInput) chatInput.removeEventListener("keydown", onChatKeyDown);
}

export default {
  update,
  reset,
};
