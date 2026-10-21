import Phaser from "phaser";
import type { EnemyKind, EnemyRuntime, PathId, WaveEnemyGroup } from "../types";
import { ENEMIES } from "../data/enemies";
import { pathLength, pointAtProgress } from "../data/paths";
import { SpatialGrid } from "../utils/spatialGrid";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { randomRange } from "../utils/math";
import { gameEvents, GameEvents } from "../events";

const ENEMY_RADIUS = 7;
const BOSS_RADIUS = 13;
const HP_BAR_W = 18;
const BOSS_HP_BAR_W = 32;

/**
 * Враги: спавн, движение по путям, урон, замедление/оглушение, отрисовка.
 *
 * Отрисовка — один Graphics на всех (перерисовывается каждый кадр).
 * Когда появятся спрайты, здесь можно заменить на Image-пул.
 */
export class EnemySystem {
  private enemies: EnemyRuntime[] = [];
  private lateralOffset = new Map<string, number>();
  private pathLengths: Record<PathId, number>;
  private graphics: Phaser.GameObjects.Graphics;
  private nextId = 1;

  /** Пространственная сетка живых врагов — для поиска целей башнями. */
  readonly grid = new SpatialGrid<EnemyRuntime>(GAME_WIDTH, GAME_HEIGHT, 64);

  onKilled?: (enemy: EnemyRuntime) => void;
  onReachedBase?: (enemy: EnemyRuntime) => void;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(10);
    this.pathLengths = {
      long: pathLength("long"),
      tunnels: pathLength("tunnels"),
      mid: pathLength("mid"),
    };
  }

  spawn(type: EnemyKind, group: WaveEnemyGroup, pathId: PathId): EnemyRuntime {
    const cfg = ENEMIES[type];
    const hp = Math.round(cfg.baseHp * group.hpMul);
    const speed = cfg.baseSpeed * group.speedMul;
    const start = pointAtProgress(pathId, 0);

    const enemy: EnemyRuntime = {
      id: `e${this.nextId++}`,
      type,
      pathId,
      pathProgress: 0,
      x: start.x,
      y: start.y,
      hp,
      maxHp: hp,
      speed,
      baseSpeed: speed,
      slowUntil: 0,
      slowFactor: 1,
      reward: Math.round(cfg.baseReward * group.rewardMul),
      damage: cfg.baseDamage,
      isBoss: cfg.isBoss,
      isDead: false,
      reachedBase: false,
    };

    this.enemies.push(enemy);
    this.lateralOffset.set(enemy.id, cfg.isBoss ? 0 : randomRange(-6, 6));
    return enemy;
  }

  /** dt — секунды игрового времени, now — мс игрового времени. */
  update(dt: number, now: number): void {
    for (const e of this.enemies) {
      if (e.isDead || e.reachedBase) continue;

      if (now >= e.slowUntil) e.slowFactor = 1;
      e.speed = e.baseSpeed * e.slowFactor;

      e.pathProgress += (e.speed * dt) / this.pathLengths[e.pathId];

      if (e.pathProgress >= 1) {
        e.pathProgress = 1;
        e.reachedBase = true;
        gameEvents.emit(GameEvents.ENEMY_REACHED_BASE, { id: e.id });
        this.onReachedBase?.(e);
        continue;
      }

      const p = pointAtProgress(e.pathId, e.pathProgress);
      const off = this.lateralOffset.get(e.id) ?? 0;
      // смещение перпендикулярно направлению движения — чтобы толпа не сливалась в точку
      e.x = p.x - Math.sin(p.angle) * off;
      e.y = p.y + Math.cos(p.angle) * off;
    }

    this.removeFinished();
    this.rebuildGrid();
    this.draw();
  }

  /** Нанести урон. Возвращает true, если враг убит этим попаданием. */
  damage(id: string, amount: number): boolean {
    const e = this.getById(id);
    if (!e || e.isDead || e.reachedBase || amount <= 0) return false;
    e.hp -= amount;
    if (e.hp <= 0) {
      e.hp = 0;
      e.isDead = true;
      gameEvents.emit(GameEvents.ENEMY_KILLED, { id: e.id, type: e.type });
      this.onKilled?.(e);
      return true;
    }
    return false;
  }

  /** factor: 0.5 — замедление на 50%, 0 — оглушение. Берётся сильнейший эффект. */
  applySlow(id: string, factor: number, until: number): void {
    const e = this.getById(id);
    if (!e || e.isDead) return;
    e.slowFactor = Math.min(e.slowFactor, factor);
    e.slowUntil = Math.max(e.slowUntil, until);
  }

  getById(id: string): EnemyRuntime | undefined {
    return this.enemies.find((e) => e.id === id);
  }

  getAlive(): readonly EnemyRuntime[] {
    return this.enemies;
  }

  get aliveCount(): number {
    return this.enemies.length;
  }

  clear(): void {
    this.enemies = [];
    this.lateralOffset.clear();
    this.grid.clear();
    this.graphics.clear();
  }

  destroy(): void {
    this.clear();
    this.graphics.destroy();
  }

  private removeFinished(): void {
    if (!this.enemies.some((e) => e.isDead || e.reachedBase)) return;
    this.enemies = this.enemies.filter((e) => {
      const done = e.isDead || e.reachedBase;
      if (done) this.lateralOffset.delete(e.id);
      return !done;
    });
  }

  private rebuildGrid(): void {
    this.grid.clear();
    for (const e of this.enemies) this.grid.insert(e);
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();

    for (const e of this.enemies) {
      const cfg = ENEMIES[e.type];
      const r = e.isBoss ? BOSS_RADIUS : ENEMY_RADIUS;

      // тень
      g.fillStyle(0x000000, 0.35);
      g.fillCircle(e.x + 2, e.y + 3, r);

      // тело
      g.fillStyle(cfg.color, 1);
      g.fillCircle(e.x, e.y, r);
      g.lineStyle(e.isBoss ? 2 : 1, e.slowFactor < 1 ? 0x9ad0ff : 0x1a0a0a, 1);
      g.strokeCircle(e.x, e.y, r);

      // HP-бар (только если ранен или босс)
      if (e.hp < e.maxHp || e.isBoss) {
        const w = e.isBoss ? BOSS_HP_BAR_W : HP_BAR_W;
        const ratio = e.hp / e.maxHp;
        const bx = e.x - w / 2;
        const by = e.y - r - 6;
        g.fillStyle(0x000000, 0.7);
        g.fillRect(bx - 1, by - 1, w + 2, 5);
        g.fillStyle(ratio > 0.5 ? 0x4ad45a : ratio > 0.25 ? 0xd4c44a : 0xd44a4a, 1);
        g.fillRect(bx, by, w * ratio, 3);
      }
    }
  }
}
