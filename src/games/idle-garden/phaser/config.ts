/**
 * Idle Garden Tycoon — Phaser configuration
 */

export const GAME_WIDTH = 480
export const GAME_HEIGHT = 854

export const COLORS = {
  background: '#1a4d2e',
  primary: '#4CAF50',
  secondary: '#8BC34A',
  accent: '#FFD740',
  text: '#FFFFFF',
  textDark: '#2C3E50',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  soil: '#8B6914',
  soilDark: '#6B4F12',
  pot: '#D2691E',
  potDark: '#A0522D',
  sky: '#87CEEB',
  grass: '#4CAF50',
} as const

export const POT_LAYOUT = {
  startX: 60,
  startY: 300,
  spacingX: 120,
  spacingY: 130,
  potsPerRow: 4,
  potWidth: 80,
  potHeight: 80,
} as const
