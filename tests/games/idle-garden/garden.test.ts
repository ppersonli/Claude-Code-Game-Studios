/**
 * Idle Garden Tycoon — Garden System Tests
 * TDD: Tests planting, harvesting, watering, growth progress
 */

import { describe, it, expect } from 'vitest'
import type { GameState } from '../../../src/games/idle-garden/data/types'
import {
  createPot,
  createDefaultPots,
  plantFlower,
  harvestPot,
  waterPot,
  getGrowthProgress,
  isPotReady,
  getPotCount,
  addPots,
  getAutoHarvestYield,
  autoWaterPots,
} from '../../../src/games/idle-garden/systems/GardenSystem'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 1000,
    totalCoins: 1000,
    sunPoints: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    spGrowthUpgrades: 0,
    spPriceUpgrades: 0,
    pots: createDefaultPots(),
    gardenLevel: 1,
    level: 1,
    experience: 0,
    unlockedFlowers: ['sunflower'],
    upgrades: {},
    decorations: [],
    achievements: [],
    dailyChallenge: null,
    stats: {
      totalCoinsEarned: 1000,
      totalFlowersGrown: 0,
      totalHarvests: 0,
      totalPlayTime: 0,
      maxComboCount: 0,
    },
    lastOnline: 0,
    sessionStart: 0,
    lastHarvestTime: 0,
    comboCount: 0,
    ...overrides,
  }
}

describe('createPot', () => {
  it('creates an empty pot with given ID', () => {
    const pot = createPot(5)
    expect(pot.id).toBe(5)
    expect(pot.flowerId).toBeNull()
    expect(pot.plantedAt).toBe(0)
    expect(pot.isWatered).toBe(false)
    expect(pot.isReady).toBe(false)
  })
})

describe('createDefaultPots', () => {
  it('creates STARTING_POTS (4) pots', () => {
    const pots = createDefaultPots()
    expect(pots).toHaveLength(4)
  })

  it('assigns sequential IDs starting from 0', () => {
    const pots = createDefaultPots()
    expect(pots.map(p => p.id)).toEqual([0, 1, 2, 3])
  })
})

describe('plantFlower', () => {
  it('plants a flower in an empty pot', () => {
    const state = createTestState()
    const now = Date.now()
    const result = plantFlower(state, 0, 'sunflower', now)
    expect(result).toBe(true)
    expect(state.pots[0].flowerId).toBe('sunflower')
    expect(state.pots[0].plantedAt).toBe(now)
  })

  it('deducts seed cost', () => {
    const state = createTestState({ coins: 100 })
    plantFlower(state, 0, 'sunflower', Date.now())
    // sunflower seedCost = 5
    expect(state.coins).toBe(95)
  })

  it('increments totalFlowersGrown stat', () => {
    const state = createTestState()
    plantFlower(state, 0, 'sunflower', Date.now())
    expect(state.stats.totalFlowersGrown).toBe(1)
  })

  it('fails if pot is already occupied', () => {
    const state = createTestState()
    plantFlower(state, 0, 'sunflower', Date.now())
    const result = plantFlower(state, 0, 'sunflower', Date.now())
    expect(result).toBe(false)
  })

  it('fails if insufficient coins', () => {
    const state = createTestState({ coins: 3 }) // sunflower costs 5
    const result = plantFlower(state, 0, 'sunflower', Date.now())
    expect(result).toBe(false)
    expect(state.pots[0].flowerId).toBeNull()
  })

  it('fails if flower is not unlocked', () => {
    const state = createTestState({ unlockedFlowers: ['sunflower'] })
    const result = plantFlower(state, 0, 'rainbow', Date.now())
    expect(result).toBe(false)
  })

  it('fails for invalid pot ID', () => {
    const state = createTestState()
    const result = plantFlower(state, 999, 'sunflower', Date.now())
    expect(result).toBe(false)
  })

  it('can plant different flowers in different pots', () => {
    const state = createTestState({
      level: 2,
      unlockedFlowers: ['sunflower', 'tulip'],
    })
    plantFlower(state, 0, 'sunflower', Date.now())
    plantFlower(state, 1, 'tulip', Date.now())
    expect(state.pots[0].flowerId).toBe('sunflower')
    expect(state.pots[1].flowerId).toBe('tulip')
  })
})

