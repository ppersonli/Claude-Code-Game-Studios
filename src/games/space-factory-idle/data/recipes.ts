/** Recipe data for Space Factory Idle */

export interface Recipe {
  id: string
  name: string
  planetId: string
  /** Base output per production tick */
  baseOutput: number
  /** Base coin value per item when sold */
  basePrice: number
  /** Cost multiplier for line upgrades */
  costMultiplier: number
  /** Coin cost to unlock this recipe (0 = starter) */
  baseCost: number
  /** Stardust cost to unlock (if not starter) */
  unlockCost?: number
}

export const RECIPES: Recipe[] = [
  // Earth recipes
  { id: 'ore-smelt', name: 'Ore Smelt', planetId: 'earth', baseOutput: 1, basePrice: 1, costMultiplier: 1.15, baseCost: 0 },
  { id: 'metal-work', name: 'Metal Work', planetId: 'earth', baseOutput: 2, basePrice: 3, costMultiplier: 1.15, baseCost: 100 },
  { id: 'electronics', name: 'Electronics', planetId: 'earth', baseOutput: 3, basePrice: 8, costMultiplier: 1.15, baseCost: 500 },
  { id: 'precision', name: 'Precision Parts', planetId: 'earth', baseOutput: 5, basePrice: 20, costMultiplier: 1.15, baseCost: 2000 },

  // Moon recipes
  { id: 'helium3', name: 'He-3 Battery', planetId: 'moon', baseOutput: 4, basePrice: 15, costMultiplier: 1.15, baseCost: 0 },
  { id: 'moon-rock', name: 'Moon Rock', planetId: 'moon', baseOutput: 3, basePrice: 10, costMultiplier: 1.15, baseCost: 200 },

  // Mars recipes
  { id: 'mars-alloy', name: 'Mars Alloy', planetId: 'mars', baseOutput: 6, basePrice: 25, costMultiplier: 1.15, baseCost: 0 },
  { id: 'solar-panel', name: 'Solar Panel', planetId: 'mars', baseOutput: 5, basePrice: 30, costMultiplier: 1.15, baseCost: 1000 },

  // Europa recipes
  { id: 'ice-core', name: 'Ice Core Fuel', planetId: 'europa', baseOutput: 8, basePrice: 50, costMultiplier: 1.15, baseCost: 0 },
  { id: 'ocean-mineral', name: 'Ocean Mineral', planetId: 'europa', baseOutput: 7, basePrice: 40, costMultiplier: 1.15, baseCost: 5000 },

  // Titan recipes
  { id: 'polymer', name: 'Organic Polymer', planetId: 'titan', baseOutput: 10, basePrice: 80, costMultiplier: 1.15, baseCost: 0 },
  { id: 'nitrogen-compound', name: 'Nitrogen Compound', planetId: 'titan', baseOutput: 9, basePrice: 60, costMultiplier: 1.15, baseCost: 20000 },

  // Galactic recipes
  { id: 'galactic-matter', name: 'Galactic Matter', planetId: 'galactic', baseOutput: 15, basePrice: 200, costMultiplier: 1.15, baseCost: 0 },
  { id: 'void-crystal', name: 'Void Crystal', planetId: 'galactic', baseOutput: 12, basePrice: 150, costMultiplier: 1.15, baseCost: 50000 },
]

export function getRecipesForPlanet(planetId: string): Recipe[] {
  return RECIPES.filter((r) => r.planetId === planetId)
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id)
}
