import { connect, play } from "./networking";
import { startRendering, stopRendering } from "./render/render";
import { startCapturingInput, stopCapturingInput } from "./input";
import { downloadAssets } from "./assets";
import { initState } from "./state";

import "./css/main.css";

const playMenu = document.getElementById("play-menu")!;
const playButton = document.getElementById("play-button")!;
const usernameInput = document.getElementById("username-input") as HTMLInputElement;
const upgradePanel = document.getElementById("upgrade-panel")!;
const chatBox = document.getElementById("chat-box")!;
const chatMessages = document.getElementById("chat-messages")!;

function onGameOver() {
  stopCapturingInput();
  stopRendering();
  upgradePanel.classList.add("hidden");
  chatBox.classList.add("hidden");
  chatMessages.innerHTML = '';
  playMenu.classList.remove("hidden");
  usernameInput.focus();
  // Reset upgrade panel cache so it re-renders next game
  (document.getElementById('upgrade-choices')!).innerHTML = '';
}

Promise.all([connect(onGameOver), downloadAssets()]).then(() => {
  playMenu.classList.remove("hidden");
  usernameInput.focus();

  // Enter key submits username — stop propagation so it doesn't
  // reach the window listener (added by startCapturingInput) and open chat
  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      playButton.click();
    }
  });

  playButton.onclick = () => {
    play(usernameInput.value);
    playMenu.classList.add("hidden");
    chatBox.classList.remove("hidden");
    document.getElementById('upgrade-panel')?.classList.remove('hidden');
    initState();
    startCapturingInput();
    startRendering();
  };
});
