/**
 * Jelly Pop – Pure game logic (no Phaser dependency).
 *
 * Everything here is deterministic given a seed; rendering is handled
 * separately in GameScene.ts.
 */
import {
  ROWS,
  COLS,
  JELLY_TYPES,
  SPECIAL,
  type JellyType,
  type SpecialKind,
  type CellPos,
} from './constants'

// ─── Grid Cell ────────────────────────────────────────────────────────────────

export interface GridCell {
  type: JellyType
  special: SpecialKind
}

export type Grid = (GridCell | null)[][]

// ─── State ────────────────────────────────────────────────────────────────────

export interface JellyPopState {
  grid: Grid
  score: number
  highScore: number
  level: number
  movesLeft: number
  numColors: number
  chainCount: number
  gameOver: boolean
}

// ─── High-score helpers (localStorage) ─────────────────────────────────────────

const HS_KEY = 'jelly-pop-highscore'

export function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem(HS_KEY) ?? '0') || 0
  } catch {
    return 0
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HS_KEY, score.toString())
  } catch {
    /* noop */
  }
}

// ─── Random helper (injectable for determinism in tests) ──────────────────────

export type RNG = () => number

export function defaultRng(): number {
  return Math.random()
}

// ─── Grid creation ────────────────────────────────────────────────────────────

/**
 * Pick a random jelly type using the given RNG and numColors.
 */
export function randomType(numColors: number, rng: RNG = defaultRng): JellyType {
  return JELLY_TYPES[Math.floor(rng() * numColors)]
}

/**
 * Return true if placing `type` at (row,col) would form a 3-in-a-row
 * with the two cells to the left or the two cells above.
 */
export function wouldMatch(grid: Grid, row: number, col: number, type: JellyType): boolean {
  // horizontal – left 2
  if (
    col >= 2 &&
    grid[row][col - 1]?.type === type &&
    grid[row][col - 2]?.type === type
  ) {
    return true
  }
  // vertical – up 2
  if (
    row >= 2 &&
    grid[row - 1]?.[col]?.type === type &&
    grid[row - 2]?.[col]?.type === type
  ) {
    return true
  }
  return false
}

/**
 * Create an initial grid with no pre-existing matches.
 */
export function createGrid(numColors: number, rng: RNG = defaultRng): Grid {
  const grid: Grid = []
  for (let r = 0; r < ROWS; r++) {
    grid[r] = []
    for (let c = 0; c < COLS; c++) {
      let type: JellyType
      do {
        type = randomType(numColors, rng)
      } while (wouldMatch(grid, r, c, type))
      grid[r][c] = { type, special: SPECIAL.NONE }
    }
  }
  return grid
}

// ─── State factory ────────────────────────────────────────────────────────────

export function createInitialState(
  overrides?: Partial<JellyPopState>,
  rng: RNG = defaultRng,
): JellyPopState {
  const numColors = overrides?.numColors ?? 5
  return {
    grid: overrides?.grid ?? createGrid(numColors, rng),
    score: 0,
    highScore: 0,
    level: 1,
    movesLeft: 30,
    numColors,
    chainCount: 0,
    gameOver: false,
    ...overrides,
  }
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

export function isValidCell(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  const dr = Math.abs(r1 - r2)
  const dc = Math.abs(c1 - c2)
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1)
}

// ─── Swap ─────────────────────────────────────────────────────────────────────

/** Swap two cells in the grid (mutates). */
export function swapCells(grid: Grid, r1: number, c1: number, r2: number, c2: number): void {
  const temp = grid[r1][c1]
  grid[r1][c1] = grid[r2][c2]
  grid[r2][c2] = temp
}

// ─── Match finding ────────────────────────────────────────────────────────────

/**
 * Find all groups of 3+ consecutive cells of the same type.
 * Returns deduplicated set of positions.
 */
export function findAllMatches(grid: Grid): CellPos[] {
  const matched = new Set<number>()

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let c = 0
    while (c < COLS) {
      const cell = grid[r][c]
      if (!cell) { c++; continue }
      const type = cell.type
      let len = 1
      while (c + len < COLS && grid[r][c + len]?.type === type) {
        len++
      }
      if (len >= 3) {
        for (let i = 0; i < len; i++) {
          matched.add(r * COLS + (c + i))
        }
      }
      c += len
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    let r = 0
    while (r < ROWS) {
      const cell = grid[r][c]
      if (!cell) { r++; continue }
      const type = cell.type
      let len = 1
      while (r + len < ROWS && grid[r + len]?.[c]?.type === type) {
        len++
      }
      if (len >= 3) {
        for (let i = 0; i < len; i++) {
          matched.add((r + i) * COLS + c)
        }
      }
      r += len
    }
  }

  return Array.from(matched).map((idx) => ({
    row: Math.floor(idx / COLS),
    col: idx % COLS,
  }))
}

