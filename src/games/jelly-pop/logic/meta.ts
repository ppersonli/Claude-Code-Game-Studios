/**
 * Pure meta-system logic for Jelly Pop.
 * Handles themes, achievements, coins, daily rewards.
 * Works alongside the existing high-score persistence.
 */
import { JELLY_THEMES, getJellyThemeById, type JellyTheme } from '../data/themes'
import { JELLY_ACHIEVEMENTS, type JellyAchievement } from '../data/achievements'
export type { JellyStats } from '../data/achievements'
import type { JellyStats } from '../data/achievements'

// === Theme Management ===

export function canBuyJellyTheme(coins: number, level: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getJellyThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (level < theme.requiredLevel) return false
  return true
}

export function equipJellyTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableJellyThemes(
  coins: number, level: number, unlockedThemes: string[],
): { theme: JellyTheme; unlocked: boolean; canBuy: boolean }[] {
  return JELLY_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyJellyTheme(coins, level, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkJellyAchievements(
  stats: JellyStats, existingAchievements: string[],
): JellyAchievement[] {
  const newlyUnlocked: JellyAchievement[] = []
  for (const a of JELLY_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Coin calculations ===

export function levelCoins(score: number): number {
  return Math.floor(score / 20)
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
