/**
 * Pure meta-system logic for Block Blast Kawaii.
 * Handles themes, achievements, coins, daily rewards.
 */
import { BLAST_THEMES, getBlastThemeById, type BlastTheme } from '../data/themes'
import { BLAST_ACHIEVEMENTS, type BlastAchievement } from '../data/achievements'
export type { BlastStats } from '../data/achievements'
import type { BlastStats } from '../data/achievements'

// === Theme Management ===

export function canBuyBlastTheme(coins: number, highScore: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getBlastThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (highScore < theme.requiredScore) return false
  return true
}

export function equipBlastTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableBlastThemes(
  coins: number, highScore: number, unlockedThemes: string[],
): { theme: BlastTheme; unlocked: boolean; canBuy: boolean }[] {
  return BLAST_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyBlastTheme(coins, highScore, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkBlastAchievements(
  stats: BlastStats, existingAchievements: string[],
): BlastAchievement[] {
  const newlyUnlocked: BlastAchievement[] = []
  for (const a of BLAST_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Coin calculations ===

export function gameCoins(score: number): number {
  return Math.floor(score / 5)
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
