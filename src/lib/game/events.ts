import EventEmitter from "eventemitter3";

/**
 * Глобальный мост Phaser ↔ React.
 *
 * Phaser-сцена эмитит события при изменении game-state,
 * React-компоненты (HUD, BuyMenu) слушают и ре-рендерят UI.
 *
 * ВАЖНО: не использовать для высокочастотных обновлений (позиции врагов и т.д.).
 * Только для UI-значимых изменений (деньги, HP, волна, счёт).
 */

export const gameEvents = new EventEmitter();

/**
 * Реестр всех событий.
 * Используем как enum, чтобы не опечататься в строках.
 */
export const GameEvents = {
  // Economy
  MONEY_CHANGED: "money:changed",
  TOWER_PLACED: "tower:placed",
  TOWER_SOLD: "tower:sold",
  TOWER_UPGRADED: "tower:upgraded",

  // Health
  BASE_HP_CHANGED: "base:hp_changed",
  BASE_DAMAGED: "base:damaged",

  // Waves
  WAVE_STARTED: "wave:started",
  WAVE_COMPLETED: "wave:completed",
  WAVE_ALL_DONE: "wave:all_done",

  // Score
  SCORE_CHANGED: "score:changed",
  ENEMY_KILLED: "enemy:killed",
  ENEMY_REACHED_BASE: "enemy:reached_base",
  KILLS_CHANGED: "score:kills_changed",

  // Phaser → React: снимки состояния для UI
  SCENE_CHANGED: "state:scene_changed",
  WAVE_STATE: "state:wave",
  TOWER_INFO: "state:tower_info",

  // Game state
  GAME_OVER: "game:over",
  GAME_VICTORY: "game:victory",
  GAME_RESTART: "game:restart",

  // UI
  TOWER_SELECTED: "ui:tower_selected",
  TOWER_DESELECTED: "ui:tower_deselected",
  PAUSE_TOGGLED: "ui:pause_toggled",
  SPEED_CHANGED: "ui:speed_changed",

  // React → Phaser: команды
  CALL_WAVE: "cmd:call_wave",
  UPGRADE_TOWER: "cmd:upgrade_tower",
  SELL_TOWER: "cmd:sell_tower",

  // Audio (опционально, обычно Phaser сам играет звуки)
  PLAY_SOUND: "audio:play",
} as const;

export type GameEventName =
  (typeof GameEvents)[keyof typeof GameEvents];

/**
 * Типы payload для type-safe эмитов.
 * Можно расширять по мере добавления фич.
 */
export type SceneName = "boot" | "menu" | "game" | "gameover";

export interface WaveStatePayload {
  phase: "countdown" | "spawning" | "clearing";
  /** Номер текущей волны (0 — ещё не начиналась). */
  wave: number;
  /** Номер волны, которая начнётся после отсчёта. */
  nextWave: number;
  /** Секунд до следующей волны (целое, только в фазе countdown). */
  countdown: number;
  /** Враги на карте + ещё не заспавненные. */
  remaining: number;
  isEndless: boolean;
}

export interface TowerInfoPayload {
  id: string;
  type: string;
  level: 1 | 2 | 3;
  kills: number;
  damageDealt: number;
  /** null — максимальный уровень. */
  upgradeCost: number | null;
  sellValue: number;
}

export interface GameEventPayloads {
  [GameEvents.MONEY_CHANGED]: { money: number };
  [GameEvents.BASE_HP_CHANGED]: { hp: number; max: number };
  [GameEvents.WAVE_STARTED]: { wave: number; isEndless: boolean };
  [GameEvents.WAVE_COMPLETED]: { wave: number; reward: number };
  [GameEvents.SCORE_CHANGED]: { score: number };
  [GameEvents.BASE_DAMAGED]: { amount: number };
  [GameEvents.ENEMY_KILLED]: { id: string; type: string };
  [GameEvents.ENEMY_REACHED_BASE]: { id: string };
  [GameEvents.WAVE_ALL_DONE]: { wave: number };
  [GameEvents.KILLS_CHANGED]: { kills: number };
  [GameEvents.SCENE_CHANGED]: { scene: SceneName };
  [GameEvents.WAVE_STATE]: WaveStatePayload;
  [GameEvents.TOWER_INFO]: TowerInfoPayload | null;
  [GameEvents.GAME_OVER]: { score: number; wave: number };
  [GameEvents.GAME_VICTORY]: { score: number };
  [GameEvents.TOWER_SELECTED]: { towerType: string | null };
  [GameEvents.PAUSE_TOGGLED]: { paused: boolean };
  [GameEvents.SPEED_CHANGED]: { speed: 1 | 2 };
  [GameEvents.PLAY_SOUND]: { key: string };
}