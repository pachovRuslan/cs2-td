import type { EnemyKind, PathId, WaveConfig, WaveEnemyGroup } from "../types";

/** Количество «сюжетных» волн. Дальше — endless. */
export const TOTAL_WAVES = 15;

/** Бонус за каждую секунду, на которую раунд вызван раньше. */
export const EARLY_CALL_BONUS_PER_SEC = 5;

/** Базовая награда за прохождение волны. */
export const WAVE_REWARD_BASE = 100;
export const WAVE_REWARD_PER_WAVE = 25;

function g(
  enemyType: EnemyKind,
  count: number,
  hpMul = 1,
  speedMul = 1,
  rewardMul = 1,
  pathPreference?: PathId
): WaveEnemyGroup {
  return { enemyType, count, hpMul, speedMul, rewardMul, pathPreference };
}

function wave(
  n: number,
  groups: WaveEnemyGroup[],
  spawnInterval: number,
  isBossWave = false
): WaveConfig {
  return {
    wave: n,
    isEndless: false,
    isBossWave,
    groups,
    spawnInterval,
    startDelay: n === 1 ? 15 : 8,
  };
}

export const WAVES: WaveConfig[] = [
  wave(1, [g("normal", 8)], 1.4),
  wave(2, [g("normal", 10), g("light", 4)], 1.2),
  wave(3, [g("light", 14, 1, 1, 1, "long")], 0.8),
  wave(4, [g("normal", 12), g("heavy", 3)], 1.1),
  wave(5, [g("normal", 10), g("boss_generic", 1)], 1.0, true),

  wave(6, [g("light", 12, 1.1), g("normal", 12, 1.1)], 0.9),
  wave(7, [g("heavy", 8, 1.1, 1, 1, "tunnels"), g("normal", 10, 1.1)], 1.0),
  wave(8, [g("elite", 6), g("light", 16, 1.2)], 0.8),
  wave(9, [g("heavy", 10, 1.2), g("elite", 6, 1.1)], 0.9),
  wave(10, [g("elite", 8, 1.2), g("boss_kennys", 1)], 0.9, true),

  wave(11, [g("light", 24, 1.4, 1.1)], 0.5),
  wave(12, [g("heavy", 14, 1.4), g("elite", 8, 1.3)], 0.8),
  wave(13, [g("elite", 14, 1.4, 1, 1, "mid"), g("normal", 16, 1.5)], 0.7),
  wave(14, [g("heavy", 16, 1.6), g("elite", 14, 1.5), g("light", 20, 1.6)], 0.6),
  wave(
    15,
    [g("elite", 16, 1.7), g("boss_generic", 1, 1.3), g("boss_s1mple", 1)],
    0.7,
    true
  ),
];

const ENDLESS_BOSSES: EnemyKind[] = ["boss_generic", "boss_kennys", "boss_s1mple"];

/**
 * Генерация endless-волн (n > TOTAL_WAVES).
 * HP растёт экспоненциально, количество — линейно, каждая 5-я — с боссом.
 */
function generateEndlessWave(n: number): WaveConfig {
  const k = n - TOTAL_WAVES;
  const hpMul = 1.7 * Math.pow(1.15, k);
  const speedMul = Math.min(1.5, 1 + k * 0.02);
  const isBossWave = n % 5 === 0;

  const groups: WaveEnemyGroup[] = [
    g("light", 16 + k * 2, hpMul, speedMul),
    g("heavy", 10 + k, hpMul, speedMul),
    g("elite", 10 + k, hpMul, speedMul),
  ];

  if (isBossWave) {
    const boss = ENDLESS_BOSSES[Math.floor(k / 5) % ENDLESS_BOSSES.length];
    groups.push(g(boss, 1 + Math.floor(k / 15), hpMul));
  }

  return {
    wave: n,
    isEndless: true,
    isBossWave,
    groups,
    spawnInterval: Math.max(0.3, 0.6 - k * 0.01),
    startDelay: 8,
  };
}

/** Конфиг волны по номеру (с 1). */
export function getWaveConfig(n: number): WaveConfig {
  if (n < 1) throw new Error(`Invalid wave number: ${n}`);
  return n <= TOTAL_WAVES ? WAVES[n - 1] : generateEndlessWave(n);
}

export function getWaveReward(n: number): number {
  return WAVE_REWARD_BASE + WAVE_REWARD_PER_WAVE * n;
}

export function getWaveEnemyCount(config: WaveConfig): number {
  return config.groups.reduce((sum, grp) => sum + grp.count, 0);
}
