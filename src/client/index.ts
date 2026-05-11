import { connect, play } from "./networking";
import { startRendering } from "./render";
import { startCapturingInput } from "./input";
import { downloadAssets } from "./assets";
import { initState } from "./state";

import "./css/main.css";

const playMenu = document.getElementById("play-menu")!;
const playButton = document.getElementById("play-button")!;
const usernameInput = document.getElementById("username-input") as HTMLInputElement;

Promise.all([connect(), downloadAssets()]).then(() => {
  playMenu.classList.remove("hidden");
  usernameInput.focus();
  playButton.onclick = () => {
    play(usernameInput.value);
    playMenu.classList.add("hidden");
    initState();
    startCapturingInput();
    startRendering();
  };
});
