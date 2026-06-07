/**
 * Idle Garden Tycoon — Flower Data Tests
 * TDD: Tests flower definitions and helper functions
 */

import { describe, it, expect } from 'vitest'
import {
  FLOWERS,
  getFlowerById,
  getAvailableFlowers,
} from '../../../src/games/idle-garden/data/flowers'

describe('FLOWERS data', () => {
  it('has 6 flower types', () => {
    expect(FLOWERS).toHaveLength(6)
  })

  it('has unique IDs', () => {
    const ids = FLOWERS.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sunflower is the starter flower (unlockLevel 1, unlockPrestige 0)', () => {
    const sunflower = getFlowerById('sunflower')
    expect(sunflower).toBeDefined()
    expect(sunflower!.unlockLevel).toBe(1)
    expect(sunflower!.unlockPrestige).toBe(0)
    expect(sunflower!.growTime).toBe(10)
    expect(sunflower!.sellPrice).toBe(10)
    expect(sunflower!.seedCost).toBe(5)
  })

  it('rainbow flower requires prestige', () => {
    const rainbow = getFlowerById('rainbow')
    expect(rainbow).toBeDefined()
    expect(rainbow!.unlockPrestige).toBe(1)
    expect(rainbow!.sellPrice).toBe(2000)
  })

  it('each flower has positive growTime and sellPrice', () => {
    for (const flower of FLOWERS) {
      expect(flower.growTime).toBeGreaterThan(0)
      expect(flower.sellPrice).toBeGreaterThan(0)
      expect(flower.seedCost).toBeGreaterThanOrEqual(0)
    }
  })

  it('sell price is always >= seed cost (profitable)', () => {
    for (const flower of FLOWERS) {
      expect(flower.sellPrice).toBeGreaterThanOrEqual(flower.seedCost)
    }
  })
})

describe('getFlowerById', () => {
  it('returns the correct flower', () => {
    const tulip = getFlowerById('tulip')
    expect(tulip).toBeDefined()
    expect(tulip!.name).toBe('Tulip')
    expect(tulip!.growTime).toBe(30)
  })

  it('returns undefined for unknown ID', () => {
    expect(getFlowerById('nonexistent')).toBeUndefined()
    expect(getFlowerById('')).toBeUndefined()
  })
})

describe('getAvailableFlowers', () => {
  it('returns only sunflower at level 1, prestige 0', () => {
    const available = getAvailableFlowers(1, 0)
    expect(available).toHaveLength(1)
    expect(available[0].id).toBe('sunflower')
  })

  it('returns sunflower + tulip at level 2', () => {
    const available = getAvailableFlowers(2, 0)
    expect(available).toHaveLength(2)
    expect(available.map(f => f.id)).toContain('sunflower')
    expect(available.map(f => f.id)).toContain('tulip')
  })

  it('returns all non-prestige flowers at level 5', () => {
    const available = getAvailableFlowers(5, 0)
    expect(available).toHaveLength(5) // sunflower, tulip, rose, peony, orchid
    expect(available.map(f => f.id)).not.toContain('rainbow')
  })

  it('includes rainbow flower only with prestige >= 1', () => {
    const withoutPrestige = getAvailableFlowers(5, 0)
    expect(withoutPrestige.map(f => f.id)).not.toContain('rainbow')

    const withPrestige = getAvailableFlowers(5, 1)
    expect(withPrestige.map(f => f.id)).toContain('rainbow')
  })

  it('returns empty array at level 0', () => {
    const available = getAvailableFlowers(0, 0)
    expect(available).toHaveLength(0)
  })
})
