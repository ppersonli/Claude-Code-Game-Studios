/**
 * Save/Load persistence for Mochi Merge using localStorage.
 * Backward-compatible: old saves with only highScore are auto-migrated.
 */
import { type MochiSaveData, createDefaultSave } from './meta'

const STORAGE_KEY = 'mochi-merge-save'

export function loadSave(): MochiSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.highScore === 'number') {
        const defaults = createDefaultSave()
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
  return createDefaultSave()
}

export function saveSave(data: MochiSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable — silently fail
  }
}

/**
 * Update high score if the new score is higher. Returns the (possibly updated) save data.
 */
export function updateHighScore(score: number): MochiSaveData {
  const save = loadSave()
  if (score > save.highScore) {
    save.highScore = score
    saveSave(save)
  }
  return save
}
