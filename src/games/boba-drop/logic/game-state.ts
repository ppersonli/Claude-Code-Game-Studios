/**
 * Pure game-state logic for Boba Drop.
 * No Phaser or DOM dependencies — fully testable.
 */

import { INGREDIENTS, MAX_INGREDIENT_LEVEL, getMaxDropLevel } from '../data/ingredients'
import { OVERFLOW_TIME, CUP_TOP } from './constants'
import { calculateMergeScore } from './scoring'

/** Represents a placed ingredient in the game world. */
export interface IngredientBody {
  id: number
  x: number
  y: number
  level: number
  droppedAt: number
}

/** Full game state (Phaser-free representation). */
export interface GameState {
  score: number
  ingredients: IngredientBody[]
  canDrop: boolean
  gameOver: boolean
  nextLevel: number
  merging: Set<number>  // set of ingredient ids currently being merged
}

/**
 * Create a fresh game state.
 */
export function createGameState(): GameState {
  return {
    score: 0,
    ingredients: [],
    canDrop: true,
    gameOver: false,
    nextLevel: getRandomLevel(),
    merging: new Set(),
  }
}

/**
 * Generate a random droppable ingredient level (0..4).
 */
export function getRandomLevel(): number {
  const maxLevel = getMaxDropLevel()
  return Math.floor(Math.random() * (maxLevel + 1))
}

/**
 * Check whether two ingredients can merge.
 * Rules: same level, not max level, neither is currently merging.
 */
export function canMerge(
  a: IngredientBody,
  b: IngredientBody,
  merging: Set<number>,
): boolean {
  if (a.level !== b.level) return false
  if (a.level >= MAX_INGREDIENT_LEVEL) return false
  if (merging.has(a.id) || merging.has(b.id)) return false
  return true
}

/**
 * Process a merge of two ingredients. Returns the new ingredient body and points earned.
 * Does NOT mutate the input state — returns new values.
 */
export function processMerge(
  a: IngredientBody,
  b: IngredientBody,
  now: number,
): { newBody: IngredientBody; points: number } {
  const newLevel = a.level + 1
  const points = calculateMergeScore(a.level)
  const newBody: IngredientBody = {
    id: Date.now() + Math.random(), // unique id
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    level: newLevel,
    droppedAt: now,
  }
  return { newBody, points }
}

/**
 * Check if any ingredient has been overflowing the cup top for too long.
 * Returns true if game over should be triggered.
 */
export function checkGameOver(
  ingredients: IngredientBody[],
  currentTime: number,
): boolean {
  for (const ing of ingredients) {
    if (ing.y < CUP_TOP) {
      if (currentTime - ing.droppedAt > OVERFLOW_TIME) {
        return true
      }
    }
  }
  return false
}

/**
 * Validate a drop position, clamping to cup boundaries.
 */
export function clampDropX(
  x: number,
  cupLeftTop: number,
  cupRightTop: number,
): number {
  const margin = 30
  return Math.max(cupLeftTop + margin, Math.min(cupRightTop - margin, x))
}
