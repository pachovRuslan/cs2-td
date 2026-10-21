"use client";

import { gameEvents, GameEvents } from "@/lib/game/events";
import { useAppSelector } from "@/store/hooks";
import { EARLY_CALL_BONUS_PER_SEC } from "@/lib/game/data/waves";

/** Статус волны, вызов волны раньше, пауза, скорость. */
export default function Controls() {
  const waveState = useAppSelector((s) => s.game.waveState);
  const { isPaused, gameSpeed } = useAppSelector((s) => s.ui);

  const isCountdown = waveState.phase === "countdown";
  const bonus = waveState.countdown * EARLY_CALL_BONUS_PER_SEC;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between rounded-md bg-zinc-800/60 px-3 py-2 text-sm">
        {isCountdown ? (
          <>
            <span className="text-zinc-400">До раунда {waveState.nextWave}</span>
            <span className="font-mono text-lg font-bold tabular-nums text-amber-300">
              0:{String(waveState.countdown).padStart(2, "0")}
            </span>
          </>
        ) : (
          <>
            <span className="text-zinc-400">Террористов осталось</span>
            <span className="font-mono text-lg font-bold tabular-nums text-red-400">
              {waveState.remaining}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        disabled={!isCountdown}
        onClick={() => gameEvents.emit(GameEvents.CALL_WAVE)}
        className="w-full rounded-md bg-amber-500 px-3 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {isCountdown ? `Начать раунд сейчас${bonus > 0 ? ` (+$${bonus})` : ""}` : "Раунд идёт"}
        <Kbd>Space</Kbd>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => gameEvents.emit(GameEvents.PAUSE_TOGGLED, { paused: !isPaused })}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            isPaused
              ? "bg-sky-500 text-zinc-950 hover:bg-sky-400"
              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          {isPaused ? "Продолжить" : "Пауза"}
          <Kbd>P</Kbd>
        </button>
        <button
          type="button"
          onClick={() =>
            gameEvents.emit(GameEvents.SPEED_CHANGED, { speed: gameSpeed === 1 ? 2 : 1 })
          }
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            gameSpeed === 2
              ? "bg-sky-500 text-zinc-950 hover:bg-sky-400"
              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          Скорость {gameSpeed}x
          <Kbd>F</Kbd>
        </button>
      </div>
    </section>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-1.5 rounded border border-current/30 px-1 font-mono text-[10px] font-normal opacity-60">
      {children}
    </kbd>
  );
}
