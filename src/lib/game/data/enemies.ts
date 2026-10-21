import type { EnemyConfig, EnemyKind } from "../types";
import { SPRITE_KEYS } from "./sprites";

/**
 * Конфиги врагов (террористов).
 * Скорость — px/сек; длина путей ~1100–1400 px.
 */
export const ENEMIES: Record<EnemyKind, EnemyConfig> = {
  light: {
    id: "light",
    name: "Раш-T",
    baseHp: 60,
    baseSpeed: 95,
    baseReward: 15,
    baseDamage: 5,
    sprite: SPRITE_KEYS.ENEMY_LIGHT,
    color: 0xe0a060,
    isBoss: false,
  },
  normal: {
    id: "normal",
    name: "Террорист",
    baseHp: 100,
    baseSpeed: 70,
    baseReward: 20,
    baseDamage: 8,
    sprite: SPRITE_KEYS.ENEMY_NORMAL,
    color: 0xc45a3a,
    isBoss: false,
  },
  heavy: {
    id: "heavy",
    name: "Тяжёлый T",
    baseHp: 260,
    baseSpeed: 45,
    baseReward: 40,
    baseDamage: 15,
    sprite: SPRITE_KEYS.ENEMY_HEAVY,
    color: 0x8a3a2a,
    isBoss: false,
  },
  elite: {
    id: "elite",
    name: "Элитный T",
    baseHp: 400,
    baseSpeed: 75,
    baseReward: 60,
    baseDamage: 20,
    sprite: SPRITE_KEYS.ENEMY_ELITE,
    color: 0xa02a5a,
    isBoss: false,
  },
  boss_generic: {
    id: "boss_generic",
    name: "Главарь",
    baseHp: 4000,
    baseSpeed: 35,
    baseReward: 400,
    baseDamage: 40,
    sprite: SPRITE_KEYS.ENEMY_BOSS_GENERIC,
    color: 0x5a1a1a,
    isBoss: true,
  },
  boss_kennys: {
    id: "boss_kennys",
    name: "kennyS",
    baseHp: 3000,
    baseSpeed: 40,
    baseReward: 500,
    baseDamage: 50,
    sprite: SPRITE_KEYS.ENEMY_BOSS_KENNYS,
    color: 0x2a6aa0,
    isBoss: true,
  },
  boss_s1mple: {
    id: "boss_s1mple",
    name: "s1mple",
    baseHp: 2500,
    baseSpeed: 60,
    baseReward: 500,
    baseDamage: 50,
    sprite: SPRITE_KEYS.ENEMY_BOSS_S1MPLE,
    color: 0xe0c040,
    isBoss: true,
  },
};

/** Очки за убийство = награда × множитель. */
export const SCORE_PER_REWARD = 10;
