/**
 * Pure meta-system logic for Number Merge 2048.
 * Handles themes, achievements, coins, daily rewards.
 */
import { MERGE_THEMES, getMergeThemeById, type Merge2048Theme } from '../data/themes'
import { MERGE_ACHIEVEMENTS, type Merge2048Achievement } from '../data/achievements'
export type { Merge2048Stats } from '../data/achievements'
import type { Merge2048Stats } from '../data/achievements'

// === Theme Management ===

export function canBuyMergeTheme(coins: number, highScore: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getMergeThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (highScore < theme.requiredScore) return false
  return true
}

export function equipMergeTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableMergeThemes(
  coins: number, highScore: number, unlockedThemes: string[],
): { theme: Merge2048Theme; unlocked: boolean; canBuy: boolean }[] {
  return MERGE_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyMergeTheme(coins, highScore, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkMergeAchievements(
  stats: Merge2048Stats, existingAchievements: string[],
): Merge2048Achievement[] {
  const newlyUnlocked: Merge2048Achievement[] = []
  for (const a of MERGE_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Coin calculations ===

export function gameCoins(score: number, won: boolean): number {
  const base = Math.floor(score / 10)
  return won ? base + 50 : base
}

export function dailyRewardCoins(): number {
  return 100
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
