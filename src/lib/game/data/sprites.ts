/**
 * Реестр спрайтов.
 *
 * SPRITE_KEYS — строковые константы (ключи), по которым Phaser
 * обращается к загруженным текстурам.
 *
 * SPRITE_PATHS — пути к PNG-файлам в /public/game/sprites/.
 * Next.js раздаёт /public/* как статику по корню.
 */

export const SPRITE_KEYS = {
  // Карта (тайлы и объекты)
  GROUND: "ground",
  WALL: "wall",
  CRATE: "crate",
  CRATE_STACK: "crate_stack",
  CAR: "car",
  SITE_A_BG: "site_a_bg",
  SITE_B_BG: "site_b_bg",
  T_SPAWN_BG: "t_spawn_bg",
  CT_SPAWN_BG: "ct_spawn_bg",

  // Башни
  TOWER_AWP: "tower_awp",
  TOWER_AK: "tower_ak",
  TOWER_P90: "tower_p90",
  TOWER_HE: "tower_he",
  TOWER_SMOKE: "tower_smoke",
  TOWER_C4: "tower_c4",
  TOWER_CT_SAS: "tower_ct_sas",
  TOWER_CT_GROM: "tower_ct_grom",

  // Враги
  ENEMY_LIGHT: "enemy_light",
  ENEMY_NORMAL: "enemy_normal",
  ENEMY_HEAVY: "enemy_heavy",
  ENEMY_ELITE: "enemy_elite",
  ENEMY_BOSS_KENNYS: "enemy_boss_kennys",
  ENEMY_BOSS_S1MPLE: "enemy_boss_s1mple",
  ENEMY_BOSS_GENERIC: "enemy_boss_generic",

  // Эффекты
  PROJECTILE_BULLET: "projectile_bullet",
  PROJECTILE_AWP: "projectile_awp",
  PARTICLE_BLOOD: "particle_blood",
  PARTICLE_SMOKE: "particle_smoke",
  PARTICLE_FIRE: "particle_fire",
  MUZZLE_FLASH: "muzzle_flash",
} as const;

export type SpriteKey = (typeof SPRITE_KEYS)[keyof typeof SPRITE_KEYS];

/**
 * Карта: ключ → путь к PNG.
 *
 * ВАЖНО: пути относительные от /public/.
 * Если файл не найден — BootScene покажет предупреждение, но игра не упадёт.
 */
export const SPRITE_PATHS: Record<SpriteKey, string> = {
  // Карта
  [SPRITE_KEYS.GROUND]: "/game/sprites/ground.png",
  [SPRITE_KEYS.WALL]: "/game/sprites/wall.png",
  [SPRITE_KEYS.CRATE]: "/game/sprites/crate.png",
  [SPRITE_KEYS.CRATE_STACK]: "/game/sprites/crate_stack.png",
  [SPRITE_KEYS.CAR]: "/game/sprites/car.png",
  [SPRITE_KEYS.SITE_A_BG]: "/game/sprites/site_a_bg.png",
  [SPRITE_KEYS.SITE_B_BG]: "/game/sprites/site_b_bg.png",
  [SPRITE_KEYS.T_SPAWN_BG]: "/game/sprites/t_spawn_bg.png",
  [SPRITE_KEYS.CT_SPAWN_BG]: "/game/sprites/ct_spawn_bg.png",

  // Башни
  [SPRITE_KEYS.TOWER_AWP]: "/game/sprites/tower_awp.png",
  [SPRITE_KEYS.TOWER_AK]: "/game/sprites/tower_ak.png",
  [SPRITE_KEYS.TOWER_P90]: "/game/sprites/tower_p90.png",
  [SPRITE_KEYS.TOWER_HE]: "/game/sprites/tower_he.png",
  [SPRITE_KEYS.TOWER_SMOKE]: "/game/sprites/tower_smoke.png",
  [SPRITE_KEYS.TOWER_C4]: "/game/sprites/tower_c4.png",
  [SPRITE_KEYS.TOWER_CT_SAS]: "/game/sprites/tower_ct_sas.png",
  [SPRITE_KEYS.TOWER_CT_GROM]: "/game/sprites/tower_ct_grom.png",

  // Враги
  [SPRITE_KEYS.ENEMY_LIGHT]: "/game/sprites/enemy_light.png",
  [SPRITE_KEYS.ENEMY_NORMAL]: "/game/sprites/enemy_normal.png",
  [SPRITE_KEYS.ENEMY_HEAVY]: "/game/sprites/enemy_heavy.png",
  [SPRITE_KEYS.ENEMY_ELITE]: "/game/sprites/enemy_elite.png",
  [SPRITE_KEYS.ENEMY_BOSS_KENNYS]: "/game/sprites/enemy_boss_kennys.png",
  [SPRITE_KEYS.ENEMY_BOSS_S1MPLE]: "/game/sprites/enemy_boss_s1mple.png",
  [SPRITE_KEYS.ENEMY_BOSS_GENERIC]: "/game/sprites/enemy_boss_generic.png",

  // Эффекты
  [SPRITE_KEYS.PROJECTILE_BULLET]: "/game/sprites/projectile_bullet.png",
  [SPRITE_KEYS.PROJECTILE_AWP]: "/game/sprites/projectile_awp.png",
  [SPRITE_KEYS.PARTICLE_BLOOD]: "/game/sprites/particle_blood.png",
  [SPRITE_KEYS.PARTICLE_SMOKE]: "/game/sprites/particle_smoke.png",
  [SPRITE_KEYS.PARTICLE_FIRE]: "/game/sprites/particle_fire.png",
  [SPRITE_KEYS.MUZZLE_FLASH]: "/game/sprites/muzzle_flash.png",
};

/**
 * Список всех спрайтов в виде массива (для итерации в BootScene).
 */
export const ALL_SPRITES: { key: SpriteKey; path: string }[] = (
  Object.keys(SPRITE_PATHS) as SpriteKey[]
).map((key) => ({ key, path: SPRITE_PATHS[key] }));