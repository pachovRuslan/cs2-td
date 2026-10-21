/**
 * Генератор спрайтов: рисует SVG кодом и рендерит в PNG (public/game/sprites/).
 *
 *   pnpm sprites
 *
 * Все юниты смотрят вправо (+x) — в игре спрайт поворачивается на угол движения/цели.
 * Стиль: мультяшный объём (радиальные градиенты) + мягкий тёмный контур, как ассеты карты.
 */
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "game", "sprites");
mkdirSync(OUT, { recursive: true });

// ============================================================================
// УТИЛИТЫ
// ============================================================================

const OUTLINE = `stroke="#24180c" stroke-opacity="0.6" stroke-width="1.1" stroke-linejoin="round"`;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => {
    const x = amt >= 0 ? v + (255 - v) * amt : v * (1 + amt);
    return Math.round(Math.max(0, Math.min(255, x)));
  };
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

let gid = 0;
/** Радиальный градиент «объёма»: блик сверху-слева, тень снизу-справа. */
function vol(defs, color, strength = 0.32) {
  const id = `g${gid++}`;
  defs.push(
    `<radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8">` +
      `<stop offset="0" stop-color="${shade(color, strength)}"/>` +
      `<stop offset="0.55" stop-color="${color}"/>` +
      `<stop offset="1" stop-color="${shade(color, -strength)}"/>` +
      `</radialGradient>`
  );
  return `url(#${id})`;
}

function svg(size, viewBox, defs, body) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">` +
    `<defs>${defs.join("")}</defs>${body}</svg>`
  );
}

