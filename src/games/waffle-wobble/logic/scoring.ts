import type { ServeResult } from './game-state'

export function calculateScore(timeBonus: number, perfect: boolean, combo: number): number {
  let points = 10 + timeBonus
  if (perfect) points *= 2
  points += combo * 2
  return points
}

export function calculateCoins(points: number): number {
  return Math.max(1, Math.floor(points / 3))
}
