export interface SweetTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredStars: number
  bgColor: number
  accentColor: string
  description: string
}

export const SWEET_THEMES: readonly SweetTheme[] = [
  { id: 'classic', name: '經典糖果', emoji: '🍬', cost: 0, requiredStars: 0, bgColor: 0xFFF5E6, accentColor: '#8B4513', description: 'Original sweet sort style' },
  { id: 'chocolate', name: '巧克力夢', emoji: '🍫', cost: 50, requiredStars: 5, bgColor: 0x3E2723, accentColor: '#795548', description: 'Rich chocolate brown' },
  { id: 'strawberry', name: '草莓甜心', emoji: '🍓', cost: 120, requiredStars: 15, bgColor: 0x880E4F, accentColor: '#F48FB1', description: 'Sweet strawberry pink' },
  { id: 'mint', name: '薄荷清新', emoji: '🌿', cost: 300, requiredStars: 30, bgColor: 0x1B5E20, accentColor: '#66BB6A', description: 'Fresh mint green' },
  { id: 'blueberry', name: '藍莓星空', emoji: '🫐', cost: 600, requiredStars: 50, bgColor: 0x0D47A1, accentColor: '#42A5F5', description: 'Blueberry night sky' },
  { id: 'rainbow', name: '彩虹糖夢', emoji: '🌈', cost: 1200, requiredStars: 80, bgColor: 0x4A148C, accentColor: '#CE93D8', description: 'Rainbow candy wonderland' },
] as const

export function getSweetThemeById(id: string): SweetTheme {
  const t = SWEET_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Sweet theme not found: ${id}`)
  return t
}
