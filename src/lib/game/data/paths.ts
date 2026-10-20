import type { PathId } from "../types";

export interface Waypoint {
  x: number;
  y: number;
}

export const PATHS: Record<PathId, Waypoint[]> = {
  long: [
    { x: 940, y: 580 },
    { x: 870, y: 540 },
    { x: 870, y: 500 },
    { x: 860, y: 400 },
    { x: 860, y: 320 },
    { x: 860, y: 240 },
    { x: 820, y: 200 },
    { x: 780, y: 200 },
    { x: 600, y: 180 },
    { x: 400, y: 150 },
    { x: 200, y: 120 },
    { x: 110, y: 80 },
  ],
  tunnels: [
    { x: 940, y: 580 },
    { x: 700, y: 560 },
    { x: 500, y: 540 },
    { x: 380, y: 520 },
    { x: 315, y: 460 },
    { x: 315, y: 380 },
    { x: 315, y: 290 },
    { x: 290, y: 230 },
    { x: 250, y: 200 },
    { x: 180, y: 180 },
    { x: 140, y: 130 },
    { x: 110, y: 80 },
  ],
  mid: [
    { x: 940, y: 580 },
    { x: 820, y: 540 },
    { x: 680, y: 500 },
    { x: 560, y: 450 },
    { x: 500, y: 380 },
    { x: 500, y: 280 },
    { x: 560, y: 230 },
    { x: 650, y: 200 },
    { x: 780, y: 200 },
    { x: 600, y: 180 },
    { x: 400, y: 150 },
    { x: 200, y: 120 },
    { x: 110, y: 80 },
  ],
};

export const PATH_COLORS: Record<PathId, number> = {
  long: 0xd4a04a,
  tunnels: 0xd44a4a,
  mid: 0x4a8ad4,
};

export const PATH_NAMES: Record<PathId, string> = {
  long: "Long A",
  tunnels: "Tunnels -> B",
  mid: "Mid -> Catwalk -> A",
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