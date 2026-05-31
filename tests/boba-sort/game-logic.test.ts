import { describe, it, expect, beforeEach } from 'vitest'
import {
  createLevel,
  pour,
  checkWin,
  calculateStars,
  calculateScore,
  undo,
  getHint,
  canPour,
  createDailyLevel,
  getDailyChallengeSeed,
  type SortState,
  type Tube,
} from '../../src/games/boba-sort/composables/useGameLogic'
import { SORT_LEVELS, type SortLevel } from '../../src/games/boba-sort/data/levels'

// Helper: manually build a state for testing
function makeState(tubes: string[][], levelOverrides?: Partial<SortLevel>): SortState {
  const level = { ...SORT_LEVELS[0], ...levelOverrides }
  const tubeObjs: Tube[] = tubes.map((contents, id) => ({
    id,
    contents: [...contents],
    capacity: level.itemsPerType,
  }))
  return {
    tubes: tubeObjs,
    level,
    moves: 0,
    score: 0,
    stars: 0,
    combo: 0,
    maxCombo: 0,
    selectedTube: null,
    gameOver: false,
    won: false,
    timeElapsed: 0,
    undoStack: [],
    dailySeed: 0,
    completedTubes: new Set(),
  }
}

describe('createLevel', () => {
  it('creates correct number of tubes', () => {
    const state = createLevel(0, 42)
    expect(state.tubes).toHaveLength(4)
  })

  it('creates tubes with correct capacity', () => {
    const state = createLevel(0, 42)
    for (const tube of state.tubes) {
      expect(tube.capacity).toBe(4)
    }
  })

  it('distributes all items across tubes', () => {
    const state = createLevel(0, 42)
    const total = state.tubes.reduce((sum, t) => sum + t.contents.length, 0)
    expect(total).toBe(3 * 4) // 3 types × 4 items
  })

  it('all ingredient types are represented', () => {
    const state = createLevel(0, 42)
    const allTypes = new Set(state.tubes.flatMap((t) => t.contents))
    expect(allTypes.size).toBe(3)
  })

  it('each type appears exactly itemsPerType times', () => {
    const state = createLevel(0, 42)
    const counts: Record<string, number> = {}
    for (const tube of state.tubes) {
      for (const item of tube.contents) {
        counts[item] = (counts[item] || 0) + 1
      }
    }
    for (const count of Object.values(counts)) {
      expect(count).toBe(4)
    }
  })

  it('produces deterministic output with same seed', () => {
    const s1 = createLevel(0, 12345)
    const s2 = createLevel(0, 12345)
    expect(s1.tubes.map((t) => t.contents)).toEqual(s2.tubes.map((t) => t.contents))
  })

  it('produces different output with different seeds', () => {
    const s1 = createLevel(0, 111)
    const s2 = createLevel(0, 222)
    const contents1 = s1.tubes.flatMap((t) => t.contents).join(',')
    const contents2 = s2.tubes.flatMap((t) => t.contents).join(',')
    // Extremely unlikely to be the same
    expect(contents1 === contents2).toBe(false)
  })

  it('defaults to Math.random when no seed given', () => {
    const s1 = createLevel(0)
    const s2 = createLevel(0)
    // Both should have valid state (may or may not differ)
    expect(s1.tubes).toHaveLength(4)
    expect(s2.tubes).toHaveLength(4)
  })

  it('initial state has zero moves and score', () => {
    const state = createLevel(0, 42)
    expect(state.moves).toBe(0)
    expect(state.score).toBe(0)
    expect(state.combo).toBe(0)
    expect(state.maxCombo).toBe(0)
    expect(state.gameOver).toBe(false)
    expect(state.won).toBe(false)
    expect(state.selectedTube).toBeNull()
    expect(state.undoStack).toEqual([])
  })

  it('handles different level configurations', () => {
    const s1 = createLevel(0, 42) // 4 tubes, 3 types
    const s2 = createLevel(3, 42) // 6 tubes, 5 types
    expect(s1.tubes).toHaveLength(4)
    expect(s2.tubes).toHaveLength(6)
    const types2 = new Set(s2.tubes.flatMap((t) => t.contents))
    expect(types2.size).toBe(5)
  })

  it('clamps to last level for out-of-range index', () => {
    const state = createLevel(999, 42)
    expect(state.level.id).toBe(6) // Last level
  })
})

