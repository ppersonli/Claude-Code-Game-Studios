// Canvas
export const GAME_W = 480
export const GAME_H = 854

// Cup geometry (trapezoid)
export const CUP_TOP = 120
export const CUP_BOTTOM = 750
export const CUP_TOP_WIDTH = 300
export const CUP_BOTTOM_WIDTH = 200
export const WALL_THICKNESS = 40

// Derived cup edges
export const CUP_LEFT_TOP = (GAME_W - CUP_TOP_WIDTH) / 2     // 90
export const CUP_RIGHT_TOP = CUP_LEFT_TOP + CUP_TOP_WIDTH     // 390
export const CUP_LEFT_BOTTOM = (GAME_W - CUP_BOTTOM_WIDTH) / 2 // 140
export const CUP_RIGHT_BOTTOM = CUP_LEFT_BOTTOM + CUP_BOTTOM_WIDTH // 340

// Drop zone
export const DROP_ZONE_Y = 100
export const DROP_MARGIN = 30
export const DROP_COOLDOWN = 500

// Game-over
export const OVERFLOW_TIME = 2000
export const GAME_OVER_CHECK_INTERVAL = 100

// Physics
export const INGREDIENT_RESTITUTION = 0.2
export const INGREDIENT_FRICTION = 0.5
export const INGREDIENT_DENSITY = 0.001
export const WALL_RESTITUTION = 0.1
export const WALL_FRICTION = 0.5

// Visual
export const BG_COLOR = 0x1a0a2e
