/**
 * Idle Garden Tycoon — Challenge System
 * Daily challenges with deterministic generation based on date.
 */

import type { GameState } from '../data/types'
import { CHALLENGES, type ChallengeTemplate } from '../data/challenges'
import { addCoins } from './CurrencySystem'

/**
 * Get today's date as YYYY-MM-DD string (local timezone).
 */
export function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Simple deterministic hash from a string (for seeded selection).
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Get the current stat value for a challenge template.
 */
function getStatValue(state: GameState, statKey: string): number {
  if (statKey === 'maxComboCount') return state.stats.maxComboCount
  if (statKey === 'totalHarvests') return state.stats.totalHarvests
  if (statKey === 'totalCoinsEarned') return state.stats.totalCoinsEarned
  if (statKey === 'totalFlowersGrown') return state.stats.totalFlowersGrown
  if (statKey === 'totalPlayTime') return state.stats.totalPlayTime
  return 0
}

/**
 * Calculate the reward for a challenge template at a given target.
 */
function calcReward(template: ChallengeTemplate, target: number): number {
  return Math.floor(template.rewardBase + target * template.rewardPerUnit)
}

/**
 * Generate a daily challenge. Deterministic by date string.
 * Pass a custom date for testing; defaults to today.
 */
export function generateDailyChallenge(
  state: GameState,
  dateStr?: string,
): GameState['dailyChallenge'] {
  const date = dateStr || getTodayString()
  const seed = hashString(date)

  const template = CHALLENGES[seed % CHALLENGES.length]
  const range = template.targetRange[1] - template.targetRange[0]
  const target = template.targetRange[0] + (seed % (range + 1))
  const startValue = getStatValue(state, template.statKey)

  return {
    date,
    templateId: template.id,
    target,
    startValue,
    claimed: false,
  }
}

/**
 * Get the challenge template by id.
 */
function getTemplate(id: string): ChallengeTemplate | undefined {
  return CHALLENGES.find(c => c.id === id)
}

/**
 * Get progress toward the current daily challenge.
 * Returns { current, target, percent }.
 */
export function getChallengeProgress(state: GameState): { current: number; target: number; percent: number } {
  if (!state.dailyChallenge) return { current: 0, target: 0, percent: 0 }

  const template = getTemplate(state.dailyChallenge.templateId)
  if (!template) return { current: 0, target: 0, percent: 0 }

  const currentValue = getStatValue(state, template.statKey)
  const current = Math.max(0, currentValue - state.dailyChallenge.startValue)
  const target = state.dailyChallenge.target
  const percent = Math.min(1, current / target)

  return { current, target, percent }
}

/**
 * Check if the daily challenge is complete.
 */
export function isChallengeComplete(state: GameState): boolean {
  if (!state.dailyChallenge) return false
  if (state.dailyChallenge.claimed) return false
  const { current, target } = getChallengeProgress(state)
  return current >= target
}

/**
 * Claim the daily challenge reward. Returns coins earned (0 if not complete or already claimed).
 */
export function claimChallengeReward(state: GameState): number {
  if (!state.dailyChallenge) return 0
  if (state.dailyChallenge.claimed) return 0
  if (!isChallengeComplete(state)) return 0

  const template = getTemplate(state.dailyChallenge.templateId)
  if (!template) return 0

  const reward = calcReward(template, state.dailyChallenge.target)
  state.dailyChallenge.claimed = true
  addCoins(state, reward)
  return reward
}

/**
 * Refresh the daily challenge if the date has changed.
 * Keeps the current challenge if it's still today.
 */
export function refreshDailyChallenge(state: GameState): void {
  const today = getTodayString()
  if (!state.dailyChallenge || state.dailyChallenge.date !== today) {
    state.dailyChallenge = generateDailyChallenge(state, today)
  }
}
