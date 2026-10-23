"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setVolume, toggleMute } from "@/store/slices/uiSlice";
import { audio } from "@/lib/game/audio/AudioEngine";
import { SOUND_KEYS } from "@/lib/game/data/sounds";
import { Kbd } from "./Controls";

type Channel = "master" | "sfx" | "ambient" | "ui";

const CHANNELS: { key: Exclude<Channel, "master">; label: string }[] = [
  { key: "sfx", label: "Бой" },
  { key: "ambient", label: "Фон" },
  { key: "ui", label: "Интерфейс" },
];

/** Звук: вкл/выкл, общая громкость и (по раскрытию) громкость по каналам. */
export default function SoundControls() {
  const dispatch = useAppDispatch();
  const muted = useAppSelector((s) => s.ui.muted);
  const volume = useAppSelector((s) => s.ui.volume);
  const [open, setOpen] = useState(false);

  const change = (key: Channel, value: number) => dispatch(setVolume({ [key]: value }));

  return (
    <section className="space-y-2 border-t border-zinc-800 pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            dispatch(toggleMute());
            // клик слышен, только если звук включается
            if (muted) window.setTimeout(() => audio.play(SOUND_KEYS.UI_CLICK), 60);
          }}
          aria-pressed={!muted}
          data-silent
          className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
            muted ? "bg-zinc-800 text-zinc-500 hover:bg-zinc-700" : "bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
          }`}
        >
          {muted ? "Звук выкл" : "Звук вкл"}
          <Kbd>M</Kbd>
        </button>
        <Slider
          label="Громкость"
          value={volume.master}
          disabled={muted}
          onChange={(v) => change("master", v)}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          data-silent
          aria-label="Громкость по каналам"
          className="shrink-0 rounded px-1.5 py-1 text-xs text-zinc-500 hover:text-zinc-200"
        >
          {open ? "▴" : "▾"}
        </button>
      </div>

      {open && (
        <div className="space-y-1.5 rounded-md bg-zinc-800/40 px-3 py-2">
          {CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-zinc-400">{c.label}</span>
              <Slider
                label={c.label}
                value={volume[c.key]}
                disabled={muted}
                onChange={(v) => change(c.key, v)}
                onCommit={() => {
                  if (c.key === "ui") audio.play(SOUND_KEYS.UI_CLICK);
                  if (c.key === "sfx") audio.play(SOUND_KEYS.SHOT_RIFLE);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Slider({
  label,
  value,
  disabled,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(value * 100)}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
      className="h-1.5 min-w-0 flex-1 cursor-pointer accent-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}
