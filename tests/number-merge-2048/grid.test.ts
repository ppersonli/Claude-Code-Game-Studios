import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createEmptyGrid, getEmptyCells, spawnTile, slideRowLeft, slideGrid,
  hasWinTile, canMove, getHighestTile, countTiles, initGrid,
  cloneGrid, clearAnimations, resetTileIdCounter, createTileId,
  type Tile, type Grid, type Direction,
} from '../../src/games/number-merge-2048/logic/grid'
import { GRID_SIZE, WIN_TILE, SPAWN_TILE_2_PROBABILITY } from '../../src/games/number-merge-2048/logic/constants'
import { calculateMergePoints, calculateGameOverBonus } from '../../src/games/number-merge-2048/logic/scoring'
import { getTileStyle, type TileStyle } from '../../src/games/number-merge-2048/data/tile-colors'

beforeEach(() => {
  resetTileIdCounter()
})

// ==============================
// CONSTANTS
// ==============================

describe('constants', () => {
  it('test_GRID_SIZE_is_4', () => {
    expect(GRID_SIZE).toBe(4)
  })
  it('test_WIN_TILE_is_2048', () => {
    expect(WIN_TILE).toBe(2048)
  })
  it('test_spawn_probability_between_0_and_1', () => {
    expect(SPAWN_TILE_2_PROBABILITY).toBeGreaterThan(0)
    expect(SPAWN_TILE_2_PROBABILITY).toBeLessThan(1)
  })
})

// ==============================
// createTileId / resetTileIdCounter
// ==============================

describe('tile id counter', () => {
  it('test_increments_sequentially', () => {
    resetTileIdCounter()
    expect(createTileId()).toBe(1)
    expect(createTileId()).toBe(2)
    expect(createTileId()).toBe(3)
  })
  it('test_reset_returns_to_1', () => {
    createTileId()
    createTileId()
    resetTileIdCounter()
    expect(createTileId()).toBe(1)
  })
})

// ==============================
// createEmptyGrid
// ==============================

describe('createEmptyGrid', () => {
  it('test_creates_4x4', () => {
    const grid = createEmptyGrid()
    expect(grid).toHaveLength(GRID_SIZE)
    for (const row of grid) expect(row).toHaveLength(GRID_SIZE)
  })
  it('test_all_null', () => {
    const grid = createEmptyGrid()
    for (const row of grid) for (const cell of row) expect(cell).toBeNull()
  })
  it('test_each_call_creates_independent_grid', () => {
    const a = createEmptyGrid()
    const b = createEmptyGrid()
    a[0][0] = { value: 2, id: 1 }
    expect(b[0][0]).toBeNull()
  })
})

// ==============================
// getEmptyCells
// ==============================

describe('getEmptyCells', () => {
  it('test_full_grid_returns_16_cells', () => {
    expect(getEmptyCells(createEmptyGrid())).toHaveLength(16)
  })
  it('test_partial_grid', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][1] = { value: 4, id: 2 }
    expect(getEmptyCells(grid)).toHaveLength(14)
  })
  it('test_full_returns_empty', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        grid[r][c] = { value: 2, id: r * 4 + c }
    expect(getEmptyCells(grid)).toHaveLength(0)
  })
  it('test_returns_correct_positions', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    const cells = getEmptyCells(grid)
    expect(cells.find(c => c.row === 0 && c.col === 0)).toBeUndefined()
    expect(cells.find(c => c.row === 0 && c.col === 1)).toBeDefined()
    expect(cells.find(c => c.row === 3 && c.col === 3)).toBeDefined()
  })
  it('test_single_tile', () => {
    const grid = createEmptyGrid()
    grid[2][3] = { value: 2, id: 1 }
    expect(getEmptyCells(grid)).toHaveLength(15)
  })
})

// ==============================
// spawnTile
// ==============================

