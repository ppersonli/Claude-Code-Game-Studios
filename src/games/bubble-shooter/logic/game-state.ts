import type { Grid } from './grid'
import { findConnected, findFloating, isGridEmpty, getLowestBubbleRow } from './grid'
import { getLevelConfig, generateLevelGrid } from './levels'
import { MIN_MATCH, FALL_SCORE_PER_BUBBLE, POP_SCORE_PER_BUBBLE } from './constants'

export interface GameState {
  level: number
  grid: Grid
  currentColor: number
  nextColor: number
  score: number
  totalScore: number
  shotsLeft: number
  maxShots: number
  shotsFired: number
  colorsInPlay: number
  gameOver: boolean
  levelComplete: boolean
  highScore: number
  levelsCompleted: number[]
}

export function createLevelState(level: number, highScore: number = 0, levelsCompleted: number[] = []): GameState {
  const config = getLevelConfig(level)
  const grid = generateLevelGrid(config)
  const colorsInPlay = config.colors
  const colorPool = Array.from({ length: colorsInPlay }, (_, i) => i)

  return {
    level,
    grid,
    currentColor: pickRandomColor(colorPool),
    nextColor: pickRandomColor(colorPool),
    score: 0,
    totalScore: 0,
    shotsLeft: config.maxShots,
    maxShots: config.maxShots,
    shotsFired: 0,
    colorsInPlay,
    gameOver: false,
    levelComplete: false,
    highScore,
    levelsCompleted: [...levelsCompleted],
  }
}

export function pickRandomColor(colorPool: number[]): number {
  return colorPool[Math.floor(Math.random() * colorPool.length)]
}

export function shootBubble(state: GameState, row: number, col: number): ShootResult {
  if (state.gameOver || state.levelComplete) return { popped: 0, fallen: 0, points: 0 }

  // Place bubble
  if (row < 0 || row >= state.grid.length || col < 0 || col >= (state.grid[row]?.length ?? 0)) {
    return { popped: 0, fallen: 0, points: 0 }
  }
  if (state.grid[row][col] !== null) return { popped: 0, fallen: 0, points: 0 }

  state.grid[row][col] = state.currentColor
  state.shotsFired++
  state.shotsLeft--

  let points = 0
  let popped = 0
  let fallen = 0

  // Check for matches
  const connected = findConnected(state.grid, row, col)
  if (connected.length >= MIN_MATCH) {
    // Pop connected
    for (const cell of connected) {
      state.grid[cell.row][cell.col] = null
    }
    popped = connected.length
    points += connected.length * POP_SCORE_PER_BUBBLE

    // Find and remove floating bubbles
    const floating = findFloating(state.grid)
    for (const cell of floating) {
      state.grid[cell.row][cell.col] = null
    }
    fallen = floating.length
    points += floating.length * FALL_SCORE_PER_BUBBLE
  }

  state.score += points
  state.totalScore += points

  // Next bubble
  const colorPool = getActiveColors(state.grid, state.colorsInPlay)
  state.currentColor = state.nextColor
  state.nextColor = colorPool.length > 0
    ? pickRandomColor(colorPool)
    : pickRandomColor(Array.from({ length: state.colorsInPlay }, (_, i) => i))

  // Check win/lose
  if (isGridEmpty(state.grid)) {
    state.levelComplete = true
    state.levelsCompleted.push(state.level)
    if (state.score > state.highScore) state.highScore = state.score
  } else if (state.shotsLeft <= 0) {
    state.gameOver = true
    if (state.totalScore > state.highScore) state.highScore = state.totalScore
  } else {
    const lowestRow = getLowestBubbleRow(state.grid)
    if (lowestRow >= state.grid.length - 1) {
      state.gameOver = true
      if (state.totalScore > state.highScore) state.highScore = state.totalScore
    }
  }

  return { popped, fallen, points }
}

export interface ShootResult {
  popped: number
  fallen: number
  points: number
}

function getActiveColors(grid: Grid, maxColors: number): number[] {
  const colors = new Set<number>()
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) colors.add(cell)
    }
  }
  return Array.from(colors)
}

export function getNextLevel(state: GameState): number | null {
  if (state.level >= 50) return null
  return state.level + 1
}
