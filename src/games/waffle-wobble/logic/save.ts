import type { GameState } from './game-state'
import { SAVE_KEY } from './constants'

export function saveGame(state: GameState): void {
  try {
    const data = { ...state, customers: [], waffle: { state: 'empty', startedAt: 0, addedToppings: [] } }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch { /* */ }
}

export function loadGame(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (typeof data.score !== 'number') return null
    return data
  } catch {
    return null
  }
}

export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* */ }
}
