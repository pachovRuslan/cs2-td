import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { CT_BASE, MAP_IMAGE_KEY, T_SPAWN } from "../data/map";
import { ALL_PATHS, PATHS, PATH_COLORS } from "../data/paths";
import { SCORE_PER_REWARD } from "../data/enemies";
import {
  gameEvents,
  GameEvents,
  type TowerInfoPayload,
  type WaveStatePayload,
} from "../events";
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
  private slotGraphics!: Phaser.GameObjects.Graphics;
  private pathHints!: Phaser.GameObjects.Graphics;
  private dashOffset = 0;

  private paused = false;
  private speed: GameSpeed = 1;
  /** Игровое время в мс (не идёт на паузе, ускоряется на 2x). */
  private gameTime = 0;
  private ended = false;

  /** Последние отправленные в React снимки — чтобы не слать одно и то же каждый кадр. */
  private lastWaveState = "";
  private lastTowerInfo = "";

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.drawMap();

    gameEvents.emit(GameEvents.SCENE_CHANGED, { scene: "game" });
    this.initSystems();
    this.initControls();
    this.drawSlots();

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ==========================================================================
  // КАРТА
  // ==========================================================================

  private drawMap(): void {
    if (this.textures.exists(MAP_IMAGE_KEY)) {
      this.add.image(0, 0, MAP_IMAGE_KEY).setOrigin(0).setDepth(0);
    } else {
      // фон не загрузился — хотя бы видно пути
      this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x2a2622).setOrigin(0);
    }

    // подсказка путей — бегущий пунктир, виден во время отсчёта до волны
    this.pathHints = this.add.graphics().setDepth(5);

    // маркеры входа T и CT-базы
    const base = this.add.circle(CT_BASE.x, CT_BASE.y, 30, 0x3a6cc4, 0.18)
      .setStrokeStyle(2, 0x7fb2ff, 0.8)
      .setDepth(4);
    this.tweens.add({
      targets: base,
      scale: 1.15,
      alpha: 0.6,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
    this.add
      .text(T_SPAWN.x, T_SPAWN.y - 14, "T", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffb08a",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(4);
  }

  private drawPathHints(): void {
    const g = this.pathHints;
    g.clear();
    if (this.waves.phase !== "countdown") return;

    this.dashOffset = (this.dashOffset + 0.6) % 24;
    for (const id of ALL_PATHS) {
      const path = PATHS[id];
      g.fillStyle(PATH_COLORS[id], 0.85);
      let carry = this.dashOffset;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        for (let d = carry; d < len; d += 24) {
          const t = d / len;
          g.fillCircle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2.5);
        }
        carry = (carry - len) % 24;
        if (carry < 0) carry += 24;
      }
    }
  }

  /** Слоты под башни: пунктирные площадки, подсвечиваются в режиме постройки. */
  private drawSlots(): void {
    if (!this.slotGraphics) this.slotGraphics = this.add.graphics().setDepth(6);
    const g = this.slotGraphics;
    g.clear();

    const towers = this.towers.getAll();
    const building = this.buildType !== null;
    const ptr = this.input.activePointer;
    const hovered = this.placement.slotAt(ptr.worldX, ptr.worldY);

    for (const slot of this.placement.slots) {
      if (this.placement.isOccupied(slot, towers)) continue;
      const isHover = hovered?.index === slot.index;
      const alpha = building ? 0.95 : isHover ? 0.8 : 0.5;

      g.fillStyle(0x3a2410, building ? 0.55 : 0.4);
      g.fillEllipse(slot.x, slot.y + 2, 40, 22);
      g.lineStyle(2, isHover ? 0xffe08a : 0xf2dcaa, alpha);
      g.strokeEllipse(slot.x, slot.y, 36, 18);
      g.lineStyle(2, 0xf2dcaa, alpha * 0.8);
      g.lineBetween(slot.x - 5, slot.y, slot.x + 5, slot.y);
      g.lineBetween(slot.x, slot.y - 4, slot.x, slot.y + 4);
    }
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
    this.lastWaveState = "";
    this.lastTowerInfo = "";

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
    gameEvents.emit(GameEvents.PAUSE_TOGGLED, { paused: false });
    gameEvents.emit(GameEvents.SPEED_CHANGED, { speed: 1 });
    gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null });
    this.syncUi();
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
    const onCallWave = () => this.waves.callEarly();
    const onUpgrade = () => this.upgradeSelected();
    const onSell = () => this.sellSelected();
    const onDeselect = () => this.selectTower(null);
    gameEvents.on(GameEvents.TOWER_DESELECTED, onDeselect);
    gameEvents.on(GameEvents.CALL_WAVE, onCallWave);
    gameEvents.on(GameEvents.UPGRADE_TOWER, onUpgrade);
    gameEvents.on(GameEvents.SELL_TOWER, onSell);

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
      gameEvents.off(GameEvents.CALL_WAVE, onCallWave);
      gameEvents.off(GameEvents.UPGRADE_TOWER, onUpgrade);
      gameEvents.off(GameEvents.SELL_TOWER, onSell);
      gameEvents.off(GameEvents.TOWER_DESELECTED, onDeselect);
      gameEvents.emit(GameEvents.TOWER_INFO, null);
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
    if (!tower && this.placement.slotAt(x, y)) {
      this.particles.floatingText(x, y - 16, "Сначала выбери башню в Buy Menu", "#f5e6c8");
    }
    this.selectTower(tower ? tower.id : null);
  }

  private tryBuild(type: TowerKind, x: number, y: number): void {
    const cost = TOWERS[type].baseCost;
    const { slot, error } = this.placement.check(
      x,
      y,
      this.towers.getAll(),
      this.economy.canAfford(cost)
    );
    if (error || !slot) {
      this.particles.floatingText(x, y - 16, PLACEMENT_ERROR_TEXT[error ?? "no_slot"], "#ff6a5a");
      return;
    }
    this.economy.spend(cost);
    this.towers.build(type, slot.x, slot.y);
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
      g.strokeCircle(selected.x, selected.y, 28);
    }

    this.drawSlots();
    if (!this.buildType) return;
    const ptr = this.input.activePointer;
    const cfg = TOWERS[this.buildType];
    const { slot, error } = this.placement.check(
      ptr.worldX,
      ptr.worldY,
      this.towers.getAll(),
      this.economy.canAfford(cfg.baseCost)
    );
    if (!slot) return; // призрак показываем только над слотом
    const { x, y } = slot;
    const color = error ? 0xd44a4a : 0x4ad45a;

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
    this.syncUi();
    if (this.paused) return;
    this.drawPathHints();

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
    this.saveRecords();
    gameEvents.emit(GameEvents.GAME_OVER, payload);
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop("UIScene");
      this.scene.start("GameOverScene", payload);
    });
  }

  /** Рекорды для экрана «Рекорды» в меню. */
  private saveRecords(): void {
    try {
      const num = (k: string) => Number(localStorage.getItem(k) || "0");
      localStorage.setItem(
        "cs2-td:highscore",
        String(Math.max(num("cs2-td:highscore"), this.economy.score))
      );
      localStorage.setItem(
        "cs2-td:total-kills",
        String(num("cs2-td:total-kills") + this.economy.kills)
      );
      localStorage.setItem(
        "cs2-td:max-wave",
        String(Math.max(num("cs2-td:max-wave"), this.waves.wave))
      );
    } catch {
      // хранилище недоступно (приватный режим и т.п.) — рекорды просто не сохраняются
    }
  }

  // ==========================================================================
  // СИНХРОНИЗАЦИЯ С REACT-UI
  // ==========================================================================

  /** Шлёт в React снимки волны и выбранной башни, только если они изменились. */
  private syncUi(): void {
    const w = this.waves;
    const wave: WaveStatePayload = {
      phase: w.phase,
      wave: w.wave,
      nextWave: w.nextWave,
      countdown: w.phase === "countdown" ? Math.max(0, Math.ceil(w.countdown)) : 0,
      remaining: this.enemies.aliveCount + w.remainingToSpawn,
      isEndless: w.isEndless,
    };
    const waveKey = JSON.stringify(wave);
    if (waveKey !== this.lastWaveState) {
      this.lastWaveState = waveKey;
      gameEvents.emit(GameEvents.WAVE_STATE, wave);
    }

    const t = this.selectedTowerId ? this.towers.getById(this.selectedTowerId) : undefined;
    const info: TowerInfoPayload | null = t
      ? {
          id: t.id,
          type: t.type,
          level: t.level,
          kills: t.totalKills,
          damageDealt: Math.round(t.totalDamage),
          upgradeCost: this.towers.getUpgradeCost(t),
          sellValue: getTowerSellValue(t.type, t.level),
        }
      : null;
    const infoKey = JSON.stringify(info);
    if (infoKey !== this.lastTowerInfo) {
      this.lastTowerInfo = infoKey;
      gameEvents.emit(GameEvents.TOWER_INFO, info);
    }
  }
}
