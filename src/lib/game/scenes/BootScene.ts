import Phaser from "phaser";
import { ALL_SPRITES } from "../data/sprites";
import { ALL_SOUNDS } from "../data/sounds";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * Boot Scene - загрузка всех ассетов.
 * Если файлы не найдены - НЕ падаем, продолжаем с цветными заглушками.
 */
export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;
  private errorCount = 0;
  private loadedCount = 0;
  private totalCount = 0;

  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.add.text(cx, cy - 60, "CS2 DUST2 - TOWER DEFENSE", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#f5e6c8",
    }).setOrigin(0.5);

    this.loadingText = this.add.text(cx, cy, "Loading...", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#888",
    }).setOrigin(0.5);

    const barWidth = 400;
    const barHeight = 12;
    this.add.rectangle(cx, cy + 40, barWidth + 4, barHeight + 4, 0x333333).setOrigin(0.5);
    this.loadingBar = this.add.rectangle(
      cx - barWidth / 2,
      cy + 40,
      0,
      barHeight,
      0x4a8ad4
    ).setOrigin(0, 0.5);

    for (const { key, path } of ALL_SPRITES) {
      this.load.image(key, path);
    }

    for (const { key, path } of ALL_SOUNDS) {
      this.load.audio(key, path);
    }

    this.totalCount = ALL_SPRITES.length + ALL_SOUNDS.length;

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      this.errorCount++;
      console.warn(`[BootScene] Missing: ${file.key} (${file.url})`);
    });

    this.load.on("load", () => {
      this.loadedCount++;
      const progress = this.loadedCount / this.totalCount;
      this.loadingBar.width = 400 * progress;
      this.loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    });
  }

  create(): void {
    this.loadingBar.width = 400;
    this.loadingText.setText(
      `Loaded ${this.loadedCount}/${this.totalCount}` +
      (this.errorCount > 0 ? ` (errors: ${this.errorCount})` : "")
    );

    console.log(
      `[BootScene] Loaded ${this.loadedCount}/${this.totalCount}. Errors: ${this.errorCount}.`
    );

    if (this.errorCount > 0) {
      console.warn(
        "[BootScene] Some assets missing. Game will use colored placeholders."
      );
    }

    this.time.delayedCall(800, () => {
      this.scene.start("MenuScene");
    });
  }
}