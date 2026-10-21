import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameEvents, GameEvents } from "../events";
import { MAP_IMAGE_KEY } from "../data/map";
import { ALL_PATHS, PATHS, PATH_COLORS } from "../data/paths";

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
    gameEvents.emit(GameEvents.SCENE_CHANGED, { scene: "menu" });
    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.drawMapPreview();

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setOrigin(0);

    const cy = GAME_HEIGHT / 2;

    this.add.text(GAME_WIDTH / 2, cy - 230, "CS2 DUST2", {
      fontFamily: "monospace",
      fontSize: "56px",
      color: "#f5e6c8",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, cy - 170, "TOWER DEFENSE", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#d4a04a",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, cy - 130, "Защити CT-базу от террористов", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#888888",
    }).setOrigin(0.5);

    this.playBtn = this.createButton(GAME_WIDTH / 2, cy - 30, "ИГРАТЬ", 0x4a8ad4, () => {
      this.unlockAudio();
      this.scene.start("GameScene");
      this.scene.launch("UIScene");
      gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null });
    });

    this.helpBtn = this.createButton(GAME_WIDTH / 2, cy + 40, "КАК ИГРАТЬ", 0x5a5a5a, () => {
      this.unlockAudio();
      this.showHelp();
    });

    this.recordsBtn = this.createButton(GAME_WIDTH / 2, cy + 110, "РЕКОРДЫ", 0x5a5a5a, () => {
      this.unlockAudio();
      this.showRecords();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "Phaser 4 · Next.js 16", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#444444",
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private drawMapPreview(): void {
    if (this.textures.exists(MAP_IMAGE_KEY)) {
      this.add.image(0, 0, MAP_IMAGE_KEY).setOrigin(0);
    }

    const g = this.add.graphics().setAlpha(0.6);
    for (const pathId of ALL_PATHS) {
      const path = PATHS[pathId];
      g.lineStyle(3, PATH_COLORS[pathId], 0.8);
      g.beginPath();
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
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
      "1. Выбери башню в Buy Menu справа (или клавиши 1–8).",
      "2. Кликни по свободному слоту на карте.",
      "3. Башни стреляют по террористам автоматически.",
      "4. За каждый килл получаешь деньги $.",
      "5. Между волнами — улучшай башни или ставь новые.",
      "",
      "Цель: не дать террористам дойти до CT-базы",
      "(вертолётная площадка).",
      "",
      "Террористы идут 3 путями:",
      "  - Long, справа (оранжевый)",
      "  - B, слева (красный)",
      "  - Mid, через центр (синий)",
      "",
      "Клик по башне: U — апгрейд, S — продать.",
      "P — пауза, F — скорость 2x, SPACE — волна раньше.",
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