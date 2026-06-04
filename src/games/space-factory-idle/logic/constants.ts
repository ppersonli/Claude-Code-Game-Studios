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
  /** Inflation rate per hour of play time */
  INFLATION_RATE_PER_HOUR: 0.01,
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
 * output = baseOutput * levelMult * upgradeMult * planetMult * prestigeMult
 *
 * @param baseOutput - Base output of the recipe
 * @param level - Production line level (1-based)
 * @param upgradeMult - Upgrade multiplier (1.0 = no upgrades)
 * @param planetMult - Planet multiplier (1.0 = earth)
 * @param prestigeMult - Prestige multiplier (1.0 = no prestige)
 * @returns Output per tick (not floored, for precision)
 */
export function calcOutput(
  baseOutput: number,
  level: number,
  upgradeMult: number,
  planetMult: number,
  prestigeMult: number,
): number {
  const levelMult = 1 + (level - 1) * 0.5
  return baseOutput * levelMult * upgradeMult * planetMult * prestigeMult
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
 * Calculate inflation multiplier based on play time.
 * inflation = 1 + (totalPlayTimeSeconds / 3600) * INFLATION_RATE_PER_HOUR
 *
 * Higher inflation means items sell for less (prices decrease over time).
 *
 * @param totalPlayTimeSeconds - Total play time in seconds
 * @returns Inflation multiplier (1.0 = no inflation)
 */
export function calcInflation(totalPlayTimeSeconds: number): number {
  return 1 + (totalPlayTimeSeconds / 3600) * CONSTANTS.INFLATION_RATE_PER_HOUR
}
