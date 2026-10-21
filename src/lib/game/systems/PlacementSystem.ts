import { TOWER_SLOTS, type Point } from "../data/map";
import type { TowerRuntime } from "../types";

export const TOWER_RADIUS = 16;
/** Насколько далеко от центра слота можно кликнуть. */
const SLOT_HIT_RADIUS = 26;

export type PlacementError = "no_slot" | "occupied" | "no_money";

export const PLACEMENT_ERROR_TEXT: Record<PlacementError, string> = {
  no_slot: "Башни ставятся только в слоты",
  occupied: "Слот занят",
  no_money: "Недостаточно денег",
};

export interface Slot extends Point {
  index: number;
}

/**
 * Постановка башен в фиксированные слоты (как в Kingdom Rush).
 * Чистая логика — без Phaser.
 */
export class PlacementSystem {
  readonly slots: readonly Slot[] = TOWER_SLOTS.map((p, index) => ({ ...p, index }));

  /** Ближайший слот под точкой или null. */
  slotAt(x: number, y: number): Slot | null {
    let best: Slot | null = null;
    let bestSq = SLOT_HIT_RADIUS * SLOT_HIT_RADIUS;
    for (const s of this.slots) {
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d <= bestSq) {
        best = s;
        bestSq = d;
      }
    }
    return best;
  }

  isOccupied(slot: Slot, towers: readonly TowerRuntime[]): boolean {
    return towers.some((t) => t.x === slot.x && t.y === slot.y);
  }

  check(
    x: number,
    y: number,
    towers: readonly TowerRuntime[],
    canAfford: boolean
  ): { slot: Slot | null; error: PlacementError | null } {
    const slot = this.slotAt(x, y);
    if (!slot) return { slot: null, error: "no_slot" };
    if (this.isOccupied(slot, towers)) return { slot, error: "occupied" };
    if (!canAfford) return { slot, error: "no_money" };
    return { slot, error: null };
  }
}
