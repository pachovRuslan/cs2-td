# === НАЧАЛО block3.ps1 ===
# Блок 3: CS2 Dust2 Tower Defense
# Создаёт 8 файлов: утилиты + данные карты + 4 сцены
# Запуск: powershell -ExecutionPolicy Bypass -File .\block3.ps1

 $ErrorActionPreference = "Stop"
 $root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

function Write-GameFile($relPath, $content) {
    $fullPath = Join-Path $root $relPath
    $dir = Split-Path $fullPath -Parent
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false, $false
    [System.IO.File]::WriteAllText($fullPath, $content, $utf8NoBom)
    Write-Host "  [OK] $relPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Applying Block 3..." -ForegroundColor Cyan
Write-Host ""

# ===== 1. src/lib/game/utils/math.ts =====
Write-GameFile "src\lib\game\utils\math.ts" @'
/**
 * Математические утилиты для игры.
 * Без зависимостей — чистые функции.
 */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSquared(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleDiff(a: number, b: number): number {
  return normalizeAngle(b - a);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function closestPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { x: number; y: number; t: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: ax, y: ay, t: 0 };
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = clamp(t, 0, 1);
  return { x: lerp(ax, bx, t), y: lerp(ay, by, t), t };
}
'@

# ===== 2. src/lib/game/utils/spatialGrid.ts =====
Write-GameFile "src\lib\game\utils\spatialGrid.ts" @'
/**
 * Spatial Grid — для быстрого поиска врагов вокруг башни.
 * Вместо O(n^2) проверки разбиваем поле на ячейки.
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
'@

# ===== 3. src/lib/game/data/map.ts =====
Write-GameFile "src\lib\game\data\map.ts" @'
/**
 * Карта Dust2 — топ-даун координаты.
 * Сетка 1024x640. Все зоны — прямоугольники {x, y, w, h}.
 */

export interface RectZone {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface CrateDef {
  x: number;
  y: number;
  size: number;
}

export interface WallDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const GAME_WORLD = {
  width: 1024,
  height: 640,
} as const;

export const MAP_COLORS = {
  ground: 0x1a1816,
  groundLight: 0x2a2622,
  wall: 0x3d3a36,
  wallTop: 0x54514a,
  crate: 0x8b6f47,
  crateTop: 0xa0835a,
  car: 0x4a4a4a,
  siteA: 0x7fa05a,
  siteB: 0x5d7a3f,
  tSpawn: 0xc45a3a,
  ctSpawn: 0x3a6cc4,
  mid: 0x4a4036,
  catwalk: 0x5a4f3e,
  pathLong: 0xd4a04a,
  pathTunnels: 0xd44a4a,
  pathMid: 0x4a8ad4,
  text: 0xf5e6c8,
} as const;

export const ZONES: Record<string, RectZone> = {
  tSpawn:      { x: 880, y: 540, w: 120, h: 70,  label: "T-SPAWN" },
  ctSpawn:     { x: 60,  y: 40,  w: 130, h: 80,  label: "CT-SPAWN" },
  siteA:       { x: 700, y: 130, w: 180, h: 130, label: "A" },
  siteB:       { x: 200, y: 130, w: 160, h: 130, label: "B" },
  mid:         { x: 440, y: 280, w: 120, h: 160, label: "MID" },
  long:        { x: 820, y: 260, w: 80,  h: 280, label: "LONG A" },
  tunnels:     { x: 280, y: 260, w: 70,  h: 280, label: "TUNNELS" },
  catwalk:     { x: 560, y: 200, w: 140, h: 60,  label: "CATWALK" },
  outsideLong: { x: 720, y: 460, w: 100, h: 80,  label: "OUTSIDE LONG" },
  upperTunnels:{ x: 280, y: 260, w: 70,  h: 140, label: "UPPER TUNNELS" },
};

export const WALLS: WallDef[] = [
  { x: 0,    y: 0,    w: 1024, h: 20 },
  { x: 0,    y: 620, w: 1024, h: 20 },
  { x: 0,    y: 0,    w: 20,   h: 640 },
  { x: 1004, y: 0,    w: 20,   h: 640 },
  { x: 820,  y: 540, w: 100, h: 20 },
  { x: 900,  y: 260, w: 20,  h: 280 },
  { x: 700,  y: 260, w: 120, h: 20 },
  { x: 560,  y: 260, w: 20,  h: 60 },
  { x: 440,  y: 260, w: 20,  h: 60 },
  { x: 560,  y: 200, w: 140, h: 20 },
  { x: 360,  y: 130, w: 20,  h: 130 },
  { x: 200,  y: 260, w: 160, h: 20 },
  { x: 350,  y: 260, w: 20,  h: 280 },
  { x: 720,  y: 540, w: 80,  h: 60 },
  { x: 820,  y: 540, w: 60,  h: 60 },
  { x: 200,  y: 100, w: 100, h: 30 },
  { x: 380,  y: 80,  w: 80,  h: 50 },
];

export const CRATES_A: CrateDef[] = [
  { x: 745, y: 180, size: 26 },
  { x: 775, y: 180, size: 26 },
  { x: 760, y: 210, size: 26 },
  { x: 800, y: 230, size: 22 },
];

export const CRATES_B: CrateDef[] = [
  { x: 230, y: 180, size: 24 },
  { x: 255, y: 200, size: 24 },
  { x: 280, y: 175, size: 22 },
];

export const CAR_B = { x: 215, y: 175, w: 30, h: 50 };

export const CRATES_MID: CrateDef[] = [
  { x: 490, y: 320, size: 22 },
  { x: 490, y: 360, size: 22 },
];

export const CRATES_LONG: CrateDef[] = [
  { x: 860, y: 350, size: 24 },
  { x: 860, y: 400, size: 24 },
];

export const SAND_DOTS_COUNT = 400;

export const NO_BUILD_ZONES: RectZone[] = [
  ZONES.tSpawn,
  ZONES.ctSpawn,
  ...WALLS.map((w) => ({ x: w.x, y: w.y, w: w.w, h: w.h, label: "wall" })),
];
'@

# ===== 4. src/lib/game/data/paths.ts =====
Write-GameFile "src\lib\game\data\paths.ts" @'
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
'@

# ===== 5. src/lib/game/scenes/BootScene.ts =====
Write-GameFile "src\lib\game\scenes\BootScene.ts" @'
import Phaser from "phaser";
import { ALL_SPRITES } from "../data/sprites";
import { ALL_SOUNDS } from "../data/sounds";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * Boot Scene - загрузка всех ассетов.
 * Если файлы не найдены - НЕ падаем, продолжаем с цветными заглушками.
 */
export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;
  private errorCount = 0;
  private loadedCount = 0;
  private totalCount = 0;

  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.add.text(cx, cy - 60, "CS2 DUST2 - TOWER DEFENSE", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#f5e6c8",
    }).setOrigin(0.5);

    this.loadingText = this.add.text(cx, cy, "Loading...", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#888",
    }).setOrigin(0.5);

    const barWidth = 400;
    const barHeight = 12;
    this.add.rectangle(cx, cy + 40, barWidth + 4, barHeight + 4, 0x333333).setOrigin(0.5);
    this.loadingBar = this.add.rectangle(
      cx - barWidth / 2,
      cy + 40,
      0,
      barHeight,
      0x4a8ad4
    ).setOrigin(0, 0.5);

    for (const { key, path } of ALL_SPRITES) {
      this.load.image(key, path);
    }

    for (const { key, path } of ALL_SOUNDS) {
      this.load.audio(key, path);
    }

    this.totalCount = ALL_SPRITES.length + ALL_SOUNDS.length;

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      this.errorCount++;
      console.warn(`[BootScene] Missing: ${file.key} (${file.url})`);
    });

    this.load.on("load", () => {
      this.loadedCount++;
      const progress = this.loadedCount / this.totalCount;
      this.loadingBar.width = 400 * progress;
      this.loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    });
  }

  create(): void {
    this.loadingBar.width = 400;
    this.loadingText.setText(
      `Loaded ${this.loadedCount}/${this.totalCount}` +
      (this.errorCount > 0 ? ` (errors: ${this.errorCount})` : "")
    );

    console.log(
      `[BootScene] Loaded ${this.loadedCount}/${this.totalCount}. Errors: ${this.errorCount}.`
    );

    if (this.errorCount > 0) {
      console.warn(
        "[BootScene] Some assets missing. Game will use colored placeholders."
      );
    }

    this.time.delayedCall(800, () => {
      this.scene.start("MenuScene");
    });
  }
}
'@

