export interface Recipe {
  id: string
  name: string
  emoji: string
  basePrice: number
  unlockCost: number
  unlockLevel: number
}

export const RECIPES: readonly Recipe[] = [
  { id: 'classic-milk-tea', name: '经典奶茶', emoji: '🧋', basePrice: 1, unlockCost: 0, unlockLevel: 0 },
  { id: 'taro-boba', name: '芋泥波波', emoji: '🍠', basePrice: 3, unlockCost: 50, unlockLevel: 3 },
  { id: 'matcha-latte', name: '抹茶拿铁', emoji: '🍵', basePrice: 8, unlockCost: 300, unlockLevel: 8 },
  { id: 'brown-sugar', name: '黑糖鹿丸', emoji: '🍯', basePrice: 20, unlockCost: 2000, unlockLevel: 15 },
  { id: 'strawberry-cream', name: '草莓奶昔', emoji: '🍓', basePrice: 50, unlockCost: 15000, unlockLevel: 25 },
  { id: 'cheese-foam', name: '芝士奶盖', emoji: '🧀', basePrice: 120, unlockCost: 100000, unlockLevel: 40 },
  { id: 'royal-boba', name: '皇家特调', emoji: '👑', basePrice: 300, unlockCost: 500000, unlockLevel: 60 },
  { id: 'golden-boba', name: '黄金波波', emoji: '✨', basePrice: 800, unlockCost: 2000000, unlockLevel: 80 },
] as const

export function getRecipeById(id: string): Recipe {
  const r = RECIPES.find(rec => rec.id === id)
  if (!r) throw new Error(`Recipe not found: ${id}`)
  return r
}