describe('harvestPot', () => {
  it('harvests a ready pot and returns earnings', () => {
    const state = createTestState()
    const now = Date.now()
    plantFlower(state, 0, 'sunflower', now)

    // Simulate growth complete
    state.pots[0].isReady = true

    const earnings = harvestPot(state, 0, now + 1000)
    // sunflower sellPrice = 10, combo = 1 (first harvest) → mult = 1
    expect(earnings).toBe(10)
  })

  it('clears the pot after harvest', () => {
    const state = createTestState()
    plantFlower(state, 0, 'sunflower', Date.now())
    state.pots[0].isReady = true

    harvestPot(state, 0, Date.now())
    expect(state.pots[0].flowerId).toBeNull()
    expect(state.pots[0].isReady).toBe(false)
  })

  it('increments totalHarvests stat', () => {
    const state = createTestState()
    plantFlower(state, 0, 'sunflower', Date.now())
    state.pots[0].isReady = true

    harvestPot(state, 0, Date.now())
    expect(state.stats.totalHarvests).toBe(1)
  })

  it('returns 0 for empty pot', () => {
    const state = createTestState()
    const earnings = harvestPot(state, 0, Date.now())
    expect(earnings).toBe(0)
  })

  it('returns 0 for not-ready pot', () => {
    const state = createTestState()
    plantFlower(state, 0, 'sunflower', Date.now())
    // isReady is false
    const earnings = harvestPot(state, 0, Date.now())
    expect(earnings).toBe(0)
  })

  it('applies combo multiplier for quick successive harvests', () => {
    const state = createTestState()
    const now = Date.now()

    // First harvest
    plantFlower(state, 0, 'sunflower', now)
    state.pots[0].isReady = true
    harvestPot(state, 0, now)

    // Second harvest within COMBO_WINDOW (3000ms)
    plantFlower(state, 1, 'sunflower', now)
    state.pots[1].isReady = true
    const earnings2 = harvestPot(state, 1, now + 1000)

    // comboCount = 2, comboMult = 1 + (2-1)*0.25 = 1.25
    expect(earnings2).toBe(Math.floor(10 * 1.25))
  })

  it('resets combo after COMBO_WINDOW', () => {
    const state = createTestState()
    const now = Date.now()

    // First harvest
    plantFlower(state, 0, 'sunflower', now)
    state.pots[0].isReady = true
    harvestPot(state, 0, now)

    // Second harvest outside COMBO_WINDOW
    plantFlower(state, 1, 'sunflower', now)
    state.pots[1].isReady = true
    const earnings2 = harvestPot(state, 1, now + 5000) // > 3000ms

    // comboCount reset to 1, comboMult = 1
    expect(earnings2).toBe(10)
  })
})

describe('waterPot', () => {
  it('waters a planted pot', () => {
    const state = createTestState()
    plantFlower(state, 0, 'sunflower', Date.now())
    const result = waterPot(state, 0)
    expect(result).toBe(true)
    expect(state.pots[0].isWatered).toBe(true)
  })

  it('fails for empty pot', () => {
    const state = createTestState()
    const result = waterPot(state, 0)
    expect(result).toBe(false)
  })

  it('fails if already watered', () => {
    const state = createTestState()
    plantFlower(state, 0, 'sunflower', Date.now())
    waterPot(state, 0)
    const result = waterPot(state, 0)
    expect(result).toBe(false)
  })

  it('fails for invalid pot ID', () => {
    const state = createTestState()
    const result = waterPot(state, 999)
    expect(result).toBe(false)
  })
})

