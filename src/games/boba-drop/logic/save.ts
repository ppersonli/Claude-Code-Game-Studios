/**
 * Save/Load persistence for Boba Drop using localStorage.
 * Backward-compatible: old saves with only highScore are auto-migrated.
 */
import { type DropSaveData, createDefaultDropSave } from './meta'

export interface SaveData {
  highScore: number
}

const STORAGE_KEY = 'boba-drop-save'

export function loadSave(): DropSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.highScore === 'number') {
        const defaults = createDefaultDropSave()
        return {
          ...defaults,
          ...parsed,
          stats: { ...defaults.stats, ...(parsed.stats ?? {}) },
          unlockedThemes: Array.isArray(parsed.unlockedThemes) ? parsed.unlockedThemes : ['classic'],
          achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        }
      }
    }
  } catch { /* corrupted */ }
  return createDefaultDropSave()
}

export function saveSave(data: DropSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable — silently fail
  }
}

/**
 * Update high score if the new score is higher. Returns the (possibly updated) save data.
 */
export function updateHighScore(score: number): DropSaveData {
  const save = loadSave()
  if (score > save.highScore) {
    save.highScore = score
    saveSave(save)
  }
  return save
}
