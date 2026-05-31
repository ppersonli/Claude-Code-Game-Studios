export interface MergeTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredHighScore: number
  cupColor: number
  cupAlpha: number
  borderColor: number
  bgGradient: [number, number]
  description: string
}

export const MERGE_THEMES: readonly MergeTheme[] = [
  { id: 'classic', name: '經典奶茶', emoji: '🧋', cost: 0, requiredHighScore: 0, cupColor: 0xCE93D8, cupAlpha: 0.08, borderColor: 0xCE93D8, bgGradient: [0x1a0a2e, 0x2d1b4e], description: 'Original boba merge style' },
  { id: 'taro', name: '芋頭幻想', emoji: '💜', cost: 100, requiredHighScore: 100, cupColor: 0x9B59B6, cupAlpha: 0.12, borderColor: 0xBB77DD, bgGradient: [0x2d1050, 0x4a2080], description: 'Dreamy taro purple theme' },
  { id: 'matcha', name: '抹茶庭院', emoji: '🍵', cost: 200, requiredHighScore: 300, cupColor: 0x27AE60, cupAlpha: 0.1, borderColor: 0x44CC66, bgGradient: [0x0a2e1a, 0x1a4e2d], description: 'Zen matcha garden' },
  { id: 'strawberry', name: '草莓甜心', emoji: '🍓', cost: 300, requiredHighScore: 500, cupColor: 0xE74C3C, cupAlpha: 0.1, borderColor: 0xFF6B6B, bgGradient: [0x2e0a1a, 0x4e1a2d], description: 'Sweet strawberry pink' },
  { id: 'ocean', name: '海洋波波', emoji: '🌊', cost: 500, requiredHighScore: 1000, cupColor: 0x3498DB, cupAlpha: 0.1, borderColor: 0x55BBFF, bgGradient: [0x0a1a2e, 0x1a2d4e], description: 'Deep ocean blue' },
  { id: 'galaxy', name: '銀河水晶', emoji: '🌌', cost: 800, requiredHighScore: 2000, cupColor: 0x90CAF9, cupAlpha: 0.12, borderColor: 0xBBDDFF, bgGradient: [0x0a0a2e, 0x1a1a4e], description: 'Cosmic crystal boba' },
] as const

export function getMergeThemeById(id: string): MergeTheme {
  const t = MERGE_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Merge theme not found: ${id}`)
  return t
}
