import Phaser from "phaser";
import type { EnemyKind, EnemyRuntime, PathId, WaveEnemyGroup } from "../types";
import { ENEMIES } from "../data/enemies";
import { pathLength, pointAtProgress } from "../data/paths";
import { SpatialGrid } from "../utils/spatialGrid";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { randomRange } from "../utils/math";
import { gameEvents, GameEvents } from "../events";

const ENEMY_RADIUS = 9;
const BOSS_RADIUS = 16;
/** Размер спрайта на экране (px) по типу врага. */
const SPRITE_SIZE: Record<EnemyKind, number> = {
  light: 50,
  normal: 52,
  heavy: 60,
  elite: 55,
  boss_generic: 86,
  boss_kennys: 80,
  boss_s1mple: 80,
};
const HIT_FLASH_MS = 80;

interface EnemyView {
  img: Phaser.GameObjects.Image | null;
  angle: number;
  /** Сдвиг фазы «покачивания» при ходьбе, чтобы толпа не шагала в ногу. */
  phase: number;
  hitUntil: number;
}

/** Глубина по Y: кто ниже на экране — тот рисуется поверх (общая шкала для врагов и башен). */
export function depthByY(y: number): number {
  return 10 + y / 1000;
}
const HP_BAR_W = 22;
const BOSS_HP_BAR_W = 38;

/**
 * Враги: спавн, движение по путям, урон, замедление/оглушение, отрисовка.
 *
 * Отрисовка: спрайт на врага (поворот по направлению движения + покачивание),
 * тени и HP-бары — общими Graphics. Если текстуры нет — рисуем кружком.
 */
export class EnemySystem {
  private enemies: EnemyRuntime[] = [];
  private lateralOffset = new Map<string, number>();
  private views = new Map<string, EnemyView>();
  private pathLengths: Record<PathId, number>;
  private graphics: Phaser.GameObjects.Graphics;
  private shadows: Phaser.GameObjects.Graphics;
  private now = 0;
  private nextId = 1;

  /** Пространственная сетка живых врагов — для поиска целей башнями. */
  readonly grid = new SpatialGrid<EnemyRuntime>(GAME_WIDTH, GAME_HEIGHT, 64);

  onKilled?: (enemy: EnemyRuntime) => void;
  onReachedBase?: (enemy: EnemyRuntime) => void;

  constructor(private scene: Phaser.Scene) {
    this.shadows = scene.add.graphics().setDepth(9);
    this.graphics = scene.add.graphics().setDepth(12);
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
    this.lateralOffset.set(enemy.id, cfg.isBoss ? 0 : randomRange(-8, 8));

    let img: Phaser.GameObjects.Image | null = null;
    if (this.scene.textures.exists(cfg.sprite)) {
      const size = SPRITE_SIZE[type];
      img = this.scene.add
        .image(start.x, start.y, cfg.sprite)
        .setDisplaySize(size, size)
        .setDepth(depthByY(start.y));
    }
    this.views.set(enemy.id, {
      img,
      angle: -Math.PI / 2,
      phase: Math.random() * Math.PI * 2,
      hitUntil: 0,
    });
    return enemy;
  }

  /** dt — секунды игрового времени, now — мс игрового времени. */
  update(dt: number, now: number): void {
    this.now = now;
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
      const view = this.views.get(e.id);
      if (view) view.angle = p.angle;
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
    const view = this.views.get(id);
    if (view) view.hitUntil = this.now + HIT_FLASH_MS;
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
    for (const v of this.views.values()) v.img?.destroy();
    this.views.clear();
    this.enemies = [];
    this.lateralOffset.clear();
    this.grid.clear();
    this.graphics.clear();
    this.shadows.clear();
  }

  destroy(): void {
    this.clear();
    this.graphics.destroy();
    this.shadows.destroy();
  }

  private removeFinished(): void {
    if (!this.enemies.some((e) => e.isDead || e.reachedBase)) return;
    this.enemies = this.enemies.filter((e) => {
      const done = e.isDead || e.reachedBase;
      if (done) {
        this.lateralOffset.delete(e.id);
        const img = this.views.get(e.id)?.img;
        this.views.delete(e.id);
        if (img) {
          // убитый — оседает и исчезает, дошедший до базы — просто пропадает
          if (e.isDead) {
            img.setTint(0x8a8a8a).setTintMode(Phaser.TintModes.MULTIPLY);
            this.scene.tweens.add({
              targets: img,
              alpha: 0,
              scale: img.scale * 0.75,
              duration: 350,
              onComplete: () => img.destroy(),
            });
          } else {
            img.destroy();
          }
        }
      }
      return !done;
    });
  }

  private rebuildGrid(): void {
    this.grid.clear();
    for (const e of this.enemies) this.grid.insert(e);
  }

  private draw(): void {
    const g = this.graphics;
    const sh = this.shadows;
    g.clear();
    sh.clear();

    for (const e of this.enemies) {
      const cfg = ENEMIES[e.type];
      const view = this.views.get(e.id);
      const r = e.isBoss ? BOSS_RADIUS : ENEMY_RADIUS;
      const stunned = e.slowFactor === 0;

      // тень
      sh.fillStyle(0x000000, 0.28);
      sh.fillEllipse(e.x + 2, e.y + 4, r * 2.4, r * 1.6);

      if (view?.img) {
        const sway = stunned ? 0 : Math.sin(this.now / 90 + view.phase) * 0.08;
        view.img
          .setPosition(e.x, e.y)
          .setRotation(view.angle + sway)
          .setDepth(depthByY(e.y));
        if (this.now < view.hitUntil) {
          view.img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        } else if (e.slowFactor < 1) {
          view.img
            .setTint(stunned ? 0xfff08a : 0x9ad0ff)
            .setTintMode(Phaser.TintModes.MULTIPLY);
        } else {
          view.img.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
        }
      } else {
        // заглушка без текстуры
        g.fillStyle(cfg.color, 1);
        g.fillCircle(e.x, e.y, r);
        g.lineStyle(e.isBoss ? 2 : 1, e.slowFactor < 1 ? 0x9ad0ff : 0x1a0a0a, 1);
        g.strokeCircle(e.x, e.y, r);
      }

      // HP-бар (только если ранен или босс)
      if (e.hp < e.maxHp || e.isBoss) {
        const w = e.isBoss ? BOSS_HP_BAR_W : HP_BAR_W;
        const ratio = e.hp / e.maxHp;
        const bx = e.x - w / 2;
        const by = e.y - r - 10;
        g.fillStyle(0x000000, 0.7);
        g.fillRect(bx - 1, by - 1, w + 2, 5);
        g.fillStyle(ratio > 0.5 ? 0x4ad45a : ratio > 0.25 ? 0xd4c44a : 0xd44a4a, 1);
        g.fillRect(bx, by, w * ratio, 3);
      }
    }
  }
}
