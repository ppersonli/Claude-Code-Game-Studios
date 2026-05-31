/** Game state management for Sweet Sort */

export interface SaveData {
  currentLevel: number
  stars: Record<number, number>
  totalStars: number
  highScores: Record<number, number>
  unlocks: number[]
  candyCollection: number[]
}

export interface GameMove {
  from: number
  to: number
  candy: number
}

/**
 * Check if a move is valid.
 * Can move to empty tube or onto same color.
 */
export function isValidMove(
  tubes: number[][],
  from: number,
  to: number,
  capacity: number
): boolean {
  if (from < 0 || from >= tubes.length) return false
  if (to < 0 || to >= tubes.length) return false
  if (from === to) return false

  const fromTube = tubes[from]
  const toTube = tubes[to]

  if (!fromTube || fromTube.length === 0) return false
  if (!toTube) return false
  if (toTube.length >= capacity) return false

  return toTube.length === 0 || toTube[toTube.length - 1] === fromTube[fromTube.length - 1]
}

/**
 * Execute a move: pop from source, push to target.
 * Returns the moved candy color index.
 */
export function executeMove(
  tubes: number[][],
  from: number,
  to: number
): number {
  const candy = tubes[from].pop()!
  tubes[to].push(candy)
  return candy
}

/**
 * Check if the puzzle is complete.
 * All non-empty tubes must have only one color.
 */
export function checkCompletion(tubes: number[][]): boolean {
  for (const tube of tubes) {
    if (tube.length === 0) continue
    const color = tube[0]
    if (!tube.every(c => c === color)) {
      return false
    }
  }
  return true
}

/**
 * Get the default save data.
 */
export function getDefaultSave(): SaveData {
  return {
    currentLevel: 1,
    stars: {},
    totalStars: 0,
    highScores: {},
    unlocks: [],
    candyCollection: []
  }
}

/**
 * Update save data with level completion result.
 */
export function updateLevelResult(
  save: SaveData,
  levelNum: number,
  stars: number,
  moves: number
): SaveData {
  const prevStars = save.stars[levelNum] || 0
  if (stars > prevStars) {
    save.totalStars += (stars - prevStars)
    save.stars[levelNum] = stars
  }

  const prevMoves = save.highScores[levelNum] || Infinity
  if (moves < prevMoves) {
    save.highScores[levelNum] = moves
  }

  if (levelNum >= save.currentLevel) {
    save.currentLevel = Math.max(save.currentLevel, levelNum + 1)
  }

  return save
}
