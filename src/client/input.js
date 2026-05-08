// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#6-client-input
import { getCurrentState } from './state';
import { toggleHitboxes, areHitboxesVisible } from './render';
import { updateDirection } from './networking';

const Constants = require('../shared/constants');

// Get canvas and context
const canvas = document.getElementById('game-canvas');

// The position we've told the server we're at
let lastPosition = { x: 0, y: 0 };

// The position our player should be at (used for interpolation)
let targetPosition = { x: 0, y: 0 };

// The direction the player is facing
let direction = 0;

// The last time the server update our position
let lastServerUpdate = Date.now();

// The current input state
const keys = {};

// Handle keydown events
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  
  // Toggle hitboxes with 'h' key
  if (e.key === 'h' || e.key === 'H') {
    toggleHitboxes();
    console.log('Hitboxes', areHitboxesVisible() ? 'enabled' : 'disabled');
  }
});

// Handle keyup events
window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});


// Update the player's position based on input
function update() {
  const state = getCurrentState();
  if (!state.me) return;

  // Update target position based on input
  let dx = 0;
  let dy = 0;

  // WASD and Arrow key controls
  if (keys['w'] || keys['W'] || keys['ArrowUp']) dx += 1;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) dy -= 1;
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) dy += 1;
  if (keys['s'] || keys['S'] || keys['ArrowDown']) dx -= 1;

  // Calculate direction based on movement (only if moving)
  if (dx !== 0 || dy !== 0) {
    direction = Math.atan2(-dy, dx); // Negative dy for correct up/down
    updateDirection(direction);
  }

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  // Update target position
  targetPosition.x = state.me.x + dx * Constants.PLAYER_SPEED * 0.016;
  targetPosition.y = state.me.y + dy * Constants.PLAYER_SPEED * 0.016;

  // Keep player in bounds
  targetPosition.x = Math.max(0, Math.min(Constants.MAP_SIZE, targetPosition.x));
  targetPosition.y = Math.max(0, Math.min(Constants.MAP_SIZE, targetPosition.y));

  // Interpolate position towards target
  const now = Date.now();
  const dt = (now - lastServerUpdate) / 1000;
  const lerpFactor = Math.min(dt * 10, 1);

  lastPosition.x += (targetPosition.x - lastPosition.x) * lerpFactor;
  lastPosition.y += (targetPosition.y - lastPosition.y) * lerpFactor;

  // Send input to server if we've moved significantly
  if (Math.abs(lastPosition.x - state.me.x) > 1 || Math.abs(lastPosition.y - state.me.y) > 1) {
    lastServerUpdate = now;
  }
}

// Get the current interpolated position
function getPosition() {
  return lastPosition;
}

// Get the current direction
function getDirection() {
  return direction;
}

// Reset the input state
function reset() {
  lastPosition = { x: 0, y: 0 };
  targetPosition = { x: 0, y: 0 };
  direction = 0;
  lastServerUpdate = Date.now;
}

export default {
  update,
  getPosition,
  getDirection,
  reset,
};