/**
 * Idle Garden Tycoon — Garden System Tests
 */
import { describe, it, expect } from 'vitest'
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
} from '../../src/games/idle-garden/systems/GardenSystem'
import { createDefaultState } from '../../src/games/idle-garden/systems/GameState'
import { CONSTANTS } from '../../src/games/idle-garden/data/constants'
import type { GameState } from '../../src/games/idle-garden/data/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createDefaultState(), ...overrides }
}

describe('createPot', () => {
  it('creates an empty pot with given id', () => {
    const pot = createPot(5)
    expect(pot.id).toBe(5)
    expect(pot.flowerId).toBeNull()
    expect(pot.plantedAt).toBe(0)
    expect(pot.isWatered).toBe(false)
    expect(pot.isReady).toBe(false)
  })
})

describe('createDefaultPots', () => {
  it('creates STARTING_POTS pots', () => {
    const pots = createDefaultPots()
    expect(pots.length).toBe(CONSTANTS.STARTING_POTS)
  })

  it('assigns sequential ids starting from 0', () => {
    const pots = createDefaultPots()
    pots.forEach((pot, i) => expect(pot.id).toBe(i))
  })

  it('all pots are empty', () => {
    const pots = createDefaultPots()
    pots.forEach(pot => {
      expect(pot.flowerId).toBeNull()
      expect(pot.isReady).toBe(false)
    })
  })
})

describe('plantFlower', () => {
  it('plants a sunflower in an empty pot', () => {
    const state = makeState({ coins: 100, level: 1 })
    const result = plantFlower(state, 0, 'sunflower', Date.now())
    expect(result).toBe(true)
    expect(state.pots[0].flowerId).toBe('sunflower')
  })

  it('deducts seed cost', () => {
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', Date.now())
    // sunflower seedCost = 5
    expect(state.coins).toBe(95)
  })

  it('fails when pot is occupied', () => {
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', Date.now())
    const result = plantFlower(state, 0, 'sunflower', Date.now())
    expect(result).toBe(false)
  })

  it('fails when insufficient coins', () => {
    const state = makeState({ coins: 2, level: 1 })
    const result = plantFlower(state, 0, 'sunflower', Date.now())
    expect(result).toBe(false)
    expect(state.coins).toBe(2)
  })

  it('fails when flower not unlocked', () => {
    const state = makeState({ coins: 1000, level: 1 })
    // peony requires level 4
    const result = plantFlower(state, 0, 'peony', Date.now())
    expect(result).toBe(false)
  })

  it('fails for invalid pot id', () => {
    const state = makeState({ coins: 100, level: 1 })
    const result = plantFlower(state, 999, 'sunflower', Date.now())
    expect(result).toBe(false)
  })

  it('fails for invalid flower id', () => {
    const state = makeState({ coins: 100, level: 1 })
    const result = plantFlower(state, 0, 'nonexistent', Date.now())
    expect(result).toBe(false)
  })

  it('increments totalFlowersGrown stat', () => {
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', Date.now())
    expect(state.stats.totalFlowersGrown).toBe(1)
  })
})

describe('harvestPot', () => {
  it('returns 0 for empty pot', () => {
    const state = makeState()
    const earnings = harvestPot(state, 0, Date.now())
    expect(earnings).toBe(0)
  })

  it('returns 0 for unready pot', () => {
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', Date.now())
    const earnings = harvestPot(state, 0, Date.now())
    expect(earnings).toBe(0)
  })

  it('harvests a ready pot and earns coins', () => {
    const now = Date.now()
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', now)
    // Mark pot as ready
    state.pots[0].isReady = true
    const earnings = harvestPot(state, 0, now + 20000)
    // sunflower sellPrice = 10
    expect(earnings).toBe(10)
    expect(state.coins).toBe(105) // 100 - 5 (seed) + 10 (harvest)
  })

  it('clears pot after harvest', () => {
    const now = Date.now()
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', now)
    state.pots[0].isReady = true
    harvestPot(state, 0, now + 20000)
    expect(state.pots[0].flowerId).toBeNull()
    expect(state.pots[0].isReady).toBe(false)
  })

  it('increments totalHarvests stat', () => {
    const now = Date.now()
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', now)
    state.pots[0].isReady = true
    harvestPot(state, 0, now + 20000)
    expect(state.stats.totalHarvests).toBe(1)
  })

  it('applies combo multiplier for rapid harvests', () => {
    const now = Date.now()
    const state = makeState({ coins: 1000, level: 1 })
    // Plant and ready 2 sunflowers
    plantFlower(state, 0, 'sunflower', now)
    plantFlower(state, 1, 'sunflower', now)
    state.pots[0].isReady = true
    state.pots[1].isReady = true

    const first = harvestPot(state, 0, now + 1000)
    // Combo window is 3000ms, harvest within window
    const second = harvestPot(state, 1, now + 2000)
    // Combo count = 2, mult = 1 + (2-1)*0.25 = 1.25
    expect(second).toBe(Math.floor(10 * 1.25))
  })
})

