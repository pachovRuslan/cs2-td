/**
 * Spatial Grid вЂ” РґР»СЏ Р±С‹СЃС‚СЂРѕРіРѕ РїРѕРёСЃРєР° РІСЂР°РіРѕРІ РІРѕРєСЂСѓРі Р±Р°С€РЅРё.
 * Р’РјРµСЃС‚Рѕ O(n^2) РїСЂРѕРІРµСЂРєРё СЂР°Р·Р±РёРІР°РµРј РїРѕР»Рµ РЅР° СЏС‡РµР№РєРё.
 */

export interface SpatialItem {
  id: string;
  x: number;
  y: number;
}

export class SpatialGrid<T extends SpatialItem> {
  private cellSize: number;
  private cols: number;
  private rows: number;
  private grid: Map<string, T[]>;

  constructor(width: number, height: number, cellSize = 64) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize) + 1;
    this.rows = Math.ceil(height / cellSize) + 1;
    this.grid = new Map();
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private cellAt(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: Math.floor(x / this.cellSize),
      cy: Math.floor(y / this.cellSize),
    };
  }

  clear(): void {
    this.grid.clear();
  }

  insert(item: T): void {
    const { cx, cy } = this.cellAt(item.x, item.y);
    const k = this.key(cx, cy);
    let arr = this.grid.get(k);
    if (!arr) {
      arr = [];
      this.grid.set(k, arr);
    }
    arr.push(item);
  }

  queryRadius(x: number, y: number, radius: number): T[] {
    const result: T[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const rSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const arr = this.grid.get(this.key(cx, cy));
        if (!arr) continue;
        for (const item of arr) {
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= rSq) {
            result.push(item);
          }
        }
      }
    }
    return result;
  }

  queryNearest(x: number, y: number, radius: number): T | null {
    let best: T | null = null;
    let bestDistSq = Infinity;
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const rSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const arr = this.grid.get(this.key(cx, cy));
        if (!arr) continue;
        for (const item of arr) {
          const dx = item.x - x;
          const dy = item.y - y;
          const dSq = dx * dx + dy * dy;
          if (dSq <= rSq && dSq < bestDistSq) {
            bestDistSq = dSq;
            best = item;
          }
        }
      }
    }
    return best;
  }
}