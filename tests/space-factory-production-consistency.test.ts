import { describe, it, expect } from 'vitest'
import {
  processProductionTick,
  clickProduce,
  sellStock,
  getLineUpgradeCost,
} from '../src/games/space-factory-idle/logic/production'
import type { GameState } from '../src/games/space-factory-idle/logic/game-state'
import { RECIPES as DATA_RECIPES } from '../src/games/space-factory-idle/data/recipes'

/* ── Helpers ────────────────────────────────────────────────────── */

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
    productionLines: {
      earth: [
        { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false },
      ],
    },
    upgrades: {},
    employees: {},
    unlockedPlanets: ['earth'],
    unlockedRecipes: ['ore-smelt'],
    totalProduced: 0,
    bestDistance: 0,
    achievements: [],
    lastDailyCompleted: '',
    dailyStreak: 0,
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    activeEvent: null,
    eventEndTime: 0,
    sessionCoinsEarned: 0,
    sessionItemsProduced: 0,
    sessionUpgradesMade: 0,
    totalPlayTime: 0,
    ...overrides,
  }
}

/* ── Tests ──────────────────────────────────────────────────────── */

describe('production.ts — recipe consistency with data/recipes.ts', () => {
  it('processProductionTick handles all recipes from data/recipes.ts', () => {
    // Every recipe defined in data/recipes.ts should work in production
    for (const recipe of DATA_RECIPES) {
      const state = makeGameState({
        productionLines: {
          [recipe.planetId]: [
            { recipeId: recipe.id, level: 1, stock: 0, maxStock: 10, automated: false },
          ],
        },
      })

      // Should produce items (stock > 0 after tick)
      processProductionTick(state)
      expect(state.productionLines[recipe.planetId][0].stock).toBeGreaterThan(0)
    }
  })

  it('clickProduce works for galactic recipes', () => {
    const state = makeGameState({
      productionLines: {
        galactic: [
          { recipeId: 'galactic-matter', level: 1, stock: 0, maxStock: 10, automated: false },
        ],
      },
    })

    const coins = clickProduce(state, 'galactic', 0)
    expect(state.productionLines.galactic[0].stock).toBeGreaterThan(0)
    // clickProduce returns 0 when not overflowing
    expect(coins).toBe(0)
  })

  it('sellStock works for galactic recipes', () => {
    const state = makeGameState({
      productionLines: {
        galactic: [
          { recipeId: 'galactic-matter', level: 1, stock: 5, maxStock: 10, automated: false },
        ],
      },
    })

    const coins = sellStock(state, 'galactic', 0)
    expect(coins).toBeGreaterThan(0)
    expect(state.coins).toBe(coins)
  })

  it('getLineUpgradeCost works for galactic recipes', () => {
    const line = { recipeId: 'galactic-matter', level: 1, stock: 0, maxStock: 10, automated: false }
    const cost = getLineUpgradeCost(line)
    expect(cost).toBeGreaterThan(0)
    expect(cost).not.toBe(Infinity)
  })

  it('getLineUpgradeCost works for void-crystal', () => {
    const line = { recipeId: 'void-crystal', level: 1, stock: 0, maxStock: 10, automated: false }
    const cost = getLineUpgradeCost(line)
    expect(cost).toBeGreaterThan(0)
    expect(cost).not.toBe(Infinity)
  })
})
