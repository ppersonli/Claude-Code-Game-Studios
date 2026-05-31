export interface JellyTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredLevel: number
  bgColor: number
  accentColor: string
  description: string
}

export const JELLY_THEMES: readonly JellyTheme[] = [
  { id: 'classic', name: '經典果凍', emoji: '🍬', cost: 0, requiredLevel: 0, bgColor: 0x1a0a2e, accentColor: '#FF6B6B', description: 'Original jelly pop style' },
  { id: 'tropical', name: '熱帶風情', emoji: '🌴', cost: 100, requiredLevel: 3, bgColor: 0x0a2e1a, accentColor: '#66CC66', description: 'Tropical fruit vibes' },
  { id: 'ocean', name: '海洋清新', emoji: '🌊', cost: 250, requiredLevel: 6, bgColor: 0x0a1a2e, accentColor: '#44DDFF', description: 'Ocean depth blue' },
  { id: 'sunset', name: '日落甜心', emoji: '🌅', cost: 500, requiredLevel: 10, bgColor: 0x2e1a0a, accentColor: '#FF8844', description: 'Warm sunset glow' },
  { id: 'candy', name: '糖果夢境', emoji: '🍭', cost: 1000, requiredLevel: 15, bgColor: 0x2e0a2e, accentColor: '#FF69B4', description: 'Candy wonderland' },
  { id: 'galaxy', name: '星河果凍', emoji: '🌌', cost: 2000, requiredLevel: 25, bgColor: 0x0a0a2e, accentColor: '#88BBFF', description: 'Galaxy jelly shimmer' },
] as const

export function getJellyThemeById(id: string): JellyTheme {
  const t = JELLY_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Jelly theme not found: ${id}`)
  return t
}
