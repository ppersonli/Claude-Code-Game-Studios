/**
 * Meta-system composable for Bubble Tea Lab.
 * Works alongside the existing BubbleTeaLabState persistence pattern.
 * Handles themes, daily rewards, and enhanced achievement tracking.
 */
import { LAB_THEMES, getLabThemeById, type LabTheme } from '../data/themes'

// === Theme Management ===

export function canBuyLabTheme(
  coins: number,
  level: number,
  unlockedThemes: string[],
  themeId: string,
): boolean {
  const theme = getLabThemeById(themeId)
  if (unlockedThemes.includes(themeId)) return false
  if (coins < theme.cost) return false
  if (level < theme.requiredLevel) return false
  return true
}

export function equipLabTheme(unlockedThemes: string[], themeId: string): boolean {
  return unlockedThemes.includes(themeId)
}

export function getAvailableLabThemes(
  coins: number,
  level: number,
  unlockedThemes: string[],
): { theme: LabTheme; unlocked: boolean; canBuy: boolean }[] {
  return LAB_THEMES.map(theme => ({
    theme,
    unlocked: unlockedThemes.includes(theme.id),
    canBuy: canBuyLabTheme(coins, level, unlockedThemes, theme.id),
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

// === Meta Achievements ===

export interface LabServeStats {
  totalServed: number
  perfectServed: number
  bestCombo: number
  highestLevel: number
  themesUnlocked: number
  dailyDays: number
  ingredientsUnlocked: number
}

export const META_ACHIEVEMENTS = [
  { id: 'lab_master', name: '調茶大師', desc: '累計服務100杯', emoji: '🏅', reward: 100, check: (s: LabServeStats) => s.totalServed >= 100 },
  { id: 'perfect_streak10', name: '完美十連', desc: '累計10次完美調配', emoji: '✨', reward: 100, check: (s: LabServeStats) => s.perfectServed >= 10 },
  { id: 'combo_master', name: '連擊之王', desc: '達成10連擊', emoji: '🔥', reward: 100, check: (s: LabServeStats) => s.bestCombo >= 10 },
  { id: 'fashionista', name: '時尚達人', desc: '解鎖3個主題', emoji: '👗', reward: 75, check: (s: LabServeStats) => s.themesUnlocked >= 3 },
  { id: 'daily_3', name: '每日忠實', desc: '領取3次每日獎勵', emoji: '📅', reward: 75, check: (s: LabServeStats) => s.dailyDays >= 3 },
  { id: 'level_10', name: '十級達人', desc: '達到等級10', emoji: '⭐', reward: 75, check: (s: LabServeStats) => s.highestLevel >= 10 },
  { id: 'ingredient_master', name: '全料大師', desc: '解鎖所有16種食材', emoji: '🧪', reward: 100, check: (s: LabServeStats) => s.ingredientsUnlocked >= 16 },
] as const

export function checkMetaAchievements(
  stats: LabServeStats,
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
