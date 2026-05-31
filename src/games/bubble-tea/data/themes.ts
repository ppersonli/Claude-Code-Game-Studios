export interface TeaTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredLevel: number
  bgGradient: [string, string]
  accentColor: string
  description: string
}

export const TEA_THEMES: readonly TeaTheme[] = [
  { id: 'classic', name: '經典奶茶', emoji: '🧋', cost: 0, requiredLevel: 0, bgGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)'], accentColor: '#FFD700', description: 'Original bubble tea style' },
  { id: 'taro', name: '芋頭夢境', emoji: '💜', cost: 150, requiredLevel: 3, bgGradient: ['rgba(155,89,182,0.3)', 'rgba(155,89,182,0.1)'], accentColor: '#BB77DD', description: 'Dreamy taro purple theme' },
  { id: 'matcha', name: '抹茶庭院', emoji: '🍵', cost: 300, requiredLevel: 5, bgGradient: ['rgba(39,174,96,0.25)', 'rgba(39,174,96,0.08)'], accentColor: '#66BB6A', description: 'Zen matcha garden' },
  { id: 'strawberry', name: '草莓甜心', emoji: '🍓', cost: 500, requiredLevel: 8, bgGradient: ['rgba(231,76,60,0.2)', 'rgba(231,76,60,0.08)'], accentColor: '#FF6B6B', description: 'Sweet strawberry pink' },
  { id: 'mango', name: '芒果熱帶', emoji: '🥭', cost: 800, requiredLevel: 12, bgGradient: ['rgba(243,156,18,0.25)', 'rgba(243,156,18,0.08)'], accentColor: '#FFB347', description: 'Tropical mango sunset' },
  { id: 'galaxy', name: '銀河珍珠', emoji: '🌌', cost: 1200, requiredLevel: 16, bgGradient: ['rgba(100,100,255,0.2)', 'rgba(100,100,255,0.05)'], accentColor: '#88BBFF', description: 'Cosmic galaxy theme' },
] as const

export function getTeaThemeById(id: string): TeaTheme {
  const t = TEA_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Tea theme not found: ${id}`)
  return t
}
