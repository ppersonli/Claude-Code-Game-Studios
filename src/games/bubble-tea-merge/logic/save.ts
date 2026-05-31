import { type MergeSaveData, createDefaultSave } from './meta'

const STORAGE_KEY = 'bubble-tea-merge-save'

// Backward-compatible: old saves only had highScore
export interface SaveData {
  highScore: number
}

export function loadSave(): MergeSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (typeof data.highScore === 'number') {
        const defaults = createDefaultSave()
        return {
          ...defaults,
          ...data,
          stats: { ...defaults.stats, ...(data.stats ?? {}) },
          unlockedThemes: Array.isArray(data.unlockedThemes) ? data.unlockedThemes : ['classic'],
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
        }
      }
    }
  } catch { /* corrupted */ }
  return createDefaultSave()
}

export function saveData(data: MergeSaveData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* */ }
}

// Legacy API for GameScene compatibility
export function updateHighScore(score: number): MergeSaveData {
  const save = loadSave()
  if (score > save.highScore) {
    save.highScore = score
    saveData(save)
  }
  return save
}
