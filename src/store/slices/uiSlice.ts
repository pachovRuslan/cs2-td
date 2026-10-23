import { GameSpeed, TowerKind } from "@/lib/game/types";
import type { SceneName, TowerInfoPayload } from "@/lib/game/events";
import { DEFAULT_VOLUME } from "@/lib/game/data/sounds";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
 

/**
 * UI-state: только то, что нужно React-компонентам.
 *
 * ВНИМАНИЕ: игровое состояние (позиции, HP врагов и т.д.)
 * живёт ВНУТРИ Phaser сцены. Redux — только зеркало для UI.
 *
 * Phaser обновляет этот стор через gameEvents → React подписывается.
 */

export interface UIState {
  /** Какая башня выбрана в BuyMenu для установки (null = ничего) */
  selectedTowerType: TowerKind | null;

  /** Игра на паузе */
  isPaused: boolean;

  /** Скорость игры (1x или 2x) */
  gameSpeed: GameSpeed;

  /** Какую башню (runtime ID) сейчас смотрит игрок (для tooltip) */
  hoveredTowerId: string | null;

  /** Выбранная построенная башня (панель апгрейда/продажи). */
  selectedTower: TowerInfoPayload | null;

  /** Открыт ли экран GameOver */
  isGameOverOpen: boolean;

  /** Текущая сцена Phaser */
  currentScene: SceneName;

  /** Меню настроек открыто */
  isSettingsOpen: boolean;

  /** Звук выключен целиком. */
  muted: boolean;

  /** Громкость */
  volume: {
    master: number;
    sfx: number;
    ambient: number;
    ui: number;
  };
}

const initialState: UIState = {
  selectedTowerType: null,
  isPaused: false,
  gameSpeed: 1,
  hoveredTowerId: null,
  selectedTower: null,
  isGameOverOpen: false,
  currentScene: "boot",
  isSettingsOpen: false,
  muted: false,
  volume: { ...DEFAULT_VOLUME },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    selectTower: (state, action: PayloadAction<TowerKind | null>) => {
      state.selectedTowerType = action.payload;
    },

    togglePause: (state) => {
      state.isPaused = !state.isPaused;
    },

    setPaused: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },

    setGameSpeed: (state, action: PayloadAction<GameSpeed>) => {
      state.gameSpeed = action.payload;
    },

    setHoveredTower: (state, action: PayloadAction<string | null>) => {
      state.hoveredTowerId = action.payload;
    },

    setSelectedTower: (state, action: PayloadAction<TowerInfoPayload | null>) => {
      state.selectedTower = action.payload;
    },

    setCurrentScene: (
      state,
      action: PayloadAction<UIState["currentScene"]>
    ) => {
      state.currentScene = action.payload;
    },

    openGameOver: (state) => {
      state.isGameOverOpen = true;
    },

    closeGameOver: (state) => {
      state.isGameOverOpen = false;
    },

    toggleSettings: (state) => {
      state.isSettingsOpen = !state.isSettingsOpen;
    },

    setVolume: (
      state,
      action: PayloadAction<Partial<UIState["volume"]>>
    ) => {
      state.volume = { ...state.volume, ...action.payload };
    },

    setMuted: (state, action: PayloadAction<boolean>) => {
      state.muted = action.payload;
    },

    toggleMute: (state) => {
      state.muted = !state.muted;
    },

    // звук — пользовательская настройка, при рестарте игры не сбрасывается
    resetUI: (state) => ({ ...initialState, muted: state.muted, volume: state.volume }),
  },
});

export const {
  selectTower,
  togglePause,
  setPaused,
  setGameSpeed,
  setHoveredTower,
  setSelectedTower,
  setCurrentScene,
  openGameOver,
  closeGameOver,
  toggleSettings,
  setVolume,
  setMuted,
  toggleMute,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;