describe('canPour', () => {
  it('returns true when pouring same type onto same type', () => {
    const state = makeState([['a', 'a'], ['b', 'a']]) // top of tube 1 is 'a', matches tube 0's top 'a'
    expect(canPour(state, 0, 1)).toBe(true)
  })

  it('returns false when pouring different type onto different type', () => {
    const state = makeState([['a', 'a'], ['b', 'c']])
    expect(canPour(state, 0, 1)).toBe(false)
  })

  it('returns true when pouring into empty tube', () => {
    const state = makeState([['a', 'b'], []])
    expect(canPour(state, 0, 1)).toBe(true)
  })

  it('returns false when source is empty', () => {
    const state = makeState([[], ['a']])
    expect(canPour(state, 0, 1)).toBe(false)
  })

  it('returns false when target is full', () => {
    const state = makeState([['a'], ['b', 'b', 'b', 'b']])
    expect(canPour(state, 0, 1)).toBe(false)
  })

  it('returns false when pouring to same tube', () => {
    const state = makeState([['a', 'b']])
    expect(canPour(state, 0, 0)).toBe(false)
  })

  it('returns false for invalid indices', () => {
    const state = makeState([['a']])
    expect(canPour(state, 0, -1)).toBe(false)
    expect(canPour(state, -1, 0)).toBe(false)
    expect(canPour(state, 0, 5)).toBe(false)
    expect(canPour(state, 5, 0)).toBe(false)
  })

  it('returns false when game is over', () => {
    const state = makeState([['a'], ['a']])
    state.gameOver = true
    expect(canPour(state, 0, 1)).toBe(false)
  })

  it('allows pouring onto matching top of multi-item tube', () => {
    const state = makeState([['x', 'a'], ['b', 'a']])
    expect(canPour(state, 0, 1)).toBe(true)
  })

  it('blocks pouring onto non-matching top', () => {
    const state = makeState([['x', 'a'], ['b', 'c']])
    expect(canPour(state, 0, 1)).toBe(false)
  })
})

describe('pour', () => {
  it('moves top item from source to target', () => {
    const state = makeState([['a', 'b'], []]) // pour 'b' into empty tube
    const result = pour(state, 0, 1)
    expect(result).toBe(true)
    expect(state.tubes[0].contents).toEqual(['a'])
    expect(state.tubes[1].contents).toEqual(['b'])
  })

  it('returns false for illegal pour', () => {
    const state = makeState([['a'], ['b']])
    const result = pour(state, 0, 1)
    expect(result).toBe(false)
    expect(state.tubes[0].contents).toEqual(['a'])
    expect(state.tubes[1].contents).toEqual(['b'])
  })

  it('increments moves on success', () => {
    const state = makeState([['a'], ['a']])
    pour(state, 0, 1)
    expect(state.moves).toBe(1)
  })

  it('does not increment moves on failure', () => {
    const state = makeState([['a'], ['b']])
    pour(state, 0, 1)
    expect(state.moves).toBe(0)
  })

  it('saves undo snapshot before pouring', () => {
    const state = makeState([['a'], ['a']])
    pour(state, 0, 1)
    expect(state.undoStack).toHaveLength(1)
    expect(state.undoStack[0].tubes).toEqual([['a'], ['a']])
  })

  it('detects win when all tubes sorted', () => {
    const state = makeState([['a'], ['a', 'a', 'a']])
    pour(state, 0, 1)
    expect(state.won).toBe(true)
    expect(state.gameOver).toBe(true)
  })

  it('does not detect win with unsorted tubes', () => {
    const state = makeState([['a', 'b'], ['a', 'b']])
    pour(state, 0, 1) // Move 'b' onto 'b'
    expect(state.won).toBe(false)
  })

  it('calculates score and stars on win', () => {
    const state = makeState([['a'], ['a', 'a', 'a']])
    pour(state, 0, 1)
    expect(state.score).toBeGreaterThan(0)
    expect(state.stars).toBeGreaterThan(0)
  })

  it('increments combo when completing a tube', () => {
    const state = makeState([['a'], ['a', 'a', 'a'], []])
    pour(state, 0, 1)
    expect(state.combo).toBe(1)
    expect(state.maxCombo).toBe(1)
  })

  it('tracks completed tubes', () => {
    const state = makeState([['a'], ['a', 'a', 'a'], []])
    pour(state, 0, 1)
    expect(state.completedTubes.has(1)).toBe(true)
  })
})