describe('spawnTile', () => {
  it('test_spawns_at_empty_cell', () => {
    const grid = createEmptyGrid()
    const result = spawnTile(grid)
    expect(result).not.toBeNull()
    const empty = getEmptyCells(result!.grid)
    expect(empty).toHaveLength(15)
  })
  it('test_spawns_value_2_or_4', () => {
    const grid = createEmptyGrid()
    const result = spawnTile(grid)
    const tile = result!.grid[result!.row][result!.col]
    expect(tile).not.toBeNull()
    expect([2, 4]).toContain(tile!.value)
  })
  it('test_marks_new_tile', () => {
    const grid = createEmptyGrid()
    const result = spawnTile(grid)
    const tile = result!.grid[result!.row][result!.col]
    expect(tile!.isNew).toBe(true)
  })
  it('test_full_grid_returns_null', () => {
    const grid = createEmptyGrid()
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        grid[r][c] = { value: 2, id: r * 4 + c }
    expect(spawnTile(grid)).toBeNull()
  })
  it('test_does_not_mutate_input', () => {
    const grid = createEmptyGrid()
    const original = cloneGrid(grid)
    spawnTile(grid)
    expect(grid).toEqual(original)
  })
  it('test_returns_valid_position', () => {
    const grid = createEmptyGrid()
    const result = spawnTile(grid)
    expect(result!.row).toBeGreaterThanOrEqual(0)
    expect(result!.row).toBeLessThan(GRID_SIZE)
    expect(result!.col).toBeGreaterThanOrEqual(0)
    expect(result!.col).toBeLessThan(GRID_SIZE)
  })
})

// ==============================
// cloneGrid
// ==============================

describe('cloneGrid', () => {
  it('test_creates_deep_copy', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    const clone = cloneGrid(grid)
    clone[0][0]!.value = 999
    expect(grid[0][0]!.value).toBe(2)
  })
  it('test_preserves_null', () => {
    const clone = cloneGrid(createEmptyGrid())
    expect(clone[0][0]).toBeNull()
  })
  it('test_preserves_animation_flags', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1, isNew: true }
    grid[1][1] = { value: 4, id: 2, mergedFrom: [{ value: 2, id: 3 }, { value: 2, id: 4 }] }
    const clone = cloneGrid(grid)
    expect(clone[0][0]!.isNew).toBe(true)
    expect(clone[1][1]!.mergedFrom).toBeDefined()
  })
  it('test_full_grid_clones_all', () => {
    const grid = createEmptyGrid()
    let id = 1
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        grid[r][c] = { value: (r * 4 + c + 1) * 2, id: id++ }
    const clone = cloneGrid(grid)
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        expect(clone[r][c]!.value).toBe(grid[r][c]!.value)
  })
})

// ==============================
// clearAnimations
// ==============================

describe('clearAnimations', () => {
  it('test_removes_isNew_flag', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1, isNew: true }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.isNew).toBeUndefined()
  })
  it('test_removes_mergedFrom_flag', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 4, id: 1, mergedFrom: [{ value: 2, id: 2 }, { value: 2, id: 3 }] }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.mergedFrom).toBeUndefined()
  })
  it('test_preserves_value', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 8, id: 1, isNew: true }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.value).toBe(8)
  })
  it('test_preserves_id', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 8, id: 42, isNew: true }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.id).toBe(42)
  })
  it('test_null_stays_null', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][1]).toBeNull()
  })
  it('test_strips_both_flags_simultaneously', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 4, id: 1, isNew: true, mergedFrom: [{ value: 2, id: 2 }, { value: 2, id: 3 }] }
    const cleaned = clearAnimations(grid)
    expect(cleaned[0][0]!.isNew).toBeUndefined()
    expect(cleaned[0][0]!.mergedFrom).toBeUndefined()
    expect(cleaned[0][0]!.value).toBe(4)
  })
})

// ==============================
// slideRowLeft
// ==============================

