import { BUBBLE_COLORS } from '../data/colors'
import { COLS, ROWS } from './constants'
import { createEmptyGrid, type Grid } from './grid'

export interface LevelConfig {
  level: number
  rows: number
  colors: number // number of distinct colors to use
  maxShots: number
}

export function getLevelConfig(level: number): LevelConfig {
  const clamped = Math.max(1, Math.min(50, level))
  const rows = Math.min(ROWS, 4 + Math.floor(clamped / 5))
  const colors = Math.min(BUBBLE_COLORS.length, 3 + Math.floor(clamped / 10))
  const maxShots = Math.max(15, 40 - Math.floor(clamped / 3))
  return { level: clamped, rows, colors, maxShots }
}

export function generateLevelGrid(config: LevelConfig): Grid {
  const grid = createEmptyGrid(ROWS, COLS)
  const colorIds = BUBBLE_COLORS.slice(0, config.colors).map(c => c.id)

  for (let r = 0; r < config.rows; r++) {
    const maxCol = r % 2 === 1 ? COLS - 1 : COLS
    for (let c = 0; c < maxCol; c++) {
      // 80% fill rate for more natural look
      if (Math.random() < 0.8) {
        grid[r][c] = colorIds[Math.floor(Math.random() * colorIds.length)]
      }
    }
  }

  return grid
}
