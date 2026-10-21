"use client";

import { useEffect } from "react";
import {
  gameEvents,
  GameEvents,
  type SceneName,
  type TowerInfoPayload,
  type WaveStatePayload,
} from "@/lib/game/events";
import type { GameSpeed, TowerKind } from "@/lib/game/types";
import { useAppDispatch } from "@/store/hooks";
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
} from "@/store/slices/uiSlice";

/**
 * Мост Phaser → Redux: слушает gameEvents и складывает значения в стор.
 * Команды в обратную сторону (React → Phaser) компоненты шлют напрямую через gameEvents.
 *
 * Подписка ставится до создания Phaser.Game, поэтому первые события не теряются.
 */
export function useGameBridge(): void {
  const dispatch = useAppDispatch();

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
    ];

    for (const [event, fn] of handlers) gameEvents.on(event, fn);
    return () => {
      for (const [event, fn] of handlers) gameEvents.off(event, fn);
    };
  }, [dispatch]);
}
