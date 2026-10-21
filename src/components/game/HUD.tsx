"use client";

import { useAppSelector } from "@/store/hooks";
import { TOTAL_WAVES } from "@/lib/game/data/waves";
import { formatMoney, formatNumber } from "@/lib/ui/format";

/** Деньги, HP базы, раунд, счёт. */
export default function HUD() {
  const { money, baseHp, baseHpMax, score, kills, waveState } = useAppSelector(
    (s) => s.game
  );

  const hpRatio = baseHpMax > 0 ? baseHp / baseHpMax : 0;
  const hpColor =
    hpRatio > 0.5 ? "bg-emerald-500" : hpRatio > 0.25 ? "bg-amber-400" : "bg-red-500";

  const shownWave = waveState.phase === "countdown" ? waveState.nextWave : waveState.wave;
  const waveLabel = waveState.isEndless || shownWave > TOTAL_WAVES
    ? `${shownWave} · endless`
    : `${shownWave} / ${TOTAL_WAVES}`;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-zinc-500">Деньги</div>
          <div className="font-mono text-3xl font-bold text-lime-400 tabular-nums">
            {formatMoney(money)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500">Раунд</div>
          <div className="font-mono text-xl font-bold text-zinc-100 tabular-nums">
            {waveLabel}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-sky-300">CT-база</span>
          <span className="font-mono tabular-nums text-zinc-300">
            {baseHp} / {baseHpMax}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full ${hpColor} transition-[width] duration-300`}
            style={{ width: `${hpRatio * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Счёт" value={formatNumber(score)} />
        <Stat label="Киллы" value={formatNumber(kills)} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-800/60 px-2.5 py-1.5">
      <div className="text-zinc-500">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-zinc-100">{value}</div>
    </div>
  );
}
