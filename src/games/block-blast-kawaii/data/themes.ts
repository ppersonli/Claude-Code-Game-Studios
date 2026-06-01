export interface BlastTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredScore: number
  bgTop: string
  bgBot: string
  gridBg: string
  cellBg: string
  accentColor: string
  description: string
}

export const BLAST_THEMES: readonly BlastTheme[] = [
  { id: 'pastel', name: '糖果夢', emoji: '🍬', cost: 0, requiredScore: 0, bgTop: '#FFE4EC', bgBot: '#E8F5E9', gridBg: '#F5C6D0', cellBg: '#FAE0E6', accentColor: '#FF69B4', description: 'Sweet pastel dreams' },
  { id: 'ocean', name: '海洋樂', emoji: '🌊', cost: 150, requiredScore: 500, bgTop: '#E0F7FA', bgBot: '#B2EBF2', gridBg: '#B2DFDB', cellBg: '#E0F2F1', accentColor: '#00BCD4', description: 'Ocean fun' },
  { id: 'forest', name: '森林趣', emoji: '🌲', cost: 400, requiredScore: 2000, bgTop: '#E8F5E9', bgBot: '#C8E6C9', gridBg: '#A5D6A7', cellBg: '#E8F5E9', accentColor: '#4CAF50', description: 'Forest adventure' },
  { id: 'sunset', name: '夕陽美', emoji: '🌅', cost: 800, requiredScore: 5000, bgTop: '#FFF3E0', bgBot: '#FFE0B2', gridBg: '#FFCC80', cellBg: '#FFF8E1', accentColor: '#FF9800', description: 'Warm sunset' },
  { id: 'lavender', name: '薰衣草', emoji: '💜', cost: 1500, requiredScore: 10000, bgTop: '#F3E5F5', bgBot: '#E1BEE7', gridBg: '#CE93D8', cellBg: '#F3E5F5', accentColor: '#9C27B0', description: 'Dreamy lavender' },
  { id: 'galaxy', name: '星空夢', emoji: '🌌', cost: 3000, requiredScore: 20000, bgTop: '#1A1A2E', bgBot: '#16213E', gridBg: '#2D2D5E', cellBg: '#3D3D6E', accentColor: '#7C4DFF', description: 'Starlit galaxy' },
] as const

export function getBlastThemeById(id: string): BlastTheme {
  const t = BLAST_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Blast theme not found: ${id}`)
  return t
}
