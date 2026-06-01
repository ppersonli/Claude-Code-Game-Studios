/**
 * 10x10 grid logic for Block Blast Kawaii.
 * Pure functions for placement, line clearing, and validity checks.
 */
import { GRID_SIZE } from './constants'

export type Grid = (number | null)[][] // null = empty, number = color index

/** Create an empty 10x10 grid */
export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  )
}

/** Deep clone a grid */
export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row])
}

/**
 * Check if a block can be placed at (row, col) on the grid.
 * No collision with existing cells and within bounds.
 */
export function canPlace(grid: Grid, matrix: number[][], row: number, col: number): boolean {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  if (row + rows > GRID_SIZE || col + cols > GRID_SIZE) return false
  if (row < 0 || col < 0) return false
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] && grid[row + r][col + c] !== null) return false
    }
  }
  return true
}

/**
 * Place a block on the grid. Returns a new grid.
 * Does not check validity — caller should use canPlace first.
 */
export function placeBlock(grid: Grid, matrix: number[][], row: number, col: number, colorIndex: number): Grid {
  const newGrid = cloneGrid(grid)
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        newGrid[row + r][col + c] = colorIndex
      }
    }
  }
  return newGrid
}

/** Find all full rows and columns. Returns their indices. */
export function findFullLines(grid: Grid): { rows: number[]; cols: number[] } {
  const fullRows: number[] = []
  const fullCols: number[] = []

  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every(cell => cell !== null)) fullRows.push(r)
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) { full = false; break }
    }
    if (full) fullCols.push(c)
  }

  return { rows: fullRows, cols: fullCols }
}

/**
 * Clear full rows and columns from the grid.
 * Returns new grid and count of lines cleared.
 */
export function clearLines(grid: Grid): { grid: Grid; linesCleared: number } {
  const { rows, cols } = findFullLines(grid)
  if (rows.length === 0 && cols.length === 0) return { grid, linesCleared: 0 }

  const newGrid = cloneGrid(grid)

  // Clear full rows
  for (const r of rows) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[r][c] = null
    }
  }

  // Clear full columns
  for (const c of cols) {
    for (let r = 0; r < GRID_SIZE; r++) {
      newGrid[r][c] = null
    }
  }

  return { grid: newGrid, linesCleared: rows.length + cols.length }
}

/** Check if ANY block from a set can be placed anywhere on the grid */
export function canAnyBlockFit(grid: Grid, blocks: { matrix: number[][] }[]): boolean {
  for (const block of blocks) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlace(grid, block.matrix, r, c)) return true
      }
    }
  }
  return false
}

/** Count occupied cells */
export function countOccupied(grid: Grid): number {
  let count = 0
  for (const row of grid)
    for (const cell of row)
      if (cell !== null) count++
  return count
}

/** Check if grid is completely empty */
export function isGridEmpty(grid: Grid): boolean {
  return countOccupied(grid) === 0
}
