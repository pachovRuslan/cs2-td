import type { TowerConfig, TowerKind, TowerLevelConfig } from "../types";
import { SPRITE_KEYS } from "./sprites";

/**
 * Конфиги башен.
 *
 * levels[i].cost — сколько стоил переход НА этот уровень
 * (для 1 уровня = baseCost), upgradeCost — цена следующего апгрейда.
 */
export const TOWERS: Record<TowerKind, TowerConfig> = {
  ak: {
    id: "ak",
    name: "AK-47",
    category: "gun",
    description: "Универсальная винтовка. Хороший урон и скорострельность.",
    baseCost: 300,
    sprite: SPRITE_KEYS.TOWER_AK,
    icon: "AK",
    color: 0xc8a050,
    projectileSpeed: 900,
    projectileSprite: SPRITE_KEYS.PROJECTILE_BULLET,
    levels: [
      { level: 1, damage: 18, range: 130, fireRate: 3, cost: 300, upgradeCost: 200 },
      { level: 2, damage: 26, range: 140, fireRate: 3.5, cost: 200, upgradeCost: 350 },
      { level: 3, damage: 36, range: 150, fireRate: 4, cost: 350, upgradeCost: 0 },
    ],
  },

  p90: {
    id: "p90",
    name: "P90",
    category: "gun",
    description: "Высокая скорострельность, малый урон и дальность.",
    baseCost: 250,
    sprite: SPRITE_KEYS.TOWER_P90,
    icon: "P90",
    color: 0x6a8a5a,
    projectileSpeed: 850,
    projectileSprite: SPRITE_KEYS.PROJECTILE_BULLET,
    levels: [
      { level: 1, damage: 8, range: 100, fireRate: 8, cost: 250, upgradeCost: 175 },
      { level: 2, damage: 11, range: 105, fireRate: 9, cost: 175, upgradeCost: 300 },
      { level: 3, damage: 15, range: 110, fireRate: 10, cost: 300, upgradeCost: 0 },
    ],
  },

  awp: {
    id: "awp",
    name: "AWP",
    category: "gun",
    description: "Снайпер. Огромный урон и дальность, медленная стрельба.",
    baseCost: 550,
    sprite: SPRITE_KEYS.TOWER_AWP,
    icon: "AWP",
    color: 0x4a7a4a,
    projectileSpeed: 1600,
    projectileSprite: SPRITE_KEYS.PROJECTILE_AWP,
    levels: [
      { level: 1, damage: 110, range: 260, fireRate: 0.5, cost: 550, upgradeCost: 400 },
      { level: 2, damage: 170, range: 290, fireRate: 0.6, cost: 400, upgradeCost: 700 },
      { level: 3, damage: 260, range: 320, fireRate: 0.7, cost: 700, upgradeCost: 0 },
    ],
  },

  he: {
    id: "he",
    name: "HE-граната",
    category: "grenade",
    description: "Урон по площади. Эффективна против толп.",
    baseCost: 400,
    sprite: SPRITE_KEYS.TOWER_HE,
    icon: "HE",
    color: 0x8a3a2a,
    projectileSpeed: 450,
    projectileSprite: SPRITE_KEYS.PROJECTILE_BULLET,
    effect: { type: "aoe", radius: 60 },
    levels: [
      { level: 1, damage: 40, range: 140, fireRate: 0.6, cost: 400, upgradeCost: 300 },
      { level: 2, damage: 60, range: 145, fireRate: 0.7, cost: 300, upgradeCost: 500 },
      { level: 3, damage: 90, range: 150, fireRate: 0.8, cost: 500, upgradeCost: 0 },
    ],
  },

  smoke: {
    id: "smoke",
    name: "Smoke",
    category: "grenade",
    description: "Замедляет врагов в радиусе на 50%. Урона не наносит.",
    baseCost: 350,
    sprite: SPRITE_KEYS.TOWER_SMOKE,
    icon: "SM",
    color: 0x9a9a9a,
    projectileSpeed: 400,
    projectileSprite: SPRITE_KEYS.PROJECTILE_BULLET,
    effect: { type: "slow", radius: 70, duration: 2000, factor: 0.5 },
    levels: [
      { level: 1, damage: 0, range: 120, fireRate: 0.5, cost: 350, upgradeCost: 250 },
      { level: 2, damage: 0, range: 130, fireRate: 0.6, cost: 250, upgradeCost: 400 },
      { level: 3, damage: 0, range: 140, fireRate: 0.7, cost: 400, upgradeCost: 0 },
    ],
  },

  c4: {
    id: "c4",
    name: "C4",
    category: "bomb",
    description: "Мощный взрыв по большой площади. Очень медленная перезарядка.",
    baseCost: 650,
    sprite: SPRITE_KEYS.TOWER_C4,
    icon: "C4",
    color: 0xb04040,
    projectileSpeed: 350,
    projectileSprite: SPRITE_KEYS.PROJECTILE_BULLET,
    effect: { type: "aoe", radius: 100 },
    levels: [
      { level: 1, damage: 200, range: 110, fireRate: 0.2, cost: 650, upgradeCost: 500 },
      { level: 2, damage: 320, range: 115, fireRate: 0.25, cost: 500, upgradeCost: 800 },
      { level: 3, damage: 500, range: 120, fireRate: 0.3, cost: 800, upgradeCost: 0 },
    ],
  },

  ct_sas: {
    id: "ct_sas",
    name: "CT SAS",
    category: "agent",
    description: "Элитный боец. Стабильный высокий DPS.",
    baseCost: 700,
    sprite: SPRITE_KEYS.TOWER_CT_SAS,
    icon: "SAS",
    color: 0x3a5aa4,
    projectileSpeed: 1000,
    projectileSprite: SPRITE_KEYS.PROJECTILE_BULLET,
    levels: [
      { level: 1, damage: 30, range: 160, fireRate: 4, cost: 700, upgradeCost: 500 },
      { level: 2, damage: 45, range: 170, fireRate: 4.5, cost: 500, upgradeCost: 800 },
      { level: 3, damage: 65, range: 180, fireRate: 5, cost: 800, upgradeCost: 0 },
    ],
  },

  ct_grom: {
    id: "ct_grom",
    name: "CT Гром",
    category: "agent",
    description: "Боец спецназа. Оглушает цель на короткое время.",
    baseCost: 800,
    sprite: SPRITE_KEYS.TOWER_CT_GROM,
    icon: "GRM",
    color: 0x2a4a7a,
    projectileSpeed: 1000,
    projectileSprite: SPRITE_KEYS.PROJECTILE_BULLET,
    effect: { type: "stun", duration: 400 },
    levels: [
      { level: 1, damage: 50, range: 170, fireRate: 2, cost: 800, upgradeCost: 600 },
      { level: 2, damage: 75, range: 180, fireRate: 2.5, cost: 600, upgradeCost: 900 },
      { level: 3, damage: 110, range: 190, fireRate: 3, cost: 900, upgradeCost: 0 },
    ],
  },
};

/** Порядок отображения в BuyMenu. */
export const TOWER_ORDER: TowerKind[] = [
  "p90",
  "ak",
  "awp",
  "he",
  "smoke",
  "c4",
  "ct_sas",
  "ct_grom",
];

/** Доля вложенных денег, возвращаемая при продаже. */
export const SELL_REFUND_RATIO = 0.7;

export function getTowerLevel(
  kind: TowerKind,
  level: 1 | 2 | 3
): TowerLevelConfig {
  return TOWERS[kind].levels[level - 1];
}

/** Сколько всего вложено в башню до текущего уровня включительно. */
export function getTowerTotalCost(kind: TowerKind, level: 1 | 2 | 3): number {
  return TOWERS[kind].levels
    .slice(0, level)
    .reduce((sum, l) => sum + l.cost, 0);
}

export function getTowerSellValue(kind: TowerKind, level: 1 | 2 | 3): number {
  return Math.floor(getTowerTotalCost(kind, level) * SELL_REFUND_RATIO);
}
