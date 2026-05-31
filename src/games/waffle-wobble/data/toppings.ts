export interface Topping {
  id: string
  name: string
  emoji: string
  color: number
  unlockCost: number
  unlockLevel: number
}

export const TOPPINGS: readonly Topping[] = [
  { id: 'syrup', name: '糖浆', emoji: '🍯', color: 0xDAA520, unlockCost: 0, unlockLevel: 0 },
  { id: 'butter', name: '黄油', emoji: '🧈', color: 0xFFF8DC, unlockCost: 0, unlockLevel: 0 },
  { id: 'cream', name: '奶油', emoji: '🍦', color: 0xFFFAFA, unlockCost: 50, unlockLevel: 3 },
  { id: 'strawberry', name: '草莓', emoji: '🍓', color: 0xFF6B6B, unlockCost: 100, unlockLevel: 5 },
  { id: 'chocolate', name: '巧克力', emoji: '🍫', color: 0x7B3F00, unlockCost: 200, unlockLevel: 8 },
  { id: 'banana', name: '香蕉', emoji: '🍌', color: 0xFFE135, unlockCost: 400, unlockLevel: 12 },
  { id: 'matcha', name: '抹茶', emoji: '🍵', color: 0x88CC44, unlockCost: 800, unlockLevel: 16 },
  { id: 'blueberry', name: '蓝莓', emoji: '🫐', color: 0x4466CC, unlockCost: 1500, unlockLevel: 20 },
  { id: 'caramel', name: '焦糖', emoji: '🍮', color: 0xCC8833, unlockCost: 3000, unlockLevel: 25 },
  { id: 'gold', name: '金箔', emoji: '✨', color: 0xFFD700, unlockCost: 10000, unlockLevel: 30 },
] as const

export const MAX_TOPPINGS_PER_ORDER = 3
export const WAFFLE_COOK_TIME = 3000 // ms

export function getToppingById(id: string): Topping {
  const t = TOPPINGS.find(tp => tp.id === id)
  if (!t) throw new Error(`Topping not found: ${id}`)
  return t
}
