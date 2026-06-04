import { describe, it, expect } from 'vitest'
import { createDefaultState, loadState, serializeState, deserializeState, type GameState } from '../src/games/space-factory-idle/logic/game-state'
import { calcPrestigeStardust, calcPrestigeThreshold } from '../src/games/space-factory-idle/logic/constants'
import { RECIPES } from '../src/games/space-factory-idle/data/recipes'

describe('GameScene integration — new GameState interface', () => {
  it('createDefaultState returns productionLines instead of factoryLevel', () => {
    const state = createDefaultState()
    expect(state.productionLines).toBeDefined()
    expect(state.productionLines.earth).toBeDefined()
    expect(state.productionLines.earth.length).toBeGreaterThan(0)
    // Old interface had factoryLevel — new one should NOT have it
    expect((state as any).factoryLevel).toBeUndefined()
  })

  it('createDefaultState has coins instead of separate stardust field', () => {
    const state = createDefaultState()
    expect(state.coins).toBe(0)
    expect(state.totalCoins).toBe(0)
    expect(state.starDust).toBe(0)
    // Old interface had totalCoinsEarned — new one uses totalCoins
    expect((state as any).totalCoinsEarned).toBeUndefined()
  })

  it('createDefaultState has lastOnline instead of lastSave', () => {
    const state = createDefaultState()
    expect(state.lastOnline).toBeDefined()
    expect((state as any).lastSave).toBeUndefined()
  })

  it('createDefaultState has upgrades record instead of factoryLevel/workers/workerSpeed', () => {
    const state = createDefaultState()
    expect(state.upgrades).toBeDefined()
    expect(typeof state.upgrades).toBe('object')
    expect(state.employees).toBeDefined()
    // Old interface had workers, workerSpeed — new one should NOT
    expect((state as any).workers).toBeUndefined()
    expect((state as any).workerSpeed).toBeUndefined()
  })

  it('createDefaultState has no currentPlanet or activeRecipes', () => {
    const state = createDefaultState()
    // Old interface had currentPlanet and activeRecipes
    expect((state as any).currentPlanet).toBeUndefined()
    expect((state as any).activeRecipes).toBeUndefined()
  })

  it('recipes from data/recipes.ts have basePrice (not value)', () => {
    for (const recipe of RECIPES) {
      expect(recipe.basePrice).toBeDefined()
      expect(typeof recipe.basePrice).toBe('number')
      expect(recipe.basePrice).toBeGreaterThan(0)
      // Old interface used 'value' — new one uses 'basePrice'
      expect((recipe as any).value).toBeUndefined()
    }
  })

  it('serializeState and deserializeState round-trip correctly', () => {
    const state = createDefaultState()
    state.coins = 500
    state.totalCoins = 1000
    state.starDust = 42

    const json = serializeState(state)
    const restored = deserializeState(json)

    expect(restored.coins).toBe(500)
    expect(restored.totalCoins).toBe(1000)
    expect(restored.starDust).toBe(42)
    expect(restored.productionLines.earth).toBeDefined()
  })

  it('calcPrestigeStardust works with totalCoins (not totalCoinsEarned)', () => {
    expect(calcPrestigeStardust(1_000_000)).toBe(1)
    expect(calcPrestigeStardust(100_000_000)).toBe(10)
  })

  it('calcPrestigeThreshold works at level 0', () => {
    expect(calcPrestigeThreshold(0)).toBe(1_000_000)
  })
})
