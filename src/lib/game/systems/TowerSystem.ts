import Phaser from "phaser";
import type { EnemyRuntime, TowerCategory, TowerKind, TowerRuntime } from "../types";
import { TOWERS, getTowerLevel, getTowerSellValue } from "../data/towers";
import { gameEvents, GameEvents } from "../events";
import { TOWER_RADIUS } from "./PlacementSystem";
import { depthByY, type EnemySystem } from "./EnemySystem";
import { SPRITE_KEYS } from "../data/sprites";
import { SOUND_KEYS, TOWER_SHOT_SOUND } from "../data/sounds";
import { audio } from "../audio/AudioEngine";
import type { ProjectileSystem } from "./ProjectileSystem";
import type { ParticleSystem } from "./ParticleSystem";

const BARREL_LEN = 16;
const BASE_SIZE = 50;
const TURRET_SIZE = 46;

const BASE_SPRITE: Record<TowerCategory, string> = {
  gun: SPRITE_KEYS.TOWER_BASE_GUN,
  grenade: SPRITE_KEYS.TOWER_BASE_GRENADE,
  bomb: SPRITE_KEYS.TOWER_BASE_BOMB,
  agent: SPRITE_KEYS.TOWER_BASE_AGENT,
};

/** Звук при попадании снаряда (у пуль — нет). */
const IMPACT_SOUND: Partial<Record<TowerKind, string>> = {
  he: SOUND_KEYS.EXPLOSION_HE,
  c4: SOUND_KEYS.EXPLOSION_C4,
  smoke: SOUND_KEYS.SMOKE_HISS,
};

/** Расстояние от центра башни до дула (px на экране) — откуда вылетает снаряд. */
const MUZZLE: Partial<Record<TowerKind, number>> = { awp: 32, he: 14, smoke: 14, c4: 0 };

interface TowerView {
  container: Phaser.GameObjects.Container;
  /** Поворотная часть: спрайт бойца или (без текстур) прямоугольник-ствол. */
  barrel: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  pips: Phaser.GameObjects.Graphics;
  rotates: boolean;
}

/**
 * Башни: постройка, апгрейд, продажа, выбор цели и стрельба.
 * Цель — враг, дальше всех продвинувшийся по пути («first»).
 */
export class TowerSystem {
  private towers: TowerRuntime[] = [];
  private views = new Map<string, TowerView>();
  private nextId = 1;

  constructor(
    private scene: Phaser.Scene,
    private enemies: EnemySystem,
    private projectiles: ProjectileSystem,
    private particles: ParticleSystem
  ) {}

  getAll(): readonly TowerRuntime[] {
    return this.towers;
  }

  getById(id: string): TowerRuntime | undefined {
    return this.towers.find((t) => t.id === id);
  }

  /** Башня под точкой (для клика). */
  getAt(x: number, y: number): TowerRuntime | undefined {
    const r = 24;
    return this.towers.find((t) => (t.x - x) ** 2 + (t.y - y) ** 2 <= r * r);
  }

  build(type: TowerKind, x: number, y: number): TowerRuntime {
    const tower: TowerRuntime = {
      id: `t${this.nextId++}`,
      type,
      x,
      y,
      level: 1,
      lastFireTime: -Infinity,
      totalKills: 0,
      totalDamage: 0,
    };
    this.towers.push(tower);
    this.views.set(tower.id, this.createView(tower));
    gameEvents.emit(GameEvents.TOWER_PLACED, { id: tower.id, type, x, y });
    return tower;
  }

  /** Цена апгрейда или null, если уровень максимальный. */
  getUpgradeCost(tower: TowerRuntime): number | null {
    const cost = getTowerLevel(tower.type, tower.level).upgradeCost;
    return tower.level < 3 && cost > 0 ? cost : null;
  }

  upgrade(id: string): void {
    const t = this.getById(id);
    if (!t || t.level >= 3) return;
    t.level = (t.level + 1) as 2 | 3;
    this.drawPips(t);
    this.particles.floatingText(t.x, t.y - 18, `LVL ${t.level}`, "#7fd4ff");
    gameEvents.emit(GameEvents.TOWER_UPGRADED, { id, level: t.level });
  }

  /** Удаляет башню, возвращает сумму возврата. */
  sell(id: string): number {
    const t = this.getById(id);
    if (!t) return 0;
    const refund = getTowerSellValue(t.type, t.level);
    this.towers = this.towers.filter((x) => x.id !== id);
    this.views.get(id)?.container.destroy();
    this.views.delete(id);
    gameEvents.emit(GameEvents.TOWER_SOLD, { id, refund });
    return refund;
  }

  recordDamage(ownerId: string, damage: number, kills: number): void {
    const t = this.getById(ownerId);
    if (!t) return;
    t.totalDamage += damage;
    t.totalKills += kills;
  }

