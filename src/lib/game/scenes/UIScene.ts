import Phaser from "phaser";

/**
 * UI Scene — внутри-canvas HUD.
 * Запускается параллельно с GameScene (overlay).
 *
 * ВНИМАНИЕ: основной HUD у нас в React (HUD.tsx, BuyMenu.tsx).
 * Эта сцена нужна только если захотим рисовать что-то прямо на canvas
 * (например, всплывающие "+$15" при килле).
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create(): void {
    // пока пусто
  }
}