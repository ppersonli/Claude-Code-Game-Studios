import type { IdleGameState } from './game-state'
import { SAVE_KEY } from './constants'

export function saveGame(state: IdleGameState): void {
  state.lastSaveTime = Date.now()
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch { /* storage full or unavailable */ }
}

export function loadGame(): IdleGameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as IdleGameState
    if (typeof data.money !== 'number') return null
    return data
  } catch {
    return null
  }
}

export function resetSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch { /* */ }
}