  /** now — мс игрового времени. */
  update(now: number): void {
    for (const t of this.towers) {
      const cfg = TOWERS[t.type];
      const lvl = getTowerLevel(t.type, t.level);
      const target = this.findTarget(t, lvl.range);
      if (!target) continue;

      const view = this.views.get(t.id)!;
      const angle = Math.atan2(target.y - t.y, target.x - t.x);
      if (view.rotates) view.barrel.setRotation(angle);

      const cooldown = 1000 / lvl.fireRate;
      if (now - t.lastFireTime < cooldown) continue;
      t.lastFireTime = now;

      const muzzle = MUZZLE[t.type] ?? 24;
      const mx = t.x + Math.cos(angle) * muzzle;
      const my = t.y + Math.sin(angle) * muzzle;
      this.recoil(view, angle);
      audio.play(TOWER_SHOT_SOUND[t.type]);
      if (cfg.category === "gun" || cfg.category === "agent") {
        this.particles.muzzle(mx, my);
      }

      this.projectiles.fire({
        x: mx,
        y: my,
        targetId: target.id,
        targetX: target.x,
        targetY: target.y,
        speed: cfg.projectileSpeed,
        damage: lvl.damage,
        sprite: cfg.projectileSprite,
        ownerId: t.id,
        effect: cfg.effect,
        impactSound: IMPACT_SOUND[t.type],
      });
    }
  }

  clear(): void {
    for (const v of this.views.values()) v.container.destroy();
    this.views.clear();
    this.towers = [];
  }

  private findTarget(t: TowerRuntime, range: number): EnemyRuntime | null {
    const inRange = this.enemies.grid.queryRadius(t.x, t.y, range);
    let best: EnemyRuntime | null = null;
    let bestScore = -Infinity;
    for (const e of inRange) {
      if (e.isDead || e.reachedBase) continue;
      // smoke предпочитает ещё не замедленных врагов
      const score =
        e.pathProgress - (t.type === "smoke" && e.slowFactor < 1 ? 1 : 0);
      if (score > bestScore) {
        best = e;
        bestScore = score;
      }
    }
    return best;
  }

  private createView(t: TowerRuntime): TowerView {
    const cfg = TOWERS[t.type];
    const hasSprites =
      this.scene.textures.exists(cfg.sprite) &&
      this.scene.textures.exists(BASE_SPRITE[cfg.category]);

    const shadow = this.scene.add.ellipse(3, 5, BASE_SIZE * 0.95, BASE_SIZE * 0.6, 0x000000, 0.3);
    const parts: Phaser.GameObjects.GameObject[] = [shadow];
    let barrel: TowerView["barrel"];

    if (hasSprites) {
      const base = this.scene.add
        .image(0, 0, BASE_SPRITE[cfg.category])
        .setDisplaySize(BASE_SIZE, BASE_SIZE);
      barrel = this.scene.add
        .image(0, 0, cfg.sprite)
        .setDisplaySize(TURRET_SIZE, TURRET_SIZE)
        .setRotation(Math.PI / 2); // враги идут снизу — смотрим вниз
      parts.push(base, barrel);
    } else {
      const base = this.scene.add
        .circle(0, 0, TOWER_RADIUS, cfg.color, 1)
        .setStrokeStyle(2, 0x111111, 1);
      barrel = this.scene.add.rectangle(0, 0, BARREL_LEN, 4, 0x1a1a1a, 1).setOrigin(0, 0.5);
      const label = this.scene.add
        .text(0, 0, cfg.icon, {
          fontFamily: "monospace",
          fontSize: cfg.icon.length > 2 ? "8px" : "9px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      parts.push(base, barrel, label);
    }

    const pips = this.scene.add.graphics();
    parts.push(pips);

    const container = this.scene.add.container(t.x, t.y, parts).setDepth(depthByY(t.y));

    const view: TowerView = { container, barrel, pips, rotates: cfg.category !== "bomb" };
    this.views.set(t.id, view);
    this.drawPips(t);

    container.setScale(0.3);
    this.scene.tweens.add({
      targets: container,
      scale: 1,
      duration: 180,
      ease: "Back.easeOut",
    });
    return view;
  }

  /** Отдача: боец на мгновение сдвигается назад от цели. */
  private recoil(view: TowerView, angle: number): void {
    if (!view.rotates) return;
    const kick = 2.5;
    view.barrel.setPosition(-Math.cos(angle) * kick, -Math.sin(angle) * kick);
    this.scene.tweens.add({ targets: view.barrel, x: 0, y: 0, duration: 90 });
  }

  /** Уровень: точки под башней и кольцо (серебро — 2, золото — 3). */
  private drawPips(t: TowerRuntime): void {
    const view = this.views.get(t.id);
    if (!view) return;
    const g = view.pips;
    g.clear();
    if (t.level >= 2) {
      g.lineStyle(2, t.level === 3 ? 0xffc83a : 0xd8dde6, 0.9);
      g.strokeCircle(0, 0, BASE_SIZE / 2 - 1);
    }
    for (let i = 0; i < t.level; i++) {
      const px = (i - (t.level - 1) / 2) * 7;
      g.fillStyle(0x24180c, 0.8);
      g.fillCircle(px, BASE_SIZE / 2 + 3, 3);
      g.fillStyle(0xffd34a, 1);
      g.fillCircle(px, BASE_SIZE / 2 + 3, 2);
    }
  }
}