describe('waterPot', () => {
  it('waters an unwatered pot with a flower', () => {
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', Date.now())
    expect(waterPot(state, 0)).toBe(true)
    expect(state.pots[0].isWatered).toBe(true)
  })

  it('returns false for empty pot', () => {
    const state = makeState()
    expect(waterPot(state, 0)).toBe(false)
  })

  it('returns false for already watered pot', () => {
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', Date.now())
    waterPot(state, 0)
    expect(waterPot(state, 0)).toBe(false)
  })

  it('returns false for invalid pot', () => {
    const state = makeState()
    expect(waterPot(state, 999)).toBe(false)
  })
})

describe('getGrowthProgress', () => {
  it('returns 0 for empty pot', () => {
    const pot = createPot(0)
    expect(getGrowthProgress(pot, Date.now(), 1)).toBe(0)
  })

  it('returns progress between 0 and 1 during growth', () => {
    const now = Date.now()
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', now)
    const pot = state.pots[0]
    const progress = getGrowthProgress(pot, now + 5000, 1) // 5s into 10s growTime
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThan(1)
  })
})

describe('isPotReady', () => {
  it('returns false for empty pot', () => {
    const pot = createPot(0)
    expect(isPotReady(pot, Date.now(), 1)).toBe(false)
  })

  it('returns true when growTime has fully elapsed', () => {
    const now = Date.now()
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', now)
    // sunflower growTime = 10s
    expect(isPotReady(state.pots[0], now + 11000, 1)).toBe(true)
  })
})

describe('getPotCount', () => {
  it('returns number of pots', () => {
    const state = makeState()
    expect(getPotCount(state)).toBe(CONSTANTS.STARTING_POTS)
  })
})

describe('addPots', () => {
  it('adds pots to the garden', () => {
    const state = makeState()
    addPots(state, 3)
    expect(state.pots.length).toBe(CONSTANTS.STARTING_POTS + 3)
  })

  it('assigns sequential ids to new pots', () => {
    const state = makeState()
    addPots(state, 2)
    const lastTwo = state.pots.slice(-2)
    expect(lastTwo[0].id).toBe(CONSTANTS.STARTING_POTS)
    expect(lastTwo[1].id).toBe(CONSTANTS.STARTING_POTS + 1)
  })
})

describe('getAutoHarvestYield', () => {
  it('returns 0 without auto-harvest upgrade', () => {
    const state = makeState()
    expect(getAutoHarvestYield(state)).toBe(0)
  })

  it('returns 0 when no pots are ready', () => {
    const state = makeState({
      upgrades: { 'auto-harvest': 1 },
      pots: [{ id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: false }],
    })
    expect(getAutoHarvestYield(state)).toBe(0)
  })

  it('calculates yield from ready pots', () => {
    const state = makeState({
      upgrades: { 'auto-harvest': 1 },
      pots: [
        { id: 0, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
        { id: 1, flowerId: 'sunflower', plantedAt: 0, isWatered: false, isReady: true },
      ],
    })
    // 2 sunflowers * 10 sellPrice = 20
    expect(getAutoHarvestYield(state)).toBe(20)
  })
})

describe('autoWaterPots', () => {
  it('returns 0 without auto-water upgrade', () => {
    const state = makeState({ coins: 100, level: 1 })
    plantFlower(state, 0, 'sunflower', Date.now())
    expect(autoWaterPots(state)).toBe(0)
  })

  it('waters all unwatered pots with flowers', () => {
    const state = makeState({
      coins: 100,
      level: 1,
      upgrades: { 'auto-water': 1 },
    })
    plantFlower(state, 0, 'sunflower', Date.now())
    plantFlower(state, 1, 'sunflower', Date.now())
    const count = autoWaterPots(state)
    expect(count).toBe(2)
    expect(state.pots[0].isWatered).toBe(true)
    expect(state.pots[1].isWatered).toBe(true)
  })

  it('skips already watered pots', () => {
    const state = makeState({
      coins: 100,
      level: 1,
      upgrades: { 'auto-water': 1 },
    })
    plantFlower(state, 0, 'sunflower', Date.now())
    waterPot(state, 0)
    plantFlower(state, 1, 'sunflower', Date.now())
    const count = autoWaterPots(state)
    expect(count).toBe(1) // Only pot 1 was watered
  })
})