// ─── Match grouping (for scoring & specials) ──────────────────────────────────

/**
 * Group matched positions into contiguous horizontal / vertical runs.
 * Only cells in valid groups (≥3) are marked as used to avoid blocking
 * legitimate vertical groups from being detected.
 */
export function groupMatches(matches: CellPos[]): CellPos[][] {
  const groups: CellPos[][] = []
  const used = new Set<number>()

  // Horizontal groups
  for (let r = 0; r < ROWS; r++) {
    const rowMatches = matches.filter((m) => m.row === r).sort((a, b) => a.col - b.col)
    let group: CellPos[] = []
    for (const m of rowMatches) {
      if (group.length === 0 || m.col === group[group.length - 1].col + 1) {
        group.push(m)
      } else {
        if (group.length >= 3) {
          for (const g of group) used.add(g.row * COLS + g.col)
          groups.push(group)
        }
        group = [m]
      }
    }
    if (group.length >= 3) {
      for (const g of group) used.add(g.row * COLS + g.col)
      groups.push(group)
    }
  }

  // Vertical groups
  for (let c = 0; c < COLS; c++) {
    const colMatches = matches.filter((m) => m.col === c).sort((a, b) => a.row - b.row)
    let group: CellPos[] = []
    for (const m of colMatches) {
      const key = m.row * COLS + m.col
      if (used.has(key)) continue
      if (group.length === 0 || m.row === group[group.length - 1].row + 1) {
        group.push(m)
      } else {
        if (group.length >= 3) groups.push(group)
        group = [m]
      }
    }
    if (group.length >= 3) groups.push(group)
  }

  return groups
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/** Score for a single group based on its length. */
export function groupScore(length: number): number {
  if (length >= 5) return 500
  if (length === 4) return 200
  return 100
}

/** Chain multiplier */
export function chainMultiplier(chainCount: number): number {
  if (chainCount >= 3) return 3
  if (chainCount === 2) return 2
  return 1
}

/**
 * Calculate total score for a set of matches, including chain multiplier.
 */
export function calculateMatchScore(matches: CellPos[], chainCount: number): number {
  const groups = groupMatches(matches)
  let base = 0
  for (const g of groups) {
    base += groupScore(g.length)
  }
  return base * chainMultiplier(chainCount)
}

// ─── Special jellies ──────────────────────────────────────────────────────────

export interface SpecialCreate {
  row: number
  col: number
  type: JellyType
  special: SpecialKind
}

/**
 * Determine which special jellies to create from a set of matches.
 * 4-in-a-row → BOMB, 5+ → RAINBOW
 */
export function determineSpecials(grid: Grid, matches: CellPos[]): SpecialCreate[] {
  const groups = groupMatches(matches)
  const specials: SpecialCreate[] = []

  for (const group of groups) {
    if (group.length >= 5) {
      const mid = group[Math.floor(group.length / 2)]
      specials.push({
        row: mid.row,
        col: mid.col,
        type: grid[mid.row]?.[mid.col]?.type ?? JELLY_TYPES[0],
        special: SPECIAL.RAINBOW,
      })
    } else if (group.length === 4) {
      const mid = group[1]
      specials.push({
        row: mid.row,
        col: mid.col,
        type: grid[mid.row]?.[mid.col]?.type ?? JELLY_TYPES[0],
        special: SPECIAL.BOMB,
      })
    }
  }

  return specials
}

// ─── Bomb / Rainbow activation ────────────────────────────────────────────────

/**
 * Get all cells destroyed by a bomb at (row,col) – 3×3 area.
 */
export function bombTargets(row: number, col: number): CellPos[] {
  const targets: CellPos[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr
      const nc = col + dc
      if (isValidCell(nr, nc)) {
        targets.push({ row: nr, col: nc })
      }
    }
  }
  return targets
}

/**
 * Get all cells of the same type as the cell at (row,col) – rainbow activation.
 */
