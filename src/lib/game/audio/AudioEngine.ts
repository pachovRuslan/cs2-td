import { DEFAULT_VOLUME, SOUND_KEYS, type SoundGroup, type SoundKey } from "../data/sounds";

/**
 * Процедурный звук на Web Audio API: каждый звук — короткий «рецепт»
 * из шума, осцилляторов, фильтров и огибающих. Аудиофайлы не нужны.
 *
 * Граф: источник → (фильтр) → огибающая → группа (sfx | ui | ambient) → master → выход.
 *
 * AudioContext создаётся только после жеста пользователя (политика автоплея браузеров),
 * поэтому до unlock() все play() молча игнорируются.
 */

export interface VolumeSettings {
  master: number;
  sfx: number;
  ambient: number;
  ui: number;
  muted: boolean;
}

interface Limit {
  /** Максимум одновременно звучащих копий. */
  voices: number;
  /** Минимальный интервал между запусками, мс. */
  gapMs: number;
  group: SoundGroup;
}

const LIMITS: Partial<Record<SoundKey, Limit>> = {
  [SOUND_KEYS.SHOT_RIFLE]: { voices: 6, gapMs: 35, group: "sfx" },
  [SOUND_KEYS.SHOT_SMG]: { voices: 6, gapMs: 30, group: "sfx" },
  [SOUND_KEYS.SHOT_SUPPRESSED]: { voices: 5, gapMs: 40, group: "sfx" },
  [SOUND_KEYS.SHOT_SNIPER]: { voices: 3, gapMs: 80, group: "sfx" },
  [SOUND_KEYS.THROW]: { voices: 3, gapMs: 80, group: "sfx" },
  [SOUND_KEYS.EXPLOSION_HE]: { voices: 3, gapMs: 60, group: "sfx" },
  [SOUND_KEYS.EXPLOSION_C4]: { voices: 2, gapMs: 120, group: "sfx" },
  [SOUND_KEYS.SMOKE_HISS]: { voices: 2, gapMs: 200, group: "sfx" },
  [SOUND_KEYS.ENEMY_DEATH]: { voices: 4, gapMs: 45, group: "sfx" },
  [SOUND_KEYS.BASE_HIT]: { voices: 1, gapMs: 350, group: "sfx" },
  [SOUND_KEYS.UI_CLICK]: { voices: 2, gapMs: 30, group: "ui" },
  [SOUND_KEYS.UI_ERROR]: { voices: 1, gapMs: 150, group: "ui" },
};
const DEFAULT_LIMIT: Limit = { voices: 2, gapMs: 50, group: "sfx" };

const STORAGE_KEY = "cs2-td:audio";

type Recipe = (t: number, out: AudioNode) => number; // возвращает длительность, с

