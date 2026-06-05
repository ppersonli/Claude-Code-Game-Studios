/**
 * Idle Garden Tycoon — Flower data
 * All flower definitions are data-driven, never hardcoded.
 */

export interface FlowerData {
  id: string
  name: string
  growTime: number    // seconds
  sellPrice: number   // coins
  unlockLevel: number // garden level required
  unlockPrestige: number // prestige level required (0 = none)
  seedCost: number    // cost to buy seed
  img: string         // image key (resolved at runtime)
}

export const FLOWERS: FlowerData[] = [
  {
    id: 'sunflower',
    name: 'Sunflower',
    growTime: 10,
    sellPrice: 10,
    unlockLevel: 1,
    unlockPrestige: 0,
    seedCost: 5,
    img: 'flower-sunflower',
  },
  {
    id: 'tulip',
    name: 'Tulip',
    growTime: 30,
    sellPrice: 30,
    unlockLevel: 2,
    unlockPrestige: 0,
    seedCost: 15,
    img: 'flower-tulip',
  },
  {
    id: 'rose',
    name: 'Rose',
    growTime: 60,
    sellPrice: 80,
    unlockLevel: 3,
    unlockPrestige: 0,
    seedCost: 40,
    img: 'flower-rose',
  },
  {
    id: 'peony',
    name: 'Peony',
    growTime: 120,
    sellPrice: 200,
    unlockLevel: 4,
    unlockPrestige: 0,
    seedCost: 100,
    img: 'flower-peony',
  },
  {
    id: 'orchid',
    name: 'Orchid',
    growTime: 300,
    sellPrice: 500,
    unlockLevel: 5,
    unlockPrestige: 0,
    seedCost: 250,
    img: 'flower-orchid',
  },
  {
    id: 'rainbow',
    name: 'Rainbow Flower',
    growTime: 600,
    sellPrice: 2000,
    unlockLevel: 5,
    unlockPrestige: 1,
    seedCost: 1000,
    img: 'flower-rainbow',
  },
]

/**
 * Get a flower by ID, or undefined if not found.
 */
export function getFlowerById(id: string): FlowerData | undefined {
  return FLOWERS.find(f => f.id === id)
}

/**
 * Get all flowers available at a given level + prestige.
 */
export function getAvailableFlowers(level: number, prestige: number): FlowerData[] {
  return FLOWERS.filter(f => f.unlockLevel <= level && f.unlockPrestige <= prestige)
}
