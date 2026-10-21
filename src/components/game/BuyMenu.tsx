"use client";

import { useState } from "react";
import { gameEvents, GameEvents } from "@/lib/game/events";
import { TOWERS, TOWER_ORDER } from "@/lib/game/data/towers";
import type { TowerCategory, TowerKind } from "@/lib/game/types";
import { useAppSelector } from "@/store/hooks";
import TowerIcon from "./TowerIcon";

const CATEGORY_LABEL: Record<TowerCategory, string> = {
  gun: "Оружие",
  grenade: "Гранаты",
  bomb: "Бомба",
  agent: "Агенты",
};

/** Магазин башен в стиле buy menu CS2. Клик — выбрать/снять выбор, дальше клик по слоту на карте. */
export default function BuyMenu() {
  const money = useAppSelector((s) => s.game.money);
  const selected = useAppSelector((s) => s.ui.selectedTowerType);
  const [hovered, setHovered] = useState<TowerKind | null>(null);

  const details = hovered ?? selected;

  const toggle = (id: TowerKind) =>
    gameEvents.emit(GameEvents.TOWER_SELECTED, {
      towerType: selected === id ? null : id,
    });

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Buy menu</h2>
        {selected && (
          <button
            type="button"
            onClick={() => gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null })}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Отмена (Esc)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {TOWER_ORDER.map((id, i) => {
          const t = TOWERS[id];
          const affordable = money >= t.baseCost;
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              aria-pressed={active}
              className={`group relative flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                active
                  ? "border-amber-400 bg-amber-400/15"
                  : "border-zinc-700/80 bg-zinc-800/60 hover:border-zinc-500 hover:bg-zinc-800"
              } ${affordable ? "" : "opacity-45"}`}
            >
              <TowerIcon id={id} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-zinc-100">
                  {t.name}
                </span>
                <span
                  className={`block font-mono text-xs tabular-nums ${
                    affordable ? "text-lime-400" : "text-red-400"
                  }`}
                >
                  ${t.baseCost}
                </span>
              </span>
              <span className="absolute right-1.5 top-1 font-mono text-[10px] text-zinc-500">
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 min-h-[76px] rounded-md bg-zinc-800/40 px-3 py-2 text-xs">
        {details ? (
          <TowerDetails id={details} />
        ) : (
          <p className="text-zinc-500">
            Выбери башню и кликни по свободному слоту на карте. Наведи на карточку, чтобы увидеть
            характеристики.
          </p>
        )}
      </div>
    </section>
  );
}

function TowerDetails({ id }: { id: TowerKind }) {
  const t = TOWERS[id];
  const l = t.levels[0];
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="font-semibold text-zinc-100">{t.name}</span>
        <span className="text-zinc-500">{CATEGORY_LABEL[t.category]}</span>
      </div>
      <p className="text-zinc-400">{t.description}</p>
      <div className="flex gap-3 font-mono text-zinc-300">
        {l.damage > 0 && <span>урон {l.damage}</span>}
        <span>радиус {l.range}</span>
        <span>{l.fireRate}/с</span>
      </div>
    </div>
  );
}
