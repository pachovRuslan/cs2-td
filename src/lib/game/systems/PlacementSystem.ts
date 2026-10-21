import { NO_BUILD_ZONES } from "../data/map";
import { ALL_PATHS, PATHS } from "../data/paths";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { closestPointOnSegment, distanceSquared } from "../utils/math";
import type { TowerRuntime } from "../types";

export const TOWER_RADIUS = 13;
/** Минимальная дистанция от центра башни до оси пути. */
const PATH_CLEARANCE = 24;
/** Минимальная дистанция между центрами башен. */
const TOWER_SPACING = TOWER_RADIUS * 2 + 2;
const EDGE_MARGIN = 30;

export type PlacementError =
  | "out_of_bounds"
  | "blocked"
  | "on_path"
  | "occupied"
  | "no_money";

export const PLACEMENT_ERROR_TEXT: Record<PlacementError, string> = {
  out_of_bounds: "За пределами карты",
  blocked: "Здесь нельзя строить",
  on_path: "Нельзя строить на пути",
  occupied: "Слишком близко к другой башне",
  no_money: "Недостаточно денег",
};

/**
 * Проверка, можно ли поставить башню в точку.
 * Чистая геометрия — без Phaser, легко тестировать.
 */
export class PlacementSystem {
  check(
    x: number,
    y: number,
    towers: readonly TowerRuntime[],
    canAfford: boolean
  ): PlacementError | null {
    if (
      x < EDGE_MARGIN ||
      y < EDGE_MARGIN ||
      x > GAME_WIDTH - EDGE_MARGIN ||
      y > GAME_HEIGHT - EDGE_MARGIN
    ) {
      return "out_of_bounds";
    }

    for (const z of NO_BUILD_ZONES) {
      if (
        x + TOWER_RADIUS > z.x &&
        x - TOWER_RADIUS < z.x + z.w &&
        y + TOWER_RADIUS > z.y &&
        y - TOWER_RADIUS < z.y + z.h
      ) {
        return "blocked";
      }
    }

    if (this.isNearPath(x, y)) return "on_path";

    const minSq = TOWER_SPACING * TOWER_SPACING;
    for (const t of towers) {
      if (distanceSquared(x, y, t.x, t.y) < minSq) return "occupied";
    }

    if (!canAfford) return "no_money";
    return null;
  }

  private isNearPath(x: number, y: number): boolean {
    const clearSq = PATH_CLEARANCE * PATH_CLEARANCE;
    for (const id of ALL_PATHS) {
      const path = PATHS[id];
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        const p = closestPointOnSegment(x, y, a.x, a.y, b.x, b.y);
        if (distanceSquared(x, y, p.x, p.y) < clearSq) return true;
      }
    }
    return false;
  }
}
