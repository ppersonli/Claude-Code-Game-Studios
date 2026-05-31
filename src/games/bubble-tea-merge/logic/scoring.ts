/**
 * Calculate score for merging two ingredients of the given level.
 * The result level is level + 1, and score = (level+1)^2 * 10.
 */
export function calculateMergeScore(level: number): number {
  const newLevel = level + 1
  return newLevel * newLevel * 10
}
