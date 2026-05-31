import { SAVE_KEY } from './constants'
import type { ShooterStats } from '../data/achievements'

export interface SaveData {
  highScore: number
  levelsCompleted: number[]
  // Meta additions
  coins: number
  unlockedThemes: string[]
  equippedTheme: string
  achievements: string[]
  stats: ShooterStats
  lastDailyDate: string
}

export function createDefaultSave(): SaveData {
  return {
    highScore: 0,
    levelsCompleted: [],
    coins: 0,
    unlockedThemes: ['classic'],
    equippedTheme: 'classic',
    achievements: [],
    stats: {
      levelsCompleted: 0, totalPopped: 0, totalFallen: 0, highScore: 0,
      perfectLevels: 0, maxLevel: 0, themesUnlocked: 1, dailyCompleted: 0, totalShots: 0,
    },
    lastDailyDate: '',
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (typeof data.highScore === 'number') {
        const defaults = createDefaultSave()
        return {
          ...defaults,
          ...data,
          levelsCompleted: Array.isArray(data.levelsCompleted) ? data.levelsCompleted : [],
          stats: { ...defaults.stats, ...(data.stats ?? {}) },
          unlockedThemes: Array.isArray(data.unlockedThemes) ? data.unlockedThemes : ['classic'],
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
        }
      }
    }
  } catch { /* corrupted */ }
  return createDefaultSave()
}

export function saveFull(data: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch { /* */ }
}

export function saveProgress(score: number, level: number, levelsCompleted: number[]): void {
  try {
    const existing = loadSave()
    const highScore = Math.max(existing.highScore, score)
    const completed = Array.from(new Set([...existing.levelsCompleted, ...levelsCompleted]))
    existing.highScore = highScore
    existing.levelsCompleted = completed
    saveFull(existing)
  } catch { /* */ }
}

export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* */ }
}
