/**
 * Merge logic — combining identical towers to upgrade them.
 * Place 2 identical towers adjacent → merge into Level 2.
 * Place 2 Level 2 adjacent → merge into Level 3.
 * Max level is 3.
 */
import { MAX_TOWER_LEVEL, MERGE_RANGE, TOWER_STATS, CELL_SIZE } from './constants'
import type { Tower } from './types'

/**
 * Check if two towers can merge.
 * Requirements: same type, both below max level, within merge range.
 */
export function canMerge(towerA: Tower, towerB: Tower): boolean {
  if (towerA.id === towerB.id) return false
  if (towerA.type !== towerB.type) return false
  if (towerA.level !== towerB.level) return false
  if (towerA.level >= MAX_TOWER_LEVEL) return false
  if (towerB.level >= MAX_TOWER_LEVEL) return false

  const dx = towerA.x - towerB.x
  const dy = towerA.y - towerB.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  return dist <= MERGE_RANGE
}

/**
 * Merge two towers. Returns the merged tower (upgraded level).
 * The merged tower takes the position of towerA.
 * towerB should be removed from the game.
 */
export function mergeTowers(towerA: Tower, towerB: Tower): Tower {
  if (!canMerge(towerA, towerB)) {
    throw new Error('Cannot merge these towers')
  }

  return {
    ...towerA,
    level: towerA.level + 1,
    lastFireTime: 0, // reset fire cooldown
    target: null,
  }
}

/**
 * Get the stats for a tower at its current level.
 */
export function getTowerStats(type: string, level: number) {
  const stats = (TOWER_STATS as any)[type]
  if (!stats) throw new Error(`Unknown tower type: ${type}`)
  const idx = Math.min(level - 1, 2) // 0-indexed, max at 2 (level 3)
  return {
    name: stats.name,
    emoji: stats.emoji,
    damage: stats.damage[idx],
    range: stats.range[idx],
    fireRate: stats.fireRate[idx],
    cost: stats.cost,
    projectileColor: stats.projectileColor,
    projectileSpeed: stats.projectileSpeed,
    splashRadius: stats.splashRadius?.[idx] ?? 0,
    chainCount: stats.chainCount?.[idx] ?? 1,
    slowAmount: stats.slowAmount?.[idx] ?? 0,
    slowDuration: stats.slowDuration?.[idx] ?? 0,
  }
}

/**
 * Find all possible merge pairs in a list of towers.
 * Returns pairs of tower indices that can merge.
 */
export function findMergePairs(towers: Tower[]): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      if (canMerge(towers[i], towers[j])) {
        pairs.push([i, j])
      }
    }
  }
  return pairs
}
