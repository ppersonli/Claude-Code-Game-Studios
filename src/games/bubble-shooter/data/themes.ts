export interface ShooterTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredLevels: number
  bgTop: number
  bgBot: number
  accentColor: string
  description: string
}

export const SHOOTER_THEMES: readonly ShooterTheme[] = [
  { id: 'classic', name: '經典紫色', emoji: '🔮', cost: 0, requiredLevels: 0, bgTop: 0x2d1b4e, bgBot: 0x1a0a2e, accentColor: '#CE93D8', description: 'Original shooter style' },
  { id: 'ocean', name: '深海藍', emoji: '🌊', cost: 50, requiredLevels: 3, bgTop: 0x0a1a2e, bgBot: 0x0a2e4e, accentColor: '#44DDFF', description: 'Deep ocean blue' },
  { id: 'forest', name: '森林綠', emoji: '🌲', cost: 120, requiredLevels: 8, bgTop: 0x0a2e1a, bgBot: 0x1a4e2d, accentColor: '#66CC66', description: 'Forest canopy green' },
  { id: 'sunset', name: '夕陽橙', emoji: '🌅', cost: 250, requiredLevels: 15, bgTop: 0x2e1a0a, bgBot: 0x4e2a1a, accentColor: '#FF8844', description: 'Warm sunset orange' },
  { id: 'cherry', name: '櫻花粉', emoji: '🌸', cost: 500, requiredLevels: 25, bgTop: 0x2e0a1a, bgBot: 0x4e1a2d, accentColor: '#FF69B4', description: 'Cherry blossom pink' },
  { id: 'cosmic', name: '宇宙銀', emoji: '🌌', cost: 1000, requiredLevels: 40, bgTop: 0x0a0a1a, bgBot: 0x1a1a2e, accentColor: '#88BBFF', description: 'Cosmic silver' },
] as const

export function getShooterThemeById(id: string): ShooterTheme {
  const t = SHOOTER_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Shooter theme not found: ${id}`)
  return t
}
