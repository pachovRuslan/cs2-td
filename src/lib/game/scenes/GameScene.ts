import Phaser from "phaser";

/**
 * Game Scene — основной геймплей.
 * Полная реализация будет в Блоках 4-8.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1816");

    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "GameScene\n(заглушка)",
      {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#f5e6c8",
      }
    );
    text.setOrigin(0.5);
  }
}