/**
 * Pure meta-system logic for Boba Runner.
 * Handles themes, achievements, coins, daily rewards.
 * Works alongside the existing save.ts persistence.
 */
import { RUNNER_THEMES, getRunnerThemeById, type RunnerTheme } from '../data/themes'
import { RUNNER_ACHIEVEMENTS, type RunnerAchievement } from '../data/achievements'
export type { RunnerStats } from '../data/achievements'
import type { RunnerStats } from '../data/achievements'

export function canBuyRunnerTheme(coins: number, highScore: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getRunnerThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (highScore < theme.requiredHighScore) return false
  return true
}

export function equipRunnerTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableRunnerThemes(
  coins: number, highScore: number, unlockedThemes: string[],
): { theme: RunnerTheme; unlocked: boolean; canBuy: boolean }[] {
  return RUNNER_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyRunnerTheme(coins, highScore, unlockedThemes, theme.id),
  }))
}

export function checkRunnerAchievements(
  stats: RunnerStats, existingAchievements: string[],
): RunnerAchievement[] {
  const newlyUnlocked: RunnerAchievement[] = []
  for (const a of RUNNER_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

export function gameCoins(score: number, pearls: number): number {
  return Math.floor(score / 5) + pearls
}

export function dailyRewardCoins(): number {
  return 50
}

export function isDailyRewardAvailable(lastDailyDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return lastDailyDate !== today
}

export function claimDailyReward(lastDailyDate: string): { claimed: boolean; today: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (lastDailyDate === today) return { claimed: false, today }
  return { claimed: true, today }
}
