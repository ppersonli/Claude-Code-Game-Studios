/**
 * Game state management for Number Merge 2048.
 * Handles game loop, persistence, and win/lose detection.
 */
import type { Grid, Direction, Tile } from './grid'
import {
  initGrid, spawnTile, slideGrid, canMove, hasWinTile,
  getHighestTile, countTiles, cloneGrid, clearAnimations,
} from './grid'
import { WIN_TILE } from './constants'

export interface GameState {
  grid: Grid
  score: number
  bestScore: number
  won: boolean
  gameOver: boolean
  keepPlaying: boolean
  moveCount: number
  highestTile: number
}

const SAVE_KEY = 'number-merge-2048-save'
const BEST_SCORE_KEY = 'number-merge-2048-best'

export function loadBestScore(): number {
  try {
    return parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0
  } catch {
    return 0
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch { /* noop */ }
}

export function createNewGame(): GameState {
  return {
    grid: initGrid(),
    score: 0,
    bestScore: loadBestScore(),
    won: false,
    gameOver: false,
    keepPlaying: false,
    moveCount: 0,
    highestTile: 2,
  }
}

export function restoreGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  try {
    // Strip animation flags before saving
    const clean = { ...state, grid: clearAnimations(state.grid) }
    localStorage.setItem(SAVE_KEY, JSON.stringify(clean))
  } catch { /* noop */ }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch { /* noop */ }
}

/**
 * Process a move. Returns the updated state and whether the move was valid.
 */
export function processMove(state: GameState, direction: Direction): { state: GameState; moved: boolean } {
  if (state.gameOver) return { state, moved: false }
  if (state.won && !state.keepPlaying) return { state, moved: false }

  // Clear previous animation flags
  const cleanGrid = clearAnimations(state.grid)
  const result = slideGrid(cleanGrid, direction)

  if (!result.moved) return { state, moved: false }

  // Spawn a new tile
  const spawnResult = spawnTile(result.grid)
  const newGrid = spawnResult ? spawnResult.grid : result.grid
  const newScore = state.score + result.points
  const newBest = Math.max(newScore, state.bestScore)
  const newHighest = getHighestTile(newGrid)
  const newMoveCount = state.moveCount + 1

  if (newBest > state.bestScore) {
    saveBestScore(newBest)
  }

  let won = state.won
  let gameOver = false

  if (!won && hasWinTile(newGrid)) {
    won = true
  } else if (!canMove(newGrid)) {
    gameOver = true
  }

  const newState: GameState = {
    grid: newGrid,
    score: newScore,
    bestScore: newBest,
    won,
    gameOver,
    keepPlaying: state.keepPlaying,
    moveCount: newMoveCount,
    highestTile: newHighest,
  }

  saveGame(newState)
  return { state: newState, moved: true }
}

/** Continue playing after winning */
export function continuePlaying(state: GameState): GameState {
  return { ...state, keepPlaying: true, won: false }
}
