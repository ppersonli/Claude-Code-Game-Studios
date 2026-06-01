import { describe, it, expect } from 'vitest'
import {
  getPath, distance, moveAlongPath, buildPathGrid, isPathCell, canPlaceTower,
} from '../../src/games/boba-tower-defense/logic/pathfinding'
import {
  canMerge, mergeTowers, getTowerStats, findMergePairs,
} from '../../src/games/boba-tower-defense/logic/merge'
import type { Tower } from '../../src/games/boba-tower-defense/logic/types'
import { CELL_SIZE, GRID_ROWS, GRID_COLS } from '../../src/games/boba-tower-defense/logic/constants'

// ═══════════════════════════════════════════════════════
// PATHFINDING
// ═══════════════════════════════════════════════════════

describe('getPath', () => {
  it('test_returns_default_path', () => {
    const path = getPath()
    expect(path.length).toBeGreaterThan(0)
  })
  it('test_starts_offscreen', () => {
    const path = getPath()
    expect(path[0].x).toBeLessThan(0)
  })
  it('test_ends_offscreen', () => {
    const path = getPath()
    expect(path[path.length - 1].x).toBeGreaterThan(480)
  })
  it('test_has_at_least_4_waypoints', () => {
    expect(getPath().length).toBeGreaterThanOrEqual(4)
  })
})

describe('distance', () => {
  it('test_zero_when_same_point', () => {
    expect(distance(0, 0, 0, 0)).toBe(0)
  })
  it('test_horizontal', () => {
    expect(distance(0, 0, 3, 0)).toBe(3)
  })
  it('test_vertical', () => {
    expect(distance(0, 0, 0, 4)).toBe(4)
  })
  it('test_diagonal', () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
  })
})

describe('moveAlongPath', () => {
  // Path: enemy starts near first waypoint, moves through waypoints
  const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]

  it('test_moves_toward_waypoint', () => {
    // Enemy at (10,0), target is path[0]=(0,0), speed 5 → moves toward origin
    const r = moveAlongPath(10, 0, 0, path, 5)
    expect(r.x).toBe(5)
    expect(r.y).toBe(0)
    expect(r.reachedEnd).toBe(false)
  })

  it('test_advances_through_waypoints', () => {
    // At (98,0), speed 10 → reaches (100,0) via pathIndex 1, continues with remaining 8
    const r = moveAlongPath(98, 0, 1, path, 10)
    expect(r.x).toBe(100) // moved to waypoint x
    expect(r.y).toBe(8)   // continued toward next waypoint y
    expect(r.pathIndex).toBe(2)
    expect(r.reachedEnd).toBe(false)
  })

  it('test_reaches_end', () => {
    // At (100,98), pathIndex=1 → target (100,0) is far, won't reach end
    // Need to be at last waypoint's target
    const shortPath = [{ x: 100, y: 98 }, { x: 100, y: 100 }]
    const r = moveAlongPath(100, 98, 1, shortPath, 10)
    expect(r.reachedEnd).toBe(true)
  })

  it('test_past_end_returns_true', () => {
    const r = moveAlongPath(100, 100, 3, path, 10)
    expect(r.reachedEnd).toBe(true)
  })

  it('test_speed_zero_stays_put', () => {
    const r = moveAlongPath(50, 50, 0, path, 0)
    expect(r.x).toBe(50)
    expect(r.y).toBe(50)
  })
})

describe('buildPathGrid', () => {
  it('test_returns_correct_dimensions', () => {
    const grid = buildPathGrid(getPath())
    expect(grid).toHaveLength(GRID_ROWS)
    expect(grid[0]).toHaveLength(GRID_COLS)
  })

  it('test_marks_path_cells', () => {
    const path = [{ x: 0, y: 24 }, { x: 200, y: 24 }]
    const grid = buildPathGrid(path)
    // Row 0 (y=24/48=0) should have path cells
    const hasPath = grid[0].some(c => c === true)
    expect(hasPath).toBe(true)
  })

  it('test_non_path_cells_are_false', () => {
    const path = [{ x: 0, y: 24 }, { x: 200, y: 24 }]
    const grid = buildPathGrid(path)
    // Bottom-right corner should not be path
    expect(grid[GRID_ROWS - 1][GRID_COLS - 1]).toBe(false)
  })
})

