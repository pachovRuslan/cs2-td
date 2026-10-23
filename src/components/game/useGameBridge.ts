"use client";

import { useEffect, useRef } from "react";
import {
  gameEvents,
  GameEvents,
  type SceneName,
  type TowerInfoPayload,
  type WaveStatePayload,
} from "@/lib/game/events";
import type { GameSpeed, TowerKind } from "@/lib/game/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { audio } from "@/lib/game/audio/AudioEngine";
import {
  setBaseHp,
  setKills,
  setMoney,
  setScore,
  setWaveState,
} from "@/store/slices/gameSlice";
import {
  selectTower,
  setCurrentScene,
  setGameSpeed,
  setPaused,
  setSelectedTower,
  setMuted,
  setVolume,
  toggleMute,
} from "@/store/slices/uiSlice";

/**
 * Мост Phaser → Redux: слушает gameEvents и складывает значения в стор.
 * Команды в обратную сторону (React → Phaser) компоненты шлют напрямую через gameEvents.
 *
 * Подписка ставится до создания Phaser.Game, поэтому первые события не теряются.
 */
export function useGameBridge(): void {
  const dispatch = useAppDispatch();
  const volume = useAppSelector((s) => s.ui.volume);
  const muted = useAppSelector((s) => s.ui.muted);
  /** Первый прогон эффекта синхронизации — ещё с дефолтами стора, его пропускаем. */
  const skipFirstSync = useRef(true);

  // звук: настройки из localStorage → Redux, разблокировка по первому жесту
  useEffect(() => {
    audio.init();
    const { muted: savedMuted, ...savedVolume } = audio.getSettings();
    dispatch(setVolume(savedVolume));
    dispatch(setMuted(savedMuted));
  }, [dispatch]);

  // Redux → AudioEngine (он же сохраняет в localStorage)
  // (первый прогон — с дефолтами стора; пропускаем, чтобы не затереть сохранённые настройки)
  useEffect(() => {
    if (skipFirstSync.current) {
      skipFirstSync.current = false;
      return;
    }
    audio.setSettings({ ...volume, muted });
  }, [volume, muted]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers: [string, (payload: any) => void][] = [
      [GameEvents.MONEY_CHANGED, ({ money }: { money: number }) => dispatch(setMoney(money))],
      [GameEvents.BASE_HP_CHANGED, ({ hp }: { hp: number }) => dispatch(setBaseHp(hp))],
      [GameEvents.SCORE_CHANGED, ({ score }: { score: number }) => dispatch(setScore(score))],
      [GameEvents.KILLS_CHANGED, ({ kills }: { kills: number }) => dispatch(setKills(kills))],
      [GameEvents.WAVE_STATE, (w: WaveStatePayload) => dispatch(setWaveState(w))],
      [GameEvents.SCENE_CHANGED, ({ scene }: { scene: SceneName }) => dispatch(setCurrentScene(scene))],
      [GameEvents.PAUSE_TOGGLED, ({ paused }: { paused: boolean }) => dispatch(setPaused(paused))],
      [GameEvents.SPEED_CHANGED, ({ speed }: { speed: GameSpeed }) => dispatch(setGameSpeed(speed))],
      [
        GameEvents.TOWER_SELECTED,
        ({ towerType }: { towerType: string | null }) =>
          dispatch(selectTower(towerType as TowerKind | null)),
      ],
      [GameEvents.TOWER_INFO, (info: TowerInfoPayload | null) => dispatch(setSelectedTower(info))],
      [GameEvents.TOGGLE_MUTE, () => dispatch(toggleMute())],
    ];

    for (const [event, fn] of handlers) gameEvents.on(event, fn);
    return () => {
      for (const [event, fn] of handlers) gameEvents.off(event, fn);
    };
  }, [dispatch]);
}
