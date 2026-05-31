import { SAVE_KEY } from './constants'

export interface SaveData {
  highScore: number
  levelsCompleted: number[]
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (typeof data.highScore === 'number') {
        return {
          highScore: data.highScore,
          levelsCompleted: Array.isArray(data.levelsCompleted) ? data.levelsCompleted : [],
        }
      }
    }
  } catch { /* corrupted */ }
  return { highScore: 0, levelsCompleted: [] }
}

export function saveProgress(score: number, level: number, levelsCompleted: number[]): void {
  try {
    const existing = loadSave()
    const highScore = Math.max(existing.highScore, score)
    const completed = Array.from(new Set([...existing.levelsCompleted, ...levelsCompleted]))
    localStorage.setItem(SAVE_KEY, JSON.stringify({ highScore, levelsCompleted: completed }))
  } catch { /* */ }
}

export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* */ }
}
