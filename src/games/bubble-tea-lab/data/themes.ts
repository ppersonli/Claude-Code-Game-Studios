export interface LabTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredLevel: number
  bgGradient: [string, string]
  accentColor: string
  description: string
}

export const LAB_THEMES: readonly LabTheme[] = [
  { id: 'classic', name: '經典實驗室', emoji: '🧪', cost: 0, requiredLevel: 0, bgGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)'], accentColor: '#FFD700', description: 'Original lab style' },
  { id: 'taro', name: '芋頭夢境', emoji: '💜', cost: 150, requiredLevel: 3, bgGradient: ['rgba(155,89,182,0.3)', 'rgba(155,89,182,0.1)'], accentColor: '#BB77DD', description: 'Dreamy taro purple' },
  { id: 'matcha', name: '抹茶庭院', emoji: '🍵', cost: 300, requiredLevel: 6, bgGradient: ['rgba(39,174,96,0.25)', 'rgba(39,174,96,0.08)'], accentColor: '#66BB6A', description: 'Zen matcha garden' },
  { id: 'strawberry', name: '草莓甜心', emoji: '🍓', cost: 600, requiredLevel: 10, bgGradient: ['rgba(231,76,60,0.2)', 'rgba(231,76,60,0.08)'], accentColor: '#FF6B6B', description: 'Sweet strawberry pink' },
  { id: 'ocean', name: '海洋實驗室', emoji: '🌊', cost: 1200, requiredLevel: 16, bgGradient: ['rgba(52,152,219,0.2)', 'rgba(52,152,219,0.08)'], accentColor: '#55BBFF', description: 'Ocean depth blue' },
  { id: 'galaxy', name: '銀河特調', emoji: '🌌', cost: 2500, requiredLevel: 25, bgGradient: ['rgba(100,100,255,0.2)', 'rgba(100,100,255,0.05)'], accentColor: '#88BBFF', description: 'Galaxy bubble tea' },
] as const

export function getLabThemeById(id: string): LabTheme {
  const t = LAB_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Lab theme not found: ${id}`)
  return t
}
