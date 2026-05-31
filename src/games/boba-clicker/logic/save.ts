import type { ClickerState } from './game-state'
import { SAVE_KEY } from './constants'

export function saveGame(state: ClickerState): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch { /* */ }
}

export function loadGame(): ClickerState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as ClickerState
    if (typeof data.points !== 'number') return null
    return data
  } catch { return null }
}

export function resetSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* */ }
}
