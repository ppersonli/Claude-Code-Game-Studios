export interface Location {
  id: string
  name: string
  emoji: string
  unlockCost: number
  incomeMultiplier: number
  requiredLevel: number
}

export const LOCATIONS: readonly Location[] = [
  { id: 'street', name: '街边小摊', emoji: '🏪', unlockCost: 0, incomeMultiplier: 1, requiredLevel: 0 },
  { id: 'mall', name: '商场店铺', emoji: '🏬', unlockCost: 5000, incomeMultiplier: 1.5, requiredLevel: 15 },
  { id: 'downtown', name: '市中心旗舰店', emoji: '🏢', unlockCost: 50000, incomeMultiplier: 2.5, requiredLevel: 30 },
  { id: 'airport', name: '机场店', emoji: '✈️', unlockCost: 500000, incomeMultiplier: 5, requiredLevel: 50 },
  { id: 'global', name: '全球连锁', emoji: '🌍', unlockCost: 5000000, incomeMultiplier: 10, requiredLevel: 75 },
] as const

export function getLocationById(id: string): Location {
  const loc = LOCATIONS.find(l => l.id === id)
  if (!loc) throw new Error(`Location not found: ${id}`)
  return loc
}

export function getCurrentLocation(locationId: string): Location {
  return getLocationById(locationId)
}