describe('slideRowLeft', () => {
  it('test_merges_two_equal_tiles', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 2, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(4)
    expect(result.row[1]).toBeNull()
    expect(result.points).toBe(4)
  })
  it('test_no_merge_different_values', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 4, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(2)
    expect(result.row[1]!.value).toBe(4)
    expect(result.points).toBe(0)
  })
  it('test_compacts_gaps', () => {
    const row: (Tile | null)[] = [null, { value: 2, id: 1 }, null, { value: 2, id: 2 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(4)
    expect(result.points).toBe(4)
  })
  it('test_no_triple_merge', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 2, id: 2 }, { value: 2, id: 3 }, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(4)
    expect(result.row[1]!.value).toBe(2)
    expect(result.points).toBe(4)
  })
  it('test_four_equal_merges_to_two_pairs', () => {
    const row: (Tile | null)[] = [{ value: 4, id: 1 }, { value: 4, id: 2 }, { value: 4, id: 3 }, { value: 4, id: 4 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(8)
    expect(result.row[1]!.value).toBe(8)
    expect(result.points).toBe(16)
  })
  it('test_already_compact_no_change', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 4, id: 2 }, { value: 8, id: 3 }, { value: 16, id: 4 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(2)
    expect(result.row[1]!.value).toBe(4)
    expect(result.row[2]!.value).toBe(8)
    expect(result.row[3]!.value).toBe(16)
    expect(result.points).toBe(0)
  })
  it('test_all_null', () => {
    const row: (Tile | null)[] = [null, null, null, null]
    const result = slideRowLeft(row)
    for (const cell of result.row) expect(cell).toBeNull()
    expect(result.points).toBe(0)
  })
  it('test_sets_mergedFrom_flag', () => {
    const row: (Tile | null)[] = [{ value: 8, id: 1 }, { value: 8, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.mergedFrom).toBeDefined()
    expect(result.row[0]!.mergedFrom!.length).toBe(2)
  })
  it('test_high_merge_values', () => {
    const row: (Tile | null)[] = [{ value: 1024, id: 1 }, { value: 1024, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(2048)
    expect(result.points).toBe(2048)
  })
  it('test_single_tile_slides_left', () => {
    const row: (Tile | null)[] = [null, null, null, { value: 2, id: 1 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(2)
    expect(result.points).toBe(0)
  })
  it('test_two_pairs_different_values', () => {
    const row: (Tile | null)[] = [{ value: 2, id: 1 }, { value: 2, id: 2 }, { value: 4, id: 3 }, { value: 4, id: 4 }]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(4)
    expect(result.row[1]!.value).toBe(8)
    expect(result.points).toBe(12)
  })
  it('test_non_power_of_two_merges', () => {
    // Edge: 0 value shouldn't happen but test robustness
    const row: (Tile | null)[] = [{ value: 32, id: 1 }, { value: 32, id: 2 }, null, null]
    const result = slideRowLeft(row)
    expect(result.row[0]!.value).toBe(64)
    expect(result.points).toBe(64)
  })
  it('test_result_always_length_4', () => {
    const inputs: (Tile | null)[][] = [
      [null, null, null, null],
      [{ value: 2, id: 1 }, null, null, null],
      [{ value: 2, id: 1 }, { value: 2, id: 2 }, { value: 2, id: 3 }, { value: 2, id: 4 }],
    ]
    for (const row of inputs) {
      expect(slideRowLeft(row).row).toHaveLength(4)
    }
  })
})

// ==============================
// slideGrid
// ==============================

describe('slideGrid', () => {
  it('test_slide_left_merges', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][2] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'left')
    expect(result.grid[0][0]!.value).toBe(4)
    expect(result.moved).toBe(true)
    expect(result.points).toBe(4)
  })
  it('test_slide_right', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][2] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'right')
    expect(result.grid[0][3]!.value).toBe(4)
    expect(result.moved).toBe(true)
  })
  it('test_slide_up', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[2][0] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'up')
    expect(result.grid[0][0]!.value).toBe(4)
    expect(result.moved).toBe(true)
  })
  it('test_slide_down', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[2][0] = { value: 2, id: 2 }
    const result = slideGrid(grid, 'down')
    expect(result.grid[3][0]!.value).toBe(4)
    expect(result.moved).toBe(true)
  })
  it('test_no_move_returns_false', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    const result = slideGrid(grid, 'left')
    expect(result.moved).toBe(false)
    expect(result.points).toBe(0)
  })
  it('test_multi_row_merge', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }; grid[0][1] = { value: 2, id: 2 }
    grid[1][0] = { value: 4, id: 3 }; grid[1][1] = { value: 4, id: 4 }
    const result = slideGrid(grid, 'left')
    expect(result.grid[0][0]!.value).toBe(4)
    expect(result.grid[1][0]!.value).toBe(8)
    expect(result.points).toBe(12)
  })
  it('test_does_not_mutate_input', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][2] = { value: 2, id: 2 }
    slideGrid(grid, 'left')
    expect(grid[0][2]!.value).toBe(2)
  })
  it('test_empty_grid_slide_any_direction', () => {
    const grid = createEmptyGrid()
    for (const dir of ['left', 'right', 'up', 'down'] as Direction[]) {
      const result = slideGrid(grid, dir)
      expect(result.moved).toBe(false)
      expect(result.points).toBe(0)
    }
  })
  it('test_slide_down_multi_column', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }; grid[0][1] = { value: 4, id: 2 }
    grid[1][0] = { value: 2, id: 3 }; grid[1][1] = { value: 4, id: 4 }
    const result = slideGrid(grid, 'down')
    expect(result.grid[3][0]!.value).toBe(4)
    expect(result.grid[3][1]!.value).toBe(8)
    expect(result.points).toBe(12)
  })
  it('test_slide_up_shifts_all_to_top', () => {
    const grid = createEmptyGrid()
    grid[3][0] = { value: 2, id: 1 }
    const result = slideGrid(grid, 'up')
    expect(result.grid[0][0]!.value).toBe(2)
    expect(result.grid[3][0]).toBeNull()
    expect(result.moved).toBe(true)
  })
  it('test_slide_right_shifts_all_to_right', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    const result = slideGrid(grid, 'right')
    expect(result.grid[0][3]!.value).toBe(2)
    expect(result.grid[0][0]).toBeNull()
    expect(result.moved).toBe(true)
  })
})

