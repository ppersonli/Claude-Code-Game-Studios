/**
 * Score calculation for Number Merge 2048.
 * Points = merged tile value (2+2→4 earns 4 points).
 */

export function calculateMergePoints(mergedValue: number): number {
  return mergedValue
}

export function calculateGameOverBonus(score: number): number {
  return Math.floor(score * 0.1)
}
