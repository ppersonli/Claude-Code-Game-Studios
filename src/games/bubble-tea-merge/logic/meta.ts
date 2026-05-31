/**
 * Pure meta-system logic for Bubble Tea Merge.
 * Handles coins, themes, achievements, daily rewards.
 */
import { MERGE_THEMES, getMergeThemeById, type MergeTheme } from '../data/themes'
import { MERGE_ACHIEVEMENTS, type MergeAchievement, type MergeStats } from '../data/achievements'

// === Extended SaveData ===

export interface MergeSaveData {
  highScore: number
  coins: number
  unlockedThemes: string[]
  equippedTheme: string
  achievements: string[]
  stats: MergeStats
  lastDailyDate: string
}

export function createDefaultSave(): MergeSaveData {
  return {
    highScore: 0,
    coins: 0,
    unlockedThemes: ['classic'],
    equippedTheme: 'classic',
    achievements: [],
    stats: {
      totalGames: 0,
      totalMerges: 0,
      bestTier: 0,
      bestScore: 0,
      bestCombo: 0,
      totalPearls: 0,
      crystalBobas: 0,
      dailyCompleted: 0,
    },
    lastDailyDate: '',
  }
}

// === Coin calculations ===

export function mergeCoins(newLevel: number): number {
  return newLevel * newLevel * 5
}

export function scoreCoins(score: number): number {
  return Math.floor(score / 10)
}

export function dailyRewardCoins(): number {
  return 50
}

export function achievementCoins(achievement: MergeAchievement): number {
  return achievement.reward
}

// === Themes ===

export function canBuyMergeTheme(save: MergeSaveData, themeId: string): boolean {
  const theme = getMergeThemeById(themeId)
  if (save.unlockedThemes.includes(themeId)) return false
  if (save.coins < theme.cost) return false
  if (save.highScore < theme.requiredHighScore) return false
  return true
}

export function buyMergeTheme(save: MergeSaveData, themeId: string): boolean {
  if (!canBuyMergeTheme(save, themeId)) return false
  const theme = getMergeThemeById(themeId)
  save.coins -= theme.cost
  save.unlockedThemes.push(themeId)
  save.equippedTheme = themeId
  return true
}

export function equipMergeTheme(save: MergeSaveData, themeId: string): boolean {
  if (!save.unlockedThemes.includes(themeId)) return false
  save.equippedTheme = themeId
  return true
}

export function getEquippedMergeTheme(save: MergeSaveData): MergeTheme {
  return getMergeThemeById(save.equippedTheme)
}

export function getAvailableMergeThemes(save: MergeSaveData): { theme: MergeTheme; unlocked: boolean; canBuy: boolean }[] {
  return MERGE_THEMES.map(theme => ({
    theme,
    unlocked: save.unlockedThemes.includes(theme.id),
    canBuy: canBuyMergeTheme(save, theme.id),
  }))
}

// === Achievements ===

export function checkMergeAchievements(save: MergeSaveData): MergeAchievement[] {
  const newlyUnlocked: MergeAchievement[] = []
  for (const a of MERGE_ACHIEVEMENTS) {
    if (!save.achievements.includes(a.id) && a.check(save.stats)) {
      save.achievements.push(a.id)
      save.coins += a.reward
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Game session updates ===

export function onMerge(save: MergeSaveData, newLevel: number, combo: number): number {
  const coins = mergeCoins(newLevel)
  save.coins += coins
  save.stats.totalMerges++
  save.stats.totalPearls += coins
  if (newLevel > save.stats.bestTier) save.stats.bestTier = newLevel
  if (combo > save.stats.bestCombo) save.stats.bestCombo = combo
  if (newLevel >= 6) save.stats.crystalBobas++
  return coins
}

export function onGameEnd(save: MergeSaveData, score: number, isDaily: boolean): { scoreCoins: number; dailyCoins: number; newAchievements: MergeAchievement[] } {
  save.stats.totalGames++
  if (score > save.stats.bestScore) save.stats.bestScore = score
  if (score > save.highScore) save.highScore = score

  const sc = scoreCoins(score)
  save.coins += sc

  let dc = 0
  if (isDaily) {
    const today = new Date().toISOString().slice(0, 10)
    if (save.lastDailyDate !== today) {
      save.lastDailyDate = today
      save.stats.dailyCompleted++
      dc = dailyRewardCoins()
      save.coins += dc
    }
  }

  const newAchievements = checkMergeAchievements(save)
  return { scoreCoins: sc, dailyCoins: dc, newAchievements }
}

// === Daily ===

export function isDailyAvailable(save: MergeSaveData): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return save.lastDailyDate !== today
}
