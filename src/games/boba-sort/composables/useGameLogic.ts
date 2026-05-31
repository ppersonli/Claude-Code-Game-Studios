/**
 * Pure game logic for Boba Sort. All functions are side-effect free and testable.
 */
import { seededRandom, getDailySeed } from '@shared/utils'
import type { SortLevel } from '../data/levels'
import { SORT_LEVELS } from '../data/levels'
import { SORT_INGREDIENTS } from '../data/ingredients'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Tube {
  id: number
  contents: string[]
  capacity: number
}

export interface SortState {
  tubes: Tube[]
  level: SortLevel
  moves: number
  score: number
  stars: number
  combo: number
  maxCombo: number
  selectedTube: number | null
  gameOver: boolean
  won: boolean
  timeElapsed: number
  undoStack: { tubes: string[][]; moves: number; score: number; combo: number }[]
  dailySeed: number
  completedTubes: Set<number>
}

/* ------------------------------------------------------------------ */
/*  Seeded PRNG (mulberry32 — deterministic, testable)                 */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ------------------------------------------------------------------ */
/*  Level Creation                                                     */
/* ------------------------------------------------------------------ */

/**
 * Create a new game level with shuffled ingredients.
 * @param levelIndex 0-based index into SORT_LEVELS
 * @param seed       optional PRNG seed (deterministic). Defaults to Math.random.
 */
export function createLevel(levelIndex: number, seed?: number): SortState {
  const levelConfig = SORT_LEVELS[Math.min(levelIndex, SORT_LEVELS.length - 1)]
  const rng = seed != null ? mulberry32(seed) : Math.random

  // Pick ingredient types for this level
  const allTypes = SORT_INGREDIENTS.map((i) => i.id)
  const picked: string[] = []
  const indices = shuffleArray(allTypes.map((_, i) => i), rng)
  for (let i = 0; i < levelConfig.ingredientTypes; i++) {
    picked.push(allTypes[indices[i]])
  }

  // Build items pool: each type appears itemsPerType times
  const items: string[] = []
  for (const type of picked) {
    for (let i = 0; i < levelConfig.itemsPerType; i++) {
      items.push(type)
    }
  }

  // Shuffle items and distribute evenly across tubes
  const shuffled = shuffleArray(items, rng)
  const filledTubes: string[][] = Array.from({ length: levelConfig.tubes }, () => [])
  for (let i = 0; i < shuffled.length; i++) {
    filledTubes[i % levelConfig.tubes].push(shuffled[i])
  }

  // Ensure no tube starts fully sorted (all same type) — if so, shuffle again
  let attempts = 0
  while (attempts < 10 && filledTubes.some((t) => t.length === levelConfig.itemsPerType && new Set(t).size === 1)) {
    const reshuffled = shuffleArray(items, rng)
    for (let i = 0; i < levelConfig.tubes; i++) filledTubes[i] = []
    for (let i = 0; i < reshuffled.length; i++) {
      filledTubes[i % levelConfig.tubes].push(reshuffled[i])
    }
    attempts++
  }

  const tubes: Tube[] = filledTubes.map((contents, i) => ({
    id: i,
    contents,
    capacity: levelConfig.itemsPerType,
  }))

  return {
    tubes,
    level: levelConfig,
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
    dailySeed: seed ?? 0,
    completedTubes: new Set(),
  }
}

/* ------------------------------------------------------------------ */
/*  Pour Logic                                                         */
/* ------------------------------------------------------------------ */

function isTubeSorted(tube: Tube): boolean {
  if (tube.contents.length === 0) return true
  if (tube.contents.length < tube.capacity) return false
  return tube.contents.every((id) => id === tube.contents[0])
}

function isTubeFullySorted(tube: Tube): boolean {
  return tube.contents.length === tube.capacity && new Set(tube.contents).size === 1
}

/**
 * Validate whether a pour from `fromIdx` to `toIdx` is legal.
 * Pure — does not modify state.
 */
export function canPour(state: SortState, fromIdx: number, toIdx: number): boolean {
  if (fromIdx === toIdx) return false
  if (fromIdx < 0 || fromIdx >= state.tubes.length) return false
  if (toIdx < 0 || toIdx >= state.tubes.length) return false
  if (state.gameOver) return false

  const from = state.tubes[fromIdx]
  const to = state.tubes[toIdx]

  if (from.contents.length === 0) return false
  if (to.contents.length >= to.capacity) return false

  const topFrom = from.contents[from.contents.length - 1]
  const topTo = to.contents.length > 0 ? to.contents[to.contents.length - 1] : null

  // Can pour onto matching ingredient or into empty tube
  if (topTo === null) return true
  return topFrom === topTo
}

/**
 * Execute a pour. Returns true if successful, false if illegal.
 * Mutates state in-place (pure from caller's perspective — new state object).
 */
