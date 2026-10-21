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
import type { GameSpeed, TowerKind } from "../types";
import { TOWERS, TOWER_ORDER, getTowerLevel, getTowerSellValue } from "../data/towers";
import { EconomySystem } from "../systems/EconomySystem";
import { EnemySystem } from "../systems/EnemySystem";
import { WaveSystem } from "../systems/WaveSystem";
import { TowerSystem } from "../systems/TowerSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { ParticleSystem } from "../systems/ParticleSystem";
import {
  PlacementSystem,
  PLACEMENT_ERROR_TEXT,
  TOWER_RADIUS,
} from "../systems/PlacementSystem";

const KEY_NAMES = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT"];

/**
 * Game Scene - основная сцена геймплея.
 * Рендер карты Dust2 + игровой цикл (экономика, волны, враги, башни).
 */
export class GameScene extends Phaser.Scene {
  private economy!: EconomySystem;
  private enemies!: EnemySystem;
  private waves!: WaveSystem;
  private towers!: TowerSystem;
  private projectiles!: ProjectileSystem;
  private particles!: ParticleSystem;
  private placement = new PlacementSystem();

  /** Какую башню ставим (выбрана в Buy Menu / клавишами 1–8). */
  private buildType: TowerKind | null = null;
  /** Какая построенная башня выбрана (для апгрейда/продажи). */
  private selectedTowerId: string | null = null;
  private overlay!: Phaser.GameObjects.Graphics;

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
    this.buildType = null;
    this.selectedTowerId = null;
    this.tweens.timeScale = 1;

    this.economy = new EconomySystem();
    this.enemies = new EnemySystem(this);
    this.waves = new WaveSystem(this.enemies, this.economy);
    this.particles = new ParticleSystem(this);
    this.projectiles = new ProjectileSystem(this, this.enemies, this.particles);
    this.towers = new TowerSystem(this, this.enemies, this.projectiles, this.particles);
    this.overlay = this.add.graphics().setDepth(50);

    this.projectiles.onDamageDealt = (owner, dmg, kills) =>
      this.towers.recordDamage(owner, dmg, kills);
    this.enemies.onKilled = (e) => {
      this.economy.registerKill(e.reward, e.reward * SCORE_PER_REWARD);
      this.particles.floatingText(e.x, e.y - 10, `+$${e.reward}`);
    };
    this.enemies.onReachedBase = (e) => this.economy.damageBase(e.damage);
    this.economy.onBaseDestroyed = () => this.endGame();