function save(name, svgText, size) {
  const png = new Resvg(svgText, { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(join(OUT, `${name}.png`), png);
  console.log(`  ${name}.png`);
}

// ============================================================================
// ОРУЖИЕ (вправо, рукоять у x≈8)
// ============================================================================

function weapon(defs, kind) {
  const metal = "#2b2d30";
  const metalHi = "#4a4e54";
  const wood = "#8a5328";
  switch (kind) {
    case "ak":
      return `
        <rect x="-3" y="1" width="10" height="4" rx="1.5" fill="${wood}" ${OUTLINE}/>
        <rect x="5" y="-2.2" width="25" height="5" rx="1.2" fill="${metal}" ${OUTLINE}/>
        <rect x="18" y="-2.4" width="9" height="5.4" rx="1.5" fill="${wood}" ${OUTLINE}/>
        <path d="M12 2.5 Q14 8 11 10 L8.5 9 Q11 7 10 2.5 Z" fill="${metal}" ${OUTLINE}/>
        <rect x="29" y="-0.9" width="8" height="1.8" fill="${metal}"/>
        <rect x="6" y="-1.6" width="12" height="1" fill="${metalHi}"/>`;
    case "m4":
      return `
        <rect x="-3" y="0.5" width="10" height="4" rx="1" fill="${metal}" ${OUTLINE}/>
        <rect x="5" y="-2.4" width="24" height="5" rx="1" fill="${metal}" ${OUTLINE}/>
        <rect x="17" y="-2.8" width="11" height="5.6" rx="1" fill="#3c4046" ${OUTLINE}/>
        <rect x="11" y="2.5" width="3.5" height="7" rx="1" fill="${metal}" ${OUTLINE}/>
        <rect x="9" y="-5" width="6" height="3" rx="1" fill="#1a1a1a"/>
        <rect x="28" y="-0.9" width="8" height="1.8" fill="${metal}"/>`;
    case "mp5":
      return `
        <rect x="3" y="-2.4" width="19" height="5" rx="1.5" fill="${metal}" ${OUTLINE}/>
        <rect x="15" y="-2.8" width="7" height="5.6" rx="2" fill="#3c4046" ${OUTLINE}/>
        <path d="M11 2.5 Q12 8 10 10 L8 9 Q10 7 9 2.5 Z" fill="${metal}" ${OUTLINE}/>
        <rect x="22" y="-1" width="6" height="2" fill="${metal}"/>`;
    case "p90":
      return `
        <rect x="2" y="-3.6" width="22" height="7.4" rx="3.5" fill="#3a3e36" ${OUTLINE}/>
        <rect x="6" y="-4.6" width="12" height="2.6" rx="1.2" fill="#5a5e52"/>
        <rect x="9" y="-1.4" width="10" height="2.4" rx="1" fill="#22251f"/>
        <rect x="23" y="-0.9" width="5" height="1.8" fill="${metal}"/>`;
    case "awp":
      return `
        <rect x="-4" y="0" width="12" height="5" rx="2" fill="#4f6a3a" ${OUTLINE}/>
        <rect x="6" y="-2.6" width="26" height="5.4" rx="1.5" fill="#55703f" ${OUTLINE}/>
        <rect x="11" y="-6.4" width="15" height="3.8" rx="1.9" fill="#1c1c1c" ${OUTLINE}/>
        <rect x="9.5" y="-6" width="3" height="3" rx="1" fill="#3f3f3f"/>
        <rect x="31" y="-1" width="16" height="2" fill="${metal}"/>
        <rect x="45" y="-1.5" width="3" height="3" rx="0.8" fill="${metal}"/>`;
    case "lmg":
      return `
        <rect x="-2" y="0.5" width="9" height="4.5" rx="1.5" fill="${metal}" ${OUTLINE}/>
        <rect x="5" y="-3" width="26" height="6.5" rx="1.5" fill="${metal}" ${OUTLINE}/>
        <rect x="11" y="3" width="9" height="7" rx="1.5" fill="#4b4f3a" ${OUTLINE}/>
        <rect x="30" y="-1.1" width="9" height="2.2" fill="${metal}"/>
        <rect x="6" y="-2" width="20" height="1" fill="${metalHi}"/>`;
    case "pistol":
      return `
        <rect x="10" y="-1.8" width="11" height="3.6" rx="1" fill="${metal}" ${OUTLINE}/>
        <rect x="20" y="-0.8" width="3" height="1.6" fill="${metal}"/>`;
    case "he":
      return `<circle cx="18" cy="7" r="4.6" fill="${vol(defs, "#4f6b2f")}" ${OUTLINE}/>
        <rect x="16.6" y="1.6" width="2.8" height="2.4" rx="0.6" fill="#a0a0a0"/>
        <path d="M19.5 2.4 L23 0.5" stroke="#c8c8c8" stroke-width="1"/>`;
    case "smoke":
      return `<rect x="13" y="3.4" width="10" height="7" rx="2.6" fill="${vol(defs, "#9aa0a6")}" ${OUTLINE}/>
        <rect x="14.5" y="5.4" width="7" height="1.4" fill="#5a6066"/>
        <rect x="21.5" y="5.6" width="2.4" height="2.6" rx="0.6" fill="#c8c8c8"/>`;
    default:
      return "";
  }
}

// ============================================================================
// БОЕЦ (вид сверху, смотрит вправо)
// ============================================================================

/**
 * o: { uniform, vest, skin, glove, head, headColor, accent, weapon, backpack, shield, bulky }
 * Координаты: центр (0,0), примерный размер 64×64.
 */
function soldier(defs, o) {
  const bulk = o.bulky ? 1.18 : 1;
  const parts = [];
  const twoHanded = !["he", "smoke"].includes(o.weapon);

  // рюкзак
  if (o.backpack) {
    parts.push(
      `<rect x="${-17 * bulk}" y="-9" width="11" height="18" rx="4" fill="${vol(defs, o.backpack)}" ${OUTLINE}/>`,
      `<rect x="${-16 * bulk}" y="-3" width="9" height="2" fill="${shade(o.backpack, -0.3)}"/>`
    );
  }

  // оружие под руками
  parts.push(weapon(defs, o.weapon));

  // корпус (плечи поперёк направления)
  parts.push(
    `<ellipse cx="-2" cy="0" rx="${10.5 * bulk}" ry="${15.5 * bulk}" fill="${vol(defs, o.uniform)}" ${OUTLINE}/>`
  );
  // бронежилет
  parts.push(
    `<rect x="${-9 * bulk}" y="${-10.5 * bulk}" width="${14 * bulk}" height="${21 * bulk}" rx="4.5" fill="${vol(defs, o.vest, 0.22)}" ${OUTLINE}/>`,
    `<rect x="${1 * bulk}" y="${-7 * bulk}" width="3.4" height="5" rx="1" fill="${shade(o.vest, -0.25)}"/>`,
    `<rect x="${1 * bulk}" y="${2 * bulk}" width="3.4" height="5" rx="1" fill="${shade(o.vest, -0.25)}"/>`
  );
  if (o.accent) {
    parts.push(
      `<rect x="${-8 * bulk}" y="${-14.5 * bulk}" width="5" height="4" rx="1" fill="${o.accent}" ${OUTLINE}/>`
    );
  }

  // щит (Гром)
  if (o.shield) {
    parts.push(
      `<path d="M14 -20 Q24 -12 24 -2 L18 -2 Q18 -12 9 -17 Z" fill="${vol(defs, "#3d4b5e")}" ${OUTLINE}/>`,
      `<path d="M15 -15 Q20 -10 20.5 -5" stroke="#9fb8d8" stroke-width="1.2" fill="none" opacity="0.8"/>`
    );
  }

  // руки
  const arm = (sx, sy, hx, hy) =>
    `<path d="M${sx} ${sy} L${hx} ${hy}" stroke="#24180c" stroke-opacity="0.55" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M${sx} ${sy} L${hx} ${hy}" stroke="${shade(o.uniform, 0.12)}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<circle cx="${hx}" cy="${hy}" r="2.4" fill="${o.glove ?? o.skin}" ${OUTLINE}/>`;
  if (twoHanded) {
    const fore = o.weapon === "awp" ? 26 : o.weapon === "pistol" ? 16 : o.weapon === "p90" ? 18 : 22;
    parts.push(arm(0, 12 * bulk, 10, 2.5), arm(0, -12 * bulk, fore, -0.5));
  } else {
    parts.push(arm(0, 12 * bulk, 15, 7), arm(0, -12 * bulk, 8, -9));
  }

  // голова
  const hc = o.headColor ?? "#1c1c1c";
  const hr = o.head === "heavyhelmet" ? 10 : 8.2;
  switch (o.head) {
    case "helmet": // CT: каска + крепление ПНВ
      parts.push(
        `<circle cx="1" cy="0" r="${hr}" fill="${vol(defs, hc)}" ${OUTLINE}/>`,
        `<path d="M-6 -4.5 Q1 -9 7.5 -3" stroke="${shade(hc, -0.35)}" stroke-width="1.2" fill="none"/>`,
        `<rect x="6.5" y="-2.2" width="3.6" height="4.4" rx="1" fill="#2a2a2a" ${OUTLINE}/>`
      );
      break;
    case "gasmask": // SAS: чёрная каска + фильтр противогаза
      parts.push(
        `<circle cx="1" cy="0" r="${hr}" fill="${vol(defs, "#202226")}" ${OUTLINE}/>`,
        `<circle cx="8.6" cy="0" r="3" fill="${vol(defs, "#3a3d42")}" ${OUTLINE}/>`,
        `<path d="M4.5 -5.5 L7.5 -4" stroke="#7fb2d9" stroke-width="1.6" stroke-linecap="round"/>`,
        `<path d="M4.5 5.5 L7.5 4" stroke="#7fb2d9" stroke-width="1.6" stroke-linecap="round"/>`
      );
      break;
    case "heavyhelmet": // тяжёлый: бронешлем с визором
      parts.push(
        `<circle cx="1" cy="0" r="${hr}" fill="${vol(defs, hc)}" ${OUTLINE}/>`,
        `<path d="M5 -7 Q12 0 5 7" stroke="#1a1a1a" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
        `<path d="M6.2 -5 Q10.5 0 6.2 5" stroke="#d48a3a" stroke-width="1.2" fill="none"/>`
      );
      break;
    case "balaclava": // T: балаклава с прорезью для глаз
      parts.push(
        `<circle cx="1" cy="0" r="${hr}" fill="${vol(defs, hc)}" ${OUTLINE}/>`,
        `<rect x="5.6" y="-3.6" width="3.2" height="7.2" rx="1.4" fill="${o.skin}"/>`,
        `<circle cx="7.6" cy="-1.8" r="0.8" fill="#111"/><circle cx="7.6" cy="1.8" r="0.8" fill="#111"/>`
      );
      break;
    case "bandana": // T: открытая голова + бандана
      parts.push(
        `<circle cx="1" cy="0" r="${hr}" fill="${vol(defs, o.skin, 0.2)}" ${OUTLINE}/>`,
        `<path d="M-7 -3 Q0 -8.8 6.5 -4 L6 4 Q0 8.8 -7 3 Z" fill="${vol(defs, hc)}" ${OUTLINE}/>`,
        `<path d="M-7 1 L-12 4 M-7 -1 L-12.5 0" stroke="${hc}" stroke-width="2" stroke-linecap="round"/>`
      );
      break;
    case "cap": // элитный T: кепка задом наперёд
      parts.push(
        `<circle cx="1" cy="0" r="${hr}" fill="${vol(defs, o.skin, 0.2)}" ${OUTLINE}/>`,
        `<circle cx="0" cy="0" r="${hr - 1}" fill="${vol(defs, hc)}" ${OUTLINE}/>`,
        `<path d="M-6 -5 Q-12 0 -6 5" fill="${shade(hc, -0.3)}" ${OUTLINE}/>`
      );
      break;
  }

  return parts.join("");
}

// ============================================================================
// ПАЛИТРЫ
// ============================================================================

const SKIN = "#d9a77c";
const SKIN_DARK = "#b9825a";
const CT = { uniform: "#3a5276", vest: "#4b5d4a", skin: SKIN, glove: "#2a2a2a", head: "helmet", headColor: "#46556b" };

// ============================================================================
// БАШНИ: турели (поворачиваются) и основания (статичны)
// ============================================================================

const TOWER_TURRETS = {
  p90: { ...CT, weapon: "p90", accent: "#7fb2ff" },
  ak: { ...CT, weapon: "ak", accent: "#7fb2ff", backpack: "#55613f" },
  awp: { ...CT, weapon: "awp", vest: "#5d6b3f", headColor: "#58663a", accent: "#7fb2ff" },
  he: { ...CT, weapon: "he", vest: "#5a5040", accent: "#e06a3a", backpack: "#4a5a36" },
  smoke: { ...CT, weapon: "smoke", vest: "#5a5f66", accent: "#d0d4d8" },
  ct_sas: { uniform: "#2a2c30", vest: "#3a3d33", skin: SKIN, glove: "#1a1a1a", head: "gasmask", weapon: "m4", accent: "#c8a440", backpack: "#33352f" },
  ct_grom: { uniform: "#3f4a3c", vest: "#2f3a4e", skin: SKIN, glove: "#1a1a1a", head: "helmet", headColor: "#55606e", weapon: "mp5", shield: true, accent: "#d04040" },
};

function c4Turret(defs) {
  return `
    <rect x="-13" y="-10" width="26" height="20" rx="2.5" fill="${vol(defs, "#c9b48a", 0.2)}" ${OUTLINE}/>
    <rect x="-11" y="-8" width="7" height="16" rx="1.2" fill="${vol(defs, "#d8c9a0", 0.15)}" ${OUTLINE}/>
    <rect x="-3" y="-8" width="7" height="16" rx="1.2" fill="${vol(defs, "#d8c9a0", 0.15)}" ${OUTLINE}/>
    <rect x="5" y="-8" width="6" height="16" rx="1.2" fill="${vol(defs, "#d8c9a0", 0.15)}" ${OUTLINE}/>
    <rect x="-7" y="-4.5" width="14" height="9" rx="1.5" fill="#1c1f1c" ${OUTLINE}/>
    <rect x="-5.5" y="-3" width="11" height="4" fill="#2f6a2f"/>
    <circle cx="4" cy="3" r="1.3" fill="#ff3b30"/>
    <path d="M-13 6 Q-20 10 -18 -4" stroke="#c83a2a" stroke-width="1.6" fill="none"/>
    <path d="M-13 -6 Q-22 -6 -20 4" stroke="#2a5ac8" stroke-width="1.6" fill="none"/>
    <path d="M10 -10 L16 -18" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>`;
}

function sandbagRing(defs) {
  const bags = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * 33, y = Math.sin(a) * 33;
    const deg = (a * 180) / Math.PI + 90;
    bags.push(
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="11" ry="7" transform="rotate(${deg.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${vol(defs, "#b49a68", 0.25)}" ${OUTLINE}/>`
    );
  }
  return `<circle cx="0" cy="0" r="30" fill="${vol(defs, "#7a6644", 0.15)}"/>` + bags.join("");
}

function cratePlatform(defs) {
  return `
    <rect x="-34" y="-34" width="68" height="68" rx="4" fill="${vol(defs, "#a87442", 0.22)}" ${OUTLINE}/>
    <path d="M-34 -17 H34 M-34 0 H34 M-34 17 H34" stroke="#7a4e24" stroke-width="1.6"/>
    <rect x="-34" y="-34" width="68" height="68" rx="4" fill="none" stroke="#6a4219" stroke-width="5"/>
    <rect x="-37" y="-37" width="18" height="18" rx="2" fill="${vol(defs, "#b8844e", 0.25)}" ${OUTLINE}/>
    <path d="M-37 -37 L-19 -19 M-19 -37 L-37 -19" stroke="#6a4219" stroke-width="2"/>
    <rect x="19" y="19" width="18" height="18" rx="2" fill="${vol(defs, "#b8844e", 0.25)}" ${OUTLINE}/>
    <path d="M19 19 L37 37 M37 19 L19 37" stroke="#6a4219" stroke-width="2"/>`;
}

function hazardPlate(defs) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    pts.push(`${(Math.cos(a) * 37).toFixed(1)},${(Math.sin(a) * 37).toFixed(1)}`);
  }
  const inner = pts.map((p) => p.split(",").map((v) => (v * 0.78).toFixed(1)).join(",")).join(" ");
  const id = `hz${gid++}`;
  defs.push(
    `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="10" height="10" fill="#e8b830"/><rect width="5" height="10" fill="#1e1e1e"/></pattern>`
  );
  return `
    <polygon points="${pts.join(" ")}" fill="url(#${id})" ${OUTLINE}/>
    <polygon points="${inner}" fill="${vol(defs, "#6a6e72", 0.25)}" ${OUTLINE}/>
    <circle cx="-18" cy="-18" r="2" fill="#3a3a3a"/><circle cx="18" cy="-18" r="2" fill="#3a3a3a"/>
    <circle cx="-18" cy="18" r="2" fill="#3a3a3a"/><circle cx="18" cy="18" r="2" fill="#3a3a3a"/>`;
}

