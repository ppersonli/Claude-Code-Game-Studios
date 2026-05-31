/**
 * Pure meta-system logic for Boba Tycoon.
 * Handles themes, achievements, and daily rewards.
 * Works alongside the existing TycoonState persistence.
 */
import { TYCOON_THEMES, getTycoonThemeById, type TycoonTheme } from '../data/themes'
import { TYCOON_ACHIEVEMENTS, type TycoonAchievement, type TycoonStats } from '../data/achievements'

// === Theme Management ===

export function canBuyTycoonTheme(money: number, level: number, unlockedThemes: string[], themeId: string): boolean {
  const theme = getTycoonThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (money < theme.cost) return false
  if (level < theme.requiredLevel) return false
  return true
}

export function equipTycoonTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableTycoonThemes(
  money: number, level: number, unlockedThemes: string[],
): { theme: TycoonTheme; unlocked: boolean; canBuy: boolean }[] {
  return TYCOON_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyTycoonTheme(money, level, unlockedThemes, theme.id),
  }))
}

// === Achievements ===

export function checkTycoonAchievements(
  stats: TycoonStats, existingAchievements: string[],
): TycoonAchievement[] {
  const newlyUnlocked: TycoonAchievement[] = []
  for (const a of TYCOON_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Stats builder ===

export function buildTycoonStats(state: {
  totalTaps: number; totalEarned: number; level: number;
  prestigeCount: number; unlockedLocations: string[]; unlockedRecipes: string[];
  staffCounts: Record<string, number>; dailyCompleted: boolean;
}, unlockedThemes: string[], dailyCount: number): TycoonStats {
  const staffHired = Object.values(state.staffCounts).reduce((sum, n) => sum + n, 0)
  return {
    totalTaps: state.totalTaps,
    totalEarned: state.totalEarned,
    level: state.level,
    prestigeCount: state.prestigeCount,
    locationsUnlocked: state.unlockedLocations.length,
    recipesUnlocked: state.unlockedRecipes.length,
    staffHired,
    themesUnlocked: unlockedThemes.length,
    dailyCompleted: dailyCount,
  }
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
