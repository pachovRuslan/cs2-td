import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";
import { GameOverScene } from "./scenes/GameOverScene";

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 640;

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0a0a0a",
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  audio: {
    disableWebAudio: false,
    noAudio: false,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene],
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  banner: false,
};