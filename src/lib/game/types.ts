/**
 * Общие типы для всей игры.
 * Используются в Phaser сценах, Redux store, UI компонентах.
 */

// ============================================================================
// БАШНИ
// ============================================================================

export type TowerKind =
  | "awp"      // Снайпер
  | "ak"       // AK-47
  | "p90"      // P90
  | "he"       // HE-граната
  | "smoke"    // Smoke
  | "c4"       // C4
  | "ct_sas"   // CT SAS
  | "ct_grom"; // CT Гром

export type TowerCategory = "gun" | "agent" | "grenade" | "bomb";

export interface TowerLevelConfig {
  level: 1 | 2 | 3;
  damage: number;
  range: number;
  fireRate: number; // выстрелов в секунду
  cost: number;     // стоимость апгрейда до этого уровня
  upgradeCost: number; // сколько стоит перейти на след. уровень (0 для max)
}

export interface TowerConfig {
  id: TowerKind;
  name: string;
  category: TowerCategory;
  description: string;
  baseCost: number;
  sprite: string;
  icon: string;        // эмодзи или буква для UI
  color: number;       // Phaser цвет (0xRRGGBB) для placeholder
  projectileSpeed: number;
  projectileSprite: string;
  /** Спецэффект: slow для smoke, aoe для he/c4 */
  effect?: {
    type: "slow" | "aoe" | "stun";
    radius?: number;
    duration?: number;  // мс
    factor?: number;    // 0.5 = замедление на 50%
  };
  levels: TowerLevelConfig[];
}

// ============================================================================
// ВРАГИ
// ============================================================================

export type EnemyKind =
  | "light"
  | "normal"
  | "heavy"
  | "elite"
  | "boss_kennys"
  | "boss_s1mple"
  | "boss_generic";

export type PathId = "long" | "tunnels" | "mid";

export interface EnemyConfig {
  id: EnemyKind;
  name: string;
  baseHp: number;
  baseSpeed: number;   // px/sec
  baseReward: number;
  baseDamage: number;  // урон по базе при достижении CT-spawn
  sprite: string;
  color: number;
  isBoss: boolean;
}

// ============================================================================
// ВОЛНЫ
// ============================================================================

export interface WaveEnemyGroup {
  enemyType: EnemyKind;
  count: number;
  hpMul: number;     // множитель HP
  speedMul: number;  // множитель скорости
  rewardMul: number; // множитель награды
  pathPreference?: PathId; // если задано — все на эту дорожку
}

export interface WaveConfig {
  wave: number;
  isEndless: boolean;
  isBossWave: boolean;
  groups: WaveEnemyGroup[];
  spawnInterval: number;  // сек между спавнами
  startDelay: number;     // сек перед началом волны
}

// ============================================================================
// ИГРОВЫЕ ОБЪЕКТЫ (runtime)
// ============================================================================

export interface TowerRuntime {
  id: string;           // уникальный ID
  type: TowerKind;
  x: number;
  y: number;
  level: 1 | 2 | 3;
  lastFireTime: number;  // ms timestamp
  totalKills: number;
  totalDamage: number;
}

export interface EnemyRuntime {
  id: string;
  type: EnemyKind;
  pathId: PathId;
  pathProgress: number;  // 0..1
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  slowUntil: number;  // ms timestamp, до какого момента замедлён
  slowFactor: number; // 0.5 = 50% скорость
  isDead: boolean;
  reachedBase: boolean;
}

export interface ProjectileRuntime {
  id: string;
  x: number;
  y: number;
  targetId: string;     // ID врага
  targetX: number;       // последняя известная позиция (если враг умер)
  targetY: number;
  speed: number;
  damage: number;
  sprite: string;
  ownerId: string;      // ID башни
  effect?: TowerConfig["effect"];
}

// ============================================================================
// СОСТОЯНИЕ ИГРЫ (зеркало в Redux)
// ============================================================================

export interface GameStats {
  money: number;
  baseHp: number;
  baseHpMax: number;
  wave: number;
  score: number;
  kills: number;
  isEndless: boolean;
  gameOver: boolean;
  victory: boolean;
}

export type GameSpeed = 1 | 2;