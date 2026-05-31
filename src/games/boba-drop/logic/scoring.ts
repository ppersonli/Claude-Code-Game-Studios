/**
 * Pure scoring logic for Boba Drop.
 */

/**
 * Calculate points awarded for merging two ingredients of the given level.
 * Points = (newLevel)^2 * 10, where newLevel = level + 1.
 */
export function calculateMergeScore(level: number): number {
  const newLevel = level + 1
  return newLevel * newLevel * 10
}

/**
 * Check if a level is the maximum (cannot be merged further).
 */
export function isMaxLevel(level: number, maxLevel: number): boolean {
  return level >= maxLevel
}
