import { GameStats, TowerKind } from "@/lib/game/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
 

/**
 * Game-state зеркало для UI.
 *
 * ВНИМАНИЕ: это ТОЛЬКО зеркало. Источник правды — Phaser-сцена.
 * Phaser обновляет эти поля через events.ts → React-redux подписывается.
 * Не делай сложной логики тут — только хранилище для отображения.
 */

export interface GameState extends GameStats {
  /** Сколько башен построено */
  towersBuilt: number;

  /** Сколько башен продано */
  towersSold: number;

  /** Топ-рекорд (из localStorage) */
  highScore: number;
}

const initialState: GameState = {
  money: 800,        // стартовые деньги как в CS2 pistol round
  baseHp: 100,
  baseHpMax: 100,
  wave: 0,           // 0 = ещё не начали
  score: 0,
  kills: 0,
  isEndless: false,
  gameOver: false,
  victory: false,
  towersBuilt: 0,
  towersSold: 0,
  highScore: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setMoney: (state, action: PayloadAction<number>) => {
      state.money = Math.max(0, Math.floor(action.payload));
    },

    addMoney: (state, action: PayloadAction<number>) => {
      state.money = Math.max(0, state.money + action.payload);
    },

    spendMoney: (state, action: PayloadAction<number>) => {
      state.money = Math.max(0, state.money - action.payload);
    },

    setBaseHp: (state, action: PayloadAction<number>) => {
      state.baseHp = Math.max(0, Math.min(state.baseHpMax, action.payload));
      if (state.baseHp <= 0) state.gameOver = true;
    },

    damageBase: (state, action: PayloadAction<number>) => {
      state.baseHp = Math.max(0, state.baseHp - action.payload);
      if (state.baseHp <= 0) state.gameOver = true;
    },

    setWave: (state, action: PayloadAction<number>) => {
      state.wave = action.payload;
    },

    setEndless: (state, action: PayloadAction<boolean>) => {
      state.isEndless = action.payload;
    },

    addScore: (state, action: PayloadAction<number>) => {
      state.score += action.payload;
      if (state.score > state.highScore) state.highScore = state.score;
    },

    setHighScore: (state, action: PayloadAction<number>) => {
      state.highScore = Math.max(state.highScore, action.payload);
    },

    addKill: (state, action: PayloadAction<{ reward: number; score: number }>) => {
      state.kills += 1;
      state.money += action.payload.reward;
      state.score += action.payload.score;
      if (state.score > state.highScore) state.highScore = state.score;
    },

    towerBuilt: (state, _action: PayloadAction<{ type: TowerKind; cost: number }>) => {
      state.towersBuilt += 1;
      // деньги списываются в EconomySystem, тут только счётчик
    },

    towerSold: (state, _action: PayloadAction<{ refund: number }>) => {
      state.towersSold += 1;
      state.money += _action.payload.refund;
    },

    setGameOver: (state) => {
      state.gameOver = true;
    },

    setVictory: (state) => {
      state.victory = true;
    },

    resetGame: () => ({
      ...initialState,
      highScore: 0, // highScore сбрасывается отдельно через setHighScore
    }),
  },
});

export const {
  setMoney,
  addMoney,
  spendMoney,
  setBaseHp,
  damageBase,
  setWave,
  setEndless,
  addScore,
  setHighScore,
  addKill,
  towerBuilt,
  towerSold,
  setGameOver,
  setVictory,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;