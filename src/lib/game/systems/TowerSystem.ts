import Phaser from "phaser";
import type { EnemyRuntime, TowerKind, TowerRuntime } from "../types";
import { TOWERS, getTowerLevel, getTowerSellValue } from "../data/towers";
import { gameEvents, GameEvents } from "../events";
import { TOWER_RADIUS } from "./PlacementSystem";
import type { EnemySystem } from "./EnemySystem";
import type { ProjectileSystem } from "./ProjectileSystem";
import type { ParticleSystem } from "./ParticleSystem";

const BARREL_LEN = 20;

interface TowerView {
  container: Phaser.GameObjects.Container;
  barrel: Phaser.GameObjects.Rectangle;
  pips: Phaser.GameObjects.Graphics;
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
    const r = TOWER_RADIUS + 2;
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
      view.barrel.setRotation(angle);

      const cooldown = 1000 / lvl.fireRate;
      if (now - t.lastFireTime < cooldown) continue;
      t.lastFireTime = now;

      const mx = t.x + Math.cos(angle) * BARREL_LEN;
      const my = t.y + Math.sin(angle) * BARREL_LEN;
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

    const shadow = this.scene.add.circle(2, 3, TOWER_RADIUS, 0x000000, 0.35);
    const base = this.scene.add
      .circle(0, 0, TOWER_RADIUS, cfg.color, 1)
      .setStrokeStyle(2, 0x111111, 1);
    const barrel = this.scene.add
      .rectangle(0, 0, BARREL_LEN, 4, 0x1a1a1a, 1)
      .setOrigin(0, 0.5);
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
    const pips = this.scene.add.graphics();

    const container = this.scene.add
      .container(t.x, t.y, [shadow, base, barrel, label, pips])
      .setDepth(15);

    const view = { container, barrel, pips };
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

  /** Точки уровня под башней. */
  private drawPips(t: TowerRuntime): void {
    const view = this.views.get(t.id);
    if (!view) return;
    const g = view.pips;
    g.clear();
    for (let i = 0; i < t.level; i++) {
      const px = (i - (t.level - 1) / 2) * 6;
      g.fillStyle(0xffd34a, 1);
      g.fillCircle(px, TOWER_RADIUS + 4, 2);
    }
  }
}