# ===== 6. src/lib/game/scenes/MenuScene.ts =====
Write-GameFile "src\lib\game\scenes\MenuScene.ts" @'
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameEvents, GameEvents } from "../events";
import { MAP_COLORS, ZONES } from "../data/map";
import { ALL_PATHS, PATHS, PATH_COLORS, PATH_NAMES } from "../data/paths";

/**
 * Menu Scene - главное меню.
 * Фон-превью карты Dust2, заголовок, кнопки Играть/Как играть/Рекорды.
 */
export class MenuScene extends Phaser.Scene {
  private playBtn!: Phaser.GameObjects.Container;
  private helpBtn!: Phaser.GameObjects.Container;
  private recordsBtn!: Phaser.GameObjects.Container;
  private audioUnlocked = false;

  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.drawMapPreview();

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setOrigin(0);

    this.add.text(GAME_WIDTH / 2, 110, "CS2 DUST2", {
      fontFamily: "monospace",
      fontSize: "56px",
      color: "#f5e6c8",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 165, "TOWER DEFENSE", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#d4a04a",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, "Защити CT-spawn от террористов", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#888888",
    }).setOrigin(0.5);

    this.playBtn = this.createButton(GAME_WIDTH / 2, 310, "ИГРАТЬ", 0x4a8ad4, () => {
      this.unlockAudio();
      this.scene.start("GameScene");
      this.scene.launch("UIScene");
      gameEvents.emit(GameEvents.TOWER_SELECTED, { towerType: null });
    });

