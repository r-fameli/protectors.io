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

function onGameOver() {
  stopCapturingInput();
  stopRendering();
  upgradePanel.classList.add("hidden");
  playMenu.classList.remove("hidden");
  usernameInput.focus();
  // Reset upgrade panel cache so it re-renders next game
  (document.getElementById('upgrade-choices')!).innerHTML = '';
}

Promise.all([connect(onGameOver), downloadAssets()]).then(() => {
  playMenu.classList.remove("hidden");
  usernameInput.focus();

  // Enter key submits username
  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      playButton.click();
    }
  });

  playButton.onclick = () => {
    play(usernameInput.value);
    playMenu.classList.add("hidden");
    initState();
    startCapturingInput();
    startRendering();
  };
});
