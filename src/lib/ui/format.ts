/** Phaser-цвет 0xRRGGBB → CSS "#rrggbb". */
export function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function formatMoney(n: number): string {
  return `$${formatNumber(n)}`;
}
