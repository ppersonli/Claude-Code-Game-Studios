// Grid
export const COLS = 12
export const ROWS = 12
export const BUBBLE_RADIUS = 18
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2
export const ROW_HEIGHT = BUBBLE_DIAMETER * 0.866 // hex row offset

// Playfield
export const GRID_OFFSET_X = BUBBLE_RADIUS + 10
export const GRID_OFFSET_Y = 80
export const GAME_W = 480
export const GAME_H = 854

// Launcher
export const LAUNCHER_X = GAME_W / 2
export const LAUNCHER_Y = GAME_H - 100
export const SHOOT_SPEED = 12

// Gameplay
export const MIN_MATCH = 3
export const FALL_SCORE_PER_BUBBLE = 15
export const POP_SCORE_PER_BUBBLE = 10

// Save
export const SAVE_KEY = 'bubble-shooter-save'