    this.helpBtn = this.createButton(GAME_WIDTH / 2, 380, "КАК ИГРАТЬ", 0x5a5a5a, () => {
      this.unlockAudio();
      this.showHelp();
    });

    this.recordsBtn = this.createButton(GAME_WIDTH / 2, 450, "РЕКОРДЫ", 0x5a5a5a, () => {
      this.unlockAudio();
      this.showRecords();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "Block 3 - Phaser 4 - Next.js 16", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#444444",
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private drawMapPreview(): void {
    const g = this.add.graphics();
    g.setAlpha(0.35);

    for (const [key, zone] of Object.entries(ZONES)) {
      let color = MAP_COLORS.groundLight;
      if (key === "tSpawn") color = MAP_COLORS.tSpawn;
      else if (key === "ctSpawn") color = MAP_COLORS.ctSpawn;
      else if (key === "siteA") color = MAP_COLORS.siteA;
      else if (key === "siteB") color = MAP_COLORS.siteB;
      else if (key === "mid" || key === "catwalk") color = MAP_COLORS.catwalk;
      else if (key === "long" || key === "tunnels") color = MAP_COLORS.mid;
      g.fillStyle(color, 0.6);
      g.fillRect(zone.x, zone.y, zone.w, zone.h);
    }

    for (const pathId of ALL_PATHS) {
      const path = PATHS[pathId];
      const color = PATH_COLORS[pathId];
      g.lineStyle(3, color, 0.7);
      g.beginPath();
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        g.lineTo(path[i].x, path[i].y);
      }
      g.strokePath();
    }
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const width = 240;
    const height = 50;

    const bg = this.add.rectangle(0, 0, width, height, color, 0.85)
      .setStrokeStyle(2, 0xffffff, 0.3);

    const text = this.add.text(0, 0, label, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      bg.setScale(1.05);
      bg.setFillStyle(color, 1);
      bg.setStrokeStyle(3, 0xffffff, 0.6);
    });

    container.on("pointerout", () => {
      bg.setScale(1);
      bg.setFillStyle(color, 0.85);
      bg.setStrokeStyle(2, 0xffffff, 0.3);
    });

    container.on("pointerdown", onClick);

    return container;
  }

