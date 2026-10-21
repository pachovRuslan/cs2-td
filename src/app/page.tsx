"use client";

import dynamic from "next/dynamic";

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
    <main className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-2 p-2 overflow-hidden">
      <header className="text-center shrink-0">
        <h1 className="text-lg font-bold text-zinc-100">CS2 Dust2 — Tower Defense</h1>
      </header>

      {/* Canvas-контейнер — Phaser вставит сюда canvas. Ширина подгоняется под высоту экрана. */}
      <div
        className="aspect-[1046/1008] bg-black border border-zinc-800 rounded-lg overflow-hidden"
        style={{ width: "min(100%, calc((100vh - 3.5rem) * 1046 / 1008))" }}
      >
        <GameCanvas />
      </div>
    </main>
  );
}