describe('isPathCell', () => {
  it('test_returns_true_for_path', () => {
    const grid = [[false, true, false]]
    expect(isPathCell(grid, 0, 1)).toBe(true)
  })
  it('test_returns_false_for_non_path', () => {
    const grid = [[false, true, false]]
    expect(isPathCell(grid, 0, 0)).toBe(false)
  })
  it('test_returns_false_out_of_bounds', () => {
    const grid = [[false]]
    expect(isPathCell(grid, -1, 0)).toBe(false)
    expect(isPathCell(grid, 0, -1)).toBe(false)
  })
})

describe('canPlaceTower', () => {
  it('test_can_place_on_empty_non_path', () => {
    const grid = [[false, false]]
    const towers = [[null, null]]
    expect(canPlaceTower(grid, towers, 0, 0)).toBe(true)
  })
  it('test_cannot_place_on_path', () => {
    const grid = [[true, false]]
    const towers = [[null, null]]
    expect(canPlaceTower(grid, towers, 0, 0)).toBe(false)
  })
  it('test_cannot_place_on_existing_tower', () => {
    const grid = [[false, false]]
    const towers = [[{ id: 1 }, null]]
    expect(canPlaceTower(grid, towers, 0, 0)).toBe(false)
  })
  it('test_cannot_place_out_of_bounds', () => {
    const grid: boolean[][] = []
    expect(canPlaceTower(grid, [], -1, 0)).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// MERGE
// ═══════════════════════════════════════════════════════

function makeTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 1, type: 'classic', level: 1, row: 0, col: 0,
    x: 100, y: 100, lastFireTime: 0, target: null, ...overrides,
  }
}

describe('canMerge', () => {
  it('test_same_type_same_level_adjacent', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'classic', level: 1, x: 120, y: 100 })
    expect(canMerge(a, b)).toBe(true)
  })

  it('test_different_type_rejects', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'taro', level: 1, x: 120, y: 100 })
    expect(canMerge(a, b)).toBe(false)
  })

  it('test_different_level_rejects', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'classic', level: 2, x: 120, y: 100 })
    expect(canMerge(a, b)).toBe(false)
  })

  it('test_max_level_rejects', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 3, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'classic', level: 3, x: 120, y: 100 })
    expect(canMerge(a, b)).toBe(false)
  })

  it('test_same_id_rejects', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 })
    expect(canMerge(a, a)).toBe(false)
  })

  it('test_too_far_rejects', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'classic', level: 1, x: 500, y: 500 })
    expect(canMerge(a, b)).toBe(false)
  })

  it('test_level2_merges', () => {
    const a = makeTower({ id: 1, type: 'taro', level: 2, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'taro', level: 2, x: 120, y: 100 })
    expect(canMerge(a, b)).toBe(true)
  })
})

describe('mergeTowers', () => {
  it('test_upgrades_level', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'classic', level: 1, x: 120, y: 100 })
    const merged = mergeTowers(a, b)
    expect(merged.level).toBe(2)
  })

  it('test_keeps_towerA_position', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 200 })
    const b = makeTower({ id: 2, type: 'classic', level: 1, x: 120, y: 200 })
    const merged = mergeTowers(a, b)
    expect(merged.x).toBe(100)
    expect(merged.y).toBe(200)
  })

  it('test_keeps_type', () => {
    const a = makeTower({ id: 1, type: 'taro', level: 1, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'taro', level: 1, x: 120, y: 100 })
    const merged = mergeTowers(a, b)
    expect(merged.type).toBe('taro')
  })

  it('test_throws_on_invalid_merge', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 })
    const b = makeTower({ id: 2, type: 'taro', level: 1, x: 120, y: 100 })
    expect(() => mergeTowers(a, b)).toThrow()
  })

  it('test_resets_target', () => {
    const a = makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100, target: { id: 5 } as any })
    const b = makeTower({ id: 2, type: 'classic', level: 1, x: 120, y: 100 })
    const merged = mergeTowers(a, b)
    expect(merged.target).toBeNull()
  })
})

