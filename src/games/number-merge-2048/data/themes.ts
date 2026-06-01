export interface Merge2048Theme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredScore: number
  bgTop: string
  bgBot: string
  accentColor: string
  gridBg: string
  cellBg: string
  description: string
}

export const MERGE_THEMES: readonly Merge2048Theme[] = [
  { id: 'classic', name: '經典粉', emoji: '🌸', cost: 0, requiredScore: 0, bgTop: '#FFE4EC', bgBot: '#FFD1DC', accentColor: '#FF69B4', gridBg: '#F5C6D0', cellBg: '#FAE0E6', description: 'Original kawaii pink' },
  { id: 'ocean', name: '海洋藍', emoji: '🌊', cost: 100, requiredScore: 500, bgTop: '#E0F7FA', bgBot: '#B2EBF2', accentColor: '#00BCD4', gridBg: '#B2DFDB', cellBg: '#E0F2F1', description: 'Cool ocean breeze' },
  { id: 'forest', name: '森林綠', emoji: '🌿', cost: 250, requiredScore: 2000, bgTop: '#E8F5E9', bgBot: '#C8E6C9', accentColor: '#4CAF50', gridBg: '#A5D6A7', cellBg: '#E8F5E9', description: 'Fresh forest canopy' },
  { id: 'sunset', name: '夕陽橙', emoji: '🌅', cost: 500, requiredScore: 5000, bgTop: '#FFF3E0', bgBot: '#FFE0B2', accentColor: '#FF9800', gridBg: '#FFCC80', cellBg: '#FFF8E1', description: 'Warm sunset glow' },
  { id: 'lavender', name: '薰衣草紫', emoji: '💜', cost: 1000, requiredScore: 10000, bgTop: '#F3E5F5', bgBot: '#E1BEE7', accentColor: '#9C27B0', gridBg: '#CE93D8', cellBg: '#F3E5F5', description: 'Dreamy lavender fields' },
  { id: 'galaxy', name: '銀河夢', emoji: '🌌', cost: 2000, requiredScore: 20000, bgTop: '#1A1A2E', bgBot: '#16213E', accentColor: '#7C4DFF', gridBg: '#2D2D5E', cellBg: '#3D3D6E', description: 'Deep space wonder' },
] as const

export function getMergeThemeById(id: string): Merge2048Theme {
  const t = MERGE_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Merge theme not found: ${id}`)
  return t
}
