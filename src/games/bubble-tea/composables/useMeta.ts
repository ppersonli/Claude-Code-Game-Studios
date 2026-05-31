/**
 * Meta-system composable for Bubble Tea.
 * Works alongside the existing BubbleTeaState persistence pattern.
 * Handles themes, daily rewards, and enhanced achievement tracking.
 */
import { TEA_THEMES, getTeaThemeById, type TeaTheme } from '../data/themes'

// === Theme Management ===

export function canBuyTeaTheme(
  coins: number,
  level: number,
  unlockedThemes: string[],
  themeId: string,
): boolean {
  const theme = getTeaThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (level < theme.requiredLevel) return false
  return true
}

export function buyTeaTheme(
  themeId: string,
): { cost: number } | null {
  const theme = getTeaThemeById(themeId)
  return { cost: theme.cost }
}

export function equipTeaTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableTeaThemes(
  coins: number,
  level: number,
  unlockedThemes: string[],
): { theme: TeaTheme; unlocked: boolean; canBuy: boolean }[] {
  return TEA_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyTeaTheme(coins, level, unlockedThemes, theme.id),
  }))
}

// === Daily Reward ===

export const DAILY_REWARD_COINS = 50

export function isDailyRewardAvailable(lastDailyDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return lastDailyDate !== today
}

export function claimDailyReward(lastDailyDate: string): { claimed: boolean; today: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (lastDailyDate === today) return { claimed: false, today }
  return { claimed: true, today }
}

// === Serve Statistics for Meta Achievements ===

export interface ServeStats {
  totalServed: number
  perfectServed: number
  bestCombo: number
  highestLevel: number
  themesUnlocked: number
  dailyDays: number
}

export const META_ACHIEVEMENTS = [
  { id: 'tea_master', name: '調茶大師', desc: '累計服務100杯', emoji: '🏅', reward: 100, check: (s: ServeStats) => s.totalServed >= 100 },
  { id: 'perfect_streak10', name: '完美十連', desc: '累計10次完美調配', emoji: '✨', reward: 100, check: (s: ServeStats) => s.perfectServed >= 10 },
  { id: 'combo_master', name: '連擊之王', desc: '達成10連擊', emoji: '🔥', reward: 100, check: (s: ServeStats) => s.bestCombo >= 10 },
  { id: 'fashionista', name: '時尚達人', desc: '解鎖3個主題', emoji: '👗', reward: 75, check: (s: ServeStats) => s.themesUnlocked >= 3 },
  { id: 'daily_3', name: '每日忠實', desc: '領取3次每日獎勵', emoji: '📅', reward: 75, check: (s: ServeStats) => s.dailyDays >= 3 },
  { id: 'level_10', name: '十級達人', desc: '達到等級10', emoji: '⭐', reward: 75, check: (s: ServeStats) => s.highestLevel >= 10 },
] as const

export function checkMetaAchievements(
  stats: ServeStats,
  existingAchievements: string[],
): { id: string; name: string; emoji: string; reward: number }[] {
  const newlyUnlocked: { id: string; name: string; emoji: string; reward: number }[] = []
  for (const a of META_ACHIEVEMENTS) {
    if (!existingAchievements.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push({ id: a.id, name: a.name, emoji: a.emoji, reward: a.reward })
    }
  }
  return newlyUnlocked
}
