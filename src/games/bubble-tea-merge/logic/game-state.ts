import { MAX_INGREDIENT_LEVEL, MAX_DROP_LEVEL } from '../data/ingredients'
import { CUP_LEFT_TOP, CUP_RIGHT_TOP, DROP_MARGIN, CUP_TOP, OVERFLOW_TIME } from './constants'

export interface IngredientBody {
  id: number
  x: number
  y: number
  level: number
  droppedAt: number
}

export interface GameState {
  score: number
  ingredients: IngredientBody[]
  canDrop: boolean
  gameOver: boolean
  nextLevel: number
  merging: Set<number>
}

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

export function getRandomLevel(): number {
  return Math.floor(Math.random() * (MAX_DROP_LEVEL + 1))
}

export function canMerge(a: IngredientBody, b: IngredientBody, merging: Set<number>): boolean {
  if (a.level !== b.level) return false
  if (a.level >= MAX_INGREDIENT_LEVEL) return false
  if (merging.has(a.id) || merging.has(b.id)) return false
  return true
}

export function processMerge(
  a: IngredientBody,
  b: IngredientBody,
): { x: number; y: number; newLevel: number; points: number } {
  const newLevel = a.level + 1
  const points = newLevel * newLevel * 10
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    newLevel,
    points,
  }
}

export function checkGameOver(ingredients: IngredientBody[], now: number): boolean {
  return ingredients.some(b => b.y < CUP_TOP && now - b.droppedAt > OVERFLOW_TIME)
}

export function clampDropX(x: number): number {
  const leftBound = CUP_LEFT_TOP + DROP_MARGIN
  const rightBound = CUP_RIGHT_TOP - DROP_MARGIN
  return Math.max(leftBound, Math.min(rightBound, x))
}
