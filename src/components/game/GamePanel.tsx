"use client";

import type { MouseEvent } from "react";
import { useAppSelector } from "@/store/hooks";
import { audio } from "@/lib/game/audio/AudioEngine";
import { SOUND_KEYS } from "@/lib/game/data/sounds";
import HUD from "./HUD";
import Controls from "./Controls";
import BuyMenu from "./BuyMenu";
import TowerTooltip from "./TowerTooltip";
import SoundControls from "./SoundControls";

/** Щелчок на любой активной кнопке панели (кроме помеченных data-silent). */
function clickSound(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest("button");
  if (btn && !btn.disabled && !btn.hasAttribute("data-silent")) audio.play(SOUND_KEYS.UI_CLICK);
}

/** После клика снимаем фокус: иначе Space/P/F нажмут кнопку в фокусе и сработают ещё и в Phaser. */
function blurFocused() {
  const el = document.activeElement as HTMLElement | null;
  if (el?.tagName === "BUTTON") el.blur();
}

/** Боковая панель: HUD, управление, магазин, выбранная башня и звук. */
export default function GamePanel() {
  const scene = useAppSelector((s) => s.ui.currentScene);
  const selectedTower = useAppSelector((s) => s.ui.selectedTower);

  if (scene !== "game") {
    return (
      <aside className="flex h-full flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-zinc-400">
            {scene === "gameover"
              ? "Раунд проигран. Кликни по экрану игры, чтобы вернуться в меню."
              : "Нажми «Играть» на экране игры."}
          </p>
          <p className="text-xs text-zinc-600">Здесь появятся деньги, раунды и магазин.</p>
        </div>
        <SoundControls />
      </aside>
    );
  }

  return (
    <aside
      onClickCapture={clickSound}
      onMouseUp={blurFocused}
      className="flex h-full flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
    >
      <HUD />
      <Controls />
      {selectedTower ? <TowerTooltip /> : <BuyMenu />}
      <div className="mt-auto">
        <SoundControls />
      </div>
    </aside>
  );
}