  private unlockAudio(): void {
    if (this.audioUnlocked) return;
    if (this.sound.context.state === "suspended") {
      this.sound.context.resume().then(() => {
        console.log("[MenuScene] AudioContext unlocked.");
      });
    }
    this.audioUnlocked = true;
  }

  private showHelp(): void {
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9)
      .setOrigin(0)
      .setInteractive();

    const lines = [
      "КАК ИГРАТЬ",
      "",
      "1. Выбери башню в Buy Menu (внизу экрана).",
      "2. Кликни по карте, чтобы поставить башню.",
      "3. Башни стреляют по террористам автоматически.",
      "4. За каждый килл получаешь деньги $.",
      "5. Между волнами — улучшай башни или ставь новые.",
      "",
      "Цель: не дать террористам дойти до CT-spawn.",
      "",
      "Террористы идут 3 путями:",
      "  - Long A (оранжевый)",
      "  - Tunnels -> B (красный)",
      "  - Mid -> Catwalk -> A (синий)",
      "",
      "После 15 волны начинается endless-режим.",
      "",
      "Клик в любом месте, чтобы закрыть.",
    ];

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, lines, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#f5e6c8",
      align: "center",
      lineSpacing: 8,
    }).setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      txt.destroy();
    });
  }

  private showRecords(): void {
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9)
      .setOrigin(0)
      .setInteractive();

    const highScore = Number(localStorage.getItem("cs2-td:highscore") || "0");
    const totalKills = Number(localStorage.getItem("cs2-td:total-kills") || "0");
    const maxWave = Number(localStorage.getItem("cs2-td:max-wave") || "0");

    const lines = [
      "РЕКОРДЫ",
      "",
      `Лучший счёт:     ${highScore}`,
      `Всего киллов:    ${totalKills}`,
      `Макс. волна:     ${maxWave}`,
      "",
      "(Пока рекордов нет — сыграй первую игру!)",
      "",
      "Клик в любом месте, чтобы закрыть.",
    ];

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, lines, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#f5e6c8",
      align: "center",
      lineSpacing: 10,
    }).setOrigin(0.5);

    overlay.on("pointerdown", () => {
      overlay.destroy();
      txt.destroy();
    });
  }
}
'@

# ===== 7. src/lib/game/scenes/UIScene.ts =====
Write-GameFile "src\lib\game\scenes\UIScene.ts" @'
import Phaser from "phaser";

