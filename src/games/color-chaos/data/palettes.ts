export interface ColorPalette {
  id: string
  name: string
  emoji: string
  cost: number
  requiredStars: number
  bgColor1: number
  bgColor2: number
  accentColor: string
  description: string
}

export const COLOR_PALETTES: readonly ColorPalette[] = [
  { id: 'classic', name: '經典', emoji: '🎨', cost: 0, requiredStars: 0, bgColor1: 0x1a1a2e, bgColor2: 0x16213e, accentColor: '#4488FF', description: 'Original color chaos' },
  { id: 'sunset', name: '日落橙', emoji: '🌅', cost: 20, requiredStars: 5, bgColor1: 0x2e1a0a, bgColor2: 0x4e2a1a, accentColor: '#FF8844', description: 'Warm sunset glow' },
  { id: 'forest', name: '森林綠', emoji: '🌲', cost: 40, requiredStars: 15, bgColor1: 0x0a2e1a, bgColor2: 0x1a4e2d, accentColor: '#44CC44', description: 'Deep forest green' },
  { id: 'ocean', name: '海洋藍', emoji: '🌊', cost: 80, requiredStars: 30, bgColor1: 0x0a1a2e, bgColor2: 0x1a2d4e, accentColor: '#44DDFF', description: 'Ocean depth blue' },
  { id: 'cherry', name: '櫻花粉', emoji: '🌸', cost: 150, requiredStars: 50, bgColor1: 0x2e0a1a, bgColor2: 0x4e1a2d, accentColor: '#FF88CC', description: 'Cherry blossom pink' },
  { id: 'void', name: '虛空紫', emoji: '🔮', cost: 300, requiredStars: 80, bgColor1: 0x1a0a2e, bgColor2: 0x2d1b4e, accentColor: '#AA44FF', description: 'Deep void purple' },
] as const

export function getColorPaletteById(id: string): ColorPalette {
  const p = COLOR_PALETTES.find(cp => cp.id === id)
  if (!p) throw new Error(`Color palette not found: ${id}`)
  return p
}
