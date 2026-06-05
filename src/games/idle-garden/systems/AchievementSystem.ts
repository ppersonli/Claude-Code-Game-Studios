/**
 * Idle Garden Tycoon — Achievement System
 * Tracks milestone-based rewards for long-term progression.
 */

import type { GameState } from '../data/types'
import { ACHIEVEMENTS, type AchievementData } from '../data/achievements'
import { addCoins } from './CurrencySystem'

export { ACHIEVEMENTS }

/**
 * Check which achievements are newly unlocked (condition met but not yet claimed).
 */
export function checkAchievements(state: GameState): string[] {
  const result: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.condition(state)) {
      result.push(a.id)
    }
  }
  return result
}

/**
 * Claim an achievement reward. Returns the coin reward (0 if already claimed or condition not met).
 */
export function claimAchievement(state: GameState, id: string): number {
  if (state.achievements.includes(id)) return 0

  const achievement = ACHIEVEMENTS.find(a => a.id === id)
  if (!achievement) return 0
  if (!achievement.condition(state)) return 0

  state.achievements.push(id)
  addCoins(state, achievement.reward)
  return achievement.reward
}

/**
 * Get progress status for all achievements.
 */
export function getAchievementProgress(state: GameState): { id: string; unlocked: boolean; claimable: boolean }[] {
  return ACHIEVEMENTS.map(a => {
    const conditionMet = a.condition(state)
    const claimed = state.achievements.includes(a.id)
    return {
      id: a.id,
      unlocked: conditionMet,
      claimable: conditionMet && !claimed,
    }
  })
}
