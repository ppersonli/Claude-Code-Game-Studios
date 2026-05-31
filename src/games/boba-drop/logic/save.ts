/**
 * Save/Load persistence for Boba Drop using localStorage.
 */

export interface SaveData {
  highScore: number
}

const STORAGE_KEY = 'boba-drop-save'

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        highScore: typeof parsed.highScore === 'number' ? parsed.highScore : 0,
      }
    }
    return { highScore: 0 }
  } catch {
    return { highScore: 0 }
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable — silently fail
  }
}

/**
 * Update high score if the new score is higher. Returns the (possibly updated) save data.
 */
export function updateHighScore(score: number): SaveData {
  const save = loadSave()
  if (score > save.highScore) {
    save.highScore = score
    saveSave(save)
  }
  return save
}
