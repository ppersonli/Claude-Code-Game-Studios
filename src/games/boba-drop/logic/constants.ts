/**
 * Boba Drop game constants.
 * All layout and timing values are centralized here for easy tuning.
 */

/** Game canvas dimensions */
export const GAME_W = 480
export const GAME_H = 854

/** Cup geometry */
export const CUP_TOP = 120
export const CUP_BOTTOM = 750
export const CUP_TOP_WIDTH = 300
export const CUP_BOTTOM_WIDTH = 200

/** Derived cup edges */
export const CUP_LEFT_TOP = (GAME_W - CUP_TOP_WIDTH) / 2
export const CUP_RIGHT_TOP = CUP_LEFT_TOP + CUP_TOP_WIDTH
export const CUP_LEFT_BOTTOM = (GAME_W - CUP_BOTTOM_WIDTH) / 2
export const CUP_RIGHT_BOTTOM = CUP_LEFT_BOTTOM + CUP_BOTTOM_WIDTH

/** Drop zone Y position (line above cup) */
export const DROP_ZONE_Y = 100

/** Cooldown between drops in ms */
export const DROP_COOLDOWN = 500

/** Time (ms) an ingredient must overflow cup top before game over */
export const OVERFLOW_TIME = 2000

/** Wall thickness for physics boundaries */
export const WALL_THICKNESS = 40

/** Background color */
export const BG_COLOR = '#1a0a2e'
