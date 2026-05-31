/**
 * Pure meta-system logic for Bubble Shooter.
 * Handles themes, achievements, coins, daily rewards.
 * Works alongside the existing save.ts persistence.
 */
import { SHOOTER_THEMES, getShooterThemeById, type ShooterTheme } from '../data/themes'
import { SHOOTER_ACHIEVEMENTS, type ShooterAchievement } from '../data/achievements'
export type { ShooterStats } from '../data/achievements'
import type { ShooterStats } from '../data/achievements'

// === Theme Management ===

export function canBuyShooterTheme(coins: number, levelsCompleted: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getShooterThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (levelsCompleted < theme.requiredLevels) return false
  return true
}

export function equipShooterTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableShooterThemes(
  coins: number, levelsCompleted: number, unlockedThemes: string[],
): { theme: ShooterTheme; unlocked: boolean; canBuy: boolean }[] {
  return SHOOTER_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyShooterTheme(coins, levelsCompleted, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkShooterAchievements(
  stats: ShooterStats, existingAchievements: string[],
): ShooterAchievement[] {
  const newlyUnlocked: ShooterAchievement[] = []
  for (const a of SHOOTER_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Coin calculations ===

export function levelCoins(won: boolean, shotsLeft: number, maxShots: number): number {
  if (!won) return 0
  return 10 + Math.floor(shotsLeft * 2)
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
