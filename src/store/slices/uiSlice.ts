import { GameSpeed, TowerKind } from "@/lib/game/types";
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

  /** Открыт ли экран GameOver */
  isGameOverOpen: boolean;

  /** Текущая сцена Phaser */
  currentScene: "boot" | "menu" | "game" | "gameover";

  /** Меню настроек открыто */
  isSettingsOpen: boolean;

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
  isGameOverOpen: false,
  currentScene: "boot",
  isSettingsOpen: false,
  volume: {
    master: 0.7,
    sfx: 0.8,
    ambient: 0.3,
    ui: 0.5,
  },
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

    resetUI: () => initialState,
  },
});

export const {
  selectTower,
  togglePause,
  setPaused,
  setGameSpeed,
  setHoveredTower,
  setCurrentScene,
  openGameOver,
  closeGameOver,
  toggleSettings,
  setVolume,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;