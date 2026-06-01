/**
 * Scoring for Block Blast Kawaii.
 * Combo system: consecutive multi-line clears increase multiplier.
 */
import { LINE_SCORES } from './constants'

/** Base score for clearing N lines in a single move */
export function lineBaseScore(linesCleared: number): number {
  if (linesCleared <= 0) return 0
  const idx = Math.min(linesCleared, LINE_SCORES.length - 1)
  return LINE_SCORES[idx]
}

/** Combo multiplier based on consecutive multi-line clears */
export function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1
  if (combo <= 3) return 1.5
  if (combo <= 5) return 2
  if (combo <= 8) return 3
  return 5
}

/** Calculate total score for a move */
export function calculateMoveScore(linesCleared: number, combo: number): number {
  const base = lineBaseScore(linesCleared)
  const multiplier = getComboMultiplier(combo)
  return Math.floor(base * multiplier)
}

/** Update combo counter after a move */
export function updateCombo(currentCombo: number, linesCleared: number): number {
  if (linesCleared >= 2) return currentCombo + 1
  return 0
}
