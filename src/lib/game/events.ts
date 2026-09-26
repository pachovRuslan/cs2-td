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

  // Game state
  GAME_OVER: "game:over",
  GAME_VICTORY: "game:victory",
  GAME_RESTART: "game:restart",

  // UI
  TOWER_SELECTED: "ui:tower_selected",
  TOWER_DESELECTED: "ui:tower_deselected",
  PAUSE_TOGGLED: "ui:pause_toggled",
  SPEED_CHANGED: "ui:speed_changed",

  // Audio (опционально, обычно Phaser сам играет звуки)
  PLAY_SOUND: "audio:play",
} as const;

export type GameEventName =
  (typeof GameEvents)[keyof typeof GameEvents];

/**
 * Типы payload для type-safe эмитов.
 * Можно расширять по мере добавления фич.
 */
export interface GameEventPayloads {
  [GameEvents.MONEY_CHANGED]: { money: number };
  [GameEvents.BASE_HP_CHANGED]: { hp: number; max: number };
  [GameEvents.WAVE_STARTED]: { wave: number; isEndless: boolean };
  [GameEvents.WAVE_COMPLETED]: { wave: number; reward: number };
  [GameEvents.SCORE_CHANGED]: { score: number };
  [GameEvents.GAME_OVER]: { score: number; wave: number };
  [GameEvents.GAME_VICTORY]: { score: number };
  [GameEvents.TOWER_SELECTED]: { towerType: string | null };
  [GameEvents.PAUSE_TOGGLED]: { paused: boolean };
  [GameEvents.SPEED_CHANGED]: { speed: 1 | 2 };
  [GameEvents.PLAY_SOUND]: { key: string };
}