class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private groups!: Record<SoundGroup | "ambient", GainNode>;
  private noise!: AudioBuffer;
  private ambientNodes: AudioNode[] = [];
  private ambientSource: AudioBufferSourceNode | null = null;

  private active = new Map<SoundKey, number>();
  private lastPlayed = new Map<SoundKey, number>();
  private paused = false;
  private settings: VolumeSettings = { ...DEFAULT_VOLUME, muted: false };
  private gestureListenersAttached = false;

  // ==========================================================================
  // ЖИЗНЕННЫЙ ЦИКЛ
  // ==========================================================================

  /** Подписаться на первый жест пользователя, чтобы разблокировать звук. Вызывать на клиенте. */
  init(): void {
    this.settings = loadSettings();
    if (this.gestureListenersAttached || typeof window === "undefined") return;
    this.gestureListenersAttached = true;
    const unlock = () => {
      this.unlock();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
  }

  /** Создать/возобновить AudioContext. Безопасно вызывать много раз. */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.buildGraph();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private buildGraph(): void {
    const ctx = this.ctx!;

    // мягкий лимитер на выходе, чтобы залпы не клиппили
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 8;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    limiter.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.connect(limiter);
    this.groups = {
      sfx: ctx.createGain(),
      ui: ctx.createGain(),
      ambient: ctx.createGain(),
    };
    for (const g of Object.values(this.groups)) g.connect(this.master);

    // 2 секунды белого шума — общий буфер для всех «шумовых» звуков
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.applyVolumes(0);
  }

  // ==========================================================================
  // НАСТРОЙКИ
  // ==========================================================================

  getSettings(): VolumeSettings {
    return { ...this.settings };
  }

  setSettings(next: Partial<VolumeSettings>): void {
    this.settings = { ...this.settings, ...next };
    saveSettings(this.settings);
    this.applyVolumes();
  }

  /** На паузе глушим игровые звуки и эмбиент, UI оставляем. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    this.applyVolumes();
  }

  private applyVolumes(ramp = 0.05): void {
    if (!this.ctx) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    const set = (node: GainNode, v: number) => node.gain.setTargetAtTime(v, t, ramp || 0.001);
    set(this.master, s.muted ? 0 : s.master);
    set(this.groups.sfx, this.paused ? 0 : s.sfx);
    set(this.groups.ambient, this.paused ? 0 : s.ambient);
    set(this.groups.ui, s.ui);
  }

  // ==========================================================================
  // ВОСПРОИЗВЕДЕНИЕ
  // ==========================================================================

  play(key: SoundKey): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || this.settings.muted) return;

    const limit = LIMITS[key] ?? DEFAULT_LIMIT;
    if (this.paused && limit.group === "sfx") return;

    const nowMs = performance.now();
    if (nowMs - (this.lastPlayed.get(key) ?? -Infinity) < limit.gapMs) return;
    if ((this.active.get(key) ?? 0) >= limit.voices) return;

    const recipe = this.recipes[key];
    if (!recipe) return;

    this.lastPlayed.set(key, nowMs);
    this.active.set(key, (this.active.get(key) ?? 0) + 1);

    const duration = recipe(ctx.currentTime + 0.005, this.groups[limit.group]);
    window.setTimeout(
      () => this.active.set(key, Math.max(0, (this.active.get(key) ?? 1) - 1)),
      duration * 1000 + 30
    );
  }

  /** Фон: ветер пустыни — коричневый шум с медленно «гуляющим» фильтром. */
  startAmbient(): void {
    const ctx = this.ctx;
    if (!ctx || this.ambientSource) return;

    const src = ctx.createBufferSource();
    src.buffer = this.brownNoise();
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.5);

    src.connect(filter).connect(gain).connect(this.groups.ambient);
    src.start();
    lfo.start();

    this.ambientSource = src;
    this.ambientNodes = [lfo, filter, gain, lfoGain];
  }

  stopAmbient(): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambientSource) return;
    const src = this.ambientSource;
    const nodes = this.ambientNodes;
    const gain = nodes[2] as GainNode;
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    window.setTimeout(() => {
      src.stop();
      (nodes[0] as OscillatorNode).stop();
      for (const n of [src, ...nodes]) n.disconnect();
    }, 1500);
    this.ambientSource = null;
    this.ambientNodes = [];
  }

  // ==========================================================================
  // СТРОИТЕЛЬНЫЕ БЛОКИ
  // ==========================================================================

  /** Небольшой случайный разброс высоты — чтобы очереди не звучали «пулемётом-копипастой». */
  private vary(amount = 0.08): number {
    return 1 + (Math.random() * 2 - 1) * amount;
  }

  private env(t: number, peak: number, attack: number, decay: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  /** Шумовой всплеск через фильтр. */
  private noiseHit(
    t: number,
    out: AudioNode,
    o: {
      type: BiquadFilterType;
      freq: number;
      freqEnd?: number;
      q?: number;
      peak: number;
      attack?: number;
      decay: number;
      rate?: number;
    }
  ): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = o.rate ?? 1;
    const f = ctx.createBiquadFilter();
    f.type = o.type;
    f.frequency.setValueAtTime(o.freq, t);
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.decay);
    f.Q.value = o.q ?? 1;
    const g = this.env(t, o.peak, o.attack ?? 0.002, o.decay);
    src.connect(f).connect(g).connect(out);
    const offset = Math.random() * 1.5;
    src.start(t, offset, (o.attack ?? 0.002) + o.decay + 0.05);
  }

  /** Тональный звук с глиссандо. */
  private tone(
    t: number,
    out: AudioNode,
    o: {
      type: OscillatorType;
      freq: number;
      freqEnd?: number;
      peak: number;
      attack?: number;
      decay: number;
    }
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t + (o.attack ?? 0.002) + o.decay);
    const g = this.env(t, o.peak, o.attack ?? 0.002, o.decay);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + (o.attack ?? 0.002) + o.decay + 0.05);
  }

  private brownNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    // сглаживаем стык петли
    const fade = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
    return buf;
  }

  // ==========================================================================
  // РЕЦЕПТЫ
  // ==========================================================================

  private recipes: Record<SoundKey, Recipe> = {
    [SOUND_KEYS.SHOT_RIFLE]: (t, out) => {
      const v = this.vary();
      this.noiseHit(t, out, { type: "bandpass", freq: 1400 * v, freqEnd: 500, q: 0.8, peak: 0.55, decay: 0.12 });
      this.noiseHit(t, out, { type: "highpass", freq: 3500, peak: 0.25, decay: 0.03 });
      this.tone(t, out, { type: "triangle", freq: 150 * v, freqEnd: 55, peak: 0.45, decay: 0.09 });
      return 0.14;
    },
    [SOUND_KEYS.SHOT_SMG]: (t, out) => {
      const v = this.vary();
      this.noiseHit(t, out, { type: "bandpass", freq: 2200 * v, freqEnd: 900, q: 1, peak: 0.38, decay: 0.065 });
      this.tone(t, out, { type: "triangle", freq: 210 * v, freqEnd: 90, peak: 0.25, decay: 0.05 });
      return 0.08;
    },
    [SOUND_KEYS.SHOT_SUPPRESSED]: (t, out) => {
      const v = this.vary();
      this.noiseHit(t, out, { type: "lowpass", freq: 1100 * v, freqEnd: 300, q: 0.9, peak: 0.42, decay: 0.07 });
      this.tone(t, out, { type: "sine", freq: 520 * v, freqEnd: 200, peak: 0.12, decay: 0.04 });
      return 0.09;
    },
    [SOUND_KEYS.SHOT_SNIPER]: (t, out) => {
      const v = this.vary(0.04);
      this.noiseHit(t, out, { type: "highpass", freq: 2500, peak: 0.5, decay: 0.04 });
      this.noiseHit(t, out, { type: "lowpass", freq: 2200 * v, freqEnd: 120, q: 0.6, peak: 0.85, decay: 0.55 });
      this.tone(t, out, { type: "sine", freq: 95 * v, freqEnd: 32, peak: 0.8, decay: 0.45 });
      // затвор
      this.noiseHit(t + 0.32, out, { type: "bandpass", freq: 3200, q: 6, peak: 0.18, decay: 0.03 });
      this.noiseHit(t + 0.42, out, { type: "bandpass", freq: 2600, q: 6, peak: 0.16, decay: 0.03 });
      return 0.6;
    },
    [SOUND_KEYS.THROW]: (t, out) => {
      this.noiseHit(t, out, {
        type: "bandpass", freq: 600, freqEnd: 2400, q: 2, peak: 0.16, attack: 0.04, decay: 0.16,
      });
      return 0.22;
    },
    [SOUND_KEYS.EXPLOSION_HE]: (t, out) => {
      const v = this.vary(0.06);
      this.noiseHit(t, out, { type: "lowpass", freq: 3000 * v, freqEnd: 90, q: 0.5, peak: 0.9, decay: 0.7 });
      this.tone(t, out, { type: "sine", freq: 110 * v, freqEnd: 28, peak: 0.9, decay: 0.6 });
      this.noiseHit(t + 0.05, out, { type: "bandpass", freq: 900, freqEnd: 200, q: 0.7, peak: 0.25, decay: 0.9, rate: 0.6 });
      return 1;
    },
    [SOUND_KEYS.EXPLOSION_C4]: (t, out) => {
      // писк таймера → взрыв
      for (let i = 0; i < 3; i++) {
        this.tone(t + i * 0.09, out, { type: "square", freq: 2100, peak: 0.08, decay: 0.04 });
      }
      const b = t + 0.3;
      this.noiseHit(b, out, { type: "lowpass", freq: 2600, freqEnd: 60, q: 0.4, peak: 1, decay: 1.3 });
      this.tone(b, out, { type: "sine", freq: 80, freqEnd: 22, peak: 1, decay: 1.1 });
      this.noiseHit(b + 0.08, out, { type: "bandpass", freq: 500, freqEnd: 120, q: 0.6, peak: 0.35, decay: 1.6, rate: 0.5 });
      return 2;
    },
    [SOUND_KEYS.SMOKE_HISS]: (t, out) => {
      this.noiseHit(t, out, { type: "bandpass", freq: 900, freqEnd: 400, q: 6, peak: 0.12, decay: 0.08 });
      this.noiseHit(t + 0.05, out, {
        type: "highpass", freq: 2600, freqEnd: 1600, peak: 0.22, attack: 0.12, decay: 1.4,
      });
      return 1.6;
    },
    [SOUND_KEYS.ENEMY_DEATH]: (t, out) => {
      const v = this.vary(0.12);
      this.tone(t, out, { type: "sine", freq: 140 * v, freqEnd: 50, peak: 0.35, decay: 0.16 });
      this.noiseHit(t, out, { type: "lowpass", freq: 900 * v, freqEnd: 200, peak: 0.22, decay: 0.12 });
      return 0.2;
    },
    [SOUND_KEYS.BOSS_DEATH]: (t, out) => {
      this.tone(t, out, { type: "sawtooth", freq: 220, freqEnd: 45, peak: 0.3, decay: 0.9 });
      this.noiseHit(t, out, { type: "lowpass", freq: 1800, freqEnd: 80, peak: 0.6, decay: 0.9 });
      this.tone(t + 0.1, out, { type: "sine", freq: 70, freqEnd: 30, peak: 0.6, decay: 0.8 });
      return 1.1;
    },
    [SOUND_KEYS.BASE_HIT]: (t, out) => {
      // тревога рации CT
      this.tone(t, out, { type: "square", freq: 880, peak: 0.12, decay: 0.09 });
      this.tone(t + 0.12, out, { type: "square", freq: 660, peak: 0.12, decay: 0.12 });
      this.noiseHit(t, out, { type: "lowpass", freq: 600, peak: 0.25, decay: 0.15 });
      return 0.3;
    },
    [SOUND_KEYS.PLACE_TOWER]: (t, out) => {
      this.noiseHit(t, out, { type: "lowpass", freq: 700, freqEnd: 150, peak: 0.45, decay: 0.12 });
      this.tone(t, out, { type: "triangle", freq: 180, freqEnd: 90, peak: 0.35, decay: 0.1 });
      // щелчок затвора
      this.noiseHit(t + 0.13, out, { type: "bandpass", freq: 2800, q: 5, peak: 0.25, decay: 0.03 });
      this.noiseHit(t + 0.2, out, { type: "bandpass", freq: 2300, q: 5, peak: 0.25, decay: 0.035 });
      return 0.3;
    },
    [SOUND_KEYS.UPGRADE_TOWER]: (t, out) => {
      [523, 659, 784, 1047].forEach((f, i) =>
        this.tone(t + i * 0.06, out, { type: "triangle", freq: f, peak: 0.2, decay: 0.18 })
      );
      return 0.45;
    },
    [SOUND_KEYS.SELL_TOWER]: (t, out) => {
      this.tone(t, out, { type: "sine", freq: 1320, peak: 0.22, decay: 0.15 });
      this.tone(t + 0.07, out, { type: "sine", freq: 1760, peak: 0.22, decay: 0.3 });
      this.noiseHit(t, out, { type: "highpass", freq: 5000, peak: 0.08, decay: 0.08 });
      return 0.4;
    },
    [SOUND_KEYS.WAVE_START]: (t, out) => {
      // щелчок рации + «го-го» сигнал
      this.noiseHit(t, out, { type: "bandpass", freq: 1800, q: 1.5, peak: 0.3, decay: 0.12 });
      [0.16, 0.32, 0.48].forEach((d) =>
        this.tone(t + d, out, { type: "square", freq: 740, peak: 0.1, decay: 0.09 })
      );
      this.noiseHit(t + 0.62, out, { type: "bandpass", freq: 1500, q: 1.5, peak: 0.2, decay: 0.08 });
      return 0.75;
    },
    [SOUND_KEYS.WAVE_COMPLETE]: (t, out) => {
      [523, 659, 784].forEach((f, i) =>
        this.tone(t + i * 0.09, out, { type: "triangle", freq: f, peak: 0.22, decay: 0.45 })
      );
      this.tone(t + 0.3, out, { type: "sine", freq: 1047, peak: 0.15, decay: 0.6 });
      return 1;
    },
    [SOUND_KEYS.GAME_OVER]: (t, out) => {
      this.tone(t, out, { type: "sawtooth", freq: 330, freqEnd: 70, peak: 0.22, attack: 0.02, decay: 1.4 });
      this.tone(t, out, { type: "sawtooth", freq: 247, freqEnd: 52, peak: 0.18, attack: 0.02, decay: 1.4 });
      this.noiseHit(t, out, { type: "lowpass", freq: 900, freqEnd: 60, peak: 0.3, decay: 1.2 });
      return 1.6;
    },
    [SOUND_KEYS.VICTORY]: (t, out) => {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
        this.tone(t + i * 0.12, out, { type: "triangle", freq: f, peak: 0.22, decay: i === 5 ? 0.9 : 0.2 })
      );
      return 1.7;
    },
    [SOUND_KEYS.UI_CLICK]: (t, out) => {
      this.tone(t, out, { type: "square", freq: 1600, freqEnd: 900, peak: 0.08, decay: 0.025 });
      return 0.05;
    },
    [SOUND_KEYS.UI_ERROR]: (t, out) => {
      this.tone(t, out, { type: "square", freq: 160, peak: 0.12, decay: 0.08 });
      this.tone(t + 0.09, out, { type: "square", freq: 130, peak: 0.12, decay: 0.12 });
      return 0.25;
    },
  };
}

// ============================================================================
// ХРАНЕНИЕ НАСТРОЕК
// ============================================================================

function clamp01(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
}

export function loadSettings(): VolumeSettings {
  const defaults: VolumeSettings = { ...DEFAULT_VOLUME, muted: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const p = JSON.parse(raw) as Partial<VolumeSettings>;
    return {
      master: clamp01(p.master, defaults.master),
      sfx: clamp01(p.sfx, defaults.sfx),
      ambient: clamp01(p.ambient, defaults.ambient),
      ui: clamp01(p.ui, defaults.ui),
      muted: typeof p.muted === "boolean" ? p.muted : false,
    };
  } catch {
    return defaults;
  }
}

function saveSettings(s: VolumeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // хранилище недоступно — настройки живут до перезагрузки
  }
}

/** Единственный экземпляр на всё приложение (Phaser и React). */
export const audio = new AudioEngineImpl();
