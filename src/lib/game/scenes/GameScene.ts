import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import {
  MAP_COLORS,
  ZONES,
  WALLS,
  CRATES_A,
  CRATES_B,
  CRATES_MID,
  CRATES_LONG,
  CAR_B,
  SAND_DOTS_COUNT,
} from "../data/map";
import { ALL_PATHS, PATHS, PATH_COLORS, PATH_NAMES } from "../data/paths";
import { SCORE_PER_REWARD } from "../data/enemies";
import { gameEvents, GameEvents } from "../events";
import type { GameSpeed } from "../types";
import { EconomySystem } from "../systems/EconomySystem";
import { EnemySystem } from "../systems/EnemySystem";
import { WaveSystem } from "../systems/WaveSystem";

/**
 * Game Scene - основная сцена геймплея.
 * Рендер карты Dust2 + игровой цикл (экономика, волны, враги).
 */
export class GameScene extends Phaser.Scene {
  private economy!: EconomySystem;
  private enemies!: EnemySystem;
  private waves!: WaveSystem;

  private paused = false;
  private speed: GameSpeed = 1;
  /** Игровое время в мс (не идёт на паузе, ускоряется на 2x). */
  private gameTime = 0;
  private ended = false;

  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    console.log("[GameScene] Creating scene...");

    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.drawGround();
    this.drawZones();
    this.drawPaths();
    this.drawWalls();
    this.drawCratesAndCar();
    this.drawLabels();

    this.initSystems();
    this.initControls();
    this.createDebugHud();

    this.cameras.main.fadeIn(300, 0, 0, 0);

