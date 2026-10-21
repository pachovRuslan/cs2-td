"use client";

import { useAppSelector } from "@/store/hooks";
import HUD from "./HUD";
import Controls from "./Controls";
import BuyMenu from "./BuyMenu";
import TowerTooltip from "./TowerTooltip";

/** Боковая панель: HUD, управление, магазин и выбранная башня. */
export default function GamePanel() {
  const scene = useAppSelector((s) => s.ui.currentScene);
  const selectedTower = useAppSelector((s) => s.ui.selectedTower);

  if (scene !== "game") {
    return (
      <aside className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 text-center">
        <p className="text-sm text-zinc-400">
          {scene === "gameover"
            ? "Раунд проигран. Кликни по экрану игры, чтобы вернуться в меню."
            : "Нажми «Играть» на экране игры."}
        </p>
        <p className="text-xs text-zinc-600">Здесь появятся деньги, раунды и магазин.</p>
      </aside>
    );
  }

  return (
    // blur после клика: иначе Space/P/F нажмут кнопку в фокусе и сработают ещё и в Phaser
    <aside
      onMouseUp={() => (document.activeElement as HTMLElement | null)?.blur?.()}
      className="flex h-full flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
    >
      <HUD />
      <Controls />
      {selectedTower ? <TowerTooltip /> : <BuyMenu />}
    </aside>
  );
}
