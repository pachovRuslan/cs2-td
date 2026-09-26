"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { phaserConfig } from "@/lib/game/config";

/**
 * Главная страница.
 * Монтирует Phaser-игру в div#game-container.
 *
 * ВНИМАНИЕ: используется ref-guard, чтобы в dev-режиме
 * (даже при включённом StrictMode) Phaser не создался дважды.
 */

export default function Home() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;  // уже создан

    console.log("[Home] Создаём Phaser.Game...");
    gameRef.current = new Phaser.Game(phaserConfig);

    return () => {
      console.log("[Home] Уничтожаем Phaser.Game...");
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

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

      {/* Phaser-контейнер */}
      <div
        id="game-container"
        className="w-full max-w-[1024px] aspect-[1024/640] bg-black border-2 border-zinc-800 rounded-lg overflow-hidden"
      />

      <footer className="mt-4 text-xs text-zinc-600 font-mono">
        1024×640 · Phaser 4 · Next.js 16
      </footer>
    </main>
  );
}