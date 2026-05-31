export interface Location {
  id: string
  name: string
  emoji: string
  unlockCost: number
  incomeMult: number
  requiredLevel: number
}

export const LOCATIONS: readonly Location[] = [
  { id: 'cart', name: '街边小推车', emoji: '🛒', unlockCost: 0, incomeMult: 1, requiredLevel: 0 },
  { id: 'kiosk', name: '商场档口', emoji: '🏪', unlockCost: 1000, incomeMult: 1.5, requiredLevel: 10 },
  { id: 'shop', name: '独立门店', emoji: '🏬', unlockCost: 15000, incomeMult: 2.5, requiredLevel: 25 },
  { id: 'flagship', name: '旗舰店', emoji: '🏢', unlockCost: 200000, incomeMult: 5, requiredLevel: 45 },
  { id: 'chain', name: '连锁品牌', emoji: '🌆', unlockCost: 3000000, incomeMult: 10, requiredLevel: 65 },
  { id: 'global', name: '全球帝国', emoji: '🌍', unlockCost: 50000000, incomeMult: 25, requiredLevel: 85 },
] as const

export function getLocationById(id: string): Location {
  const l = LOCATIONS.find(loc => loc.id === id)
  if (!l) throw new Error(`Location not found: ${id}`)
  return l
}
