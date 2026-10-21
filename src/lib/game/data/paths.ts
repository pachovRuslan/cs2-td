import type { PathId } from "../types";

export interface Waypoint {
  x: number;
  y: number;
}

/**
 * Пути террористов от входа (низ карты) до CT-базы (вертолётная площадка).
 * Точки проведены по центру коридоров на фоне public/game/maps/dust2.jpg.
 */
export const PATHS: Record<PathId, Waypoint[]> = {
  long: [
    { x: 555, y: 1005 },
    { x: 555, y: 930 },
    { x: 600, y: 870 },
    { x: 630, y: 780 },
    { x: 615, y: 660 },
    { x: 700, y: 560 },
    { x: 760, y: 480 },
    { x: 870, y: 470 },
    { x: 900, y: 380 },
    { x: 900, y: 260 },
    { x: 820, y: 230 },
    { x: 720, y: 220 },
    { x: 640, y: 220 },
    { x: 560, y: 235 },
    { x: 400, y: 230 },
    { x: 300, y: 215 },
    { x: 240, y: 190 },
    { x: 236, y: 142 },
  ],
  tunnels: [
    { x: 555, y: 1005 },
    { x: 555, y: 930 },
    { x: 420, y: 920 },
    { x: 260, y: 960 },
    { x: 200, y: 960 },
    { x: 160, y: 890 },
    { x: 220, y: 800 },
    { x: 205, y: 750 },
    { x: 205, y: 600 },
    { x: 210, y: 540 },
    { x: 160, y: 500 },
    { x: 145, y: 420 },
    { x: 150, y: 340 },
    { x: 200, y: 270 },
    { x: 240, y: 190 },
    { x: 236, y: 142 },
  ],
  mid: [
    { x: 555, y: 1005 },
    { x: 555, y: 930 },
    { x: 600, y: 870 },
    { x: 630, y: 780 },
    { x: 630, y: 680 },
    { x: 560, y: 630 },
    { x: 500, y: 600 },
    { x: 500, y: 500 },
    { x: 485, y: 440 },
    { x: 480, y: 330 },
    { x: 470, y: 240 },
    { x: 350, y: 230 },
    { x: 280, y: 200 },
    { x: 240, y: 190 },
    { x: 236, y: 142 },
  ],
};

export const PATH_COLORS: Record<PathId, number> = {
  long: 0xd4a04a,
  tunnels: 0xd44a4a,
  mid: 0x4a8ad4,
};

export const PATH_NAMES: Record<PathId, string> = {
  long: "Long (справа)",
  tunnels: "B (слева)",
  mid: "Mid (центр)",
};

export function pathLength(pathId: PathId): number {
  const path = PATHS[pathId];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

export function pointAtProgress(
  pathId: PathId,
  progress: number
): { x: number; y: number; angle: number } {
  const path = PATHS[pathId];
  const total = pathLength(pathId);
  let target = progress * total;

  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (target <= segLen) {
      const t = segLen > 0 ? target / segLen : 0;
      return {
        x: path[i - 1].x + dx * t,
        y: path[i - 1].y + dy * t,
        angle: Math.atan2(dy, dx),
      };
    }
    target -= segLen;
  }
  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  return {
    x: last.x,
    y: last.y,
    angle: Math.atan2(last.y - prev.y, last.x - prev.x),
  };
}

export const ALL_PATHS: PathId[] = ["long", "tunnels", "mid"];