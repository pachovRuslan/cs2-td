import Phaser from "phaser";

/**
 * Game Over Scene — экран финала.
 * Полная реализация будет позже.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#000");

    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "GAME OVER\n(заглушка)",
      {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#ff4444",
        align: "center",
      }
    );
    text.setOrigin(0.5);
  }
}