/**
 * Pure meta-system logic for Meme Match.
 * Handles themes, achievements, coins, daily rewards.
 * Works alongside the existing mm_best_scores persistence.
 */
import { MEME_THEMES, getMemeThemeById, type MemeTheme } from '../data/themes'
import { MEME_ACHIEVEMENTS, type MemeAchievement } from '../data/achievements'
export type { MemeStats } from '../data/achievements'
import type { MemeStats } from '../data/achievements'

// === Theme Management ===

export function canBuyMemeTheme(coins: number, bestScore: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getMemeThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (bestScore < theme.requiredScore) return false
  return true
}

export function equipMemeTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableMemeThemes(
  coins: number, bestScore: number, unlockedThemes: string[],
): { theme: MemeTheme; unlocked: boolean; canBuy: boolean }[] {
  return MEME_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyMemeTheme(coins, bestScore, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkMemeAchievements(
  stats: MemeStats, existingAchievements: string[],
): MemeAchievement[] {
  const newlyUnlocked: MemeAchievement[] = []
  for (const a of MEME_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Coin calculations ===

export function gameCoins(score: number, won: boolean): number {
  if (!won) return Math.floor(score / 50)
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