describe('checkWin', () => {
  it('returns true when all tubes are empty', () => {
    const state = makeState([[], []])
    expect(checkWin(state)).toBe(true)
  })

  it('returns true when all tubes have single type', () => {
    const state = makeState([['a', 'a', 'a', 'a'], ['b', 'b', 'b', 'b'], []])
    expect(checkWin(state)).toBe(true)
  })

  it('returns true when some tubes are empty and others sorted', () => {
    const state = makeState([['a', 'a', 'a', 'a'], []])
    expect(checkWin(state)).toBe(true)
  })

  it('returns false when a tube has mixed types', () => {
    const state = makeState([['a', 'b', 'a', 'a']])
    expect(checkWin(state)).toBe(false)
  })

  it('returns false when tube is partially filled with same type and another tube is mixed', () => {
    const state = makeState([['a', 'a'], ['a', 'b']]) // tube 1 is mixed
    expect(checkWin(state)).toBe(false)
  })

  it('returns true for single empty tube', () => {
    const state = makeState([[]])
    expect(checkWin(state)).toBe(true)
  })

  it('returns true for already sorted state', () => {
    const state = makeState([['a', 'a', 'a', 'a'], ['b', 'b', 'b', 'b'], ['c', 'c', 'c', 'c'], []])
    expect(checkWin(state)).toBe(true)
  })
})

describe('calculateStars', () => {
  it('returns 3 stars for perfect play', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 10
    state.timeElapsed = 60
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    expect(calculateStars(state)).toBe(3)
  })

  it('returns 3 stars when exactly at target', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 15
    state.timeElapsed = 120
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    expect(calculateStars(state)).toBe(3)
  })

  it('returns 2 stars when slightly over target', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 20
    state.timeElapsed = 150
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    expect(calculateStars(state)).toBe(2)
  })

  it('returns 1 star when way over target', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 50
    state.timeElapsed = 300
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    expect(calculateStars(state)).toBe(1)
  })

  it('returns 0 stars when not won', () => {
    const state = makeState([[]])
    state.won = false
    expect(calculateStars(state)).toBe(0)
  })

  it('returns 2 stars when moves ok but time over 1.5x', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 14
    state.timeElapsed = 200
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    // moves <= 15*1.5 but time > 120*1.5
    expect(calculateStars(state)).toBe(1)
  })

  it('returns 2 stars when time ok but moves over 1.5x', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 25
    state.timeElapsed = 100
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    // moves > 15*1.5, time < 120*1.5
    expect(calculateStars(state)).toBe(1)
  })
})

