import Phaser from "phaser";

/**
 * UI Scene - оверлей поверх GameScene.
 * Запускается параллельно через scene.launch("UIScene") из MenuScene.
 * В Блоке 3 — пустая. Будет использоваться позже для всплывающих "+$"
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create(): void {
    // пока пусто — UI рендерится в React (HUD.tsx)
  }
}