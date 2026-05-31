export interface EquipmentData {
  id: string
  name: string
  maxLevel: number
  baseCost: number
  costMult: number
  effect: string
  effectPerLevel: number
}

export const EQUIPMENT: Record<string, EquipmentData> = {
  coffee: { id: 'coffee', name: 'Coffee Machine', maxLevel: 50, baseCost: 100, costMult: 2, effect: 'brew_speed', effectPerLevel: 0.10 },
  grinder: { id: 'grinder', name: 'Grinder', maxLevel: 30, baseCost: 200, costMult: 2, effect: 'quality', effectPerLevel: 0.05 },
  oven: { id: 'oven', name: 'Oven', maxLevel: 20, baseCost: 500, costMult: 2, effect: 'dessert', effectPerLevel: 0.10 },
  fridge: { id: 'fridge', name: 'Fridge', maxLevel: 15, baseCost: 800, costMult: 2, effect: 'cold_income', effectPerLevel: 0.15 },
  decor: { id: 'decor', name: 'Decor', maxLevel: 10, baseCost: 1000, costMult: 2, effect: 'customer', effectPerLevel: 0.20 },
}