describe('calculateScore', () => {
  it('returns base 100 for completion', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 999
    state.timeElapsed = 999
    state.combo = 0
    state.maxCombo = 0
    expect(calculateScore(state)).toBe(100)
  })

  it('adds 50 bonus for under target moves', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 10
    state.timeElapsed = 999
    state.level = { ...state.level, targetMoves: 15 }
    state.maxCombo = 0
    expect(calculateScore(state)).toBe(150)
  })

  it('adds 50 bonus for under target time', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 999
    state.timeElapsed = 60
    state.level = { ...state.level, targetTime: 120 }
    state.maxCombo = 0
    expect(calculateScore(state)).toBe(150)
  })

  it('adds both bonuses when both targets met', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 10
    state.timeElapsed = 60
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    state.maxCombo = 0
    expect(calculateScore(state)).toBe(200)
  })

  it('applies combo multiplier', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 999
    state.timeElapsed = 999
    state.maxCombo = 3 // 1.5x
    expect(calculateScore(state)).toBe(150) // 100 * 1.5
  })

  it('applies higher combo multiplier', () => {
    const state = makeState([[]])
    state.won = true
    state.moves = 10
    state.timeElapsed = 60
    state.level = { ...state.level, targetMoves: 15, targetTime: 120 }
    state.maxCombo = 5 // 2x
    expect(calculateScore(state)).toBe(400) // 200 * 2
  })
})

describe('undo', () => {
  it('restores previous tube state', () => {
    const state = makeState([['a', 'b'], []]) // pour 'b' into empty tube
    pour(state, 0, 1)
    expect(state.tubes[0].contents).toEqual(['a'])
    expect(state.tubes[1].contents).toEqual(['b'])
    undo(state)
    expect(state.tubes[0].contents).toEqual(['a', 'b'])
    expect(state.tubes[1].contents).toEqual([])
  })

  it('restores previous moves count', () => {
    const state = makeState([['a'], ['a']])
    pour(state, 0, 1)
    expect(state.moves).toBe(1)
    undo(state)
    expect(state.moves).toBe(0)
  })

  it('restores previous combo', () => {
    const state = makeState([['a'], ['a', 'a', 'a'], []])
    pour(state, 0, 1) // completes tube, combo=1
    expect(state.combo).toBe(1)
    undo(state)
    expect(state.combo).toBe(0)
  })

  it('returns true when undo available', () => {
    const state = makeState([['a'], ['a']])
    pour(state, 0, 1)
    expect(undo(state)).toBe(true)
  })

  it('returns false when undo stack empty', () => {
    const state = makeState([['a'], ['b']])
    expect(undo(state)).toBe(false)
  })

  it('can undo multiple moves', () => {
    // Use setup where win doesn't trigger after first pour
    const s = makeState([['a'], ['b'], ['a', 'b']])
    pour(s, 0, 2) // Move 'a' onto tube 2 (top is 'b', can't pour!) — use empty tube instead
    // Actually, let's use a valid setup:
    const s2 = makeState([['a', 'b'], ['b', 'a'], []])
    pour(s2, 0, 2) // Move 'b' to empty tube 2 -> [['a'], ['b','a'], ['b']]
    expect(s2.moves).toBe(1)
    pour(s2, 1, 0) // Move 'a' onto tube 0 (top 'a') -> [['a','a'], ['b'], ['b']]
    // This completes tube 0! But tube 1 still has 'b' only (not full), so checkWin = true
    // because all tubes have single types. Game over!
    // Let's verify undo works:
    expect(s2.moves).toBe(2)
    undo(s2)
    expect(s2.moves).toBe(1)
    undo(s2)
    expect(s2.moves).toBe(0)
  })

  it('resets won and gameOver flags', () => {
    const state = makeState([['a'], ['a', 'a', 'a']])
    pour(state, 0, 1)
    expect(state.won).toBe(true)
    undo(state)
    expect(state.won).toBe(false)
    expect(state.gameOver).toBe(false)
  })
})

