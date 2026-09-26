export const SOUND_KEYS = {
  // Выстрелы
  AWP_SHOT: "awp_shot",
  AK_SHOT: "ak_shot",
  P90_SHOT: "p90_shot",

  // Взрывы
  HE_EXPLOSION: "he_explosion",
  C4_EXPLOSION: "c4_explosion",

  // Враги
  ENEMY_DEATH: "enemy_death",
  ENEMY_HURT: "enemy_hurt",

  // UI
  UI_CLICK: "ui_click",
  UI_HOVER: "ui_hover",

  // Башни
  PLACE_TOWER: "place_tower",
  UPGRADE_TOWER: "upgrade_tower",
  SELL_TOWER: "sell_tower",

  // Волны
  WAVE_START: "wave_start",
  WAVE_COMPLETE: "wave_complete",

  // Финал
  GAME_OVER: "game_over",
  VICTORY: "victory",

  // Фон
  AMBIENT: "ambient",
} as const;

export type SoundKey = (typeof SOUND_KEYS)[keyof typeof SOUND_KEYS];

export const SOUND_PATHS: Record<SoundKey, string> = {
  [SOUND_KEYS.AWP_SHOT]: "/game/sounds/awp_shot.mp3",
  [SOUND_KEYS.AK_SHOT]: "/game/sounds/ak_shot.mp3",
  [SOUND_KEYS.P90_SHOT]: "/game/sounds/p90_shot.mp3",
  [SOUND_KEYS.HE_EXPLOSION]: "/game/sounds/he_explosion.mp3",
  [SOUND_KEYS.C4_EXPLOSION]: "/game/sounds/c4_explosion.mp3",
  [SOUND_KEYS.ENEMY_DEATH]: "/game/sounds/enemy_death.mp3",
  [SOUND_KEYS.ENEMY_HURT]: "/game/sounds/enemy_hurt.mp3",
  [SOUND_KEYS.UI_CLICK]: "/game/sounds/ui_click.mp3",
  [SOUND_KEYS.UI_HOVER]: "/game/sounds/ui_hover.mp3",
  [SOUND_KEYS.PLACE_TOWER]: "/game/sounds/place_tower.mp3",
  [SOUND_KEYS.UPGRADE_TOWER]: "/game/sounds/upgrade_tower.mp3",
  [SOUND_KEYS.SELL_TOWER]: "/game/sounds/sell_tower.mp3",
  [SOUND_KEYS.WAVE_START]: "/game/sounds/wave_start.mp3",
  [SOUND_KEYS.WAVE_COMPLETE]: "/game/sounds/wave_complete.mp3",
  [SOUND_KEYS.GAME_OVER]: "/game/sounds/game_over.mp3",
  [SOUND_KEYS.VICTORY]: "/game/sounds/victory.mp3",
  [SOUND_KEYS.AMBIENT]: "/game/sounds/ambient.mp3",
};

export const ALL_SOUNDS: { key: SoundKey; path: string }[] = (
  Object.keys(SOUND_PATHS) as SoundKey[]
).map((key) => ({ key, path: SOUND_PATHS[key] }));

/**
 * Настройки громкости по группам.
 * Phaser.Sound управляет через setVolume на каждом play().
 */
export const VOLUME = {
  MASTER: 0.7,
  SFX: 0.8,
  AMBIENT: 0.3,
  UI: 0.5,
} as const;