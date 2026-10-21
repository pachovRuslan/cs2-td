import { TOWERS } from "@/lib/game/data/towers";
import type { TowerCategory, TowerKind } from "@/lib/game/types";

const BASE: Record<TowerCategory, string> = {
  gun: "/game/sprites/tower_base_gun.png",
  grenade: "/game/sprites/tower_base_grenade.png",
  bomb: "/game/sprites/tower_base_bomb.png",
  agent: "/game/sprites/tower_base_agent.png",
};

/** Иконка башни из тех же спрайтов, что и в игре: основание + боец, смотрящий вверх. */
export default function TowerIcon({ id, size }: { id: TowerKind; size: number }) {
  const cfg = TOWERS[id];
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BASE[cfg.category]} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/game/sprites/${cfg.sprite}.png`}
        alt=""
        draggable={false}
        className="absolute inset-[4%] h-[92%] w-[92%]"
        style={{ transform: cfg.category === "bomb" ? undefined : "rotate(-90deg)" }}
      />
    </span>
  );
}
