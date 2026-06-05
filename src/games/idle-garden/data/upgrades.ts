/**
 * Idle Garden Tycoon — Upgrade data
 * Garden-level upgrades and their costs.
 */

import { calcCost } from './constants'

export interface UpgradeData {
  id: string
  name: string
  description: string
  baseCost: number
  costMult: number
  maxLevel: number
}

export const UPGRADES: UpgradeData[] = [
  {
    id: 'garden',
    name: 'Expand Garden',
    description: 'Add more flower pots to your garden',
    baseCost: 500,
    costMult: 3.0,
    maxLevel: 5,
  },
  {
    id: 'auto-harvest',
    name: 'Auto Harvest',
    description: 'Automatically harvest mature flowers',
    baseCost: 10_000,
    costMult: 5.0,
    maxLevel: 3,
  },
  {
    id: 'auto-water',
    name: 'Auto Water',
    description: 'Automatically water all pots',
    baseCost: 2_000,
    costMult: 4.0,
    maxLevel: 3,
  },
  {
    id: 'growth-speed',
    name: 'Growth Speed',
    description: 'Flowers grow faster',
    baseCost: 5_000,
    costMult: 3.5,
    maxLevel: 5,
  },
  {
    id: 'offline-earn',
    name: 'Offline Earnings',
    description: 'Earn coins while away',
    baseCost: 3_000,
    costMult: 2.0,
    maxLevel: 1,
  },
]

/**
 * Get upgrade data by ID.
 */
export function getUpgradeById(id: string): UpgradeData | undefined {
  return UPGRADES.find(u => u.id === id)
}

/**
 * Calculate the cost of an upgrade at a given current level.
 */
export function getUpgradeCost(id: string, currentLevel: number): number {
  const upgrade = getUpgradeById(id)
  if (!upgrade) return Infinity
  return calcCost(upgrade.baseCost, upgrade.costMult, currentLevel)
}

/**
 * Check if an upgrade can be purchased.
 */
export function canUpgrade(id: string, currentLevel: number, coins: number): boolean {
  const upgrade = getUpgradeById(id)
  if (!upgrade) return false
  if (currentLevel >= upgrade.maxLevel) return false
  return coins >= getUpgradeCost(id, currentLevel)
}
