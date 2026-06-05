/**
 * Idle Garden Tycoon — Decoration System
 * Handles decoration purchasing, ownership checks, and bonus calculations.
 */

import type { GameState } from '../data/types'
import { DECORATIONS, type DecorationData } from '../data/decorations'

export { DECORATIONS }

/**
 * Get decoration data by ID.
 */
export function getDecorationById(id: string): DecorationData | undefined {
  return DECORATIONS.find(d => d.id === id)
}

/**
 * Get decorations available for purchase at the player's level,
 * excluding already-owned ones.
 */
export function getAvailableDecorations(level: number, owned: string[]): DecorationData[] {
  return DECORATIONS.filter(d => d.unlockLevel <= level && !owned.includes(d.id))
}

/**
 * Buy a decoration. Deducts coins and adds to owned list.
 * Returns false if: already owned, can't afford, level too low, unknown id.
 */
export function buyDecoration(state: GameState, id: string): boolean {
  const deco = getDecorationById(id)
  if (!deco) return false
  if (state.decorations.includes(id)) return false
  if (state.level < deco.unlockLevel) return false
  if (state.coins < deco.cost) return false

  state.coins -= deco.cost
  state.decorations.push(id)
  return true
}

/**
 * Check if a decoration is owned.
 */
export function isDecorationOwned(state: GameState, id: string): boolean {
  return state.decorations.includes(id)
}

/**
 * Calculate total growth and price bonuses from all owned decorations.
 */
export function getDecorationBonus(state: GameState): { growth: number; price: number } {
  let growth = 0
  let price = 0

  for (const id of state.decorations) {
    const deco = getDecorationById(id)
    if (!deco) continue
    if (deco.bonusType === 'growth') growth += deco.bonusValue
    if (deco.bonusType === 'price') price += deco.bonusValue
  }

  return { growth, price }
}
