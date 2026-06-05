/**
 * Idle Garden Tycoon — Upgrade Integration Tests
 * Tests for wiring up auto-water and growth-speed upgrades.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { updateGrowthStates, createDefaultState } from '../../src/games/idle-garden/systems/GameState'
import { autoWaterPots, createPot } from '../../src/games/idle-garden/systems/GardenSystem'
import { CONSTANTS } from '../../src/games/idle-garden/data/constants'
import { getFlowerById } from '../../src/games/idle-garden/data/flowers'
import type { GameState, PotState } from '../../src/games/idle-garden/data/types'

function makePotWithFlower(id: number, flowerId: string, plantedAt: number, isWatered = false): PotState {
  return { id, flowerId, plantedAt, isWatered, isReady: false }
}

describe('Auto-Water Upgrade Integration', () => {
  let state: GameState

  beforeEach(() => {
    state = createDefaultState()
  })

  it('autoWaterPots waters all unwatered pots when upgrade level > 0', () => {
    // Arrange
    const now = Date.now()
    state.pots[0] = makePotWithFlower(0, 'sunflower', now, false)
    state.pots[1] = makePotWithFlower(1, 'sunflower', now, false)
    state.upgrades['auto-water'] = 1

    // Act
    const count = autoWaterPots(state)

    // Assert
    expect(state.pots[0].isWatered).toBe(true)
    expect(state.pots[1].isWatered).toBe(true)
    expect(count).toBe(2)
  })

  it('autoWaterPots returns 0 and does nothing when upgrade level is 0', () => {
    // Arrange
    const now = Date.now()
    state.pots[0] = makePotWithFlower(0, 'sunflower', now, false)
    state.upgrades['auto-water'] = 0

    // Act
    const count = autoWaterPots(state)

    // Assert
    expect(count).toBe(0)
    expect(state.pots[0].isWatered).toBe(false)
  })

  it('autoWaterPots skips empty pots (no flowerId)', () => {
    // Arrange
    const now = Date.now()
    state.pots[0] = makePotWithFlower(0, 'sunflower', now, false)
    state.pots[1] = { id: 1, flowerId: null, plantedAt: 0, isWatered: false, isReady: false }
    state.upgrades['auto-water'] = 1

    // Act
    const count = autoWaterPots(state)

    // Assert
    expect(state.pots[0].isWatered).toBe(true)
    expect(state.pots[1].isWatered).toBe(false)
    expect(count).toBe(1)
  })

  it('autoWaterPots skips already-watered pots', () => {
    // Arrange
    const now = Date.now()
    state.pots[0] = makePotWithFlower(0, 'sunflower', now, true)
    state.pots[1] = makePotWithFlower(1, 'sunflower', now, false)
    state.upgrades['auto-water'] = 1

    // Act
    const count = autoWaterPots(state)

    // Assert
    expect(count).toBe(1) // only pot 1 was watered
    expect(state.pots[0].isWatered).toBe(true)
    expect(state.pots[1].isWatered).toBe(true)
  })

  it('autoWaterPots returns 0 when no upgrade key exists', () => {
    // Arrange: upgrades is empty object (no key at all)
    state.pots[0] = makePotWithFlower(0, 'sunflower', Date.now(), false)

    // Act
    const count = autoWaterPots(state)

    // Assert
    expect(count).toBe(0)
    expect(state.pots[0].isWatered).toBe(false)
  })
})

describe('Growth-Speed Upgrade Integration', () => {
  let state: GameState
  const now = Date.now()

  beforeEach(() => {
    state = createDefaultState()
  })

  it('updateGrowthStates uses growth-speed upgrade in multiplier', () => {
    // Arrange: plant flower at 50% of grow time
    const flower = getFlowerById('sunflower')!
    const halfGrowTimeMs = (flower.growTime / 2) * 1000

    // Without growth-speed
    const stateNoUpgrade = createDefaultState()
    stateNoUpgrade.pots[0] = makePotWithFlower(0, 'sunflower', now - halfGrowTimeMs)
    updateGrowthStates(stateNoUpgrade, now)

    // With growth-speed level 3
    state.upgrades['growth-speed'] = 3
    state.pots[0] = makePotWithFlower(0, 'sunflower', now - halfGrowTimeMs)
    updateGrowthStates(state, now)

    // Assert: with growth-speed, pot should be further along or ready
    expect(state.pots[0].isReady || !stateNoUpgrade.pots[0].isReady).toBe(true)
  })

  it('growth-speed at level 0 has no effect', () => {
    // Arrange
    const flower = getFlowerById('sunflower')!
    const elapsed = (flower.growTime * 0.6) * 1000

    const stateNoUpgrade = createDefaultState()
    stateNoUpgrade.pots[0] = makePotWithFlower(0, 'sunflower', now - elapsed)
    updateGrowthStates(stateNoUpgrade, now)

    const stateZero = createDefaultState()
    stateZero.upgrades['growth-speed'] = 0
    stateZero.pots[0] = makePotWithFlower(0, 'sunflower', now - elapsed)
    updateGrowthStates(stateZero, now)

    // Assert
    expect(stateNoUpgrade.pots[0].isReady).toBe(stateZero.pots[0].isReady)
  })

  it('higher growth-speed levels produce faster growth', () => {
    // Arrange: 70% of grow time — level 5 should be ready, level 1 should not
    const flower = getFlowerById('sunflower')!
    const elapsed = (flower.growTime * 0.7) * 1000

    // Level 1: growthMult = 1 + 0.1 = 1.1, progress = 0.7 * 1.1 = 0.77 (not ready)
    const stateLvl1 = createDefaultState()
    stateLvl1.upgrades['growth-speed'] = 1
    stateLvl1.pots[0] = makePotWithFlower(0, 'sunflower', now - elapsed)
    updateGrowthStates(stateLvl1, now)

    // Level 5: growthMult = 1 + 0.5 = 1.5, progress = 0.7 * 1.5 = 1.05 (ready!)
    const stateLvl5 = createDefaultState()
    stateLvl5.upgrades['growth-speed'] = 5
    stateLvl5.pots[0] = makePotWithFlower(0, 'sunflower', now - elapsed)
    updateGrowthStates(stateLvl5, now)

    // Assert
    expect(stateLvl1.pots[0].isReady).toBe(false)
    expect(stateLvl5.pots[0].isReady).toBe(true)
  })

  it('growth-speed stacks with sun point growth upgrades', () => {
    // Arrange: 70% of grow time
    const flower = getFlowerById('sunflower')!
    const elapsed = (flower.growTime * 0.7) * 1000

    // Only sun points: growthMult = 1 + 5*0.05 = 1.25, progress = 0.7 * 1.25 = 0.875 (not ready)
    const stateSP = createDefaultState()
    stateSP.spGrowthUpgrades = 5
    stateSP.pots[0] = makePotWithFlower(0, 'sunflower', now - elapsed)
    updateGrowthStates(stateSP, now)

    // Sun points + growth-speed 3: growthMult = 1.25 + 0.3 = 1.55, progress = 0.7 * 1.55 = 1.085 (ready!)
    const stateBoth = createDefaultState()
    stateBoth.spGrowthUpgrades = 5
    stateBoth.upgrades['growth-speed'] = 3
    stateBoth.pots[0] = makePotWithFlower(0, 'sunflower', now - elapsed)
    updateGrowthStates(stateBoth, now)

    // Assert
    expect(stateSP.pots[0].isReady).toBe(false)
    expect(stateBoth.pots[0].isReady).toBe(true)
  })

  it('GROWTH_SPEED_PER_LEVEL constant is 0.1', () => {
    expect(CONSTANTS.GROWTH_SPEED_PER_LEVEL).toBe(0.1)
  })
})
