import type { EnemyKind, PathId, WaveConfig, WaveEnemyGroup } from "../types";
import {
  EARLY_CALL_BONUS_PER_SEC,
  getWaveConfig,
  getWaveReward,
  TOTAL_WAVES,
} from "../data/waves";
import { ALL_PATHS } from "../data/paths";
import { gameEvents, GameEvents } from "../events";
import type { EnemySystem } from "./EnemySystem";
import type { EconomySystem } from "./EconomySystem";

export type WavePhase = "countdown" | "spawning" | "clearing";

interface SpawnEntry {
  type: EnemyKind;
  group: WaveEnemyGroup;
  pathId: PathId;
}

/**
 * Управление волнами: отсчёт → спавн → ожидание зачистки → награда → следующая.
 * Время — в секундах игрового времени (с учётом паузы и скорости).
 */
export class WaveSystem {
  wave = 0;
  phase: WavePhase = "countdown";
  /** Секунд до начала следующей волны (в фазе countdown). */
  countdown = 0;

  private config: WaveConfig | null = null;
  private queue: SpawnEntry[] = [];
  private spawnTimer = 0;
  private pathCursor = 0;

  constructor(
    private enemies: EnemySystem,
    private economy: EconomySystem
  ) {
    this.prepare(1);
  }

  get isEndless(): boolean {
    return this.wave > TOTAL_WAVES;
  }

  get nextWave(): number {
    return this.phase === "countdown" ? this.wave + 1 : this.wave;
  }

  get remainingToSpawn(): number {
    return this.queue.length;
  }

  /** Начать следующую волну досрочно (только во время отсчёта). Бонус за раннний вызов. */
  callEarly(): void {
    if (this.phase !== "countdown") return;
    const bonus = Math.floor(this.countdown * EARLY_CALL_BONUS_PER_SEC);
    if (bonus > 0) this.economy.earn(bonus);
    this.countdown = 0;
  }

  update(dt: number): void {
    switch (this.phase) {
      case "countdown":
        this.countdown -= dt;
        if (this.countdown <= 0) this.startWave();
        break;

      case "spawning":
        this.spawnTimer -= dt;
        while (this.spawnTimer <= 0 && this.queue.length > 0) {
          const entry = this.queue.shift()!;
          this.enemies.spawn(entry.type, entry.group, entry.pathId);
          this.spawnTimer += this.config!.spawnInterval;
        }
        if (this.queue.length === 0) this.phase = "clearing";
        break;

      case "clearing":
        if (this.enemies.aliveCount === 0) this.completeWave();
        break;
    }
  }

  private prepare(n: number): void {
    this.config = getWaveConfig(n);
    this.countdown = this.config.startDelay;
    this.phase = "countdown";
  }

  private startWave(): void {
    const cfg = this.config!;
    this.wave = cfg.wave;
    this.queue = this.buildQueue(cfg);
    this.spawnTimer = 0;
    this.phase = "spawning";
    gameEvents.emit(GameEvents.WAVE_STARTED, {
      wave: this.wave,
      isEndless: cfg.isEndless,
    });
  }

  private completeWave(): void {
    const reward = getWaveReward(this.wave);
    this.economy.earn(reward);
    this.economy.addScore(reward);
    gameEvents.emit(GameEvents.WAVE_COMPLETED, { wave: this.wave, reward });
    if (this.wave === TOTAL_WAVES) {
      gameEvents.emit(GameEvents.WAVE_ALL_DONE, { wave: this.wave });
    }
    this.prepare(this.wave + 1);
  }

  /**
   * Очередь спавна: группы перемешиваются по кругу (round-robin),
   * боссы — в конце. Пути чередуются, если у группы нет pathPreference.
   */
  private buildQueue(cfg: WaveConfig): SpawnEntry[] {
    const normal = cfg.groups.filter((g) => !g.enemyType.startsWith("boss"));
    const bosses = cfg.groups.filter((g) => g.enemyType.startsWith("boss"));
    const left = normal.map((g) => g.count);
    const queue: SpawnEntry[] = [];

    let added = true;
    while (added) {
      added = false;
      normal.forEach((g, i) => {
        if (left[i] > 0) {
          left[i]--;
          queue.push(this.entry(g));
          added = true;
        }
      });
    }

    for (const b of bosses) {
      for (let i = 0; i < b.count; i++) queue.push(this.entry(b));
    }
    return queue;
  }

  private entry(group: WaveEnemyGroup): SpawnEntry {
    const pathId =
      group.pathPreference ?? ALL_PATHS[this.pathCursor++ % ALL_PATHS.length];
    return { type: group.enemyType, group, pathId };
  }
}
