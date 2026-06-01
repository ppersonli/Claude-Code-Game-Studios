export interface MochiTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredHighScore: number
  boxColor: number
  boxAlpha: number
  borderColor: number
  description: string
}

export const MOCHI_THEMES: readonly MochiTheme[] = [
  { id: 'classic', name: '經典粉色', emoji: '🍡', cost: 0, requiredHighScore: 0, boxColor: 0xFFB7C5, boxAlpha: 0.15, borderColor: 0xFFB7C5, description: 'Original mochi pink style' },
  { id: 'matcha', name: '抹茶清新', emoji: '🍵', cost: 100, requiredHighScore: 200, boxColor: 0x27AE60, boxAlpha: 0.18, borderColor: 0x44CC66, description: 'Fresh matcha green' },
  { id: 'sakura', name: '櫻花夢境', emoji: '🌸', cost: 200, requiredHighScore: 500, boxColor: 0xFF69B4, boxAlpha: 0.15, borderColor: 0xFF85C8, description: 'Dreamy sakura pink' },
  { id: 'azuki', name: '紅豆和風', emoji: '🫘', cost: 300, requiredHighScore: 1000, boxColor: 0x8B4513, boxAlpha: 0.2, borderColor: 0xA0522D, description: 'Traditional azuki bean' },
  { id: 'gold', name: '金箔奢華', emoji: '✨', cost: 500, requiredHighScore: 2000, boxColor: 0xDAA520, boxAlpha: 0.2, borderColor: 0xFFD700, description: 'Luxurious gold leaf' },
  { id: 'galaxy', name: '星空團子', emoji: '🌌', cost: 800, requiredHighScore: 5000, boxColor: 0x4488FF, boxAlpha: 0.15, borderColor: 0x88BBFF, description: 'Cosmic galaxy theme' },
] as const

export function getMochiThemeById(id: string): MochiTheme {
  const t = MOCHI_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Mochi theme not found: ${id}`)
  return t
}
