/** Core game constants — all tuning knobs */

export const CONSTANTS = {
  SAVE_KEY: 'dungeon-defense-idle-state',
  TICK_INTERVAL: 1000,
  PRESTIGE_BASE_THRESHOLD: 1_000_000,
  PRESTIGE_THRESHOLD_MULT: 10,
  PRESTIGE_ENERGY_DIVISOR: 1_000_000,
  PRESTIGE_BONUS_PER_ENERGY: 0.1,
  OFFLINE_EFFICIENCY: 0.5,
  MAX_OFFLINE_HOURS: 8,
  AD_WAVE_INTERVAL: 10,
  AD_MIN_INTERVAL: 60,
  COMBO_WINDOW: 3000,
  GRID_COLS: 10,
  GRID_ROWS: 8,
  CELL_SIZE: 48,
  TOWER_MAX_LEVEL: 10,
} as const

export function calcCost(baseCost: number, costMult: number, level: number): number {
  return Math.floor(baseCost * Math.pow(costMult, level))
}

export function calcDamage(baseDamage: number, level: number, heroMult: number, prestigeMult: number): number {
  const levelMult = 1 + (level - 1) * 0.15
  return baseDamage * levelMult * heroMult * prestigeMult
}

export function calcMonsterHp(baseHp: number, waveNumber: number): number {
  return Math.floor(baseHp * Math.pow(1.25, waveNumber))
}

export function calcWaveGold(baseGold: number, waveNumber: number): number {
  return Math.floor(baseGold * Math.pow(1.15, waveNumber))
}

export function calcWaveMonsterCount(waveNumber: number): number {
  return 5 + Math.floor(waveNumber * 0.5)
}

export function calcPrestigeDarkEnergy(totalCoins: number): number {
  return Math.floor(Math.sqrt(totalCoins / CONSTANTS.PRESTIGE_ENERGY_DIVISOR))
}

export function calcPrestigeThreshold(prestigeLevel: number): number {
  return CONSTANTS.PRESTIGE_BASE_THRESHOLD * Math.pow(CONSTANTS.PRESTIGE_THRESHOLD_MULT, prestigeLevel)
}