    console.log("[GameScene] Dust2 map rendered.");
  }

  private drawGround(): void {
    const g = this.add.graphics();

    g.fillGradientStyle(
      MAP_COLORS.groundLight,
      MAP_COLORS.groundLight,
      MAP_COLORS.ground,
      MAP_COLORS.ground,
      1
    );
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    g.fillStyle(0x6a5a3a, 0.4);
    for (let i = 0; i < SAND_DOTS_COUNT; i++) {
      const x = (i * 73 + 17) % GAME_WIDTH;
      const y = (i * 137 + 23) % GAME_HEIGHT;
      g.fillRect(x, y, 2, 2);
    }
  }

  private drawZones(): void {
    const g = this.add.graphics();

    g.fillStyle(MAP_COLORS.ctSpawn, 0.7);
    g.fillRect(ZONES.ctSpawn.x, ZONES.ctSpawn.y, ZONES.ctSpawn.w, ZONES.ctSpawn.h);
    g.lineStyle(2, MAP_COLORS.ctSpawn, 1);
    g.strokeRect(ZONES.ctSpawn.x, ZONES.ctSpawn.y, ZONES.ctSpawn.w, ZONES.ctSpawn.h);

    g.fillStyle(MAP_COLORS.tSpawn, 0.7);
    g.fillRect(ZONES.tSpawn.x, ZONES.tSpawn.y, ZONES.tSpawn.w, ZONES.tSpawn.h);
    g.lineStyle(2, MAP_COLORS.tSpawn, 1);
    g.strokeRect(ZONES.tSpawn.x, ZONES.tSpawn.y, ZONES.tSpawn.w, ZONES.tSpawn.h);

    g.fillStyle(MAP_COLORS.siteA, 0.45);
    g.fillRect(ZONES.siteA.x, ZONES.siteA.y, ZONES.siteA.w, ZONES.siteA.h);
    g.lineStyle(2, MAP_COLORS.siteA, 0.8);
    g.strokeRect(ZONES.siteA.x, ZONES.siteA.y, ZONES.siteA.w, ZONES.siteA.h);

    g.fillStyle(MAP_COLORS.siteB, 0.45);
    g.fillRect(ZONES.siteB.x, ZONES.siteB.y, ZONES.siteB.w, ZONES.siteB.h);
    g.lineStyle(2, MAP_COLORS.siteB, 0.8);
    g.strokeRect(ZONES.siteB.x, ZONES.siteB.y, ZONES.siteB.w, ZONES.siteB.h);

    g.fillStyle(MAP_COLORS.mid, 0.5);
    g.fillRect(ZONES.mid.x, ZONES.mid.y, ZONES.mid.w, ZONES.mid.h);
    g.fillStyle(MAP_COLORS.catwalk, 0.5);
    g.fillRect(ZONES.catwalk.x, ZONES.catwalk.y, ZONES.catwalk.w, ZONES.catwalk.h);

    g.fillStyle(MAP_COLORS.mid, 0.4);
    g.fillRect(ZONES.long.x, ZONES.long.y, ZONES.long.w, ZONES.long.h);
    g.fillRect(ZONES.tunnels.x, ZONES.tunnels.y, ZONES.tunnels.w, ZONES.tunnels.h);
  }

  private drawPaths(): void {
    for (const pathId of ALL_PATHS) {
      const path = PATHS[pathId];
      const color = PATH_COLORS[pathId];

      const g = this.add.graphics();

      g.lineStyle(24, color, 0.2);
      g.beginPath();
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
      g.strokePath();

      g.lineStyle(2, color, 0.9);
      g.beginPath();
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
      g.strokePath();

      for (let i = 1; i < path.length - 1; i += 2) {
        const midX = (path[i].x + path[i + 1].x) / 2;
        const midY = (path[i].y + path[i + 1].y) / 2;
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / len, ny = dy / len;

        g.fillStyle(color, 0.9);
        g.beginPath();
        g.moveTo(midX + nx * 6, midY + ny * 6);
        g.lineTo(midX - nx * 4 + ny * 4, midY - ny * 4 - nx * 4);
        g.lineTo(midX - nx * 4 - ny * 4, midY - ny * 4 + nx * 4);
        g.closePath();
        g.fillPath();
      }

      const colorHex = "#" + color.toString(16).padStart(6, "0");
      this.add.text(path[1].x + 15, path[1].y - 10, PATH_NAMES[pathId], {
        fontFamily: "monospace",
        fontSize: "10px",
        color: colorHex,
        fontStyle: "bold",
      }).setOrigin(0, 0.5);
    }
  }

  private drawWalls(): void {
    const g = this.add.graphics();
    g.fillStyle(MAP_COLORS.wall, 1);
    for (const w of WALLS) {
      g.fillRect(w.x, w.y, w.w, w.h);
    }
    g.fillStyle(MAP_COLORS.wallTop, 0.5);
    for (const w of WALLS) {
      g.fillRect(w.x, w.y, w.w, 2);
    }
  }

  private drawCratesAndCar(): void {
    const g = this.add.graphics();

    for (const c of CRATES_A) this.drawCrate(g, c.x, c.y, c.size);
    for (const c of CRATES_B) this.drawCrate(g, c.x, c.y, c.size);
    for (const c of CRATES_MID) this.drawCrate(g, c.x, c.y, c.size);
    for (const c of CRATES_LONG) this.drawCrate(g, c.x, c.y, c.size);

    g.fillStyle(MAP_COLORS.car, 1);
    g.fillRect(CAR_B.x, CAR_B.y, CAR_B.w, CAR_B.h);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(CAR_B.x + 4, CAR_B.y + 4, CAR_B.w - 8, 12);
    g.lineStyle(2, 0x1a1a1a, 1);
    g.strokeRect(CAR_B.x, CAR_B.y, CAR_B.w, CAR_B.h);
  }

  private drawCrate(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number
  ): void {
    g.fillStyle(MAP_COLORS.crate, 1);
    g.fillRect(x - size / 2, y - size / 2, size, size);
    g.lineStyle(2, MAP_COLORS.crateTop, 1);
    g.strokeRect(x - size / 2, y - size / 2, size, size);
    g.beginPath();
    g.moveTo(x - size / 2, y - size / 2);
    g.lineTo(x + size / 2, y + size / 2);
    g.moveTo(x + size / 2, y - size / 2);
    g.lineTo(x - size / 2, y + size / 2);
    g.strokePath();
  }

  private drawLabels(): void {
    this.add.text(
      ZONES.siteA.x + ZONES.siteA.w / 2,
      ZONES.siteA.y + ZONES.siteA.h / 2,
      "A",
      {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.siteB.x + ZONES.siteB.w / 2,
      ZONES.siteB.y + ZONES.siteB.h / 2,
      "B",
      {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.tSpawn.x + ZONES.tSpawn.w / 2,
      ZONES.tSpawn.y + ZONES.tSpawn.h / 2,
      "T-SPAWN",
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.ctSpawn.x + ZONES.ctSpawn.w / 2,
      ZONES.ctSpawn.y + ZONES.ctSpawn.h / 2,
      "CT-SPAWN",
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.mid.x + ZONES.mid.w / 2,
      ZONES.mid.y + ZONES.mid.h / 2,
      "MID",
      {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#aaaaaa",
      }
    ).setOrigin(0.5);
  }

  // ==========================================================================
  // ИГРОВОЙ ЦИКЛ
  // ==========================================================================

  private initSystems(): void {
    this.paused = false;
    this.speed = 1;
    this.gameTime = 0;
    this.ended = false;

    this.economy = new EconomySystem();
    this.enemies = new EnemySystem(this);
    this.waves = new WaveSystem(this.enemies, this.economy);

    this.enemies.onKilled = (e) =>
      this.economy.registerKill(e.reward, e.reward * SCORE_PER_REWARD);
    this.enemies.onReachedBase = (e) => this.economy.damageBase(e.damage);
    this.economy.onBaseDestroyed = () => this.endGame();

    this.economy.emitAll();
  }

  private initControls(): void {
    const onPause = ({ paused }: { paused: boolean }) => (this.paused = paused);
    const onSpeed = ({ speed }: { speed: GameSpeed }) => (this.speed = speed);
    gameEvents.on(GameEvents.PAUSE_TOGGLED, onPause);
    gameEvents.on(GameEvents.SPEED_CHANGED, onSpeed);

    const kb = this.input.keyboard;
    kb?.on("keydown-P", () => {
      this.paused = !this.paused;
      gameEvents.emit(GameEvents.PAUSE_TOGGLED, { paused: this.paused });
    });
    kb?.on("keydown-F", () => {
      this.speed = this.speed === 1 ? 2 : 1;
      gameEvents.emit(GameEvents.SPEED_CHANGED, { speed: this.speed });
    });
    kb?.on("keydown-SPACE", () => this.waves.callEarly());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off(GameEvents.PAUSE_TOGGLED, onPause);
      gameEvents.off(GameEvents.SPEED_CHANGED, onSpeed);
      this.enemies.destroy();
    });
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    this.updateDebugHud();
    if (this.paused) return;

    // ограничиваем шаг, чтобы при сворачивании вкладки враги не «телепортировались»
    const dtMs = Math.min(delta, 50) * this.speed;
    this.gameTime += dtMs;
    const dt = dtMs / 1000;

    this.waves.update(dt);
    this.enemies.update(dt, this.gameTime);
  }

  private endGame(): void {
    if (this.ended) return;
    this.ended = true;
    const payload = { score: this.economy.score, wave: this.waves.wave };
    gameEvents.emit(GameEvents.GAME_OVER, payload);
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop("UIScene");
      this.scene.start("GameOverScene", payload);
    });
  }

  // ==========================================================================
  // ВРЕМЕННЫЙ HUD (до React-HUD)
  // ==========================================================================

  private createDebugHud(): void {
    this.debugText = this.add
      .text(28, GAME_HEIGHT - 28, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#f5e6c8",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0, 1)
      .setDepth(100);
  }

  private updateDebugHud(): void {
    const w = this.waves;
    const waveInfo =
      w.phase === "countdown"
        ? `Волна ${w.nextWave} через ${Math.ceil(w.countdown)}с [SPACE — раньше]`
        : `Волна ${w.wave}${w.isEndless ? " (endless)" : ""} · врагов: ${
            this.enemies.aliveCount + w.remainingToSpawn
          }`;
    const state = this.paused ? " · ПАУЗА" : this.speed === 2 ? " · 2x" : "";

    this.debugText.setText(
      `$${this.economy.money}  HP ${this.economy.baseHp}/${this.economy.baseHpMax}  ` +
        `Счёт ${this.economy.score}  Киллы ${this.economy.kills}\n` +
        `${waveInfo}${state}   [P] пауза  [F] скорость`
    );
  }
}
