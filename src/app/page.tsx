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
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <header className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">
          CS2 Dust2 — Tower Defense
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Блок 2 готов: Redux + Phaser config + структуры. Сцены — заглушки.
        </p>
      </header>

      {/* Canvas-контейнер — Phaser вставит сюда canvas */}
      <div className="w-full max-w-[1024px] aspect-[1024/640] bg-black border-2 border-zinc-800 rounded-lg overflow-hidden">
        <GameCanvas />
      </div>

      <footer className="mt-4 text-xs text-zinc-600 font-mono">
        1024×640 · Phaser 4 · Next.js 16
      </footer>
    </main>
  );
}