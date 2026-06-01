/**
 * Pure meta-system logic for Mochi Merge.
 * Handles coins, themes, achievements, daily rewards.
 */
import { MOCHI_THEMES, getMochiThemeById, type MochiTheme } from '../data/themes'
import { MOCHI_ACHIEVEMENTS, type MochiAchievement, type MochiStats } from '../data/achievements'

// === SaveData ===

export interface MochiSaveData {
  highScore: number
  coins: number
  unlockedThemes: string[]
  equippedTheme: string
  achievements: string[]
  stats: MochiStats
  lastDailyDate: string
}

export function createDefaultSave(): MochiSaveData {
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
      totalCoins: 0,
      grandMochis: 0,
      dailyCompleted: 0,
      biggestCount: 0,
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

// === Themes ===

export function canBuyTheme(save: MochiSaveData, themeId: string): boolean {
  const theme = getMochiThemeById(themeId)
  if (save.unlockedThemes.includes(themeId)) return false
  if (save.coins < theme.cost) return false
  if (save.highScore < theme.requiredHighScore) return false
  return true
}

export function buyTheme(save: MochiSaveData, themeId: string): boolean {
  if (!canBuyTheme(save, themeId)) return false
  const theme = getMochiThemeById(themeId)
  save.coins -= theme.cost
  save.unlockedThemes.push(themeId)
  save.equippedTheme = themeId
  return true
}

export function equipTheme(save: MochiSaveData, themeId: string): boolean {
  if (!save.unlockedThemes.includes(themeId)) return false
  save.equippedTheme = themeId
  return true
}

export function getEquippedTheme(save: MochiSaveData): MochiTheme {
  return getMochiThemeById(save.equippedTheme)
}

export function getAvailableThemes(save: MochiSaveData): { theme: MochiTheme; unlocked: boolean; canBuy: boolean }[] {
  return MOCHI_THEMES.map(theme => ({
    theme,
    unlocked: save.unlockedThemes.includes(theme.id),
    canBuy: canBuyTheme(save, theme.id),
  }))
}

// === Achievements ===

export function checkAchievements(save: MochiSaveData): MochiAchievement[] {
  const newlyUnlocked: MochiAchievement[] = []
  for (const a of MOCHI_ACHIEVEMENTS) {
    if (!save.achievements.includes(a.id) && a.check(save.stats)) {
      save.achievements.push(a.id)
      save.coins += a.reward
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Game session updates ===

export function onMerge(save: MochiSaveData, newLevel: number, mochiCount: number): number {
  const coins = mergeCoins(newLevel)
  save.coins += coins
  save.stats.totalMerges++
  save.stats.totalCoins += coins
  if (newLevel > save.stats.bestTier) save.stats.bestTier = newLevel
  if (newLevel >= 5) save.stats.grandMochis++
  if (mochiCount > save.stats.biggestCount) save.stats.biggestCount = mochiCount
  return coins
}

export function onGameEnd(save: MochiSaveData, score: number, isDaily: boolean): { scoreCoins: number; dailyCoins: number; newAchievements: MochiAchievement[] } {
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

  const newAchievements = checkAchievements(save)
  return { scoreCoins: sc, dailyCoins: dc, newAchievements }
}

// === Daily ===

export function isDailyAvailable(save: MochiSaveData): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return save.lastDailyDate !== today
}
