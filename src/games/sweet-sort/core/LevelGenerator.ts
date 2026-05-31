/** Level generation for Sweet Sort puzzle */

import { COLOR_NAMES } from './Color'

export interface LevelConfig {
  numColors: number
  numTubes: number
  capacity: number
  shuffleMoves: number
  levelNum: number
}

export interface LevelData {
  tubes: number[][]
  numColors: number
  capacity: number
  optimalMoves: number
  levelNum: number
}

/**
 * Deterministic RNG using a linear congruential generator.
 * Produces the same sequence for the same seed.
 */
export function createRNG(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Get the level configuration based on level number.
 * Early levels (1-20) are tutorial phases with fewer colors.
 * Later levels scale difficulty progressively.
 */
export function getLevelConfig(levelNum: number): LevelConfig {
  const ftuePhase = levelNum <= 20
  let numColors: number
  let numTubes: number
  let capacity: number
  let shuffleMoves: number

  if (ftuePhase) {
    if (levelNum <= 5) {
      numColors = 2; numTubes = 3; capacity = 3; shuffleMoves = 3
    } else if (levelNum <= 10) {
      numColors = 3; numTubes = 4; capacity = 3; shuffleMoves = 4
    } else if (levelNum <= 15) {
      numColors = 3; numTubes = 4; capacity = 4; shuffleMoves = 5
    } else {
      numColors = 4; numTubes = 5; capacity = 3; shuffleMoves = 6
    }
  } else {
    const progress = Math.min((levelNum - 20) / 180, 1)
    numColors = Math.floor(4 + progress * 3)
    numTubes = Math.floor(4 + progress * 4)
    capacity = Math.floor(3 + progress * 2)
    shuffleMoves = Math.floor(6 + progress * 15)
  }

  numColors = Math.min(numColors, COLOR_NAMES.length)
  numTubes = Math.max(numTubes, numColors + 2)

  return { numColors, numTubes, capacity, shuffleMoves, levelNum }
}

/**
 * Calculate the optimal number of moves for a given puzzle state.
 * Counts misplaced candies and divides by 2.
 */
export function calculateOptimalMoves(tubes: number[][], capacity: number): number {
  let misplaced = 0
  for (const tube of tubes) {
    if (tube.length === 0) continue
    const topColor = tube[tube.length - 1]
    let sameCount = 0
    for (let i = tube.length - 1; i >= 0; i--) {
      if (tube[i] === topColor) sameCount++
      else break
    }
    if (sameCount < tube.length) misplaced += tube.length - sameCount
  }
  return Math.ceil(misplaced / 2)
}

/**
 * Create a solvable puzzle by starting from the solution and shuffling backwards.
 * Uses deterministic RNG based on level number.
 */
export function createSolvableLevel(config: LevelConfig): LevelData {
  const { numColors, numTubes, capacity, shuffleMoves, levelNum } = config

  // Create solution state: each color in its own tube
  const solution: number[][] = []
  for (let i = 0; i < numColors; i++) {
    const tube: number[] = []
    for (let j = 0; j < capacity; j++) {
      tube.push(i)
    }
    solution.push(tube)
  }
  // Add empty tubes
  for (let i = numColors; i < numTubes; i++) {
    solution.push([])
  }

  // Shuffle backwards to create puzzle
  const puzzle = JSON.parse(JSON.stringify(solution))
  const rng = createRNG(levelNum)

  let movesMade = 0
  const maxAttempts = shuffleMoves * 100
  let attempts = 0

  while (movesMade < shuffleMoves && attempts < maxAttempts) {
    attempts++

    const sourceTubes: number[] = []
    const targetTubes: number[] = []

    for (let i = 0; i < numTubes; i++) {
      if (puzzle[i].length > 0 && puzzle[i].length < capacity) {
        sourceTubes.push(i)
      }
      if (puzzle[i].length < capacity) {
        targetTubes.push(i)
      }
    }

    if (sourceTubes.length === 0 || targetTubes.length < 2) break

    const srcIdx = Math.floor(rng() * sourceTubes.length)
    const src = sourceTubes[srcIdx]

    const candy = puzzle[src][puzzle[src].length - 1]
    const validTargets = targetTubes.filter(t =>
      t !== src && (puzzle[t].length === 0 || puzzle[t][puzzle[t].length - 1] === candy)
    )

    if (validTargets.length === 0) continue

    const tgtIdx = Math.floor(rng() * validTargets.length)
    const tgt = validTargets[tgtIdx]

    const movedCandy = puzzle[src].pop()
    puzzle[tgt].push(movedCandy)
    movesMade++
  }

  const optimalMoves = calculateOptimalMoves(puzzle, capacity)

  return {
    tubes: puzzle,
    numColors,
    capacity,
    optimalMoves: Math.max(optimalMoves, 3),
    levelNum
  }
}

/**
 * Generate a complete level by level number.
 */
export function generateLevel(levelNum: number): LevelData {
  const config = getLevelConfig(levelNum)
  return createSolvableLevel(config)
}

/**
 * Get star rating based on moves taken vs optimal.
 */
export function getStarRating(moves: number, optimalMoves: number): number {
  if (moves <= optimalMoves) return 3
  if (moves <= optimalMoves * 1.5) return 2
  return 1
}
