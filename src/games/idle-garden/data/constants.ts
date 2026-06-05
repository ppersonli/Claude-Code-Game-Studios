/**
 * Idle Garden Tycoon — Core constants and pure math functions
 * All gameplay values are data-driven here, never hardcoded in logic.
 */

/* ── Constants ──────────────────────────────────────────────────── */

export const CONSTANTS = {
  /** Starting number of pots */
  STARTING_POTS: 4,

  /** Offline earnings efficiency (50% of online rate) */
  OFFLINE_EFFICIENCY: 0.5,

  /** Maximum offline hours cap */
  MAX_OFFLINE_HOURS: 8,

  /** Watering growth speed boost (20%) */
  WATER_BOOST: 0.2,

  /** Prestige threshold base (100,000 coins for first prestige) */
  PRESTIGE_BASE_THRESHOLD: 100_000,

  /** Multiplier for prestige threshold each level */
  PRESTIGE_THRESHOLD_MULT: 5,

  /** Sun points per prestige = floor(sqrt(totalCoins / PRESTIGE_BASE_THRESHOLD)) */
  SP_FORMULA_DIVISOR: 100_000,

  /** localStorage save key */
  SAVE_KEY: 'idle-garden-tycoon-state',

  /** Auto-save interval in ms */
  AUTO_SAVE_INTERVAL: 30_000,

  /** Harvest combo window in ms */
  COMBO_WINDOW: 3000,

  /** Maximum combo multiplier */
  COMBO_MAX_MULT: 5,

  /** Experience per harvest */
  XP_PER_HARVEST: 10,

  /** Base experience needed per level: base * level^1.5 */
  XP_BASE: 100,

  /** XP scaling exponent */
  XP_EXPONENT: 1.5,

  /** Game tick interval in ms */
  TICK_INTERVAL: 1000,

  /** Growth boost per sun point spent (percentage) */
  SP_GROWTH_BOOST: 0.05,

  /** Price boost per sun point spent (percentage) */
  SP_PRICE_BOOST: 0.10,

  /** Max sun point upgrades */
  SP_MAX_UPGRADES: 50,
} as const

/* ── Pure Math Functions ────────────────────────────────────────── */

/**
 * Calculate exponential cost scaling.
 * cost = floor(baseCost * costMult^level)
 */
export function calcCost(baseCost: number, costMult: number, level: number): number {
  return Math.floor(baseCost * Math.pow(costMult, level))
}

/**
 * Calculate growth progress for a planted flower.
 * Returns 0.0 to 1.0 (1.0 = ready to harvest).
 *
 * @param elapsedSeconds - Time since planting
 * @param growTime - Base grow time in seconds
 * @param isWatered - Whether pot has been watered (20% boost)
 * @param growthMult - Additional growth multiplier from sun points / prestige
 * @returns Progress from 0 to 1
 */
export function calcGrowthProgress(
  elapsedSeconds: number,
  growTime: number,
  isWatered: boolean,
  growthMult: number = 1,
): number {
  if (growTime <= 0) return 1
  const waterMult = isWatered ? 1 + CONSTANTS.WATER_BOOST : 1
  const effectiveTime = growTime / (waterMult * growthMult)
  return Math.min(1, elapsedSeconds / effectiveTime)
}

/**
 * Calculate the sell price for a flower, including prestige bonuses.
 */
export function calcSellPrice(
  basePrice: number,
  priceMult: number = 1,
): number {
  return Math.floor(basePrice * priceMult)
}

/**
 * Calculate experience required for a given level.
 * xpRequired = floor(XP_BASE * level^XP_EXPONENT)
 */
export function calcXpRequired(level: number): number {
  return Math.floor(CONSTANTS.XP_BASE * Math.pow(level, CONSTANTS.XP_EXPONENT))
}

/**
 * Calculate sun points earned from prestige.
 * sp = floor(sqrt(totalCoins / SP_FORMULA_DIVISOR))
 */
export function calcSunPoints(totalCoins: number): number {
  if (totalCoins < CONSTANTS.SP_FORMULA_DIVISOR) return 0
  return Math.floor(Math.sqrt(totalCoins / CONSTANTS.SP_FORMULA_DIVISOR))
}

/**
 * Calculate prestige threshold for a given prestige level.
 * threshold = PRESTIGE_BASE_THRESHOLD * PRESTIGE_THRESHOLD_MULT^level
 */
export function calcPrestigeThreshold(prestigeLevel: number): number {
  return CONSTANTS.PRESTIGE_BASE_THRESHOLD * Math.pow(CONSTANTS.PRESTIGE_THRESHOLD_MULT, prestigeLevel)
}

/**
 * Calculate growth multiplier from sun point upgrades.
 * mult = 1 + spGrowthUpgrades * SP_GROWTH_BOOST
 */
export function calcGrowthMultiplier(spGrowthUpgrades: number): number {
  return 1 + spGrowthUpgrades * CONSTANTS.SP_GROWTH_BOOST
}

/**
 * Calculate price multiplier from sun point upgrades.
 * mult = 1 + spPriceUpgrades * SP_PRICE_BOOST
 */
export function calcPriceMultiplier(spPriceUpgrades: number): number {
  return 1 + spPriceUpgrades * CONSTANTS.SP_PRICE_BOOST
}

/**
 * Calculate the number of pots for a given garden level.
 * pots = STARTING_POTS + gardenLevel * 3
 */
export function calcPotsForLevel(gardenLevel: number): number {
  return CONSTANTS.STARTING_POTS + gardenLevel * 3
}

/**
 * Calculate offline earnings.
 * Uses 50% efficiency, capped at MAX_OFFLINE_HOURS.
 */
export function calcOfflineEarnings(
  coinsPerSecond: number,
  offlineSeconds: number,
): number {
  const maxSeconds = CONSTANTS.MAX_OFFLINE_HOURS * 3600
  const capped = Math.min(offlineSeconds, maxSeconds)
  if (capped < 10) return 0
  return Math.floor(coinsPerSecond * capped * CONSTANTS.OFFLINE_EFFICIENCY)
}
