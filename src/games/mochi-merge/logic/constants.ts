/**
 * Mochi Merge game constants.
 * All layout and timing values are centralized here for easy tuning.
 */

/** Game canvas dimensions (portrait mobile) */
export const GAME_W = 390
export const GAME_H = 844

/** Box geometry — a simple rectangle */
export const BOX_LEFT = 45
export const BOX_RIGHT = 345
export const BOX_TOP = 120
export const BOX_BOTTOM = 760

/** Derived */
export const BOX_WIDTH = BOX_RIGHT - BOX_LEFT
export const BOX_CENTER_X = (BOX_LEFT + BOX_RIGHT) / 2

/** Drop zone Y position (line above box) */
export const DROP_ZONE_Y = 100

/** Cooldown between drops in ms */
export const DROP_COOLDOWN = 500

/** Time (ms) a mochi must overflow box top before game over */
export const OVERFLOW_TIME = 2000

/** Wall thickness for physics boundaries */
export const WALL_THICKNESS = 30

/** Background color */
export const BG_COLOR = '#FFF0F5'
