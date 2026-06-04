/** Planet data for Space Factory Idle */

export interface Planet {
  id: string
  name: string
  description: string
  stardustCost: number
  bgColor: number
  recipes: string[]
  /** Max production lines for this planet (1-8) */
  productionLines: number
  /** Multiplier for this planet's output (1.0 = earth baseline) */
  specialBonus: number
  /** Distance in km needed to unlock (0 = always available) */
  unlockDistance: number
  /** Index for cost scaling */
  index: number
  /** Prestiges required to unlock (0 = none) */
  requiredPrestiges: number
  /** First recipe given when unlocking */
  firstRecipe: string
}

export const PLANETS: Planet[] = [
  {
    id: 'earth',
    name: 'Earth',
    description: 'Home planet',
    stardustCost: 0,
    bgColor: 0x1a3a5c,
    recipes: ['ore-smelt', 'metal-work', 'electronics', 'precision'],
    productionLines: 3,
    specialBonus: 1.0,
    unlockDistance: 0,
    index: 0,
    requiredPrestiges: 0,
    firstRecipe: 'ore-smelt',
  },
  {
    id: 'moon',
    name: 'Moon',
    description: "Earth's satellite",
    stardustCost: 100,
    bgColor: 0x2a2a3a,
    recipes: ['helium3', 'moon-rock'],
    productionLines: 3,
    specialBonus: 1.2,
    unlockDistance: 10,
    index: 1,
    requiredPrestiges: 0,
    firstRecipe: 'helium3',
  },
  {
    id: 'mars',
    name: 'Mars',
    description: 'The red planet',
    stardustCost: 1000,
    bgColor: 0x5c2a1a,
    recipes: ['mars-alloy', 'solar-panel'],
    productionLines: 3,
    specialBonus: 1.5,
    unlockDistance: 50,
    index: 2,
    requiredPrestiges: 0,
    firstRecipe: 'mars-alloy',
  },
  {
    id: 'europa',
    name: 'Europa',
    description: "Jupiter's icy moon",
    stardustCost: 10_000,
    bgColor: 0x1a4a5c,
    recipes: ['ice-core', 'ocean-mineral'],
    productionLines: 3,
    specialBonus: 2.0,
    unlockDistance: 200,
    index: 3,
    requiredPrestiges: 0,
    firstRecipe: 'ice-core',
  },
  {
    id: 'titan',
    name: 'Titan',
    description: "Saturn's largest moon",
    stardustCost: 100_000,
    bgColor: 0x3a2a1a,
    recipes: ['polymer', 'nitrogen-compound'],
    productionLines: 3,
    specialBonus: 2.5,
    unlockDistance: 1000,
    index: 4,
    requiredPrestiges: 0,
    firstRecipe: 'polymer',
  },
  {
    id: 'galactic',
    name: 'Galactic Core',
    description: 'The center of the galaxy',
    stardustCost: 1_000_000,
    bgColor: 0x0a0a2a,
    recipes: ['galactic-matter', 'void-crystal'],
    productionLines: 3,
    specialBonus: 3.0,
    unlockDistance: 0,
    index: 5,
    requiredPrestiges: 3,
    firstRecipe: 'galactic-matter',
  },
]

export function getPlanetById(id: string): Planet | undefined {
  return PLANETS.find((p) => p.id === id)
}

export function getPlanetIndex(id: string): number {
  return PLANETS.findIndex((p) => p.id === id)
}
