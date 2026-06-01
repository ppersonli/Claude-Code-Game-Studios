/**
 * Game state management for Block Blast Kawaii.
 * Handles game loop, persistence, and game over detection.
 */
import type { Grid } from './grid'
import type { Block } from './blocks'
import {
  createEmptyGrid, canPlace, placeBlock, clearLines, canAnyBlockFit, cloneGrid,
} from './grid'
import { generateBlockQueue, getBlockDimensions } from './blocks'
import { calculateMoveScore, updateCombo } from './scoring'
import { QUEUE_SIZE } from './constants'

export interface GameState {
  grid: Grid
  score: number
  bestScore: number
  combo: number
  blocksPlaced: number
  linesCleared: number
  queue: Block[]
  gameOver: boolean
  selectedBlockIndex: number // -1 = none selected
}

const SAVE_KEY = 'block-blast-kawaii-save'
const BEST_KEY = 'block-blast-kawaii-best'

export function loadBestScore(): number {
  try { return parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0 } catch { return 0 }
}

export function saveBestScore(score: number): void {
  try { localStorage.setItem(BEST_KEY, String(score)) } catch { /* noop */ }
}

export function createNewGame(): GameState {
  return {
    grid: createEmptyGrid(),
    score: 0,
    bestScore: loadBestScore(),
    combo: 0,
    blocksPlaced: 0,
    linesCleared: 0,
    queue: generateBlockQueue(QUEUE_SIZE),
    gameOver: false,
    selectedBlockIndex: -1,
  }
}

export function saveGame(state: GameState): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch { /* noop */ }
}

export function restoreGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? JSON.parse(raw) as GameState : null
  } catch { return null }
}

export function clearSave(): void {
  try { localStorage.removeItem(SAVE_KEY) } catch { /* noop */ }
}

/**
 * Place a block from the queue onto the grid.
 * Returns updated state and lines cleared this move (0 = no lines).
 */
export function placeBlockFromQueue(
  state: GameState,
  blockIndex: number,
  row: number,
  col: number,
): { state: GameState; linesCleared: number; points: number } | null {
  if (state.gameOver) return null
  if (blockIndex < 0 || blockIndex >= state.queue.length) return null

  const block = state.queue[blockIndex]
  if (!canPlace(state.grid, block.shape.matrix, row, col)) return null

  // Place the block
  let newGrid = placeBlock(state.grid, block.shape.matrix, row, col, block.colorIndex)

  // Clear lines
  const { grid: clearedGrid, linesCleared } = clearLines(newGrid)
  newGrid = clearedGrid

  // Update combo and score
  const newCombo = updateCombo(state.combo, linesCleared)
  const points = calculateMoveScore(linesCleared, state.combo)
  const newScore = state.score + points
  const newBest = Math.max(newScore, state.bestScore)

  if (newBest > state.bestScore) saveBestScore(newBest)

  // Remove placed block from queue and add new one
  const newQueue = [...state.queue]
  newQueue.splice(blockIndex, 1)
  newQueue.push(...generateBlockQueue(1))

  // Check game over
  const gameOver = !canAnyBlockFit(newGrid, newQueue)

  const newState: GameState = {
    grid: newGrid,
    score: newScore,
    bestScore: newBest,
    combo: newCombo,
    blocksPlaced: state.blocksPlaced + 1,
    linesCleared: state.linesCleared + linesCleared,
    queue: newQueue,
    gameOver,
    selectedBlockIndex: -1,
  }

  saveGame(newState)
  return { state: newState, linesCleared, points }
}
