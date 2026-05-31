/**
 * Pure meta-system logic for Boba Drop.
 * Handles coins, themes, achievements, daily rewards.
 */
import { DROP_THEMES, getDropThemeById, type DropTheme } from '../data/themes'
import { DROP_ACHIEVEMENTS, type DropAchievement, type DropStats } from '../data/achievements'

// === Extended SaveData ===

export interface DropSaveData {
  highScore: number
  coins: number
  unlockedThemes: string[]
  equippedTheme: string
  achievements: string[]
  stats: DropStats
  lastDailyDate: string
}

export function createDefaultDropSave(): DropSaveData {
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
      totalPearls: 0,
      superBobas: 0,
      dailyCompleted: 0,
      biggestDrop: 0,
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

export function canBuyDropTheme(save: DropSaveData, themeId: string): boolean {
  const theme = getDropThemeById(themeId)
  if (save.unlockedThemes.includes(themeId)) return false
  if (save.coins < theme.cost) return false
  if (save.highScore < theme.requiredHighScore) return false
  return true
}

export function buyDropTheme(save: DropSaveData, themeId: string): boolean {
  if (!canBuyDropTheme(save, themeId)) return false
  const theme = getDropThemeById(themeId)
  save.coins -= theme.cost
  save.unlockedThemes.push(themeId)
  save.equippedTheme = themeId
  return true
}

export function equipDropTheme(save: DropSaveData, themeId: string): boolean {
  if (!save.unlockedThemes.includes(themeId)) return false
  save.equippedTheme = themeId
  return true
}

export function getEquippedDropTheme(save: DropSaveData): DropTheme {
  return getDropThemeById(save.equippedTheme)
}

export function getAvailableDropThemes(save: DropSaveData): { theme: DropTheme; unlocked: boolean; canBuy: boolean }[] {
  return DROP_THEMES.map(theme => ({
    theme,
    unlocked: save.unlockedThemes.includes(theme.id),
    canBuy: canBuyDropTheme(save, theme.id),
  }))
}

// === Achievements ===

export function checkDropAchievements(save: DropSaveData): DropAchievement[] {
  const newlyUnlocked: DropAchievement[] = []
  for (const a of DROP_ACHIEVEMENTS) {
    if (!save.achievements.includes(a.id) && a.check(save.stats)) {
      save.achievements.push(a.id)
      save.coins += a.reward
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Game session updates ===

export function onMerge(save: DropSaveData, newLevel: number, ingredientCount: number): number {
  const coins = mergeCoins(newLevel)
  save.coins += coins
  save.stats.totalMerges++
  save.stats.totalPearls += coins
  if (newLevel > save.stats.bestTier) save.stats.bestTier = newLevel
  if (newLevel >= 7) save.stats.superBobas++
  if (ingredientCount > save.stats.biggestDrop) save.stats.biggestDrop = ingredientCount
  return coins
}

export function onGameEnd(save: DropSaveData, score: number, isDaily: boolean): { scoreCoins: number; dailyCoins: number; newAchievements: DropAchievement[] } {
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

  const newAchievements = checkDropAchievements(save)
  return { scoreCoins: sc, dailyCoins: dc, newAchievements }
}

// === Daily ===

export function isDailyAvailable(save: DropSaveData): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return save.lastDailyDate !== today
}