/**
 * UI Scene - оверлей поверх GameScene.
 * Запускается параллельно через scene.launch("UIScene") из MenuScene.
 * В Блоке 3 — пустая. Будет использоваться позже для всплывающих "+$"
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create(): void {
    // пока пусто — UI рендерится в React (HUD.tsx)
  }
}
'@

# ===== 8. src/lib/game/scenes/GameScene.ts =====
Write-GameFile "src\lib\game\scenes\GameScene.ts" @'
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import {
  MAP_COLORS,
  ZONES,
  WALLS,
  CRATES_A,
  CRATES_B,
  CRATES_MID,
  CRATES_LONG,
  CAR_B,
  SAND_DOTS_COUNT,
} from "../data/map";
import { ALL_PATHS, PATHS, PATH_COLORS, PATH_NAMES } from "../data/paths";

/**
 * Game Scene - основная сцена геймплея.
 * В Блоке 3: рендер карты Dust2 (top-down).
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    console.log("[GameScene] Creating scene...");

    this.cameras.main.setBackgroundColor("#0a0a0a");

    this.drawGround();
    this.drawZones();
    this.drawPaths();
    this.drawWalls();
    this.drawCratesAndCar();
    this.drawLabels();
    this.drawInfoPanel();

    this.cameras.main.fadeIn(300, 0, 0, 0);

    console.log("[GameScene] Dust2 map rendered.");
  }

  private drawGround(): void {
    const g = this.add.graphics();

    g.fillGradientStyle(
      MAP_COLORS.groundLight,
      MAP_COLORS.groundLight,
      MAP_COLORS.ground,
      MAP_COLORS.ground,
      1
    );
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    g.fillStyle(0x6a5a3a, 0.4);
    for (let i = 0; i < SAND_DOTS_COUNT; i++) {
      const x = (i * 73 + 17) % GAME_WIDTH;
      const y = (i * 137 + 23) % GAME_HEIGHT;
      g.fillRect(x, y, 2, 2);
    }
  }

  private drawZones(): void {
    const g = this.add.graphics();

    g.fillStyle(MAP_COLORS.ctSpawn, 0.7);
    g.fillRect(ZONES.ctSpawn.x, ZONES.ctSpawn.y, ZONES.ctSpawn.w, ZONES.ctSpawn.h);
    g.lineStyle(2, MAP_COLORS.ctSpawn, 1);
    g.strokeRect(ZONES.ctSpawn.x, ZONES.ctSpawn.y, ZONES.ctSpawn.w, ZONES.ctSpawn.h);

    g.fillStyle(MAP_COLORS.tSpawn, 0.7);
    g.fillRect(ZONES.tSpawn.x, ZONES.tSpawn.y, ZONES.tSpawn.w, ZONES.tSpawn.h);
    g.lineStyle(2, MAP_COLORS.tSpawn, 1);
    g.strokeRect(ZONES.tSpawn.x, ZONES.tSpawn.y, ZONES.tSpawn.w, ZONES.tSpawn.h);

    g.fillStyle(MAP_COLORS.siteA, 0.45);
    g.fillRect(ZONES.siteA.x, ZONES.siteA.y, ZONES.siteA.w, ZONES.siteA.h);
    g.lineStyle(2, MAP_COLORS.siteA, 0.8);
    g.strokeRect(ZONES.siteA.x, ZONES.siteA.y, ZONES.siteA.w, ZONES.siteA.h);

    g.fillStyle(MAP_COLORS.siteB, 0.45);
    g.fillRect(ZONES.siteB.x, ZONES.siteB.y, ZONES.siteB.w, ZONES.siteB.h);
    g.lineStyle(2, MAP_COLORS.siteB, 0.8);
    g.strokeRect(ZONES.siteB.x, ZONES.siteB.y, ZONES.siteB.w, ZONES.siteB.h);

    g.fillStyle(MAP_COLORS.mid, 0.5);
    g.fillRect(ZONES.mid.x, ZONES.mid.y, ZONES.mid.w, ZONES.mid.h);
    g.fillStyle(MAP_COLORS.catwalk, 0.5);
    g.fillRect(ZONES.catwalk.x, ZONES.catwalk.y, ZONES.catwalk.w, ZONES.catwalk.h);

    g.fillStyle(MAP_COLORS.mid, 0.4);
    g.fillRect(ZONES.long.x, ZONES.long.y, ZONES.long.w, ZONES.long.h);
    g.fillRect(ZONES.tunnels.x, ZONES.tunnels.y, ZONES.tunnels.w, ZONES.tunnels.h);
  }

  private drawPaths(): void {
    for (const pathId of ALL_PATHS) {
      const path = PATHS[pathId];
      const color = PATH_COLORS[pathId];

      const g = this.add.graphics();

      g.lineStyle(24, color, 0.2);
      g.beginPath();
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
      g.strokePath();

      g.lineStyle(2, color, 0.9);
      g.beginPath();
      g.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
      g.strokePath();

      for (let i = 1; i < path.length - 1; i += 2) {
        const midX = (path[i].x + path[i + 1].x) / 2;
        const midY = (path[i].y + path[i + 1].y) / 2;
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / len, ny = dy / len;

        g.fillStyle(color, 0.9);
        g.beginPath();
        g.moveTo(midX + nx * 6, midY + ny * 6);
        g.lineTo(midX - nx * 4 + ny * 4, midY - ny * 4 - nx * 4);
        g.lineTo(midX - nx * 4 - ny * 4, midY - ny * 4 + nx * 4);
        g.closePath();
        g.fillPath();
      }

      const colorHex = "#" + color.toString(16).padStart(6, "0");
      this.add.text(path[1].x + 15, path[1].y - 10, PATH_NAMES[pathId], {
        fontFamily: "monospace",
        fontSize: "10px",
        color: colorHex,
        fontStyle: "bold",
      }).setOrigin(0, 0.5);
    }
  }

  private drawWalls(): void {
    const g = this.add.graphics();
    g.fillStyle(MAP_COLORS.wall, 1);
    for (const w of WALLS) {
      g.fillRect(w.x, w.y, w.w, w.h);
    }
    g.fillStyle(MAP_COLORS.wallTop, 0.5);
    for (const w of WALLS) {
      g.fillRect(w.x, w.y, w.w, 2);
    }
  }

  private drawCratesAndCar(): void {
    const g = this.add.graphics();

    for (const c of CRATES_A) this.drawCrate(g, c.x, c.y, c.size);
    for (const c of CRATES_B) this.drawCrate(g, c.x, c.y, c.size);
    for (const c of CRATES_MID) this.drawCrate(g, c.x, c.y, c.size);
    for (const c of CRATES_LONG) this.drawCrate(g, c.x, c.y, c.size);

    g.fillStyle(MAP_COLORS.car, 1);
    g.fillRect(CAR_B.x, CAR_B.y, CAR_B.w, CAR_B.h);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(CAR_B.x + 4, CAR_B.y + 4, CAR_B.w - 8, 12);
    g.lineStyle(2, 0x1a1a1a, 1);
    g.strokeRect(CAR_B.x, CAR_B.y, CAR_B.w, CAR_B.h);
  }

  private drawCrate(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number
  ): void {
    g.fillStyle(MAP_COLORS.crate, 1);
    g.fillRect(x - size / 2, y - size / 2, size, size);
    g.lineStyle(2, MAP_COLORS.crateTop, 1);
    g.strokeRect(x - size / 2, y - size / 2, size, size);
    g.beginPath();
    g.moveTo(x - size / 2, y - size / 2);
    g.lineTo(x + size / 2, y + size / 2);
    g.moveTo(x + size / 2, y - size / 2);
    g.lineTo(x - size / 2, y + size / 2);
    g.strokePath();
  }

  private drawLabels(): void {
    this.add.text(
      ZONES.siteA.x + ZONES.siteA.w / 2,
      ZONES.siteA.y + ZONES.siteA.h / 2,
      "A",
      {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.siteB.x + ZONES.siteB.w / 2,
      ZONES.siteB.y + ZONES.siteB.h / 2,
      "B",
      {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.tSpawn.x + ZONES.tSpawn.w / 2,
      ZONES.tSpawn.y + ZONES.tSpawn.h / 2,
      "T-SPAWN",
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.ctSpawn.x + ZONES.ctSpawn.w / 2,
      ZONES.ctSpawn.y + ZONES.ctSpawn.h / 2,
      "CT-SPAWN",
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    ).setOrigin(0.5);

    this.add.text(
      ZONES.mid.x + ZONES.mid.w / 2,
      ZONES.mid.y + ZONES.mid.h / 2,
      "MID",
      {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#aaaaaa",
      }
    ).setOrigin(0.5);
  }

  private drawInfoPanel(): void {
    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 20,
      "Блок 3: карта Dust2 готова - Башни и враги появятся в Блоке 4",
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#666666",
      }
    ).setOrigin(0.5);
  }
}
'@

Write-Host ""
Write-Host "Block 3 applied! All 8 files created." -ForegroundColor Cyan
Write-Host "Next: pnpm dev" -ForegroundColor Yellow
Write-Host ""
# === КОНЕЦ block3.ps1 ===