function agentPad(defs) {
  return `
    <circle cx="0" cy="0" r="37" fill="${vol(defs, "#9a9690", 0.25)}" ${OUTLINE}/>
    <circle cx="0" cy="0" r="30" fill="none" stroke="#3a6cc4" stroke-width="4"/>
    <circle cx="0" cy="0" r="30" fill="none" stroke="#9fc4ff" stroke-width="1" opacity="0.7"/>
    <path d="M0 -36 V-30 M0 30 V36 M-36 0 H-30 M30 0 H36" stroke="#3a6cc4" stroke-width="3"/>`;
}

const TOWER_BASES = {
  gun: sandbagRing,
  grenade: cratePlatform,
  bomb: hazardPlate,
  agent: agentPad,
};

// ============================================================================
// ВРАГИ (террористы)
// ============================================================================

const T_BASE = { skin: SKIN_DARK, glove: "#3a2a1a" };
const ENEMIES = {
  light: { ...T_BASE, uniform: "#8a7650", vest: "#9c8a60", head: "bandana", headColor: "#b8322a", weapon: "pistol" },
  normal: { ...T_BASE, uniform: "#6b6440", vest: "#5a5236", head: "balaclava", headColor: "#1e1e1e", weapon: "ak", backpack: "#4a4430" },
  heavy: { ...T_BASE, uniform: "#3e3b30", vest: "#2a2a26", head: "heavyhelmet", headColor: "#3a3a34", weapon: "lmg", bulky: true },
  elite: { ...T_BASE, uniform: "#5a2e2e", vest: "#3a2a22", head: "cap", headColor: "#8a1f1f", weapon: "ak", accent: "#d4a03a" },
  boss_generic: { ...T_BASE, uniform: "#2e2a24", vest: "#1e1c18", head: "heavyhelmet", headColor: "#4a1a14", weapon: "lmg", bulky: true, accent: "#e8b830", backpack: "#3a3428" },
  boss_kennys: { ...T_BASE, uniform: "#2f4a7a", vest: "#e8e8ea", head: "cap", headColor: "#1e3a6e", weapon: "awp", accent: "#e8e8ea" },
  boss_s1mple: { ...T_BASE, uniform: "#e0b830", vest: "#1e1e1e", head: "cap", headColor: "#1e1e1e", weapon: "awp", accent: "#e0b830" },
};