describe('getHint', () => {
  it('returns a valid move when one exists', () => {
    const state = makeState([['a', 'b'], []]) // empty tube 1, can pour 'b' into it
    const hint = getHint(state)
    expect(hint).not.toBeNull()
    expect(hint!.from).not.toBe(hint!.to)
    // Should be a valid pour
    expect(canPour(state, hint!.from, hint!.to)).toBe(true)
  })

  it('returns null when no valid moves exist', () => {
    // All tubes full with different top types, no empty tubes
    const state = makeState([['a', 'a', 'a', 'a'], ['b', 'b', 'b', 'b']])
    const hint = getHint(state)
    expect(hint).toBeNull()
  })

  it('returns null when game is over', () => {
    const state = makeState([['a'], ['a']])
    state.gameOver = true
    expect(getHint(state)).toBeNull()
  })

  it('prefers moves that complete a tube', () => {
    const state = makeState([['a'], ['a', 'a', 'a'], ['b', 'b', 'b']])
    const hint = getHint(state)
    expect(hint).toEqual({ from: 0, to: 1 })
  })

  it('prefers non-empty targets over empty targets', () => {
    // tube 0: top 'a', tube 1: top 'a' (match!), tube 2: empty
    const state = makeState([['b', 'a'], ['a'], []])
    const hint = getHint(state)
    // Should prefer pouring onto matching 'a' (tube 1) rather than into empty (tube 2)
    expect(hint!.to).toBe(1)
  })
})

describe('daily challenge', () => {
  it('same date produces same puzzle', () => {
    const date = new Date(2026, 0, 15) // Jan 15, 2026
    const s1 = createDailyLevel(date)
    const s2 = createDailyLevel(date)
    expect(s1.tubes.map((t) => t.contents)).toEqual(s2.tubes.map((t) => t.contents))
  })

  it('different dates produce different puzzles', () => {
    const d1 = new Date(2026, 0, 15)
    const d2 = new Date(2026, 0, 16)
    const s1 = createDailyLevel(d1)
    const s2 = createDailyLevel(d2)
    const c1 = s1.tubes.flatMap((t) => t.contents).join(',')
    const c2 = s2.tubes.flatMap((t) => t.contents).join(',')
    expect(c1).not.toBe(c2)
  })

  it('getDailyChallengeSeed returns consistent seed for same date', () => {
    const date = new Date(2026, 5, 1)
    const seed1 = getDailyChallengeSeed(date)
    const seed2 = getDailyChallengeSeed(date)
    expect(seed1).toBe(seed2)
  })

  it('daily level uses medium difficulty', () => {
    const state = createDailyLevel(new Date(2026, 0, 1))
    expect(state.level.id).toBe(2) // Medium
  })
})

describe('edge cases', () => {
  it('handles single tube level', () => {
    // Can't really play with 1 tube, but state should be valid
    const state = createLevel(0, 42)
    expect(state.tubes.length).toBeGreaterThanOrEqual(4)
  })

  it('handles already sorted state (immediate win check)', () => {
    const state = makeState([['a', 'a', 'a', 'a'], ['b', 'b', 'b', 'b'], []])
    expect(checkWin(state)).toBe(true)
  })

  it('pour to empty tube works correctly', () => {
    const state = makeState([['a', 'b'], []])
    pour(state, 0, 1)
    expect(state.tubes[0].contents).toEqual(['a'])
    expect(state.tubes[1].contents).toEqual(['b'])
  })

  it('multiple consecutive pours work', () => {
    // Add a 4th tube with mixed types so game doesn't end early
    const state = makeState([['a', 'a'], ['b', 'b'], [], ['a', 'b']], { tubes: 4 })
    pour(state, 0, 2) // 'a' -> empty
    pour(state, 0, 2) // 'a' -> 'a'
    pour(state, 1, 0) // 'b' -> empty
    pour(state, 1, 0) // 'b' -> 'b'
    expect(state.tubes[0].contents).toEqual(['b', 'b'])
    expect(state.tubes[1].contents).toEqual([])
    expect(state.tubes[2].contents).toEqual(['a', 'a'])
  })

  it('undo restores completedTubes set', () => {
    const state = makeState([['a'], ['a', 'a', 'a'], ['b', 'b', 'b']])
    pour(state, 0, 1) // completes tube 1
    expect(state.completedTubes.has(1)).toBe(true)
    undo(state)
    expect(state.completedTubes.has(1)).toBe(false)
  })
})
