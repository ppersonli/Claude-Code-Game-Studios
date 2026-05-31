export interface TycoonTheme {
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

export const TYCOON_THEMES: readonly TycoonTheme[] = [
  { id: 'classic', name: '經典帝國', emoji: '🧋', cost: 0, requiredLevel: 0, bgTop: 0x1a0a2e, bgBot: 0x2d1b4e, accentColor: '#ffd700', description: 'Original tycoon style' },
  { id: 'taro', name: '芋頭王國', emoji: '💜', cost: 200, requiredLevel: 5, bgTop: 0x2d1050, bgBot: 0x4a2080, accentColor: '#BB77DD', description: 'Royal taro kingdom' },
  { id: 'matcha', name: '抹茶莊園', emoji: '🍵', cost: 500, requiredLevel: 10, bgTop: 0x0a2e1a, bgBot: 0x1a4e2d, accentColor: '#66BB6A', description: 'Zen matcha estate' },
  { id: 'golden', name: '黃金時代', emoji: '✨', cost: 1500, requiredLevel: 20, bgTop: 0x2e2a0a, bgBot: 0x4e4a1a, accentColor: '#FFD700', description: 'Golden age luxury' },
  { id: 'neon', name: '霓虹都會', emoji: '🌃', cost: 5000, requiredLevel: 35, bgTop: 0x0a0a2e, bgBot: 0x1a1a4e, accentColor: '#FF6B6B', description: 'Neon city vibes' },
  { id: 'cosmic', name: '星際連鎖', emoji: '🌌', cost: 15000, requiredLevel: 50, bgTop: 0x0a0a1a, bgBot: 0x1a0a2e, accentColor: '#88BBFF', description: 'Intergalactic empire' },
] as const

export function getTycoonThemeById(id: string): TycoonTheme {
  const t = TYCOON_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Tycoon theme not found: ${id}`)
  return t
}
