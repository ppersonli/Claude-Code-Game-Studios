export interface Staff {
  id: string
  name: string
  emoji: string
  baseCost: number
  costMultiplier: number
  cupsPerSecond: number
}

export const STAFF: readonly Staff[] = [
  { id: 'trainee', name: '实习生', emoji: '👶', baseCost: 15, costMultiplier: 1.15, cupsPerSecond: 0.1 },
  { id: 'barista', name: '咖啡师', emoji: '👩‍🍳', baseCost: 100, costMultiplier: 1.15, cupsPerSecond: 0.5 },
  { id: 'senior', name: '资深店员', emoji: '🧑‍🍳', baseCost: 1100, costMultiplier: 1.15, cupsPerSecond: 3 },
  { id: 'manager', name: '店长', emoji: '👔', baseCost: 12000, costMultiplier: 1.15, cupsPerSecond: 15 },
  { id: 'chef', name: '首席调茶师', emoji: '🎩', baseCost: 130000, costMultiplier: 1.15, cupsPerSecond: 80 },
] as const

export function getStaffCost(staff: Staff, owned: number): number {
  return Math.floor(staff.baseCost * Math.pow(staff.costMultiplier, owned))
}

export function getStaffCps(staffCounts: Record<string, number>): number {
  let total = 0
  for (const s of STAFF) {
    total += (staffCounts[s.id] || 0) * s.cupsPerSecond
  }
  return total
}
