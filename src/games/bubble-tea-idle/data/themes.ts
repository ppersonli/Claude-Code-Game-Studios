export interface IdleTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredLevel: number
  bgTop: number
  bgBot: number
  accentColor: string
  description: string
}

export const IDLE_THEMES: readonly IdleTheme[] = [
  { id: 'classic', name: '經典奶茶店', emoji: '🧋', cost: 0, requiredLevel: 0, bgTop: 0x2d1b4e, bgBot: 0x1a0a2e, accentColor: '#ffd700', description: 'Original bubble tea shop' },
  { id: 'matcha', name: '抹茶庭院', emoji: '🍵', cost: 200, requiredLevel: 5, bgTop: 0x0a2e1a, bgBot: 0x1a4e2d, accentColor: '#66BB6A', description: 'Zen matcha garden' },
  { id: 'taro', name: '芋頭王國', emoji: '🍠', cost: 500, requiredLevel: 12, bgTop: 0x2d1050, bgBot: 0x4a2080, accentColor: '#BB77DD', description: 'Royal taro kingdom' },
  { id: 'cherry', name: '櫻花茶屋', emoji: '🌸', cost: 1500, requiredLevel: 25, bgTop: 0x2e0a1a, bgBot: 0x4e1a2d, accentColor: '#F48FB1', description: 'Cherry blossom tea house' },
  { id: 'golden', name: '黃金時代', emoji: '✨', cost: 5000, requiredLevel: 45, bgTop: 0x2e2a0a, bgBot: 0x4e4a1a, accentColor: '#FFD700', description: 'Golden age luxury' },
  { id: 'cosmic', name: '星際茶飲', emoji: '🌌', cost: 15000, requiredLevel: 70, bgTop: 0x0a0a1a, bgBot: 0x1a0a2e, accentColor: '#88BBFF', description: 'Cosmic bubble tea' },
] as const

export function getIdleThemeById(id: string): IdleTheme {
  const t = IDLE_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Idle theme not found: ${id}`)
  return t
}
