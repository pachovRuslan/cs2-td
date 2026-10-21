import Phaser from "phaser";
import type { ProjectileRuntime, TowerConfig } from "../types";
import { SPRITE_KEYS } from "../data/sprites";
import type { EnemySystem } from "./EnemySystem";
import type { ParticleSystem } from "./ParticleSystem";

const HIT_DISTANCE = 6;

export interface FireParams {
  x: number;
  y: number;
  targetId: string;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  sprite: string;
  ownerId: string;
  effect?: TowerConfig["effect"];
}

/**
 * Снаряды: самонаведение на цель, попадание, AoE/slow/stun.
 * Если цель умерла — снаряд долетает до её последней позиции
 * (гранаты при этом всё равно взрываются, пули просто исчезают).
 */
export class ProjectileSystem {
  private projectiles: ProjectileRuntime[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  private nextId = 1;

  /** Сообщает, сколько урона нанесла башня и убила ли она кого-то. */
  onDamageDealt?: (ownerId: string, damage: number, kills: number) => void;

  constructor(
    scene: Phaser.Scene,
    private enemies: EnemySystem,
    private particles: ParticleSystem
  ) {
    this.graphics = scene.add.graphics().setDepth(20);
  }

  fire(p: FireParams): void {
    this.projectiles.push({ id: `p${this.nextId++}`, ...p });
  }

  /** dt — секунды, now — мс игрового времени. */
  update(dt: number, now: number): void {
    const done = new Set<string>();

    for (const p of this.projectiles) {
      const target = this.enemies.getById(p.targetId);
      if (target && !target.isDead) {
        p.targetX = target.x;
        p.targetY = target.y;
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = p.speed * dt;

      if (dist <= Math.max(step, HIT_DISTANCE)) {
        p.x = p.targetX;
        p.y = p.targetY;
        this.impact(p, target && !target.isDead ? target.id : null, now);
        done.add(p.id);
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }

    if (done.size > 0) {
      this.projectiles = this.projectiles.filter((p) => !done.has(p.id));
    }
    this.draw();
  }

  clear(): void {
    this.projectiles = [];
    this.graphics.clear();
  }

  destroy(): void {
    this.clear();
    this.graphics.destroy();
  }

  private impact(p: ProjectileRuntime, hitId: string | null, now: number): void {
    const effect = p.effect;

    if (effect?.type === "aoe") {
      const radius = effect.radius ?? 50;
      this.particles.explosion(p.x, p.y, radius);
      let dealt = 0;
      let kills = 0;
      for (const e of this.enemies.grid.queryRadius(p.x, p.y, radius)) {
        const before = e.hp;
        if (this.enemies.damage(e.id, p.damage)) kills++;
        dealt += before - e.hp;
      }
      this.onDamageDealt?.(p.ownerId, dealt, kills);
      return;
    }

    if (effect?.type === "slow") {
      const radius = effect.radius ?? 60;
      const duration = effect.duration ?? 2000;
      this.particles.smokeCloud(p.x, p.y, radius, duration);
      for (const e of this.enemies.grid.queryRadius(p.x, p.y, radius)) {
        this.enemies.applySlow(e.id, effect.factor ?? 0.5, now + duration);
      }
      return;
    }

    if (!hitId) return; // пуля, цель уже мертва

    const target = this.enemies.getById(hitId)!;
    const before = target.hp;
    const killed = this.enemies.damage(hitId, p.damage);
    if (effect?.type === "stun" && !killed) {
      this.enemies.applySlow(hitId, 0, now + (effect.duration ?? 400));
    }
    this.particles.hit(p.x, p.y);
    this.onDamageDealt?.(p.ownerId, before - target.hp, killed ? 1 : 0);
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();
    for (const p of this.projectiles) {
      if (p.effect?.type === "aoe" || p.effect?.type === "slow") {
        // граната / C4
        g.fillStyle(p.effect.type === "slow" ? 0xcfcfcf : 0x3a4a2a, 1);
        g.fillCircle(p.x, p.y, 4);
        g.lineStyle(1, 0x000000, 0.8);
        g.strokeCircle(p.x, p.y, 4);
      } else {
        // пуля — короткий трассер по направлению полёта
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const tail = p.sprite === SPRITE_KEYS.PROJECTILE_AWP ? 18 : 7;
        g.lineStyle(p.sprite === SPRITE_KEYS.PROJECTILE_AWP ? 2 : 1.5, 0xffe08a, 1);
        g.lineBetween(p.x, p.y, p.x - (dx / len) * tail, p.y - (dy / len) * tail);
      }
    }
  }
}
