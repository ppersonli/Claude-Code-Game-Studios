export interface WaffleTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredLevel: number
  bgGrad: [number, number]
  accentColor: string
  description: string
}

export const WAFFLE_THEMES: readonly WaffleTheme[] = [
  { id: 'classic', name: '經典華夫', emoji: '🧇', cost: 0, requiredLevel: 0, bgGrad: [0xFFF5E6, 0xFFDAB9], accentColor: '#8B4513', description: 'Original waffle shop style' },
  { id: 'chocolate', name: '巧克力夢', emoji: '🍫', cost: 100, requiredLevel: 3, bgGrad: [0x3E2723, 0x5D4037], accentColor: '#795548', description: 'Rich chocolate theme' },
  { id: 'matcha', name: '抹茶庭院', emoji: '🍵', cost: 250, requiredLevel: 6, bgGrad: [0x1B5E20, 0x2E7D32], accentColor: '#66BB6A', description: 'Zen matcha garden' },
  { id: 'strawberry', name: '草莓甜心', emoji: '🍓', cost: 500, requiredLevel: 10, bgGrad: [0x880E4F, 0xAD1457], accentColor: '#F48FB1', description: 'Sweet strawberry pink' },
  { id: 'golden', name: '黃金時代', emoji: '✨', cost: 1200, requiredLevel: 18, bgGrad: [0x4A3800, 0x6B5300], accentColor: '#FFD700', description: 'Golden luxury waffle' },
  { id: 'cosmic', name: '宇宙華夫', emoji: '🌌', cost: 3000, requiredLevel: 30, bgGrad: [0x0A0A2E, 0x1A1A4E], accentColor: '#88BBFF', description: 'Cosmic waffle vibes' },
] as const

export function getWaffleThemeById(id: string): WaffleTheme {
  const t = WAFFLE_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Waffle theme not found: ${id}`)
  return t
}
