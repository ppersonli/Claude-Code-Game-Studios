import { SAVE_KEY } from './constants'

export interface SaveData {
  highScore: number
  totalPearls: number
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (typeof data.highScore === 'number') {
        return { highScore: data.highScore, totalPearls: data.totalPearls ?? 0 }
      }
    }
  } catch { /* */ }
  return { highScore: 0, totalPearls: 0 }
}

export function saveProgress(score: number, pearls: number): SaveData {
  const existing = loadSave()
  const data: SaveData = {
    highScore: Math.max(existing.highScore, score),
    totalPearls: existing.totalPearls + pearls,
  }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch { /* */ }
  return data
}

export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* */ }
}