export function rainbowTargets(grid: Grid, row: number, col: number): CellPos[] {
  const cell = grid[row]?.[col]
  if (!cell) return []
  const targets: CellPos[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]?.type === cell.type) {
        targets.push({ row: r, col: c })
      }
    }
  }
  return targets
}

// ─── Gravity (drop & fill) ────────────────────────────────────────────────────

/**
 * Apply gravity: move cells down into empty spaces, then fill remaining
 * empty cells from the top with random types.
 * Returns the new grid (mutated) and the list of new cells created.
 */
export function dropAndFill(
  grid: Grid,
  numColors: number,
  rng: RNG = defaultRng,
): { newCells: CellPos[]; droppedCells: Array<{ from: CellPos; to: CellPos }> } {
  const newCells: CellPos[] = []
  const droppedCells: Array<{ from: CellPos; to: CellPos }> = []

  for (let c = 0; c < COLS; c++) {
    // Compact: move non-null cells to the bottom
    let writeRow = ROWS - 1
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) {
        if (r !== writeRow) {
          grid[writeRow][c] = grid[r][c]
          grid[r][c] = null
          droppedCells.push({ from: { row: r, col: c }, to: { row: writeRow, col: c } })
        }
        writeRow--
      }
    }

    // Fill remaining empty cells from top
    for (let r = writeRow; r >= 0; r--) {
      const type = randomType(numColors, rng)
      grid[r][c] = { type, special: SPECIAL.NONE }
      newCells.push({ row: r, col: c })
    }
  }

  return { newCells, droppedCells }
}

// ─── Remove matched cells ─────────────────────────────────────────────────────

export function removeCells(grid: Grid, cells: CellPos[]): void {
  for (const { row, col } of cells) {
    grid[row][col] = null
  }
}

// ─── Valid moves check ────────────────────────────────────────────────────────

/**
 * Check if there is at least one valid swap that produces a match.
 */
export function hasValidMoves(grid: Grid): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Try swap right
      if (c < COLS - 1) {
        swapCells(grid, r, c, r, c + 1)
        const hasMatch = findAllMatches(grid).length > 0
        swapCells(grid, r, c, r, c + 1) // swap back
        if (hasMatch) return true
      }
      // Try swap down
      if (r < ROWS - 1) {
        swapCells(grid, r, c, r + 1, c)
        const hasMatch = findAllMatches(grid).length > 0
        swapCells(grid, r, c, r + 1, c) // swap back
        if (hasMatch) return true
      }
    }
  }
  return false
}

// ─── Level-up logic ───────────────────────────────────────────────────────────

export function movesForLevel(level: number): number {
  return Math.max(20, 35 - level)
}

export function numColorsForLevel(level: number): number {
  return level >= 10 ? 6 : 5
}

// ─── Full move execution (stateless, for testing) ─────────────────────────────

export interface MoveResult {
  valid: boolean
  matches: CellPos[]
  specialsCreated: SpecialCreate[]
  score: number
  chainCount: number
  allDestroyed: CellPos[]
}

/**
 * Attempt a swap and compute all resulting matches, specials, and score.
 * Does NOT mutate the grid – returns information for the caller to apply.
 */
export function evaluateSwap(
  state: JellyPopState,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): MoveResult {
  if (!isAdjacent(r1, c1, r2, c2)) {
    return { valid: false, matches: [], specialsCreated: [], score: 0, chainCount: 0, allDestroyed: [] }
  }

  // Try the swap
  swapCells(state.grid, r1, c1, r2, c2)
  const matches = findAllMatches(state.grid)

  if (matches.length === 0) {
    // Swap back – invalid move
    swapCells(state.grid, r1, c1, r2, c2)
    return { valid: false, matches: [], specialsCreated: [], score: 0, chainCount: 0, allDestroyed: [] }
  }

  // Swap back – caller will apply the real animation flow
  swapCells(state.grid, r1, c1, r2, c2)

  const specials = determineSpecials(state.grid, matches)
  const score = calculateMatchScore(matches, 1)

  return {
    valid: true,
    matches,
    specialsCreated: specials,
    score,
    chainCount: 1,
    allDestroyed: [...matches],
  }
}

// ─── Deep clone (for undo / testing) ──────────────────────────────────────────

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
}

export function cloneState(state: JellyPopState): JellyPopState {
  return {
    ...state,
    grid: cloneGrid(state.grid),
  }
}
