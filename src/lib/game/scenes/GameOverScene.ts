import Phaser from "phaser";
import { gameEvents, GameEvents } from "../events";

interface GameOverData {
  score?: number;
  wave?: number;
}

/**
 * Game Over Scene — экран финала: счёт, волна, рестарт.
 */
export class GameOverScene extends Phaser.Scene {
  private result: Required<GameOverData> = { score: 0, wave: 0 };

  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data: GameOverData): void {
    this.result = { score: data.score ?? 0, wave: data.wave ?? 0 };
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.cameras.main.setBackgroundColor("#000");

    this.add
      .text(cx, cy - 90, "TERRORISTS WIN", {
        fontFamily: "monospace",
        fontSize: "44px",
        color: "#ff4444",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        cy,
        `Счёт: ${this.result.score}\nДошли до волны: ${this.result.wave}`,
        {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#f5e6c8",
          align: "center",
          lineSpacing: 8,
        }
      )
      .setOrigin(0.5);

    const hint = this.add
      .text(cx, cy + 100, "Клик или ENTER — в меню", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const restart = () => {
      gameEvents.emit(GameEvents.GAME_RESTART);
      this.scene.start("MenuScene");
    };

    // небольшая задержка, чтобы случайный клик не пропустил экран
    this.time.delayedCall(500, () => {
      this.input.once("pointerdown", restart);
      this.input.keyboard?.once("keydown-ENTER", restart);
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
