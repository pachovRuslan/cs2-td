import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameEvents, GameEvents } from "../events";
import { MAP_COLORS, ZONES } from "../data/map";
import { ALL_PATHS, PATHS, PATH_COLORS, PATH_NAMES } from "../data/paths";

/**
 * Menu Scene - главное меню.
 * Фон-превью карты Dust2, заголовок, кнопки Играть/Как играть/Рекорды.
 */
export class MenuScene extends Phaser.Scene {
  private playBtn!: Phaser.GameObjects.Container;
  private helpBtn!: Phaser.GameObjects.Container;
  private recordsBtn!: Phaser.GameObjects.Container;
  private audioUnlocked = false;

  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.drawMapPreview();

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setOrigin(0);

    this.add.text(GAME_WIDTH / 2, 110, "CS2 DUST2", {
      fontFamily: "monospace",
      fontSize: "56px",
      color: "#f5e6c8",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 165, "TOWER DEFENSE", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#d4a04a",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, "Защити CT-spawn от террористов", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#888888",
    }).setOrigin(0.5);

    this.playBtn = this.createButton(GAME_WIDTH / 2, 310, "ИГРАТЬ", 0x4a8ad4, () => {
      this.unlockAudio();
      this.scene.start("GameScene");
      this.scene.launch("UIScene");
      gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null });
    });

    this.helpBtn = this.createButton(GAME_WIDTH / 2, 380, "КАК ИГРАТЬ", 0x5a5a5a, () => {
      this.unlockAudio();
      this.showHelp();
    });

    this.recordsBtn = this.createButton(GAME_WIDTH / 2, 450, "РЕКОРДЫ", 0x5a5a5a, () => {
      this.unlockAudio();
      this.showRecords();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "Block 3 - Phaser 4 - Next.js 16", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#444444",
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private drawMapPreview(): void {
    const g = this.add.graphics();
    g.setAlpha(0.35);

    for (const [key, zone] of Object.entries(ZONES)) {
      let color: number = MAP_COLORS.groundLight;
      if (key === "tSpawn") color = MAP_COLORS.tSpawn;
      else if (key === "ctSpawn") color = MAP_COLORS.ctSpawn;
      else if (key === "siteA") color = MAP_COLORS.siteA;
      else if (key === "siteB") color = MAP_COLORS.siteB;
      else if (key === "mid" || key === "catwalk") color = MAP_COLORS.catwalk;
      else if (key === "long" || key === "tunnels") color = MAP_COLORS.mid;
      g.fillStyle(color, 0.6);
      g.fillRect(zone.x, zone.y, zone.w, zone.h);
    }

    for (const pathId of ALL_PATHS) {
      const path = PATHS[pathId];
      const color = PATH_COLORS[pathId];
      g.lineStyle(3, color, 0.7);
      g.beginPath();
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        g.lineTo(path[i].x, path[i].y);
      }
      g.strokePath();
    }
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const width = 240;
    const height = 50;

    const bg = this.add.rectangle(0, 0, width, height, color, 0.85)
      .setStrokeStyle(2, 0xffffff, 0.3);

    const text = this.add.text(0, 0, label, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      bg.setScale(1.05);
      bg.setFillStyle(color, 1);
      bg.setStrokeStyle(3, 0xffffff, 0.6);
    });

    container.on("pointerout", () => {
      bg.setScale(1);
      bg.setFillStyle(color, 0.85);
      bg.setStrokeStyle(2, 0xffffff, 0.3);
    });

    container.on("pointerdown", onClick);

    return container;
  }

  private unlockAudio(): void {
    if (this.audioUnlocked) return;
    if (
      this.sound instanceof Phaser.Sound.WebAudioSoundManager &&
      this.sound.context.state === "suspended"
    ) {
      this.sound.context.resume().then(() => {
        console.log("[MenuScene] AudioContext unlocked.");
      });
    }
    this.audioUnlocked = true;
  }

  private showHelp(): void {
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9)
      .setOrigin(0)
      .setInteractive();

    const lines = [
      "КАК ИГРАТЬ",
      "",
      "1. Выбери башню в Buy Menu (внизу экрана).",
      "2. Кликни по карте, чтобы поставить башню.",
      "3. Башни стреляют по террористам автоматически.",
      "4. За каждый килл получаешь деньги $.",
      "5. Между волнами — улучшай башни или ставь новые.",
      "",
      "Цель: не дать террористам дойти до CT-spawn.",
      "",
      "Террористы идут 3 путями:",
      "  - Long A (оранжевый)",
      "  - Tunnels -> B (красный)",
      "  - Mid -> Catwalk -> A (синий)",
      "",
      "После 15 волны начинается endless-режим.",
      "",
      "Клик в любом месте, чтобы закрыть.",
    ];

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, lines, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#f5e6c8",
      align: "center",
      lineSpacing: 8,
    }).setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      txt.destroy();
    });
  }

  private showRecords(): void {
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9)
      .setOrigin(0)
      .setInteractive();

    const highScore = Number(localStorage.getItem("cs2-td:highscore") || "0");
    const totalKills = Number(localStorage.getItem("cs2-td:total-kills") || "0");
    const maxWave = Number(localStorage.getItem("cs2-td:max-wave") || "0");

    const lines = [
      "РЕКОРДЫ",
      "",
      `Лучший счёт:     ${highScore}`,
      `Всего киллов:    ${totalKills}`,
      `Макс. волна:     ${maxWave}`,
      "",
      "(Пока рекордов нет — сыграй первую игру!)",
      "",
      "Клик в любом месте, чтобы закрыть.",
    ];

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, lines, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#f5e6c8",
      align: "center",
      lineSpacing: 10,
    }).setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      txt.destroy();
    });
  }
}