export function pour(state: SortState, fromIdx: number, toIdx: number): boolean {
  if (!canPour(state, fromIdx, toIdx)) return false

  // Save undo snapshot
  state.undoStack.push({
    tubes: state.tubes.map((t) => [...t.contents]),
    moves: state.moves,
    score: state.score,
    combo: state.combo,
  })

  const from = state.tubes[fromIdx]
  const to = state.tubes[toIdx]
  const topItem = from.contents.pop()!
  to.contents.push(topItem)

  state.moves++

  // Check if this pour made the target tube fully sorted
  const wasCompleted = state.completedTubes.has(toIdx)
  const nowSorted = isTubeFullySorted(to)

  if (nowSorted && !wasCompleted) {
    state.completedTubes.add(toIdx)
    state.combo++
    if (state.combo > state.maxCombo) state.maxCombo = state.combo
  } else if (!nowSorted) {
    // Pouring onto empty tube or non-completing pour resets combo
    if (to.contents.length === 1) {
      state.combo = 0
    }
  }

  // Check win
  if (checkWin(state)) {
    state.won = true
    state.gameOver = true
    state.stars = calculateStars(state)
    state.score = calculateScore(state)
  }

  return true
}

/* ------------------------------------------------------------------ */
/*  Win Detection                                                      */
/* ------------------------------------------------------------------ */

/**
 * Check if all tubes are sorted (empty or single-type).
 */
export function checkWin(state: SortState): boolean {
  return state.tubes.every((tube) => {
    if (tube.contents.length === 0) return true
    return tube.contents.every((id) => id === tube.contents[0])
  })
}

/* ------------------------------------------------------------------ */
/*  Star Calculation                                                   */
/* ------------------------------------------------------------------ */

/**
 * Calculate stars (1–3) based on moves and time relative to targets.
 */
export function calculateStars(state: SortState): number {
  if (!state.won) return 0

  const { targetMoves, targetTime } = state.level
  const moves = state.moves
  const time = state.timeElapsed

  if (moves <= targetMoves && time <= targetTime) return 3
  if (moves <= targetMoves * 1.5 && time <= targetTime * 1.5) return 2
  return 1
}

/* ------------------------------------------------------------------ */
/*  Score Calculation                                                  */
/* ------------------------------------------------------------------ */

function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1
  if (combo <= 3) return 1.5
  if (combo <= 5) return 2
  if (combo <= 8) return 3
  return 5
}

/**
 * Calculate final score for a won game.
 */
export function calculateScore(state: SortState): number {
  const base = 100
  const movesBonus = state.moves <= state.level.targetMoves ? 50 : 0
  const timeBonus = state.timeElapsed <= state.level.targetTime ? 50 : 0
  const multiplier = getComboMultiplier(state.maxCombo)
  return Math.round((base + movesBonus + timeBonus) * multiplier)
}

/* ------------------------------------------------------------------ */
/*  Undo                                                               */
/* ------------------------------------------------------------------ */

/**
 * Undo the last move. Returns true if successful, false if nothing to undo.
 */
export function undo(state: SortState): boolean {
  if (state.undoStack.length === 0) return false

  const snapshot = state.undoStack.pop()!
  state.tubes.forEach((tube, i) => {
    tube.contents = snapshot.tubes[i]
  })
  state.moves = snapshot.moves
  state.score = snapshot.score
  state.combo = snapshot.combo
  state.gameOver = false
  state.won = false
  state.stars = 0

  // Recalculate completedTubes
  state.completedTubes = new Set()
  state.tubes.forEach((tube, i) => {
    if (isTubeFullySorted(tube)) state.completedTubes.add(i)
  })

  return true
}

/* ------------------------------------------------------------------ */
/*  Hint                                                               */
/* ------------------------------------------------------------------ */

/**
 * Find a valid move hint. Returns {from, to} indices or null.
 */
export function getHint(state: SortState): { from: number; to: number } | null {
  if (state.gameOver) return null

  // First, look for moves that complete a tube (highest priority)
  for (let from = 0; from < state.tubes.length; from++) {
    for (let to = 0; to < state.tubes.length; to++) {
      if (from === to) continue
      if (!canPour(state, from, to)) continue
      const fromTube = state.tubes[from]
      const toTube = state.tubes[to]
      if (
        toTube.contents.length === toTube.capacity - 1 &&
        toTube.contents.length > 0 &&
        toTube.contents[toTube.contents.length - 1] === fromTube.contents[fromTube.contents.length - 1]
      ) {
        return { from, to }
      }
    }
  }

  // Otherwise, find any valid move (prefer non-empty targets)
  for (let from = 0; from < state.tubes.length; from++) {
    for (let to = 0; to < state.tubes.length; to++) {
      if (from === to) continue
      if (!canPour(state, from, to)) continue
      if (state.tubes[to].contents.length > 0) return { from, to }
    }
  }

  // Last resort: pour into empty tube
  for (let from = 0; from < state.tubes.length; from++) {
    for (let to = 0; to < state.tubes.length; to++) {
      if (from === to) continue
      if (canPour(state, from, to)) return { from, to }
    }
  }

  return null
}

/* ------------------------------------------------------------------ */
/*  Daily Challenge                                                    */
/* ------------------------------------------------------------------ */

/**
 * Create a daily challenge level. Same date = same puzzle.
 */
export function createDailyLevel(date?: Date): SortState {
  const seed = getDailySeed(date)
  return createLevel(1, seed) // Medium difficulty for daily
}

/**
 * Get today's daily seed as a number.
 */
export function getDailyChallengeSeed(date?: Date): number {
  return getDailySeed(date)
}
