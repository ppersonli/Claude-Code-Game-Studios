/**
 * Pathfinding — enemy movement along predefined waypoints.
 * Enemies follow a path defined by waypoints. Each tick they move
 * toward the next waypoint at their speed. When they reach the end,
 * they've leaked through and cost a life.
 */
import { DEFAULT_PATH, CELL_SIZE, GRID_COLS, GRID_ROWS } from './constants'
import type { GridCell } from './types'

export interface Waypoint {
  x: number
  y: number
}

// ─── Path utilities ────────────────────────────────────────────────────

/**
 * Get the default S-curve path for a level.
 */
export function getPath(): Waypoint[] {
  return DEFAULT_PATH.map(p => ({ x: p.x, y: p.y }))
}

/**
 * Distance between two points.
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Move an entity toward the next waypoint.
 * Returns { newX, newY, reachedEnd }.
 */
export function moveAlongPath(
  x: number,
  y: number,
  pathIndex: number,
  path: Waypoint[],
  speed: number,
): { x: number; y: number; pathIndex: number; reachedEnd: boolean } {
  if (pathIndex >= path.length) {
    return { x, y, pathIndex, reachedEnd: true }
  }

  const target = path[pathIndex]
  const dx = target.x - x
  const dy = target.y - y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist <= speed) {
    // Reached waypoint
    if (pathIndex + 1 >= path.length) {
      return { x: target.x, y: target.y, pathIndex: pathIndex + 1, reachedEnd: true }
    }
    // Continue to next waypoint with remaining speed
    const remaining = speed - dist
    return moveAlongPath(target.x, target.y, pathIndex + 1, path, remaining)
  }

  // Move toward waypoint
  const nx = dx / dist
  const ny = dy / dist
  return {
    x: x + nx * speed,
    y: y + ny * speed,
    pathIndex,
    reachedEnd: false,
  }
}

// ─── Grid ↔ Path ───────────────────────────────────────────────────────

/**
 * Build a grid with path cells marked.
 * Path cells are determined by tracing the waypoints through the grid.
 */
export function buildPathGrid(path: Waypoint[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    Array(GRID_COLS).fill(false),
  )

  // Mark cells along each path segment
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]
    markLine(grid, from.x, from.y, to.x, to.y)
  }

  return grid
}

/**
 * Mark grid cells along a line segment as path.
 */
function markLine(grid: boolean[][], x1: number, y1: number, x2: number, y2: number): void {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / (CELL_SIZE / 2)
  for (let t = 0; t <= steps; t++) {
    const ratio = steps === 0 ? 0 : t / steps
    const px = x1 + (x2 - x1) * ratio
    const py = y1 + (y2 - y1) * ratio
    const col = Math.floor(px / CELL_SIZE)
    const row = Math.floor(py / CELL_SIZE)
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      grid[row][col] = true
    }
  }
}

/**
 * Check if a grid cell is on the path.
 */
export function isPathCell(pathGrid: boolean[][], row: number, col: number): boolean {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false
  return pathGrid[row][col]
}

/**
 * Check if a tower can be placed at a grid cell.
 */
export function canPlaceTower(pathGrid: boolean[][], grid: (any | null)[][], row: number, col: number): boolean {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false
  if (isPathCell(pathGrid, row, col)) return false
  if (grid[row]?.[col] != null) return false
  return true
}
