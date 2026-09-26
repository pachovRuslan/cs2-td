import Phaser from "phaser";

/**
 * Boot Scene — загрузка всех ассетов.
 * Полная реализация будет в Блоке 3.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // TODO: загрузка спрайтов и звуков (Блок 3)
  }

  create(): void {
    console.log("[BootScene] Загружено. Перехожу в MenuScene.");
    this.scene.start("MenuScene");
  }
}