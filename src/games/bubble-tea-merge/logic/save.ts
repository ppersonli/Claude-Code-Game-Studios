const STORAGE_KEY = 'bubble-tea-merge-save'

export interface SaveData {
  highScore: number
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as SaveData
      if (typeof data.highScore === 'number') return data
    }
  } catch { /* corrupted */ }
  return { highScore: 0 }
}

export function updateHighScore(score: number): SaveData {
  const save = loadSave()
  if (score > save.highScore) {
    save.highScore = score
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)) } catch { /* */ }
  }
  return save
}
