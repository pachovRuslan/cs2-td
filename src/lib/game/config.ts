import Phaser from "phaser";
 

/**
 * Конфиг Phaser игры.
 *
 * Фиксированный размер 1024×640 (16:10) — как мы решили.
 * Scale mode FIT сохранит aspect ratio, чёрные полосы если экран другой.
 *
 * Порядок сцен = порядок их запуска.
 * BootScene стартует первой, потом через scene.start() переключаемся.
 */

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 640;

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  // AUTO = WebGL если доступен, иначе Canvas2D
  type: Phaser.AUTO,

  // Родительский div в DOM (Phaser вставит canvas внутрь)
  parent: "game-container",

  // Фиксированный размер игрового поля
  width: GAME_WIDTH,
  height: GAME_HEIGHT,

  // Цвет фона (показывается до загрузки сцен)
  backgroundColor: "#0a0a0a",

  // Pixel art OFF — у нас спрайты высокого качества
  pixelArt: false,

  // Сглаживание при масштабировании
  antialias: true,
  roundPixels: false,

  // Scale mode
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },

  // Физика (Arcade — простая, для top-down TD хватит)
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },  // top-down, без гравитации
      debug: false,              // ← true для дебага хитбоксов
    },
  },

  // Аудио
  audio: {
    disableWebAudio: false,  // используем Web Audio API
    noAudio: false,
  },

  // Ввод
  input: {
    activePointers: 3,  // 3 = поддержка pinch-zoom в будущем (если захотим)
  },

  // Сцены по порядку запуска
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene],

  // FPS
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },

  // Отключаем стандартный banner в консоли
  banner: false,
};