// ==============================
// hasWinTile
// ==============================

describe('hasWinTile', () => {
  it('test_empty_grid_false', () => {
    expect(hasWinTile(createEmptyGrid())).toBe(false)
  })
  it('test_1024_false', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 1024, id: 1 }
    expect(hasWinTile(grid)).toBe(false)
  })
  it('test_2048_true', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2048, id: 1 }
    expect(hasWinTile(grid)).toBe(true)
  })
  it('test_4096_also_true', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 4096, id: 1 }
    expect(hasWinTile(grid)).toBe(true)
  })
  it('test_2_is_not_win', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    expect(hasWinTile(grid)).toBe(false)
  })
  it('test_8192_true', () => {
    const grid = createEmptyGrid()
    grid[3][3] = { value: 8192, id: 1 }
    expect(hasWinTile(grid)).toBe(true)
  })
})

// ==============================
// canMove
// ==============================

describe('canMove', () => {
  it('test_empty_grid_can_move', () => {
    expect(canMove(createEmptyGrid())).toBe(true)
  })
  it('test_adjacent_horizontal_merge', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[0][1] = { value: 2, id: 2 }
    expect(canMove(grid)).toBe(true)
  })
  it('test_adjacent_vertical_merge', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][0] = { value: 2, id: 2 }
    expect(canMove(grid)).toBe(true)
  })
  it('test_no_moves_blocked', () => {
    const grid = createEmptyGrid()
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2, 4, 8, 16, 32, 64]
    let i = 0
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        grid[r][c] = { value: values[i], id: i++ }
    expect(canMove(grid)).toBe(false)
  })
  it('test_single_empty_cell_can_move', () => {
    const grid = createEmptyGrid()
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 4, 8, 16, 32, 64]
    let i = 0
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (r === 3 && c === 3) continue
        else grid[r][c] = { value: values[i], id: i++ }
    expect(canMove(grid)).toBe(true)
  })
  it('test_horizontal_merge_at_edges', () => {
    const grid = createEmptyGrid()
    grid[0][2] = { value: 16, id: 1 }
    grid[0][3] = { value: 16, id: 2 }
    // Fill rest with non-mergeable values
    const values = [2, 4, 8, 32, 64, 128, 256, 512, 1024, 2, 4, 8, 32, 64]
    let i = 0
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        if ((r === 0 && c >= 2)) continue
        grid[r][c] = { value: values[i], id: i++ + 10 }
      }
    expect(canMove(grid)).toBe(true)
  })
})

// ==============================
// getHighestTile
// ==============================

describe('getHighestTile', () => {
  it('test_empty_grid_returns_0', () => {
    expect(getHighestTile(createEmptyGrid())).toBe(0)
  })
  it('test_finds_max', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][1] = { value: 1024, id: 2 }
    grid[2][2] = { value: 512, id: 3 }
    expect(getHighestTile(grid)).toBe(1024)
  })
  it('test_single_tile', () => {
    const grid = createEmptyGrid()
    grid[3][3] = { value: 256, id: 1 }
    expect(getHighestTile(grid)).toBe(256)
  })
  it('test_all_same_value', () => {
    const grid = createEmptyGrid()
    let id = 1
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        grid[r][c] = { value: 32, id: id++ }
    expect(getHighestTile(grid)).toBe(32)
  })
})

// ==============================
// countTiles
// ==============================

