import { COLS, ROWS, BUBBLE_RADIUS, GRID_OFFSET_X, GRID_OFFSET_Y, ROW_HEIGHT, MIN_MATCH } from './constants'

export type Grid = (number | null)[][]

export function createEmptyGrid(rows: number = ROWS, cols: number = COLS): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(null))
}

export function getCellCenter(row: number, col: number): { x: number; y: number } {
  const offsetX = row % 2 === 1 ? BUBBLE_RADIUS : 0
  return {
    x: GRID_OFFSET_X + col * BUBBLE_RADIUS * 2 + offsetX,
    y: GRID_OFFSET_Y + row * ROW_HEIGHT,
  }
}

export function getNearestCell(x: number, y: number): { row: number; col: number } {
  let bestRow = 0
  let bestCol = 0
  let bestDist = Infinity
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const center = getCellCenter(r, c)
      const dx = x - center.x
      const dy = y - center.y
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        bestRow = r
        bestCol = c
      }
    }
  }
  return { row: bestRow, col: bestCol }
}

export function getNeighbors(row: number, col: number): { row: number; col: number }[] {
  const neighbors: { row: number; col: number }[] = []
  const isOdd = row % 2 === 1

  // Same row
  if (col > 0) neighbors.push({ row, col: col - 1 })
  if (col < COLS - 1) neighbors.push({ row, col: col + 1 })

  // Row above
  if (row > 0) {
    const aboveCol = isOdd ? col : col - 1
    if (aboveCol >= 0) neighbors.push({ row: row - 1, col: aboveCol })
    if (aboveCol + 1 < COLS) neighbors.push({ row: row - 1, col: aboveCol + 1 })
  }

  // Row below
  if (row < ROWS - 1) {
    const belowCol = isOdd ? col : col - 1
    if (belowCol >= 0) neighbors.push({ row: row + 1, col: belowCol })
    if (belowCol + 1 < COLS) neighbors.push({ row: row + 1, col: belowCol + 1 })
  }

  return neighbors
}

export function findConnected(grid: Grid, row: number, col: number): { row: number; col: number }[] {
  const color = grid[row]?.[col]
  if (color === null || color === undefined) return []

  const visited = new Set<string>()
  const result: { row: number; col: number }[] = []
  const queue: { row: number; col: number }[] = [{ row, col }]

  while (queue.length > 0) {
    const current = queue.shift()!
    const key = `${current.row},${current.col}`
    if (visited.has(key)) continue
    visited.add(key)

    const cellColor = grid[current.row]?.[current.col]
    if (cellColor !== color) continue

    result.push(current)
    for (const n of getNeighbors(current.row, current.col)) {
      const nKey = `${n.row},${n.col}`
      if (!visited.has(nKey)) {
        queue.push(n)
      }
    }
  }

  return result
}

export function findFloating(grid: Grid): { row: number; col: number }[] {
  const connected = new Set<string>()
  const queue: { row: number; col: number }[] = []
  const numRows = grid.length
  const numCols = grid[0]?.length ?? 0

  for (let c = 0; c < numCols; c++) {
    if (grid[0]?.[c] !== null && grid[0]?.[c] !== undefined) {
      queue.push({ row: 0, col: c })
      connected.add(`0,${c}`)
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const n of getNeighbors(current.row, current.col)) {
      const key = `${n.row},${n.col}`
      if (!connected.has(key) && n.row < numRows && n.col < numCols && grid[n.row]?.[n.col] !== null) {
        connected.add(key)
        queue.push(n)
      }
    }
  }

  const floating: { row: number; col: number }[] = []
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (grid[r][c] !== null && !connected.has(`${r},${c}`)) {
        floating.push({ row: r, col: c })
      }
    }
  }

  return floating
}

export function isGridEmpty(grid: Grid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) return false
    }
  }
  return true
}

export function getLowestBubbleRow(grid: Grid): number {
  for (let r = grid.length - 1; r >= 0; r--) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (grid[r][c] !== null) return r
    }
  }
  return -1
}
