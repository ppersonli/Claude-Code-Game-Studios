/**
 * Pure meta-system logic for Idle Coffee Shop.
 * Handles themes, achievements, daily rewards.
 * Works alongside the existing GameState persistence.
 */
import { CAFE_THEMES, getCafeThemeById, type CafeTheme } from '../data/themes'
import { CAFE_ACHIEVEMENTS, type CafeAchievement } from '../data/achievements'
export type { CafeStats } from '../data/achievements'
import type { CafeStats } from '../data/achievements'

// === Theme Management ===

export function canBuyCafeTheme(coins: number, level: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getCafeThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (level < theme.requiredLevel) return false
  return true
}

export function equipCafeTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableCafeThemes(
  coins: number, level: number, unlockedThemes: string[],
): { theme: CafeTheme; unlocked: boolean; canBuy: boolean }[] {
  return CAFE_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyCafeTheme(coins, level, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkCafeAchievements(
  stats: CafeStats, existingAchievements: string[],
): CafeAchievement[] {
  const newlyUnlocked: CafeAchievement[] = []
  for (const a of CAFE_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Daily Reward ===

export const DAILY_REWARD_COINS = 100

export function isDailyRewardAvailable(lastDailyDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return lastDailyDate !== today
}

export function claimDailyReward(lastDailyDate: string): { claimed: boolean; today: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (lastDailyDate === today) return { claimed: false, today }
  return { claimed: true, today }
}
