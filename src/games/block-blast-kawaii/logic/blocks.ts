/**
 * Block definitions for Block Blast Kawaii.
 * Tetromino and smaller shapes with kawaii animal theming.
 */
export type BlockType = 'I' | 'O' | 'T' | 'L' | 'S' | 'Z' | 'J'
  | 'single' | 'duo_h' | 'duo_v' | 'trio_h' | 'trio_v' | 'square_2'
  | 'corner' | 'plus'

export interface BlockShape {
  type: BlockType
  matrix: number[][] // 1 = filled, 0 = empty
}

/** All available block shapes */
export const BLOCK_SHAPES: readonly BlockShape[] = [
  // Tetrominos
  { type: 'I', matrix: [[1, 1, 1, 1]] },
  { type: 'I', matrix: [[1], [1], [1], [1]] },
  { type: 'O', matrix: [[1, 1], [1, 1]] },
  { type: 'T', matrix: [[1, 1, 1], [0, 1, 0]] },
  { type: 'T', matrix: [[0, 1], [1, 1], [0, 1]] },
  { type: 'T', matrix: [[0, 1, 0], [1, 1, 1]] },
  { type: 'T', matrix: [[1, 0], [1, 1], [1, 0]] },
  { type: 'L', matrix: [[1, 0], [1, 0], [1, 1]] },
  { type: 'L', matrix: [[1, 1, 1], [1, 0, 0]] },
  { type: 'L', matrix: [[1, 1], [0, 1], [0, 1]] },
  { type: 'L', matrix: [[0, 0, 1], [1, 1, 1]] },
  { type: 'J', matrix: [[0, 1], [0, 1], [1, 1]] },
  { type: 'J', matrix: [[1, 0, 0], [1, 1, 1]] },
  { type: 'J', matrix: [[1, 1], [1, 0], [1, 0]] },
  { type: 'J', matrix: [[1, 1, 1], [0, 0, 1]] },
  { type: 'S', matrix: [[0, 1, 1], [1, 1, 0]] },
  { type: 'S', matrix: [[1, 0], [1, 1], [0, 1]] },
  { type: 'Z', matrix: [[1, 1, 0], [0, 1, 1]] },
  { type: 'Z', matrix: [[0, 1], [1, 1], [1, 0]] },
  // Smaller shapes
  { type: 'single', matrix: [[1]] },
  { type: 'duo_h', matrix: [[1, 1]] },
  { type: 'duo_v', matrix: [[1], [1]] },
  { type: 'trio_h', matrix: [[1, 1, 1]] },
  { type: 'trio_v', matrix: [[1], [1], [1]] },
  { type: 'square_2', matrix: [[1, 1], [1, 1]] },
  { type: 'corner', matrix: [[1, 0], [1, 1]] },
  { type: 'corner', matrix: [[0, 1], [1, 1]] },
  { type: 'corner', matrix: [[1, 1], [1, 0]] },
  { type: 'corner', matrix: [[1, 1], [0, 1]] },
  { type: 'plus', matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
]

export interface Block {
  shape: BlockShape
  colorIndex: number // index into kawaii colors
}

/** Get dimensions of a block matrix */
export function getBlockDimensions(matrix: number[][]): { rows: number; cols: number } {
  return { rows: matrix.length, cols: matrix[0]?.length ?? 0 }
}

/** Count filled cells in a block */
export function getBlockCellCount(matrix: number[][]): number {
  let count = 0
  for (const row of matrix)
    for (const cell of row)
      if (cell) count++
  return count
}

/** Pick a random block shape */
export function pickRandomShape(): BlockShape {
  return BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)]
}

/** Generate a queue of N random blocks */
export function generateBlockQueue(count: number): Block[] {
  return Array.from({ length: count }, () => ({
    shape: pickRandomShape(),
    colorIndex: Math.floor(Math.random() * 6),
  }))
}
