/**
 * Pure meta-system logic for Bubble Tea Idle.
 * Handles themes, achievements, daily rewards.
 * Works alongside the existing IdleGameState persistence.
 */
import { IDLE_THEMES, getIdleThemeById, type IdleTheme } from '../data/themes'
import { IDLE_ACHIEVEMENTS, type IdleAchievement } from '../data/achievements'
export type { IdleStats } from '../data/achievements'
import type { IdleStats } from '../data/achievements'

export function canBuyIdleTheme(money: number, level: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getIdleThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (money < theme.cost) return false
  if (level < theme.requiredLevel) return false
  return true
}

export function equipIdleTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableIdleThemes(
  money: number, level: number, unlockedThemes: string[],
): { theme: IdleTheme; unlocked: boolean; canBuy: boolean }[] {
  return IDLE_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyIdleTheme(money, level, unlockedThemes, theme.id),
  }))
}

export function checkIdleAchievements(
  stats: IdleStats, existingAchievements: string[],
): IdleAchievement[] {
  const newlyUnlocked: IdleAchievement[] = []
  for (const a of IDLE_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

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