describe('getTowerStats', () => {
  it('test_returns_classic_level1', () => {
    const stats = getTowerStats('classic', 1)
    expect(stats.name).toBe('經典波波')
    expect(stats.damage).toBe(10)
    expect(stats.range).toBe(120)
  })

  it('test_higher_level_more_damage', () => {
    const s1 = getTowerStats('classic', 1)
    const s2 = getTowerStats('classic', 2)
    const s3 = getTowerStats('classic', 3)
    expect(s2.damage).toBeGreaterThan(s1.damage)
    expect(s3.damage).toBeGreaterThan(s2.damage)
  })

  it('test_taro_has_splash', () => {
    const stats = getTowerStats('taro', 1)
    expect(stats.splashRadius).toBeGreaterThan(0)
  })

  it('test_matcha_has_long_range', () => {
    const stats = getTowerStats('matcha', 1)
    expect(stats.range).toBeGreaterThan(150)
  })

  it('test_brown_sugar_has_chain', () => {
    const stats = getTowerStats('brown_sugar', 1)
    expect(stats.chainCount).toBeGreaterThan(1)
  })

  it('test_fruit_has_slow', () => {
    const stats = getTowerStats('fruit', 1)
    expect(stats.slowAmount).toBeGreaterThan(0)
  })

  it('test_unknown_type_throws', () => {
    expect(() => getTowerStats('fake', 1)).toThrow()
  })
})

describe('findMergePairs', () => {
  it('test_finds_adjacent_same_type', () => {
    const towers = [
      makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 }),
      makeTower({ id: 2, type: 'classic', level: 1, x: 120, y: 100 }),
    ]
    const pairs = findMergePairs(towers)
    expect(pairs).toHaveLength(1)
    expect(pairs[0]).toEqual([0, 1])
  })

  it('test_ignores_different_type', () => {
    const towers = [
      makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 }),
      makeTower({ id: 2, type: 'taro', level: 1, x: 120, y: 100 }),
    ]
    expect(findMergePairs(towers)).toHaveLength(0)
  })

  it('test_ignores_too_far', () => {
    const towers = [
      makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 }),
      makeTower({ id: 2, type: 'classic', level: 1, x: 500, y: 500 }),
    ]
    expect(findMergePairs(towers)).toHaveLength(0)
  })

  it('test_finds_multiple_pairs', () => {
    const towers = [
      makeTower({ id: 1, type: 'classic', level: 1, x: 100, y: 100 }),
      makeTower({ id: 2, type: 'classic', level: 1, x: 120, y: 100 }),
      makeTower({ id: 3, type: 'classic', level: 1, x: 140, y: 100 }),
    ]
    const pairs = findMergePairs(towers)
    // (0,1), (0,2), (1,2) — all within range
    expect(pairs.length).toBeGreaterThanOrEqual(2)
  })

  it('test_ignores_max_level', () => {
    const towers = [
      makeTower({ id: 1, type: 'classic', level: 3, x: 100, y: 100 }),
      makeTower({ id: 2, type: 'classic', level: 3, x: 120, y: 100 }),
    ]
    expect(findMergePairs(towers)).toHaveLength(0)
  })

  it('test_empty_list', () => {
    expect(findMergePairs([])).toHaveLength(0)
  })

  it('test_single_tower', () => {
    expect(findMergePairs([makeTower()])).toHaveLength(0)
  })
})
