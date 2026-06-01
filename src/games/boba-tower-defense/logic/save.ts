/**
 * Save/Load persistence for Boba Tower Defense.
 */
import type { TDSaveData } from './types'
import { SAVE_KEY } from './constants'

export function createDefaultSave(): TDSaveData {
  return {
    highScore: 0,
    coins: 0,
    levelsCompleted: [],
    totalEnemiesDefeated: 0,
    unlockedTowers: ['classic'],
    achievements: [],
    themes: ['classic'],
    equippedTheme: 'classic',
    lastDailyDate: '',
    dailyCompleted: 0,
    gamesPlayed: 0,
  }
}

export function loadSave(): TDSaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      const defaults = createDefaultSave()
      return {
        ...defaults,
        ...data,
        levelsCompleted: Array.isArray(data.levelsCompleted) ? data.levelsCompleted : [],
        unlockedTowers: Array.isArray(data.unlockedTowers) ? data.unlockedTowers : ['classic'],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        themes: Array.isArray(data.themes) ? data.themes : ['classic'],
      }
    }
  } catch { /* corrupted */ }
  return createDefaultSave()
}

export function saveFull(data: TDSaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch { /* */ }
}

export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* */ }
}