describe('countTiles', () => {
  it('test_empty_grid_returns_0', () => {
    expect(countTiles(createEmptyGrid())).toBe(0)
  })
  it('test_counts_correctly', () => {
    const grid = createEmptyGrid()
    grid[0][0] = { value: 2, id: 1 }
    grid[1][1] = { value: 4, id: 2 }
    expect(countTiles(grid)).toBe(2)
  })
  it('test_full_grid_returns_16', () => {
    const grid = createEmptyGrid()
    let i = 0
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        grid[r][c] = { value: 2, id: i++ }
    expect(countTiles(grid)).toBe(16)
  })
  it('test_one_tile', () => {
    const grid = createEmptyGrid()
    grid[2][1] = { value: 8, id: 1 }
    expect(countTiles(grid)).toBe(1)
  })
})

// ==============================
// initGrid
// ==============================

describe('initGrid', () => {
  it('test_starts_with_two_tiles', () => {
    const grid = initGrid()
    expect(countTiles(grid)).toBe(2)
  })
  it('test_tiles_are_2_or_4', () => {
    const grid = initGrid()
    for (const row of grid) {
      for (const tile of row) {
        if (tile) expect([2, 4]).toContain(tile.value)
      }
    }
  })
  it('test_tiles_at_different_positions', () => {
    // With 16 cells and 2 tiles, extremely unlikely to overlap
    const grid = initGrid()
    const positions: string[] = []
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (grid[r][c]) positions.push(`${r},${c}`)
    expect(positions).toHaveLength(2)
    expect(positions[0]).not.toBe(positions[1])
  })
})

// ==============================
// SCORING
// ==============================

describe('calculateMergePoints', () => {
  it('test_4_returns_4', () => { expect(calculateMergePoints(4)).toBe(4) })
  it('test_8_returns_8', () => { expect(calculateMergePoints(8)).toBe(8) })
  it('test_2048_returns_2048', () => { expect(calculateMergePoints(2048)).toBe(2048) })
  it('test_2_returns_2', () => { expect(calculateMergePoints(2)).toBe(2) })
  it('test_is_identity_function', () => {
    for (const v of [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096])
      expect(calculateMergePoints(v)).toBe(v)
  })
})

describe('calculateGameOverBonus', () => {
  it('test_100_gives_10', () => { expect(calculateGameOverBonus(100)).toBe(10) })
  it('test_0_gives_0', () => { expect(calculateGameOverBonus(0)).toBe(0) })
  it('test_1000_gives_100', () => { expect(calculateGameOverBonus(1000)).toBe(100) })
  it('test_rounds_down', () => { expect(calculateGameOverBonus(109)).toBe(10) })
  it('test_large_score', () => { expect(calculateGameOverBonus(999999)).toBe(99999) })
})

// ==============================
// TILE COLORS
// ==============================

describe('getTileStyle', () => {
  it('test_has_style_for_2', () => {
    const s = getTileStyle(2)
    expect(s.bg).toContain('linear-gradient')
    expect(s.color).toBe('#fff')
  })
  it('test_has_style_for_2048', () => {
    const s = getTileStyle(2048)
    expect(s.glow).toBeTruthy()
    expect(s.bg).toContain('linear-gradient')
  })
  it('test_high_value_falls_back_to_default', () => {
    const s = getTileStyle(999999)
    expect(s.bg).toBeTruthy()
    expect(s.color).toBe('#fff')
  })
  it('test_all_power_of_two_styles_present', () => {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
    for (const v of values) {
      const s = getTileStyle(v)
      expect(s.bg).toBeTruthy()
      expect(s.fontSize).toBeTruthy()
      expect(s.color).toBe('#fff')
    }
  })
  it('test_glow_only_on_high_values', () => {
    expect(getTileStyle(2).glow).toBeUndefined()
    expect(getTileStyle(4).glow).toBeUndefined()
    expect(getTileStyle(64).glow).toBeUndefined()
    expect(getTileStyle(128).glow).toBeTruthy()
    expect(getTileStyle(512).glow).toBeTruthy()
    expect(getTileStyle(2048).glow).toBeTruthy()
  })
  it('test_font_size_decreases_for_higher_values', () => {
    const small = parseFloat(getTileStyle(2).fontSize)
    const large = parseFloat(getTileStyle(2048).fontSize)
    expect(small).toBeGreaterThan(large)
  })
  it('test_value_0_falls_back', () => {
    const s = getTileStyle(0)
    expect(s.bg).toBeTruthy()
  })
})
