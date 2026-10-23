import type { TowerKind } from "../types";

/**
 * Реестр звуков. Файлов нет — все звуки синтезируются в AudioEngine через Web Audio API.
 */
export const SOUND_KEYS = {
  // Выстрелы
  SHOT_RIFLE: "shot_rifle",
  SHOT_SMG: "shot_smg",
  SHOT_SNIPER: "shot_sniper",
  SHOT_SUPPRESSED: "shot_suppressed",
  THROW: "throw",

  // Взрывы и гранаты
  EXPLOSION_HE: "explosion_he",
  EXPLOSION_C4: "explosion_c4",
  SMOKE_HISS: "smoke_hiss",

  // Враги и база
  ENEMY_DEATH: "enemy_death",
  BOSS_DEATH: "boss_death",
  BASE_HIT: "base_hit",

  // Башни
  PLACE_TOWER: "place_tower",
  UPGRADE_TOWER: "upgrade_tower",
  SELL_TOWER: "sell_tower",

  // Раунды и финал
  WAVE_START: "wave_start",
  WAVE_COMPLETE: "wave_complete",
  GAME_OVER: "game_over",
  VICTORY: "victory",

  // UI
  UI_CLICK: "ui_click",
  UI_ERROR: "ui_error",
} as const;

export type SoundKey = (typeof SOUND_KEYS)[keyof typeof SOUND_KEYS];

export type SoundGroup = "sfx" | "ui";

/** Звук выстрела каждой башни. */
export const TOWER_SHOT_SOUND: Record<TowerKind, SoundKey> = {
  p90: SOUND_KEYS.SHOT_SMG,
  ak: SOUND_KEYS.SHOT_RIFLE,
  awp: SOUND_KEYS.SHOT_SNIPER,
  he: SOUND_KEYS.THROW,
  smoke: SOUND_KEYS.THROW,
  c4: SOUND_KEYS.THROW,
  ct_sas: SOUND_KEYS.SHOT_SUPPRESSED,
  ct_grom: SOUND_KEYS.SHOT_SMG,
};

/** Громкость по умолчанию (0..1). */
export const DEFAULT_VOLUME = {
  master: 0.7,
  sfx: 0.8,
  ambient: 0.35,
  ui: 0.6,
} as const;
