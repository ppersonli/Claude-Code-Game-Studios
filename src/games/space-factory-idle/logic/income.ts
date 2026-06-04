/**
 * Income calculation module for Space Factory Idle.
 * Handles base income, inflation decay, and prestige bonuses.
 */

/** Calculate base income from production */
export function calcBaseIncome(
  productValue: number,
  workerSpeed: number,
  factoryLevel: number
): number {
  return productValue * workerSpeed * factoryLevel;
}

/** Calculate inflation multiplier (decays over time) */
export function calcInflationMultiplier(minutesPlayed: number): number {
  return 1 / (1 + 0.01 * minutesPlayed);
}

/** Calculate prestige bonus from stardust */
export function calcPrestigeBonus(stardust: number): number {
  return 1 + stardust / 1000;
}

/** Calculate final income combining all multipliers */
export function calcFinalIncome(
  productValue: number,
  workerSpeed: number,
  factoryLevel: number,
  minutesPlayed: number,
  stardust: number
): number {
  const base = calcBaseIncome(productValue, workerSpeed, factoryLevel);
  const inflation = calcInflationMultiplier(minutesPlayed);
  const prestige = calcPrestigeBonus(stardust);
  return base * inflation * prestige;
}
