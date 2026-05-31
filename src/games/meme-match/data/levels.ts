import type { GameLevel } from '@types'

/** All difficulty levels. rows × cols must always be even. */
export const LEVELS: readonly GameLevel[] = [
  { id: 1, name: 'Easy', cols: 4, rows: 3, timeLimit: 60, requiredScore: 0 },
  { id: 2, name: 'Medium', cols: 4, rows: 4, timeLimit: 75, requiredScore: 500 },
  { id: 3, name: 'Hard', cols: 5, rows: 4, timeLimit: 90, requiredScore: 1500 },
  { id: 4, name: 'Expert', cols: 6, rows: 4, timeLimit: 100, requiredScore: 3000 },
  { id: 5, name: 'Master', cols: 6, rows: 5, timeLimit: 120, requiredScore: 5000 },
] as const

/** Number of pairs for a given level. */
export function getPairCount(level: GameLevel): number {
  return (level.cols * level.rows) / 2
}

/** Get the highest unlocked level index (0-based) based on best score. */
export function getUnlockedLevelCount(bestScore: number): number {
  let count = 0
  for (const level of LEVELS) {
    if (bestScore >= level.requiredScore) count++
    else break
  }
  return count
}
