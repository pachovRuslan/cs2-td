/**
 * РљР°СЂС‚Р° Dust2 вЂ” С‚РѕРї-РґР°СѓРЅ РєРѕРѕСЂРґРёРЅР°С‚С‹.
 * РЎРµС‚РєР° 1024x640. Р’СЃРµ Р·РѕРЅС‹ вЂ” РїСЂСЏРјРѕСѓРіРѕР»СЊРЅРёРєРё {x, y, w, h}.
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