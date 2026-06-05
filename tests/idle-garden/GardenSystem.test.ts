/**
 * Idle Garden Tycoon — GardenSystem Tests
 * Tests for pot management, planting, growing, harvesting, and watering.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPot,
  createDefaultPots,
  plantFlower,
  harvestPot,
  waterPot,
  getGrowthProgress,
  isPotReady,
  addPots,
  getAutoHarvestYield,
  autoWaterPots,
} from '../../src/games/idle-garden/systems/GardenSystem'
import type { GameState, PotState } from '../../src/games/idle-garden/data/types'
import { CONSTANTS } from '../../src/games/idle-garden/data/constants'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    level: 1,
    coins: 1000,
    totalCoins: 1000,
    experience: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    sunPoints: 0,
    pots: createDefaultPots(),
    gardenLevel: 1,
    unlockedFlowers: ['sunflower'],
    decorations: [],
    upgrades: {},
    comboCount: 0,
    lastHarvestTime: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    stats: {
      totalCoinsEarned: 0,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
    },
    ...overrides,
  }
}

describe('createPot', () => {
  it('creates an empty pot with the given id', () => {
    const pot = createPot(5)
    expect(pot.id).toBe(5)
    expect(pot.flowerId).toBeNull()
    expect(pot.plantedAt).toBe(0)
    expect(pot.isWatered).toBe(false)
    expect(pot.isReady).toBe(false)
  })
})

describe('createDefaultPots', () => {
  it('creates STARTING_POTS empty pots', () => {
    const pots = createDefaultPots()
    expect(pots.length).toBe(CONSTANTS.STARTING_POTS)
    pots.forEach((pot, i) => {
      expect(pot.id).toBe(i)
      expect(pot.flowerId).toBeNull()
    })
  })
})

describe('plantFlower', () => {
  it('plants a flower in an empty pot and deducts seed cost', () => {
    const state = makeState({ coins: 100 })
    const now = Date.now()
    const result = plantFlower(state, 0, 'sunflower', now)
    expect(result).toBe(true)
    expect(state.pots[0].flowerId).toBe('sunflower')
    expect(state.pots[0].plantedAt).toBe(now)
    expect(state.pots[0].isWatered).toBe(false)
    expect(state.pots[0].isReady).toBe(false)
    expect(state.coins).toBeLessThan(100)
    expect(state.stats.totalFlowersGrown).toBe(1)
  })

  it('returns false if pot does not exist', () => {
    const state = makeState()
    const result = plantFlower(state, 999, 'sunflower', Date.now())
    expect(result).toBe(false)
  })

  it('returns false if pot is already occupied', () => {
    const state = makeState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    const result = plantFlower(state, 0, 'sunflower', now)
    expect(result).toBe(false)
  })

  it('returns false if insufficient coins', () => {
    const state = makeState({ coins: 0 })
    const result = plantFlower(state, 0, 'sunflower', Date.now())
    expect(result).toBe(false)
    expect(state.pots[0].flowerId).toBeNull()
  })

  it('returns false if flower is not unlocked', () => {
    const state = makeState({ unlockedFlowers: ['sunflower'] })
    const result = plantFlower(state, 0, 'tulip', Date.now())
    expect(result).toBe(false)
  })
})

describe('harvestPot', () => {
  it('returns 0 for an empty pot', () => {
    const state = makeState()
    const earnings = harvestPot(state, 0, Date.now())
    expect(earnings).toBe(0)
  })

  it('returns 0 if pot is not ready', () => {
    const state = makeState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    const earnings = harvestPot(state, 0, now + 1000) // 1 second later, not ready
    expect(earnings).toBe(0)
    expect(state.pots[0].flowerId).toBe('sunflower') // still planted
  })

  it('harvests a ready pot and adds coins', () => {
    const state = makeState({ coins: 100 })
    const plantedAt = Date.now()
    plantFlower(state, 0, 'sunflower', plantedAt)
    // Simulate the game loop setting isReady when growth >= 1
    state.pots[0].isReady = true
    const earnings = harvestPot(state, 0, plantedAt + 11000)
    expect(earnings).toBeGreaterThan(0)
    expect(state.coins).toBeGreaterThan(100)
    expect(state.pots[0].flowerId).toBeNull() // pot cleared
    expect(state.stats.totalHarvests).toBe(1)
  })

  it('returns 0 for non-existent pot', () => {
    const state = makeState()
    const earnings = harvestPot(state, 999, Date.now())
    expect(earnings).toBe(0)
  })
})

describe('waterPot', () => {
  it('waters a planted pot', () => {
    const state = makeState()
    plantFlower(state, 0, 'sunflower', Date.now())
    const result = waterPot(state, 0)
    expect(result).toBe(true)
    expect(state.pots[0].isWatered).toBe(true)
  })

  it('returns false for an empty pot', () => {
    const state = makeState()
    const result = waterPot(state, 0)
    expect(result).toBe(false)
  })

  it('returns false if already watered', () => {
    const state = makeState()
    plantFlower(state, 0, 'sunflower', Date.now())
    waterPot(state, 0)
    const result = waterPot(state, 0)
    expect(result).toBe(false)
  })

  it('returns false for non-existent pot', () => {
    const state = makeState()
    const result = waterPot(state, 999)
    expect(result).toBe(false)
  })
})

describe('getGrowthProgress', () => {
  it('returns 0 for empty pot', () => {
    const pot = createPot(0)
    const progress = getGrowthProgress(pot, Date.now(), 1)
    expect(progress).toBe(0)
  })

  it('returns value between 0 and 1 for growing flower', () => {
    const state = makeState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    const progress = getGrowthProgress(state.pots[0], now + 5000, 1)
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThan(1)
  })

  it('returns 1 when fully grown', () => {
    const state = makeState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    const progress = getGrowthProgress(state.pots[0], now + 11000, 1)
    expect(progress).toBeGreaterThanOrEqual(1)
  })

  it('grows faster when watered', () => {
    const state = makeState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    waterPot(state, 0)
    const progressWatered = getGrowthProgress(state.pots[0], now + 5000, 1)
    
    const state2 = makeState()
    plantFlower(state2, 0, 'sunflower', now)
    const progressDry = getGrowthProgress(state2.pots[0], now + 5000, 1)
    
    expect(progressWatered).toBeGreaterThan(progressDry)
  })

  it('grows faster with growth multiplier', () => {
    const state = makeState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    const progressMult = getGrowthProgress(state.pots[0], now + 5000, 2)
    
    const state2 = makeState()
    plantFlower(state2, 0, 'sunflower', now)
    const progressBase = getGrowthProgress(state2.pots[0], now + 5000, 1)
    
    expect(progressMult).toBeGreaterThan(progressBase)
  })
})

describe('isPotReady', () => {
  it('returns false for empty pot', () => {
    const pot = createPot(0)
    expect(isPotReady(pot, Date.now(), 1)).toBe(false)
  })

  it('returns true when flower is fully grown', () => {
    const state = makeState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    expect(isPotReady(state.pots[0], now + 11000, 1)).toBe(true)
  })
})

describe('addPots', () => {
  it('adds new pots to the garden', () => {
    const state = makeState()
    const initialCount = state.pots.length
    addPots(state, 3)
    expect(state.pots.length).toBe(initialCount + 3)
    // New pots should have sequential IDs
    expect(state.pots[initialCount].id).toBe(initialCount)
    expect(state.pots[initialCount + 1].id).toBe(initialCount + 1)
    expect(state.pots[initialCount + 2].id).toBe(initialCount + 2)
  })
})

describe('getAutoHarvestYield', () => {
  it('returns 0 if no auto-harvest upgrade', () => {
    const state = makeState()
    const yield_ = getAutoHarvestYield(state)
    expect(yield_).toBe(0)
  })

  it('returns yield from ready pots when auto-harvest is upgraded', () => {
    const state = makeState({ upgrades: { 'auto-harvest': 1 } })
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)
    plantFlower(state, 1, 'sunflower', now)
    // Simulate growth complete
    state.pots[0].isReady = true
    state.pots[1].isReady = true
    const yield_ = getAutoHarvestYield(state)
    expect(yield_).toBeGreaterThan(0)
  })
})

describe('autoWaterPots', () => {
  it('returns 0 if no auto-water upgrade', () => {
    const state = makeState()
    const count = autoWaterPots(state)
    expect(count).toBe(0)
  })

  it('waters all unwatered pots when upgraded', () => {
    const state = makeState({ upgrades: { 'auto-water': 1 } })
    plantFlower(state, 0, 'sunflower', Date.now())
    plantFlower(state, 1, 'sunflower', Date.now())
    const count = autoWaterPots(state)
    expect(count).toBe(2)
    expect(state.pots[0].isWatered).toBe(true)
    expect(state.pots[1].isWatered).toBe(true)
  })

  it('skips already watered pots', () => {
    const state = makeState({ upgrades: { 'auto-water': 1 } })
    plantFlower(state, 0, 'sunflower', Date.now())
    waterPot(state, 0)
    plantFlower(state, 1, 'sunflower', Date.now())
    const count = autoWaterPots(state)
    expect(count).toBe(1) // only pot 1 was watered
  })
})
