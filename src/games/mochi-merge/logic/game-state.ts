/**
 * Pure game-state logic for Mochi Merge.
 * No Phaser or DOM dependencies — fully testable.
 */

import { MOCHI_TYPES, MAX_MOCHI_LEVEL, getMaxDropLevel } from '../data/mochi-types'
import { OVERFLOW_TIME, BOX_TOP } from './constants'
import { calculateMergeScore } from './scoring'

/** Represents a placed mochi in the game world. */
export interface MochiBody {
  id: number
  x: number
  y: number
  level: number
  droppedAt: number
}

/** Full game state (Phaser-free representation). */
export interface GameState {
  score: number
  mochis: MochiBody[]
  canDrop: boolean
  gameOver: boolean
  nextLevel: number
  merging: Set<number>
}

/**
 * Create a fresh game state.
 */
export function createGameState(): GameState {
  return {
    score: 0,
    mochis: [],
    canDrop: true,
    gameOver: false,
    nextLevel: getRandomLevel(),
    merging: new Set(),
  }
}

/**
 * Generate a random droppable mochi level (0..3).
 */
export function getRandomLevel(): number {
  const maxLevel = getMaxDropLevel()
  return Math.floor(Math.random() * (maxLevel + 1))
}

/**
 * Check whether two mochi can merge.
 * Rules: same level, not max level, neither is currently merging.
 */
export function canMerge(
  a: MochiBody,
  b: MochiBody,
  merging: Set<number>,
): boolean {
  if (a.level !== b.level) return false
  if (a.level >= MAX_MOCHI_LEVEL) return false
  if (merging.has(a.id) || merging.has(b.id)) return false
  return true
}

/**
 * Process a merge of two mochi. Returns the new mochi body and points earned.
 * Does NOT mutate the input state — returns new values.
 */
export function processMerge(
  a: MochiBody,
  b: MochiBody,
  now: number,
): { newBody: MochiBody; points: number } {
  const newLevel = a.level + 1
  const points = calculateMergeScore(a.level)
  const newBody: MochiBody = {
    id: Date.now() + Math.random(),
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    level: newLevel,
    droppedAt: now,
  }
  return { newBody, points }
}

/**
 * Check if any mochi has been overflowing the box top for too long.
 * Returns true if game over should be triggered.
 */
export function checkGameOver(
  mochis: MochiBody[],
  currentTime: number,
): boolean {
  for (const m of mochis) {
    if (m.y < BOX_TOP) {
      if (currentTime - m.droppedAt > OVERFLOW_TIME) {
        return true
      }
    }
  }
  return false
}

/**
 * Validate a drop position, clamping to box boundaries.
 */
export function clampDropX(
  x: number,
  boxLeft: number,
  boxRight: number,
): number {
  const margin = 30
  return Math.max(boxLeft + margin, Math.min(boxRight - margin, x))
}
