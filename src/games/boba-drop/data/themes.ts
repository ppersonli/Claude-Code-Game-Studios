export interface DropTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredHighScore: number
  cupColor: number
  cupAlpha: number
  borderColor: number
  description: string
}

export const DROP_THEMES: readonly DropTheme[] = [
  { id: 'classic', name: '經典奶茶', emoji: '🧋', cost: 0, requiredHighScore: 0, cupColor: 0x6a1b9a, cupAlpha: 0.15, borderColor: 0x6a1b9a, description: 'Original boba drop style' },
  { id: 'taro', name: '芋圓夢境', emoji: '💜', cost: 100, requiredHighScore: 200, cupColor: 0x9B59B6, cupAlpha: 0.2, borderColor: 0xBB77DD, description: 'Dreamy taro purple' },
  { id: 'matcha', name: '抹茶清新', emoji: '🍵', cost: 200, requiredHighScore: 500, cupColor: 0x27AE60, cupAlpha: 0.18, borderColor: 0x44CC66, description: 'Fresh matcha green' },
  { id: 'strawberry', name: '草莓甜心', emoji: '🍓', cost: 300, requiredHighScore: 1000, cupColor: 0xE74C3C, cupAlpha: 0.15, borderColor: 0xFF6B6B, description: 'Sweet strawberry pink' },
  { id: 'honey', name: '蜂蜜金光', emoji: '🍯', cost: 500, requiredHighScore: 2000, cupColor: 0xDAA520, cupAlpha: 0.2, borderColor: 0xFFD700, description: 'Golden honey glow' },
  { id: 'galaxy', name: '銀河波波', emoji: '🌌', cost: 800, requiredHighScore: 5000, cupColor: 0x4488FF, cupAlpha: 0.15, borderColor: 0x88BBFF, description: 'Cosmic galaxy theme' },
] as const

export function getDropThemeById(id: string): DropTheme {
  const t = DROP_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Drop theme not found: ${id}`)
  return t
}
