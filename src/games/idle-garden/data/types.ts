/**
 * Idle Garden Tycoon — Game state types
 */

export interface PotState {
  id: number
  flowerId: string | null
  plantedAt: number       // timestamp (ms)
  isWatered: boolean
  isReady: boolean
}

export interface GameState {
  // Currency
  coins: number
  totalCoins: number
  sunPoints: number

  // Prestige
  prestigeLevel: number
  prestigeCount: number

  // Sun point upgrades (how many times SP was spent on each)
  spGrowthUpgrades: number
  spPriceUpgrades: number

  // Garden
  pots: PotState[]
  gardenLevel: number

  // Player level
  level: number
  experience: number

  // Unlocked flowers
  unlockedFlowers: string[]

  // Upgrades (upgrade_id -> level)
  upgrades: Record<string, number>

  // Decorations owned
  decorations: string[]

  // Stats
  stats: {
    totalCoinsEarned: number
    totalFlowersGrown: number
    totalHarvests: number
    totalPlayTime: number  // seconds
  }

  // Session tracking
  lastOnline: number
  sessionStart: number

  // Combo tracking
  lastHarvestTime: number
  comboCount: number
}
