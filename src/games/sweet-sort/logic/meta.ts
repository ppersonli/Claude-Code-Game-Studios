/**
 * Pure meta-system logic for Sweet Sort.
 * Handles themes, achievements, coins, daily rewards.
 * Works alongside the existing SaveData persistence.
 */
import { SWEET_THEMES, getSweetThemeById, type SweetTheme } from '../data/themes'
import { SWEET_ACHIEVEMENTS, type SweetAchievement } from '../data/achievements'
export type { SweetStats } from '../data/achievements'
import type { SweetStats } from '../data/achievements'

// === Theme Management ===

export function canBuySweetTheme(coins: number, totalStars: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getSweetThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (totalStars < theme.requiredStars) return false
  return true
}

export function equipSweetTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableSweetThemes(
  coins: number, totalStars: number, unlockedThemes: string[],
): { theme: SweetTheme; unlocked: boolean; canBuy: boolean }[] {
  return SWEET_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuySweetTheme(coins, totalStars, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkSweetAchievements(
  stats: SweetStats, existingAchievements: string[],
): SweetAchievement[] {
  const newlyUnlocked: SweetAchievement[] = []
  for (const a of SWEET_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Coin calculations ===

export function levelCoins(stars: number): number {
  return stars * 10
}

export function dailyRewardCoins(): number {
  return 50
}

// === Daily Reward ===

export function isDailyRewardAvailable(lastDailyDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return lastDailyDate !== today
}

export function claimDailyReward(lastDailyDate: string): { claimed: boolean; today: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (lastDailyDate === today) return { claimed: false, today }
  return { claimed: true, today }
}
