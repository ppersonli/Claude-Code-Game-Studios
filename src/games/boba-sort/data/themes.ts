export interface Theme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredStars: number
  tubeColor: string
  tubeBorder: string
  bgColor: string
  description: string
}

export const THEMES: readonly Theme[] = [
  { id: 'classic', name: '經典', emoji: '🧋', cost: 0, requiredStars: 0, tubeColor: 'rgba(255,255,255,0.12)', tubeBorder: 'rgba(255,255,255,0.25)', bgColor: '', description: 'Original boba sort style' },
  { id: 'taro', name: '芋頭夢境', emoji: '💜', cost: 100, requiredStars: 3, tubeColor: 'rgba(155,89,182,0.2)', tubeBorder: 'rgba(155,89,182,0.5)', bgColor: 'linear-gradient(135deg, #2d1b4e, #4a2680)', description: 'Purple haze taro theme' },
  { id: 'matcha', name: '抹茶庭院', emoji: '🍵', cost: 200, requiredStars: 6, tubeColor: 'rgba(39,174,96,0.2)', tubeBorder: 'rgba(39,174,96,0.5)', bgColor: 'linear-gradient(135deg, #1a3a2a, #2d5a3a)', description: 'Zen matcha garden theme' },
  { id: 'strawberry', name: '草莓甜心', emoji: '🍓', cost: 300, requiredStars: 10, tubeColor: 'rgba(231,76,60,0.15)', tubeBorder: 'rgba(231,76,60,0.4)', bgColor: 'linear-gradient(135deg, #4a1a2a, #6a2a3a)', description: 'Sweet strawberry theme' },
  { id: 'mango', name: '芒果熱帶', emoji: '🥭', cost: 400, requiredStars: 14, tubeColor: 'rgba(243,156,18,0.2)', tubeBorder: 'rgba(243,156,18,0.5)', bgColor: 'linear-gradient(135deg, #4a3a1a, #6a5a2a)', description: 'Tropical mango sunset theme' },
  { id: 'galaxy', name: '銀河波波', emoji: '🌌', cost: 500, requiredStars: 18, tubeColor: 'rgba(100,100,255,0.15)', tubeBorder: 'rgba(150,150,255,0.4)', bgColor: 'linear-gradient(135deg, #0a0a2e, #1a1a4e)', description: 'Cosmic galaxy theme' },
] as const

export function getThemeById(id: string): Theme {
  const t = THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Theme not found: ${id}`)
  return t
}
