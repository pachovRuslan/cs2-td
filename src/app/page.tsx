"use client";

import dynamic from "next/dynamic";
import GamePanel from "@/components/game/GamePanel";

/**
 * Phaser загружается ТОЛЬКО на клиенте.
 * ssr: false говорит Next.js не пытаться бандлить GameCanvas на сервере.
 * Это критично, потому что Phaser обращается к window при импорте.
 */
const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
      Загрузка игры...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 p-3 lg:h-screen lg:flex-row lg:items-stretch lg:overflow-hidden">
      {/* Canvas-контейнер — Phaser вставит сюда canvas. Квадратная карта подгоняется под высоту экрана. */}
      <div
        className="aspect-[1046/1008] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-black lg:self-center"
        style={{ width: "min(100%, calc((100vh - 1.5rem) * 1046 / 1008))" }}
      >
        <GameCanvas />
      </div>

      <div className="w-full max-w-[1046px] lg:w-80 lg:max-w-none lg:shrink-0">
        <h1 className="mb-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
          CS2 Dust2 — Tower Defense
        </h1>
        <div className="lg:h-[calc(100%-1.75rem)]">
          <GamePanel />
        </div>
      </div>
    </main>
  );
}