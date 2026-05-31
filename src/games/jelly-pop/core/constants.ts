/** Game canvas width */
export const GAME_W = 480
/** Game canvas height */
export const GAME_H = 854
/** Grid rows */
export const ROWS = 8
/** Grid columns */
export const COLS = 8
/** Cell pixel size */
export const CELL_SIZE = 52
/** Board left offset */
export const BOARD_OFFSET_X = (GAME_W - COLS * CELL_SIZE) / 2
/** Board top offset */
export const BOARD_OFFSET_Y = 180

/** Animation durations (ms) */
export const SWAP_DURATION = 200
export const FALL_DURATION = 150
export const ELIMINATE_DURATION = 300
export const CHAIN_DELAY = 350

/** Jelly flavour types */
export const JELLY_TYPES = ['strawberry', 'lemon', 'mint', 'blueberry', 'grape', 'orange'] as const
export type JellyType = (typeof JELLY_TYPES)[number]

/** Jelly color palettes (main / light / dark) */
export const JELLY_COLORS: Record<JellyType, { main: number; light: number; dark: number }> = {
  strawberry: { main: 0xff4466, light: 0xff8899, dark: 0xcc2244 },
  lemon:      { main: 0xffdd44, light: 0xffee88, dark: 0xccaa22 },
  mint:       { main: 0x44dd88, light: 0x88ffbb, dark: 0x22aa55 },
  blueberry:  { main: 0x4488ff, light: 0x88bbff, dark: 0x2255cc },
  grape:      { main: 0xbb44ff, light: 0xdd88ff, dark: 0x8822cc },
  orange:     { main: 0xff8844, light: 0xffbb88, dark: 0xcc5522 },
}

/** Special jelly kinds */
export const SPECIAL = { NONE: 0, BOMB: 1, RAINBOW: 2 } as const
export type SpecialKind = (typeof SPECIAL)[keyof typeof SPECIAL]

/** Position on the grid */
export interface CellPos {
  row: number
  col: number
}
