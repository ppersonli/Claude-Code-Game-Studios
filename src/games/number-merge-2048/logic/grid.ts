/**
 * Core grid logic for Number Merge 2048.
 * All pure functions — no side effects, fully testable.
 */
import { GRID_SIZE, SPAWN_TILE_2_PROBABILITY } from './constants'

/** Tile with optional merge tracking for animations */
export interface Tile {
  value: number
  id: number
  mergedFrom?: [Tile, Tile]
  isNew?: boolean
}

export type Grid = (Tile | null)[][]
export type Direction = 'up' | 'down' | 'left' | 'right'

let nextTileId = 1

export function resetTileIdCounter(): void {
  nextTileId = 1
}

export function createTileId(): number {
  return nextTileId++
}

/** Create an empty 4x4 grid */
export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  )
}

/** Get all empty cell positions */
export function getEmptyCells(grid: Grid): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) cells.push({ row: r, col: c })
    }
  }
  return cells
}

/** Spawn a tile (90% = 2, 10% = 4) at a random empty cell. Returns new grid. */
export function spawnTile(grid: Grid): { grid: Grid; row: number; col: number } | null {
  const empty = getEmptyCells(grid)
  if (empty.length === 0) return null
  const cell = empty[Math.floor(Math.random() * empty.length)]
  const value = Math.random() < SPAWN_TILE_2_PROBABILITY ? 2 : 4
  const newGrid = cloneGrid(grid)
  newGrid[cell.row][cell.col] = { value, id: createTileId(), isNew: true }
  return { grid: newGrid, row: cell.row, col: cell.col }
}

/** Deep clone a grid (drops animation flags) */
export function cloneGrid(grid: Grid): Grid {
  return grid.map(row =>
    row.map(tile => (tile ? { ...tile } : null)),
  )
}

/** Clear animation flags from all tiles */
export function clearAnimations(grid: Grid): Grid {
  return grid.map(row =>
    row.map(tile => {
      if (!tile) return null
      const { mergedFrom, isNew, ...rest } = tile
      return rest
    }),
  )
}

/**
 * Slide a single row to the left and merge identical adjacent tiles.
 * Returns the new row and points earned from merges.
 */
export function slideRowLeft(row: (Tile | null)[]): { row: (Tile | null)[]; points: number } {
  // 1. Compact: remove nulls
  const compacted = row.filter((t): t is Tile => t !== null)
  // 2. Merge adjacent equal tiles
  const merged: Tile[] = []
  let points = 0
  let i = 0
  while (i < compacted.length) {
    if (i + 1 < compacted.length && compacted[i].value === compacted[i + 1].value) {
      const newValue = compacted[i].value * 2
      points += newValue
      merged.push({
        value: newValue,
        id: createTileId(),
        mergedFrom: [compacted[i], compacted[i + 1]],
      })
      i += 2
    } else {
      merged.push({ ...compacted[i] })
      i++
    }
  }
  // 3. Pad with nulls
  while (merged.length < GRID_SIZE) {
    merged.push(null as unknown as Tile)
  }
  return { row: merged as (Tile | null)[], points }
}

/** Extract a column from the grid as a row */
function getColumn(grid: Grid, col: number): (Tile | null)[] {
  return grid.map(row => row[col])
}

/** Set a column in the grid */
function setColumn(grid: Grid, col: number, values: (Tile | null)[]): void {
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r][col] = values[r]
  }
}

/** Reverse a row */
function reverseRow(row: (Tile | null)[]): (Tile | null)[] {
  return [...row].reverse()
}

/**
 * Slide the entire grid in a direction.
 * Returns new grid and points earned.
 */
export function slideGrid(grid: Grid, direction: Direction): { grid: Grid; points: number; moved: boolean } {
  const newGrid = cloneGrid(grid)
  let totalPoints = 0
  let moved = false

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < GRID_SIZE; r++) {
      let row = [...newGrid[r]]
      if (direction === 'right') row = reverseRow(row)
      const result = slideRowLeft(row)
      if (direction === 'right') result.row = reverseRow(result.row)
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c]?.value !== result.row[c]?.value) moved = true
        newGrid[r][c] = result.row[c]
      }
      totalPoints += result.points
    }
  } else {
    for (let c = 0; c < GRID_SIZE; c++) {
      let col = getColumn(newGrid, c)
      if (direction === 'down') col = reverseRow(col)
      const result = slideRowLeft(col)
      if (direction === 'down') result.row = reverseRow(result.row)
      for (let r = 0; r < GRID_SIZE; r++) {
        if (newGrid[r][c]?.value !== result.row[r]?.value) moved = true
        newGrid[r][c] = result.row[r]
      }
      totalPoints += result.points
    }
  }

  return { grid: newGrid, points: totalPoints, moved }
}

/** Check if any cell has the WIN_TILE */
export function hasWinTile(grid: Grid): boolean {
  for (const row of grid) {
    for (const tile of row) {
      if (tile && tile.value >= 2048) return true
    }
  }
  return false
}

/** Check if any valid move remains */
export function canMove(grid: Grid): boolean {
  // If any empty cell exists, we can move
  if (getEmptyCells(grid).length > 0) return true
  // Check horizontal neighbors
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      if (grid[r][c]?.value === grid[r][c + 1]?.value) return true
    }
  }
  // Check vertical neighbors
  for (let r = 0; r < GRID_SIZE - 1; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c]?.value === grid[r + 1][c]?.value) return true
    }
  }
  return false
}

/** Get the highest tile value on the grid */
export function getHighestTile(grid: Grid): number {
  let max = 0
  for (const row of grid) {
    for (const tile of row) {
      if (tile && tile.value > max) max = tile.value
    }
  }
  return max
}

/** Count total occupied cells */
export function countTiles(grid: Grid): number {
  let count = 0
  for (const row of grid) {
    for (const tile of row) {
      if (tile) count++
    }
  }
  return count
}

/** Initialize a grid with two random tiles */
export function initGrid(): Grid {
  let grid = createEmptyGrid()
  const r1 = spawnTile(grid)
  if (r1) grid = r1.grid
  const r2 = spawnTile(grid)
  if (r2) grid = r2.grid
  return grid
}
