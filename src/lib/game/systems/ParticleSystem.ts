import Phaser from "phaser";

/**
 * Простые визуальные эффекты на примитивах (без текстур).
 * Твины идут через scene.tweens, поэтому подчиняются паузе и скорости сцены.
 */
export class ParticleSystem {
  constructor(private scene: Phaser.Scene) {}

  /** Взрыв HE/C4: расширяющееся кольцо + вспышка. */
  explosion(x: number, y: number, radius: number, color = 0xffa040): void {
    const flash = this.scene.add.circle(x, y, radius * 0.4, 0xffffff, 0.9).setDepth(30);
    const ring = this.scene.add
      .circle(x, y, radius * 0.3, color, 0.45)
      .setStrokeStyle(3, color, 0.9)
      .setDepth(29);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.6,
      duration: 160,
      onComplete: () => flash.destroy(),
    });
    this.scene.tweens.add({
      targets: ring,
      scale: radius / (radius * 0.3),
      alpha: 0,
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  /** Облако смока на время действия замедления. */
  smokeCloud(x: number, y: number, radius: number, durationMs: number): void {
    const cloud = this.scene.add.circle(x, y, radius * 0.5, 0xbfbfbf, 0).setDepth(25);
    this.scene.tweens.chain({
      targets: cloud,
      tweens: [
        { scale: 2, alpha: 0.45, duration: 250, ease: "Quad.easeOut" },
        { alpha: 0.35, duration: Math.max(0, durationMs - 650) },
        { alpha: 0, duration: 400 },
      ],
      onComplete: () => cloud.destroy(),
    });
  }

  /** Попадание пули: маленькая искра. */
  hit(x: number, y: number, color = 0xffe08a): void {
    const spark = this.scene.add.circle(x, y, 3, color, 1).setDepth(28);
    this.scene.tweens.add({
      targets: spark,
      scale: 2.2,
      alpha: 0,
      duration: 140,
      onComplete: () => spark.destroy(),
    });
  }

  /** Вспышка выстрела у ствола. */
  muzzle(x: number, y: number): void {
    const f = this.scene.add.circle(x, y, 4, 0xfff2a0, 0.95).setDepth(21);
    this.scene.tweens.add({
      targets: f,
      alpha: 0,
      scale: 0.4,
      duration: 70,
      onComplete: () => f.destroy(),
    });
  }

  /** Всплывающий текст (+$, урон и т.п.). */
  floatingText(x: number, y: number, text: string, color = "#ffd34a"): void {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: "11px",
        color,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.scene.tweens.add({
      targets: t,
      y: y - 22,
      alpha: 0,
      duration: 700,
      ease: "Quad.easeOut",
      onComplete: () => t.destroy(),
    });
  }
}
