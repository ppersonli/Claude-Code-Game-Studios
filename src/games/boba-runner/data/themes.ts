export interface RunnerTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredHighScore: number
  playerColor: number
  bgColor: number
  description: string
}

export const RUNNER_THEMES: readonly RunnerTheme[] = [
  { id: 'classic', name: '經典波波', emoji: '🧋', cost: 0, requiredHighScore: 0, playerColor: 0xFF69B4, bgColor: 0x1a0a2e, description: 'Original boba runner' },
  { id: 'matcha', name: '抹茶跑者', emoji: '🍵', cost: 80, requiredHighScore: 50, playerColor: 0x66BB6A, bgColor: 0x0a2e1a, description: 'Matcha green runner' },
  { id: 'taro', name: '芋頭飛人', emoji: '🍠', cost: 200, requiredHighScore: 150, playerColor: 0xBB77DD, bgColor: 0x2d1050, description: 'Taro purple flyer' },
  { id: 'strawberry', name: '草莓衝刺', emoji: '🍓', cost: 500, requiredHighScore: 300, playerColor: 0xFF6B6B, bgColor: 0x2e0a1a, description: 'Strawberry sprint' },
  { id: 'golden', name: '黃金閃電', emoji: '⚡', cost: 1200, requiredHighScore: 800, playerColor: 0xFFD700, bgColor: 0x2e2a0a, description: 'Golden lightning' },
  { id: 'cosmic', name: '宇宙疾風', emoji: '🌌', cost: 3000, requiredHighScore: 2000, playerColor: 0x88BBFF, bgColor: 0x0a0a1a, description: 'Cosmic speedster' },
] as const

export function getRunnerThemeById(id: string): RunnerTheme {
  const t = RUNNER_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Runner theme not found: ${id}`)
  return t
}