    this.economy.emitAll();
  }

  private initControls(): void {
    // события от React (BuyMenu/Controls) — сцена на них подписывается
    const onPause = ({ paused }: { paused: boolean }) => this.setPaused(paused);
    const onSpeed = ({ speed }: { speed: GameSpeed }) => this.setSpeed(speed);
    const onSelect = ({ towerType }: { towerType: string | null }) =>
      this.setBuildType((towerType as TowerKind | null) ?? null);
    gameEvents.on(GameEvents.PAUSE_TOGGLED, onPause);
    gameEvents.on(GameEvents.SPEED_CHANGED, onSpeed);
    gameEvents.on(GameEvents.TOWER_SELECTED, onSelect);

    const kb = this.input.keyboard;
    kb?.on("keydown-P", () =>
      gameEvents.emit(GameEvents.PAUSE_TOGGLED, { paused: !this.paused })
    );
    kb?.on("keydown-F", () =>
      gameEvents.emit(GameEvents.SPEED_CHANGED, { speed: this.speed === 1 ? 2 : 1 })
    );
    kb?.on("keydown-SPACE", () => this.waves.callEarly());
    kb?.on("keydown-ESC", () => this.cancelAll());
    kb?.on("keydown-U", () => this.upgradeSelected());
    kb?.on("keydown-S", () => this.sellSelected());
    KEY_NAMES.forEach((key, i) =>
      kb?.on(`keydown-${key}`, () => {
        const type = TOWER_ORDER[i];
        gameEvents.emit(GameEvents.TOWER_SELECTED, {
          towerType: this.buildType === type ? null : type,
        });
      })
    );

    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", () => this.drawOverlay());
    this.input.on("pointerdown", (ptr: Phaser.Input.Pointer) => this.onPointerDown(ptr));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off(GameEvents.PAUSE_TOGGLED, onPause);
      gameEvents.off(GameEvents.SPEED_CHANGED, onSpeed);
      gameEvents.off(GameEvents.TOWER_SELECTED, onSelect);
      this.input.off("pointermove");
      this.input.off("pointerdown");
      this.towers.clear();
      this.projectiles.destroy();
      this.enemies.destroy();
    });
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }

  private setSpeed(speed: GameSpeed): void {
    this.speed = speed;
    this.tweens.timeScale = speed;
  }

  private setBuildType(type: TowerKind | null): void {
    this.buildType = type;
    if (type) this.selectedTowerId = null;
    this.drawOverlay();
  }

  private cancelAll(): void {
    if (this.buildType) {
      gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null });
    }
    this.selectTower(null);
  }

  private selectTower(id: string | null): void {
    this.selectedTowerId = id;
    if (id) gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null });
    this.drawOverlay();
  }

  private onPointerDown(ptr: Phaser.Input.Pointer): void {
    if (this.ended) return;
    if (ptr.rightButtonDown()) {
      this.cancelAll();
      return;
    }

    const { worldX: x, worldY: y } = ptr;

    if (this.buildType) {
      this.tryBuild(this.buildType, x, y);
      return;
    }

    const tower = this.towers.getAt(x, y);
    this.selectTower(tower ? tower.id : null);
  }

  private tryBuild(type: TowerKind, x: number, y: number): void {
    const cost = TOWERS[type].baseCost;
    const err = this.placement.check(
      x,
      y,
      this.towers.getAll(),
      this.economy.canAfford(cost)
    );
    if (err) {
      this.particles.floatingText(x, y - 16, PLACEMENT_ERROR_TEXT[err], "#ff6a5a");
      return;
    }
    this.economy.spend(cost);
    this.towers.build(type, x, y);
    this.drawOverlay();
  }

  private upgradeSelected(): void {
    const t = this.selectedTowerId && this.towers.getById(this.selectedTowerId);
    if (!t) return;
    const cost = this.towers.getUpgradeCost(t);
    if (cost === null) return;
    if (!this.economy.spend(cost)) {
      this.particles.floatingText(t.x, t.y - 18, "Недостаточно денег", "#ff6a5a");
      return;
    }
    this.towers.upgrade(t.id);
    this.drawOverlay();
  }

  private sellSelected(): void {
    const id = this.selectedTowerId;
    if (!id) return;
    const t = this.towers.getById(id);
    const refund = this.towers.sell(id);
    this.economy.earn(refund);
    if (t) this.particles.floatingText(t.x, t.y - 10, `+$${refund}`);
    this.selectTower(null);
  }

  /** Призрак башни под курсором и радиус выбранной башни. */
  private drawOverlay(): void {
    const g = this.overlay;
    g.clear();

    const selected = this.selectedTowerId && this.towers.getById(this.selectedTowerId);
    if (selected) {
      const range = getTowerLevel(selected.type, selected.level).range;
      g.fillStyle(0xffffff, 0.08);
      g.fillCircle(selected.x, selected.y, range);
      g.lineStyle(1.5, 0xffffff, 0.6);
      g.strokeCircle(selected.x, selected.y, range);
      g.lineStyle(2, 0xffd34a, 1);
      g.strokeCircle(selected.x, selected.y, TOWER_RADIUS + 3);
    }

    if (!this.buildType) return;
    const ptr = this.input.activePointer;
    const { worldX: x, worldY: y } = ptr;
    const cfg = TOWERS[this.buildType];
    const ok =
      this.placement.check(
        x,
        y,
        this.towers.getAll(),
        this.economy.canAfford(cfg.baseCost)
      ) === null;
    const color = ok ? 0x4ad45a : 0xd44a4a;

    g.fillStyle(color, 0.1);
    g.fillCircle(x, y, cfg.levels[0].range);
    g.lineStyle(1.5, color, 0.7);
    g.strokeCircle(x, y, cfg.levels[0].range);
    g.fillStyle(cfg.color, 0.6);
    g.fillCircle(x, y, TOWER_RADIUS);
    g.lineStyle(2, color, 1);
    g.strokeCircle(x, y, TOWER_RADIUS);
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
    this.towers.update(this.gameTime);
    this.projectiles.update(dt, this.gameTime);
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

    let action = TOWER_ORDER.map(
      (k, i) => `${i + 1}:${TOWERS[k].icon}$${TOWERS[k].baseCost}`
    ).join(" ");
    if (this.buildType) {
      const c = TOWERS[this.buildType];
      action = `Ставим ${c.name} ($${c.baseCost}) — ЛКМ поставить, ПКМ/ESC отмена`;
    } else if (this.selectedTowerId) {
      const t = this.towers.getById(this.selectedTowerId);
      if (t) {
        const up = this.towers.getUpgradeCost(t);
        action =
          `${TOWERS[t.type].name} lvl ${t.level} · киллы ${t.totalKills} · ` +
          `[U] ${up === null ? "MAX" : `апгрейд $${up}`}  ` +
          `[S] продать $${getTowerSellValue(t.type, t.level)}`;
      }
    }

    this.debugText.setText(
      `$${this.economy.money}  HP ${this.economy.baseHp}/${this.economy.baseHpMax}  ` +
        `Счёт ${this.economy.score}  Киллы ${this.economy.kills}\n` +
        `${waveInfo}${state}   [P] пауза  [F] скорость\n` +
        action
    );
  }
}
