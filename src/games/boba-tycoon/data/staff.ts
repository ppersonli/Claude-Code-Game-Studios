export interface Staff {
  id: string
  name: string
  emoji: string
  baseCost: number
  costMult: number
  cupsPerSec: number
}

export const STAFF: readonly Staff[] = [
  { id: 'intern', name: '实习生', emoji: '👶', baseCost: 20, costMult: 1.12, cupsPerSec: 0.1 },
  { id: 'barista', name: '咖啡师', emoji: '👩‍🍳', baseCost: 150, costMult: 1.12, cupsPerSec: 0.5 },
  { id: 'senior', name: '资深店员', emoji: '🧑‍🍳', baseCost: 2000, costMult: 1.12, cupsPerSec: 3 },
  { id: 'manager', name: '店长', emoji: '👔', baseCost: 25000, costMult: 1.12, cupsPerSec: 15 },
  { id: 'master', name: '调茶大师', emoji: '🎩', baseCost: 300000, costMult: 1.12, cupsPerSec: 80 },
  { id: 'celebrity', name: '明星代言人', emoji: '⭐', baseCost: 5000000, costMult: 1.12, cupsPerSec: 500 },
] as const

export function getStaffCost(staff: Staff, owned: number): number {
  return Math.floor(staff.baseCost * Math.pow(staff.costMult, owned))
}

export function getStaffCps(counts: Record<string, number>): number {
  let total = 0
  for (const s of STAFF) {
    total += (counts[s.id] || 0) * s.cupsPerSec
  }
  return total
}
