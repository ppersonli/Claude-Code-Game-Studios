/**
 * Space Factory Idle — Core constants and pure math functions
 * All gameplay values are data-driven here, never hardcoded in logic.
 */

/* ── Constants ──────────────────────────────────────────────────── */

export const CONSTANTS = {
  /** Prestige threshold base (1M coins for first prestige) */
  PRESTIGE_BASE_THRESHOLD: 1_000_000,
  /** Multiplier for prestige threshold each level (10x) */
  PRESTIGE_THRESHOLD_MULT: 10,
  /** Offline earnings efficiency (50% of online rate) */
  OFFLINE_EFFICIENCY: 0.5,
  /** Maximum offline earnings cap (8 hours) */
  MAX_OFFLINE_HOURS: 8,
  /** Inflation rate per hour of play time (legacy) */
  INFLATION_RATE_PER_HOUR: 0.01,
  /** Inflation rate per minute of play time (design doc: 5%/min) */
  INFLATION_RATE_PER_MIN: 0.05,
  /** Inflation floor — prices never drop below this fraction of base price */
  INFLATION_FLOOR: 0.1,
  /** Game tick interval in ms */
  TICK_INTERVAL: 1000,
  /** Combo window in ms (3 seconds to chain clicks) */
  COMBO_WINDOW: 3000,
  /** Maximum combo multiplier */
  COMBO_MAX_MULT: 5,
  /** Base chance for random events per tick */
  EVENT_BASE_CHANCE: 0.002,
  /** Idle ratio (60% idle, 40% active as per design doc) */
  IDLE_RATIO: 0.6,
  /** Active ratio */
  ACTIVE_RATIO: 0.4,
  /** localStorage save key */
  SAVE_KEY: 'space-factory-idle-state',
  /** Auto-save interval in ms */
  AUTO_SAVE_INTERVAL: 30_000,
  /** Ad upgrade interval in ms (30 minutes) */
  AD_UPGRADE_INTERVAL: 1_800_000,
  /** Minimum ad interval in ms (5 minutes) */
  AD_MIN_INTERVAL: 300_000,
} as const

/* ── Pure Math Functions ────────────────────────────────────────── */

/**
 * Calculate exponential cost scaling.
 * cost = floor(baseCost * costMultiplier^level)
 *
 * @param baseCost - Starting cost at level 0
 * @param costMultiplier - Multiplier per level (e.g. 1.15)
 * @param level - Current level
 * @returns Floored cost value
 */
export function calcCost(baseCost: number, costMultiplier: number, level: number): number {
  return Math.floor(baseCost * Math.pow(costMultiplier, level))
}

/**
 * Calculate output per tick for a production line.
 * Design doc: output = baseOutput × (1 + factoryLevel × 0.1) × (1 + lineLevel × 0.2) × planetMult × prestigeMult
 *
 * @param baseOutput - Base output of the recipe
 * @param level - Production line level (1-based)
 * @param upgradeMult - Upgrade multiplier (1.0 = no upgrades)
 * @param planetMult - Planet multiplier (1.0 = earth)
 * @param prestigeMult - Prestige multiplier (1.0 = no prestige)
 * @param factoryLevel - Factory level (default 1)
 * @returns Output per tick (not floored, for precision)
 */
export function calcOutput(
  baseOutput: number,
  level: number,
  upgradeMult: number,
  planetMult: number,
  prestigeMult: number,
  factoryLevel: number = 1,
): number {
  const factoryMult = 1 + factoryLevel * 0.1
  const lineMult = 1 + level * 0.2
  return baseOutput * factoryMult * lineMult * upgradeMult * planetMult * prestigeMult
}

/**
 * Calculate stardust earned from prestige.
 * stardust = floor(sqrt(totalCoins / PRESTIGE_BASE_THRESHOLD))
 *
 * @param totalCoins - Total coins earned in current run
 * @returns Stardust to award (0 if below threshold)
 */
export function calcPrestigeStardust(totalCoins: number): number {
  if (totalCoins < CONSTANTS.PRESTIGE_BASE_THRESHOLD) return 0
  return Math.floor(Math.sqrt(totalCoins / CONSTANTS.PRESTIGE_BASE_THRESHOLD))
}

/**
 * Calculate prestige threshold for a given level.
 * threshold = PRESTIGE_BASE_THRESHOLD * PRESTIGE_THRESHOLD_MULT^level
 *
 * @param level - Prestige level (0-based)
 * @returns Coins required to prestige
 */
export function calcPrestigeThreshold(level: number): number {
  return CONSTANTS.PRESTIGE_BASE_THRESHOLD * Math.pow(CONSTANTS.PRESTIGE_THRESHOLD_MULT, level)
}

/**
 * Calculate inflation discount factor based on play time.
 * Design doc: currentPrice = basePrice × max(0.1, 1 - floor(totalPlayTime/60) × 0.05)
 *
 * Returns a factor between INFLATION_FLOOR (0.1) and 1.0.
 * Multiply base price by this factor to get current price.
 *
 * @param totalPlayTimeSeconds - Total play time in seconds
 * @returns Inflation discount factor (0.1 to 1.0)
 */
export function calcInflation(totalPlayTimeSeconds: number): number {
  const minutesPlayed = Math.floor(totalPlayTimeSeconds / 60)
  const discount = 1 - minutesPlayed * CONSTANTS.INFLATION_RATE_PER_MIN
  return Math.max(CONSTANTS.INFLATION_FLOOR, discount)
}