// ============================================================================
// ЭФФЕКТЫ / СНАРЯДЫ
// ============================================================================

const EFFECTS = {
  projectile_bullet: (d) => `<rect x="-6" y="-1.6" width="12" height="3.2" rx="1.6" fill="${vol(d, "#ffd76a")}"/>`,
  projectile_awp: (d) => `<rect x="-10" y="-1.6" width="20" height="3.2" rx="1.6" fill="${vol(d, "#fff2b0")}"/>`,
  particle_blood: (d) => `<path d="M0 -8 Q7 -6 7 0 Q8 7 0 7 Q-8 8 -7 0 Q-8 -7 0 -8 Z" fill="${vol(d, "#a3161a")}"/>`,
  particle_smoke: (d) => `<circle cx="0" cy="0" r="9" fill="${vol(d, "#c8c8c8", 0.2)}" opacity="0.9"/>`,
  particle_fire: (d) => `<path d="M0 -10 Q8 -2 5 5 Q2 10 -3 8 Q-9 4 -5 -3 Q-3 2 0 -10 Z" fill="${vol(d, "#ff8a2a")}"/>`,
  muzzle_flash: () =>
    `<path d="M-6 0 L2 -5 L0 -1.5 L10 0 L0 1.5 L2 5 Z" fill="#fff2a0" stroke="#ffb020" stroke-width="1"/>`,
};

// ============================================================================
// РЕНДЕР
// ============================================================================

console.log("Towers:");
for (const [id, o] of Object.entries(TOWER_TURRETS)) {
  gid = 0;
  const defs = [];
  save(`tower_${id}`, svg(128, "-32 -32 64 64", defs, soldier(defs, o)), 128);
}
{
  gid = 0;
  const defs = [];
  save("tower_c4", svg(128, "-32 -32 64 64", defs, c4Turret(defs)), 128);
}
for (const [id, fn] of Object.entries(TOWER_BASES)) {
  gid = 0;
  const defs = [];
  save(`tower_base_${id}`, svg(160, "-40 -40 80 80", defs, fn(defs)), 160);
}

console.log("Enemies:");
for (const [id, o] of Object.entries(ENEMIES)) {
  gid = 0;
  const defs = [];
  save(`enemy_${id}`, svg(128, "-32 -32 64 64", defs, soldier(defs, o)), 128);
}

console.log("Effects:");
for (const [id, fn] of Object.entries(EFFECTS)) {
  gid = 0;
  const defs = [];
  save(id, svg(64, "-12 -12 24 24", defs, fn(defs)), 64);
}
