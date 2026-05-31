export interface MemeTheme {
  id: string
  name: string
  emoji: string
  cost: number
  requiredScore: number
  cardBack: string
  bgColor: string
  description: string
}

export const MEME_THEMES: readonly MemeTheme[] = [
  { id: 'classic', name: '經典問號', emoji: '❓', cost: 0, requiredScore: 0, cardBack: '?', bgColor: 'linear-gradient(135deg, #1e1b4b, #581c87)', description: 'Original meme match style' },
  { id: 'doge', name: 'Doge風', emoji: '🐕', cost: 100, requiredScore: 500, cardBack: '🐕', bgColor: 'linear-gradient(135deg, #2d1b4e, #4a2680)', description: 'Such theme, much wow' },
  { id: 'pepe', name: 'Pepe風', emoji: '🐸', cost: 200, requiredScore: 1000, cardBack: '🐸', bgColor: 'linear-gradient(135deg, #1a3a2a, #2d5a3a)', description: 'Feels good man' },
  { id: 'stonks', name: 'Stonks風', emoji: '📈', cost: 400, requiredScore: 2000, cardBack: '📈', bgColor: 'linear-gradient(135deg, #0a2e1a, #1a4e2d)', description: 'Only goes up' },
  { id: 'galaxy', name: '銀河梗圖', emoji: '🌌', cost: 800, requiredScore: 5000, cardBack: '✨', bgColor: 'linear-gradient(135deg, #0a0a2e, #1a1a4e)', description: 'Galaxy brain aesthetic' },
  { id: 'legendary', name: '傳說級', emoji: '👑', cost: 1500, requiredScore: 10000, cardBack: '👑', bgColor: 'linear-gradient(135deg, #2e1a0a, #4e3a1a)', description: 'Legendary meme lord' },
] as const

export function getMemeThemeById(id: string): MemeTheme {
  const t = MEME_THEMES.find(th => th.id === id)
  if (!t) throw new Error(`Meme theme not found: ${id}`)
  return t
}
