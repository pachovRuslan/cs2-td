"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { phaserConfig } from "@/lib/game/config";

/**
 * React-обёртка для Phaser.
 *
 * ВАЖНО: этот компонент использует `next/dynamic` с `ssr: false`
 * в src/app/page.tsx, поэтому никогда не выполняется на сервере.
 *
 * Используем ref-guard, чтобы даже при двойном mount (StrictMode)
 * Phaser не создался дважды.
 */
export default function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gameRef.current) return; // уже создан

    if (!containerRef.current) return;

    console.log("[GameCanvas] Создаём Phaser.Game...");

    // Phaser вставит canvas внутрь этого div
    gameRef.current = new Phaser.Game({
      ...phaserConfig,
      parent: containerRef.current,
    });

    return () => {
      console.log("[GameCanvas] Уничтожаем Phaser.Game...");
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-container"
      className="w-full h-full bg-black"
    />
  );
}