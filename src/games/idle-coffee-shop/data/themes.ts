export interface CafeTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredLevel: number
  bgColor: number
  accentColor: string
  description: string
}

export const CAFE_THEMES: readonly CafeTheme[] = [
  { id: 'classic', name: '經典咖啡館', emoji: '☕', cost: 0, requiredLevel: 0, bgColor: 0x3E2723, accentColor: '#8B4513', description: 'Original cafe style' },
  { id: 'matcha', name: '抹茶庭院', emoji: '🍵', cost: 200, requiredLevel: 5, bgColor: 0x1B5E20, accentColor: '#66BB6A', description: 'Zen matcha garden' },
  { id: 'sakura', name: '櫻花咖啡', emoji: '🌸', cost: 500, requiredLevel: 15, bgColor: 0x880E4F, accentColor: '#F48FB1', description: 'Cherry blossom cafe' },
  { id: 'ocean', name: '海景咖啡廳', emoji: '🌊', cost: 1500, requiredLevel: 30, bgColor: 0x0D47A1, accentColor: '#42A5F5', description: 'Ocean view cafe' },
  { id: 'golden', name: '黃金時代', emoji: '✨', cost: 5000, requiredLevel: 50, bgColor: 0x4A3800, accentColor: '#FFD700', description: 'Golden luxury cafe' },
  { id: 'cosmic', name: '星際咖啡', emoji: '🌌', cost: 20000, requiredLevel: 80, bgColor: 0x0A0A2E, accentColor: '#88BBFF', description: 'Cosmic cafe vibes' },
] as const

export function getCafeThemeById(id: string): CafeTheme {
  const t = CAFE_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Cafe theme not found: ${id}`)
  return t
}
