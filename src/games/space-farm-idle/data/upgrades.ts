/** Upgrade definitions */

export interface Upgrade {
  id: string
  nameKey: string
  descriptionKey: string
  category: 'farm' | 'automation' | 'economy'
  baseCost: number
  maxLevel: number
  effect: string
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'farm-level',
    nameKey: 'upgrade_farmLevel',
    descriptionKey: 'upgrade_farmLevel_desc',
    category: 'farm',
    baseCost: 50,
    maxLevel: 50,
    effect: '+50% crop value per level',
  },
  {
    id: 'worker-speed',
    nameKey: 'upgrade_workerSpeed',
    descriptionKey: 'upgrade_workerSpeed_desc',
    category: 'farm',
    baseCost: 100,
    maxLevel: 50,
    effect: '+10% auto-harvest speed per level',
  },
  {
    id: 'auto-harvest',
    nameKey: 'upgrade_autoHarvest',
    descriptionKey: 'upgrade_autoHarvest_desc',
    category: 'automation',
    baseCost: 500,
    maxLevel: 4,
    effect: 'Auto-harvest crops',
  },
  {
    id: 'auto-plant',
    nameKey: 'upgrade_autoPlant',
    descriptionKey: 'upgrade_autoPlant_desc',
    category: 'automation',
    baseCost: 2000,
    maxLevel: 4,
    effect: 'Auto-plant crops',
  },
  {
    id: 'coin-mult',
    nameKey: 'upgrade_coinMult',
    descriptionKey: 'upgrade_coinMult_desc',
    category: 'economy',
    baseCost: 1000,
    maxLevel: 20,
    effect: '+25% sell price per level',
  },
  {
    id: 'weather-shield',
    nameKey: 'upgrade_weatherShield',
    descriptionKey: 'upgrade_weatherShield_desc',
    category: 'economy',
    baseCost: 5000,
    maxLevel: 5,
    effect: 'Reduce negative weather effects',
  },
]

export function getUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.12, level))
}

export function getUpgradeById(id: string): Upgrade | undefined {
  return UPGRADES.find(u => u.id === id)
}
