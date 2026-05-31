export interface Recipe {
  id: string
  name: string
  emoji: string
  basePrice: number
  unlockCost: number
  unlockLevel: number
}

export const RECIPES: readonly Recipe[] = [
  { id: 'classic', name: '经典奶茶', emoji: '🧋', basePrice: 1, unlockCost: 0, unlockLevel: 0 },
  { id: 'green-tea', name: '绿茶拿铁', emoji: '🍵', basePrice: 3, unlockCost: 50, unlockLevel: 5 },
  { id: 'taro', name: '芋泥波波', emoji: '🍠', basePrice: 8, unlockCost: 300, unlockLevel: 10 },
  { id: 'matcha', name: '抹茶星冰', emoji: '🍃', basePrice: 20, unlockCost: 2000, unlockLevel: 20 },
  { id: 'brown-sugar', name: '黑糖鹿丸', emoji: '🍯', basePrice: 50, unlockCost: 15000, unlockLevel: 35 },
  { id: 'cheese-tea', name: '芝士奶盖', emoji: '🧀', basePrice: 120, unlockCost: 100000, unlockLevel: 50 },
  { id: 'royal', name: '皇家特调', emoji: '👑', basePrice: 300, unlockCost: 500000, unlockLevel: 75 },
] as const

export function getRecipeById(id: string): Recipe {
  const recipe = RECIPES.find(r => r.id === id)
  if (!recipe) throw new Error(`Recipe not found: ${id}`)
  return recipe
}