describe('getGrowthProgress', () => {
  it('returns 0 for empty pot', () => {
    const pot = createPot(0)
    expect(getGrowthProgress(pot, Date.now(), 1)).toBe(0)
  })

  it('returns fractional progress', () => {
    const now = Date.now()
    const pot = { id: 0, flowerId: 'sunflower', plantedAt: now, isWatered: false, isReady: false }
    // sunflower growTime = 10s, at 5s → 0.5
    const progress = getGrowthProgress(pot, now + 5000, 1)
    expect(progress).toBeCloseTo(0.5, 1)
  })

  it('returns 1 when growth complete', () => {
    const now = Date.now()
    const pot = { id: 0, flowerId: 'sunflower', plantedAt: now, isWatered: false, isReady: false }
    const progress = getGrowthProgress(pot, now + 10000, 1)
    expect(progress).toBe(1)
  })

  it('accounts for watering boost', () => {
    const now = Date.now()
    const pot = { id: 0, flowerId: 'sunflower', plantedAt: now, isWatered: true, isReady: false }
    // With water: effectiveTime = 10 / 1.2 = 8.33s
    const progress = getGrowthProgress(pot, now + 8333, 1)
    expect(progress).toBeCloseTo(1.0, 1)
  })
})

describe('isPotReady', () => {
  it('returns false for empty pot', () => {
    const pot = createPot(0)
    expect(isPotReady(pot, Date.now(), 1)).toBe(false)
  })

  it('returns true when growth complete', () => {
    const now = Date.now()
    const pot = { id: 0, flowerId: 'sunflower', plantedAt: now, isWatered: false, isReady: false }
    expect(isPotReady(pot, now + 10000, 1)).toBe(true)
  })
})

describe('getPotCount', () => {
  it('returns the number of pots', () => {
    const state = createTestState()
    expect(getPotCount(state)).toBe(4)
  })
})

describe('addPots', () => {
  it('adds new pots to the garden', () => {
    const state = createTestState()
    addPots(state, 3)
    expect(state.pots).toHaveLength(7)
  })

  it('assigns sequential IDs', () => {
    const state = createTestState()
    addPots(state, 2)
    expect(state.pots[4].id).toBe(4)
    expect(state.pots[5].id).toBe(5)
  })
})

describe('getAutoHarvestYield', () => {
  it('returns 0 without auto-harvest upgrade', () => {
    const state = createTestState({
      upgrades: {},
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true }],
    })
    expect(getAutoHarvestYield(state)).toBe(0)
  })

  it('returns total value of ready pots', () => {
    const state = createTestState({
      upgrades: { 'auto-harvest': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ],
    })
    // 2 sunflowers × 10 sellPrice = 20
    expect(getAutoHarvestYield(state)).toBe(20)
  })

  it('does not count non-ready pots', () => {
    const state = createTestState({
      upgrades: { 'auto-harvest': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false },
      ],
    })
    expect(getAutoHarvestYield(state)).toBe(10)
  })
})

describe('autoWaterPots', () => {
  it('returns 0 without auto-water upgrade', () => {
    const state = createTestState({
      upgrades: {},
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false }],
    })
    expect(autoWaterPots(state)).toBe(0)
  })

  it('waters all unplanted pots', () => {
    const state = createTestState({
      upgrades: { 'auto-water': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false },
        { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false },
        { id: 2, flowerId: null, plantedAt: 0, isWatered: false, isReady: false },
      ],
    })
    const count = autoWaterPots(state)
    expect(count).toBe(2) // only pots with flowers
    expect(state.pots[0].isWatered).toBe(true)
    expect(state.pots[1].isWatered).toBe(true)
    expect(state.pots[2].isWatered).toBe(false) // no flower
  })

  it('skips already watered pots', () => {
    const state = createTestState({
      upgrades: { 'auto-water': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: true, isReady: false },
      ],
    })
    const count = autoWaterPots(state)
    expect(count).toBe(0)
  })
})
