import type { TycoonState } from './game-state'
import { SAVE_KEY } from './constants'

export function saveGame(state: TycoonState): void {
  state.lastSaveTime = Date.now()
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch { /* */ }
}

export function loadGame(): TycoonState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as TycoonState
    if (typeof data.money !== 'number') return null
    return data
  } catch { return null }
}

export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* */ }
}
