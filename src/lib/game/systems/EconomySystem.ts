import { gameEvents, GameEvents } from "../events";

export const START_MONEY = 800;
export const BASE_HP_MAX = 100;

/**
 * Деньги, HP базы, счёт и киллы.
 * Единственный источник правды для этих значений — React только слушает события.
 */
export class EconomySystem {
  money = START_MONEY;
  baseHp = BASE_HP_MAX;
  readonly baseHpMax = BASE_HP_MAX;
  score = 0;
  kills = 0;

  /** Вызывается один раз, когда HP базы падает до 0. */
  onBaseDestroyed?: () => void;

  /** Разослать текущее состояние (при старте сцены). */
  emitAll(): void {
    gameEvents.emit(GameEvents.MONEY_CHANGED, { money: this.money });
    gameEvents.emit(GameEvents.BASE_HP_CHANGED, {
      hp: this.baseHp,
      max: this.baseHpMax,
    });
    gameEvents.emit(GameEvents.SCORE_CHANGED, { score: this.score });
    gameEvents.emit(GameEvents.KILLS_CHANGED, { kills: this.kills });
  }

  canAfford(cost: number): boolean {
    return this.money >= cost;
  }

  /** Списать деньги. Возвращает false, если не хватает. */
  spend(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.money -= cost;
    gameEvents.emit(GameEvents.MONEY_CHANGED, { money: this.money });
    return true;
  }

  earn(amount: number): void {
    if (amount <= 0) return;
    this.money += Math.floor(amount);
    gameEvents.emit(GameEvents.MONEY_CHANGED, { money: this.money });
  }

  addScore(points: number): void {
    if (points <= 0) return;
    this.score += Math.floor(points);
    gameEvents.emit(GameEvents.SCORE_CHANGED, { score: this.score });
  }

  registerKill(reward: number, points: number): void {
    this.kills += 1;
    gameEvents.emit(GameEvents.KILLS_CHANGED, { kills: this.kills });
    this.earn(reward);
    this.addScore(points);
  }

  damageBase(amount: number): void {
    if (this.baseHp <= 0) return;
    this.baseHp = Math.max(0, this.baseHp - amount);
    gameEvents.emit(GameEvents.BASE_DAMAGED, { amount });
    gameEvents.emit(GameEvents.BASE_HP_CHANGED, {
      hp: this.baseHp,
      max: this.baseHpMax,
    });
    if (this.baseHp === 0) this.onBaseDestroyed?.();
  }

  get isBaseDestroyed(): boolean {
    return this.baseHp <= 0;
  }
}
