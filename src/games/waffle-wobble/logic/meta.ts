/**
 * Pure meta-system logic for Waffle Wobble.
 * Handles themes, achievements, daily rewards.
 * Works alongside the existing GameState coins/persistence.
 */
import { WAFFLE_THEMES, getWaffleThemeById, type WaffleTheme } from '../data/themes'
import { WAFFLE_ACHIEVEMENTS, type WaffleAchievement } from '../data/achievements'
export type { WaffleStats } from '../data/achievements'
import type { WaffleStats } from '../data/achievements'

// === Theme Management ===

export function canBuyWaffleTheme(coins: number, level: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getWaffleThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (level < theme.requiredLevel) return false
  return true
}

export function equipWaffleTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableWaffleThemes(
  coins: number, level: number, unlockedThemes: string[],
): { theme: WaffleTheme; unlocked: boolean; canBuy: boolean }[] {
  return WAFFLE_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyWaffleTheme(coins, level, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkWaffleAchievements(
  stats: WaffleStats, existingAchievements: string[],
): WaffleAchievement[] {
  const newlyUnlocked: WaffleAchievement[] = []
  for (const a of WAFFLE_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Daily Reward ===

export const DAILY_REWARD_COINS = 50

export function isDailyRewardAvailable(lastDailyDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return lastDailyDate !== today
}

export function claimDailyReward(lastDailyDate: string): { claimed: boolean; today: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (lastDailyDate === today) return { claimed: false, today }
  return { claimed: true, today }
}
