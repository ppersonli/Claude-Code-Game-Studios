/**
 * Pure meta-system logic for Boba Sort.
 * Handles coins, themes, achievements, and daily rewards.
 * All functions are side-effect free except where noted (localStorage).
 */
import { THEMES, getThemeById, type Theme } from '../data/themes'
import { ACHIEVEMENTS, type Achievement, type PlayerStats } from '../data/achievements'

// === Progress type (superset of original) ===

export interface Progress {
  totalStars: number
  levelStars: number[]
  dailyCompleted: string[]
  // Meta additions
  coins: number
  unlockedThemes: string[]
  equippedTheme: string
  achievements: string[]
  stats: PlayerStats
}

export function createDefaultProgress(): Progress {
  return {
    totalStars: 0,
    levelStars: [],
    dailyCompleted: [],
    coins: 0,
    unlockedThemes: ['classic'],
    equippedTheme: 'classic',
    achievements: [],
    stats: {
      totalGames: 0,
      totalWins: 0,
      totalStars: 0,
      bestCombo: 0,
      perfectLevels: 0,
      dailyCompleted: 0,
      fastestTime: 0,
      themesUnlocked: 1,
    },
  }
}

// === Coins ===

export function calculateLevelCoins(stars: number): number {
  return stars * 10
}

export function calculateDailyCoins(): number {
  return 50
}

export function calculateAchievementCoins(achievement: Achievement): number {
  return achievement.reward
}

// === Themes ===

export function canBuyTheme(progress: Progress, themeId: string): boolean {
  const theme = getThemeById(themeId)
  if (progress.unlockedThemes.includes(themeId)) return false
  if (progress.coins < theme.cost) return false
  if (progress.totalStars < theme.requiredStars) return false
  return true
}

export function buyTheme(progress: Progress, themeId: string): boolean {
  if (!canBuyTheme(progress, themeId)) return false
  const theme = getThemeById(themeId)
  progress.coins -= theme.cost
  progress.unlockedThemes.push(themeId)
  progress.equippedTheme = themeId
  progress.stats.themesUnlocked = progress.unlockedThemes.length
  return true
}

export function equipTheme(progress: Progress, themeId: string): boolean {
  if (!progress.unlockedThemes.includes(themeId)) return false
  progress.equippedTheme = themeId
  return true
}

export function getEquippedTheme(progress: Progress): Theme {
  return getThemeById(progress.equippedTheme)
}

export function getAvailableThemes(progress: Progress): { theme: Theme; unlocked: boolean; canBuy: boolean }[] {
  return THEMES.map(theme => ({
    theme,
    unlocked: progress.unlockedThemes.includes(theme.id),
    canBuy: canBuyTheme(progress, theme.id),
  }))
}

// === Achievements ===

export function checkAchievements(progress: Progress): Achievement[] {
  const newlyUnlocked: Achievement[] = []
  for (const a of ACHIEVEMENTS) {
    if (!progress.achievements.includes(a.id) && a.check(progress.stats)) {
      progress.achievements.push(a.id)
      progress.coins += a.reward
      newlyUnlocked.push(a)
    }
  }
  return newlyUnlocked
}

// === Game completion update ===

export function onGameComplete(
  progress: Progress,
  stars: number,
  score: number,
  combo: number,
  timeElapsed: number,
  levelIndex: number,
  isDaily: boolean,
): { levelCoins: number; dailyCoins: number; newAchievements: Achievement[] } {
  // Update level stars (keep best)
  const prevStars = progress.levelStars[levelIndex] ?? 0
  if (stars > prevStars) {
    progress.totalStars += stars - prevStars
    progress.levelStars[levelIndex] = stars
  }

  // Coins from level
  const levelCoins = calculateLevelCoins(stars)
  progress.coins += levelCoins

  // Daily bonus
  let dailyCoins = 0
  if (isDaily) {
    const today = new Date().toISOString().slice(0, 10)
    if (!progress.dailyCompleted.includes(today)) {
      progress.dailyCompleted.push(today)
      progress.stats.dailyCompleted++
      dailyCoins = calculateDailyCoins()
      progress.coins += dailyCoins
    }
  }

  // Update stats
  progress.stats.totalGames++
  progress.stats.totalWins++
  progress.stats.totalStars = progress.totalStars
  if (combo > progress.stats.bestCombo) progress.stats.bestCombo = combo
  if (stars === 3) progress.stats.perfectLevels++
  if (timeElapsed > 0 && (progress.stats.fastestTime === 0 || timeElapsed < progress.stats.fastestTime)) {
    progress.stats.fastestTime = timeElapsed
  }

  // Check achievements
  const newAchievements = checkAchievements(progress)

  return { levelCoins, dailyCoins, newAchievements }
}

// === Undo hint cost ===

export const HINT_COST = 10

export function canBuyHint(progress: Progress): boolean {
  return progress.coins >= HINT_COST
}

export function buyHint(progress: Progress): boolean {
  if (!canBuyHint(progress)) return false
  progress.coins -= HINT_COST
  return true
}
