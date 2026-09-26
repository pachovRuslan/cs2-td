import Phaser from "phaser";

/**
 * Menu Scene — главное меню.
 * Полная реализация будет в Блоке 3.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0a0a");

    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "CS2 DUST2 — TOWER DEFENSE\n\n(Заглушка меню, полная версия в Блоке 3)",
      {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#f5e6c8",
        align: "center",
      }
    );
    text.setOrigin(0.5);
  }
}