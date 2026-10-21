"use client";

import { gameEvents, GameEvents } from "@/lib/game/events";
import { TOWERS } from "@/lib/game/data/towers";
import type { TowerKind } from "@/lib/game/types";
import { useAppSelector } from "@/store/hooks";
import { formatNumber } from "@/lib/ui/format";
import TowerIcon from "./TowerIcon";
import { Kbd } from "./Controls";

/** Панель выбранной построенной башни: характеристики, апгрейд, продажа. */
export default function TowerTooltip() {
  const info = useAppSelector((s) => s.ui.selectedTower);
  const money = useAppSelector((s) => s.game.money);

  if (!info) return null;

  const cfg = TOWERS[info.type as TowerKind];
  const cur = cfg.levels[info.level - 1];
  const next = info.level < 3 ? cfg.levels[info.level] : null;
  const canUpgrade = info.upgradeCost !== null && money >= info.upgradeCost;

  return (
    <section className="rounded-lg border border-amber-400/40 bg-zinc-800/70 p-3">
      <div className="mb-2 flex items-center gap-2">
        <TowerIcon id={info.type as TowerKind} size={40} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-zinc-100">{cfg.name}</div>
          <div className="flex gap-1" aria-label={`Уровень ${info.level} из 3`}>
            {[1, 2, 3].map((l) => (
              <span
                key={l}
                className={`h-1.5 w-5 rounded-full ${l <= info.level ? "bg-amber-400" : "bg-zinc-600"}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => gameEvents.emit(GameEvents.TOWER_DESELECTED)}
          className="rounded px-1.5 text-lg leading-none text-zinc-500 hover:text-zinc-200"
        >
          ×
        </button>
      </div>

      <dl className="mb-3 grid grid-cols-3 gap-1.5 text-center text-xs">
        {cur.damage > 0 && <StatDelta label="Урон" cur={cur.damage} next={next?.damage} />}
        <StatDelta label="Радиус" cur={cur.range} next={next?.range} />
        <StatDelta label="Выстр/с" cur={cur.fireRate} next={next?.fireRate} />
      </dl>

      <div className="mb-3 flex justify-between text-xs text-zinc-400">
        <span>
          Киллы: <b className="font-mono text-zinc-200">{formatNumber(info.kills)}</b>
        </span>
        <span>
          Урон всего: <b className="font-mono text-zinc-200">{formatNumber(info.damageDealt)}</b>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!canUpgrade}
          onClick={() => gameEvents.emit(GameEvents.UPGRADE_TOWER)}
          className="rounded-md bg-lime-500 px-2 py-2 text-xs font-bold text-zinc-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {info.upgradeCost === null ? "Макс. уровень" : `Апгрейд $${info.upgradeCost}`}
          <Kbd>U</Kbd>
        </button>
        <button
          type="button"
          onClick={() => gameEvents.emit(GameEvents.SELL_TOWER)}
          className="rounded-md bg-zinc-700 px-2 py-2 text-xs font-bold text-zinc-100 transition hover:bg-red-600"
        >
          Продать ${info.sellValue}
          <Kbd>S</Kbd>
        </button>
      </div>
    </section>
  );
}

function StatDelta({ label, cur, next }: { label: string; cur: number; next?: number }) {
  const diff = next !== undefined ? +(next - cur).toFixed(2) : 0;
  return (
    <div className="rounded bg-zinc-900/60 px-1 py-1.5">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono font-semibold text-zinc-100">
        {cur}
        {diff > 0 && <span className="ml-1 text-lime-400">+{diff}</span>}
      </dd>
    </div>
  );
}
