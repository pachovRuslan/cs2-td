import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameEvents, GameEvents } from "../events";
import { MAP_COLORS, ZONES } from "../data/map";
import { ALL_PATHS, PATHS, PATH_COLORS, PATH_NAMES } from "../data/paths";

/**
 * Menu Scene - РіР»Р°РІРЅРѕРµ РјРµРЅСЋ.
 * Р¤РѕРЅ-РїСЂРµРІСЊСЋ РєР°СЂС‚С‹ Dust2, Р·Р°РіРѕР»РѕРІРѕРє, РєРЅРѕРїРєРё РРіСЂР°С‚СЊ/РљР°Рє РёРіСЂР°С‚СЊ/Р РµРєРѕСЂРґС‹.
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

    this.add.text(GAME_WIDTH / 2, 200, "Р—Р°С‰РёС‚Рё CT-spawn РѕС‚ С‚РµСЂСЂРѕСЂРёСЃС‚РѕРІ", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#888888",
    }).setOrigin(0.5);

    this.playBtn = this.createButton(GAME_WIDTH / 2, 310, "РР“Р РђРўР¬", 0x4a8ad4, () => {
      this.unlockAudio();
      this.scene.start("GameScene");
      this.scene.launch("UIScene");
      gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null });
    });

    this.helpBtn = this.createButton(GAME_WIDTH / 2, 380, "РљРђРљ РР“Р РђРўР¬", 0x5a5a5a, () => {
      this.unlockAudio();
      this.showHelp();
    });

    this.recordsBtn = this.createButton(GAME_WIDTH / 2, 450, "Р Р•РљРћР Р”Р«", 0x5a5a5a, () => {
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
      let color = MAP_COLORS.groundLight;
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
    if (this.sound.context.state === "suspended") {
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
      "РљРђРљ РР“Р РђРўР¬",
      "",
      "1. Р’С‹Р±РµСЂРё Р±Р°С€РЅСЋ РІ Buy Menu (РІРЅРёР·Сѓ СЌРєСЂР°РЅР°).",
      "2. РљР»РёРєРЅРё РїРѕ РєР°СЂС‚Рµ, С‡С‚РѕР±С‹ РїРѕСЃС‚Р°РІРёС‚СЊ Р±Р°С€РЅСЋ.",
      "3. Р‘Р°С€РЅРё СЃС‚СЂРµР»СЏСЋС‚ РїРѕ С‚РµСЂСЂРѕСЂРёСЃС‚Р°Рј Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.",
      "4. Р—Р° РєР°Р¶РґС‹Р№ РєРёР»Р» РїРѕР»СѓС‡Р°РµС€СЊ РґРµРЅСЊРіРё $.",
      "5. РњРµР¶РґСѓ РІРѕР»РЅР°РјРё вЂ” СѓР»СѓС‡С€Р°Р№ Р±Р°С€РЅРё РёР»Рё СЃС‚Р°РІСЊ РЅРѕРІС‹Рµ.",
      "",
      "Р¦РµР»СЊ: РЅРµ РґР°С‚СЊ С‚РµСЂСЂРѕСЂРёСЃС‚Р°Рј РґРѕР№С‚Рё РґРѕ CT-spawn.",
      "",
      "РўРµСЂСЂРѕСЂРёСЃС‚С‹ РёРґСѓС‚ 3 РїСѓС‚СЏРјРё:",
      "  - Long A (РѕСЂР°РЅР¶РµРІС‹Р№)",
      "  - Tunnels -> B (РєСЂР°СЃРЅС‹Р№)",
      "  - Mid -> Catwalk -> A (СЃРёРЅРёР№)",
      "",
      "РџРѕСЃР»Рµ 15 РІРѕР»РЅС‹ РЅР°С‡РёРЅР°РµС‚СЃСЏ endless-СЂРµР¶РёРј.",
      "",
      "РљР»РёРє РІ Р»СЋР±РѕРј РјРµСЃС‚Рµ, С‡С‚РѕР±С‹ Р·Р°РєСЂС‹С‚СЊ.",
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
      "Р Р•РљРћР Р”Р«",
      "",
      `Р›СѓС‡С€РёР№ СЃС‡С‘С‚:     ${highScore}`,
      `Р’СЃРµРіРѕ РєРёР»Р»РѕРІ:    ${totalKills}`,
      `РњР°РєСЃ. РІРѕР»РЅР°:     ${maxWave}`,
      "",
      "(РџРѕРєР° СЂРµРєРѕСЂРґРѕРІ РЅРµС‚ вЂ” СЃС‹РіСЂР°Р№ РїРµСЂРІСѓСЋ РёРіСЂСѓ!)",
      "",
      "РљР»РёРє РІ Р»СЋР±РѕРј РјРµСЃС‚Рµ, С‡С‚РѕР±С‹ Р·Р°РєСЂС‹С‚СЊ.",
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