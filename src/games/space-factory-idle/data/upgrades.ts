/** Upgrade definitions — 3 categories per GDD */

export interface Upgrade {
  id: string
  category: 'production' | 'facility' | 'economy'
  name: string
  description: string
  effect: string
  baseCost: number
  costMultiplier: number
  maxLevel: number
  icon: string
}

export const UPGRADES: Upgrade[] = [
  // Production Line upgrades
  {
    id: 'line-speed',
    category: 'production',
    name: 'Line Speed',
    description: 'Increase production speed',
    effect: '+10% output/sec',
    baseCost: 100,
    costMultiplier: 1.15,
    maxLevel: 100,
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/upgrades/speed.webp`,
  },
  {
    id: 'line-capacity',
    category: 'production',
    name: 'Line Capacity',
    description: 'Increase max stock per line',
    effect: '+1 max stock',
    baseCost: 200,
    costMultiplier: 1.12,
    maxLevel: 50,
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/upgrades/storage.webp`,
  },
  {
    id: 'auto-sell',
    category: 'production',
    name: 'Auto Sell',
    description: 'Auto-sell when stock is full',
    effect: 'Auto-sell enabled',
    baseCost: 500,
    costMultiplier: 1.18,
    maxLevel: 1,
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/upgrades/auto-sell.webp`,
  },
  {
    id: 'quality-boost',
    category: 'production',
    name: 'Quality Boost',
    description: 'Improve product quality',
    effect: '+25% output quantity',
    baseCost: 1000,
    costMultiplier: 1.20,
    maxLevel: 20,
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/upgrades/quality.webp`,
  },

  // Facility upgrades
  {
    id: 'warehouse',
    category: 'facility',
    name: 'Warehouse',
    description: 'Expand warehouse capacity',
    effect: '+10 max stock',
    baseCost: 300,
    costMultiplier: 1.15,
    maxLevel: 50,
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/upgrades/factory.webp`,
  },
  {
    id: 'transport',
    category: 'facility',
    name: 'Transport Speed',
    description: 'Faster selling speed',
    effect: '+20% sell speed',
    baseCost: 500,
    costMultiplier: 1.12,
    maxLevel: 30,
    icon: `${import.meta.env.BASE_URL}assets/space-factory-idle/upgrades/transport.webp`,
  },
  {
    id: 'spaceport',
    category: 'facility',
    name: 'Spaceport',
    description: 'Unlock new planets',
    effect: 'Unlock planets',
    baseCost: 5000,
    costMultiplier: 1.25,
    maxLevel: 5,
    icon: '🚀',
  },
  {
    id: 'rd-center',
    category: 'facility',
    name: 'R&D Center',
    description: 'Unlock advanced recipes',
    effect: 'Unlock advanced recipes',
    baseCost: 10000,
    costMultiplier: 1.30,
    maxLevel: 5,
    icon: '🔬',
  },

  // Economy upgrades
  {
    id: 'coin-mult',
    category: 'economy',
    name: 'Gold Multiplier',
    description: 'Increase coin income',
    effect: '×1.5 coin income',
    baseCost: 250,
    costMultiplier: 1.18,
    maxLevel: 20,
    icon: '💰',
  },
  {
    id: 'offline-earn',
    category: 'economy',
    name: 'Offline Earnings',
    description: 'Earn coins while away',
    effect: 'Auto-produce offline',
    baseCost: 1000,
    costMultiplier: 1.20,
    maxLevel: 1,
    icon: '😴',
  },
  {
    id: 'combo-boost',
    category: 'economy',
    name: 'Combo Boost',
    description: 'Combo clicks give more',
    effect: 'Higher combo multiplier',
    baseCost: 800,
    costMultiplier: 1.15,
    maxLevel: 10,
    icon: '🔥',
  },
  {
    id: 'lucky-star',
    category: 'economy',
    name: 'Lucky Star',
    description: 'Chance for double rewards',
    effect: 'Random 2x rewards',
    baseCost: 1500,
    costMultiplier: 1.18,
    maxLevel: 10,
    icon: '🌟',
  },
]

export function getUpgradesByCategory(category: Upgrade['category']): Upgrade[] {
  return UPGRADES.filter(u => u.category === category)
}
