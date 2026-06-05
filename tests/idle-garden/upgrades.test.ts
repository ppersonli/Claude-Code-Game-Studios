/**
 * Idle Garden Tycoon — Upgrade System Tests
 * Tests for upgrade data, cost calculations, and purchase checks.
 */

import { describe, it, expect } from 'vitest'
import {
  UPGRADES,
  getUpgradeById,
  getUpgradeCost,
  canUpgrade,
} from '../../src/games/idle-garden/data/upgrades'

describe('UpgradeSystem', () => {
  describe('UPGRADES data', () => {
    it('has all required upgrades', () => {
      expect(UPGRADES.length).toBe(5)
      const ids = UPGRADES.map(u => u.id)
      expect(ids).toContain('garden')
      expect(ids).toContain('auto-harvest')
      expect(ids).toContain('auto-water')
      expect(ids).toContain('growth-speed')
      expect(ids).toContain('offline-earn')
    })

    it('each upgrade has positive baseCost', () => {
      for (const upgrade of UPGRADES) {
        expect(upgrade.baseCost).toBeGreaterThan(0)
      }
    })

    it('each upgrade has costMult > 1', () => {
      for (const upgrade of UPGRADES) {
        expect(upgrade.costMult).toBeGreaterThan(1)
      }
    })

    it('each upgrade has maxLevel >= 1', () => {
      for (const upgrade of UPGRADES) {
        expect(upgrade.maxLevel).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('getUpgradeById', () => {
    it('returns upgrade for valid id', () => {
      const upgrade = getUpgradeById('garden')
      expect(upgrade).toBeDefined()
      expect(upgrade!.name).toBe('Expand Garden')
    })

    it('returns undefined for invalid id', () => {
      expect(getUpgradeById('nonexistent')).toBeUndefined()
    })

    it('returns auto-harvest upgrade', () => {
      const upgrade = getUpgradeById('auto-harvest')
      expect(upgrade).toBeDefined()
      expect(upgrade!.baseCost).toBe(10_000)
      expect(upgrade!.maxLevel).toBe(3)
    })
  })

  describe('getUpgradeCost', () => {
    it('returns base cost at level 0', () => {
      const cost = getUpgradeCost('garden', 0)
      expect(cost).toBe(500) // baseCost of garden
    })

    it('scales exponentially with level', () => {
      const cost0 = getUpgradeCost('garden', 0)
      const cost1 = getUpgradeCost('garden', 1)
      const cost2 = getUpgradeCost('garden', 2)

      // garden: baseCost=500, costMult=3.0
      expect(cost0).toBe(500)
      expect(cost1).toBe(1500)  // 500 * 3^1
      expect(cost2).toBe(4500)  // 500 * 3^2
    })

    it('returns Infinity for unknown upgrade', () => {
      expect(getUpgradeCost('nonexistent', 0)).toBe(Infinity)
    })

    it('calculates auto-harvest cost correctly', () => {
      // auto-harvest: baseCost=10000, costMult=5.0
      expect(getUpgradeCost('auto-harvest', 0)).toBe(10_000)
      expect(getUpgradeCost('auto-harvest', 1)).toBe(50_000)
      expect(getUpgradeCost('auto-harvest', 2)).toBe(250_000)
    })

    it('calculates offline-earn cost (costMult=2.0)', () => {
      // offline-earn: baseCost=3000, costMult=2.0, maxLevel=1
      expect(getUpgradeCost('offline-earn', 0)).toBe(3_000)
    })
  })

  describe('canUpgrade', () => {
    it('returns true when player can afford', () => {
      expect(canUpgrade('garden', 0, 500)).toBe(true)
    })

    it('returns true when player has more than enough', () => {
      expect(canUpgrade('garden', 0, 10_000)).toBe(true)
    })

    it('returns false when player cannot afford', () => {
      expect(canUpgrade('garden', 0, 499)).toBe(false)
    })

    it('returns false at max level', () => {
      // garden maxLevel=5
      expect(canUpgrade('garden', 5, 1_000_000)).toBe(false)
    })

    it('returns false for unknown upgrade', () => {
      expect(canUpgrade('nonexistent', 0, 10_000)).toBe(false)
    })

    it('returns false for offline-earn at max level (1)', () => {
      expect(canUpgrade('offline-earn', 1, 100_000)).toBe(false)
    })

    it('allows purchase at level below max', () => {
      // auto-harvest maxLevel=3
      expect(canUpgrade('auto-harvest', 2, 250_000)).toBe(true)
      expect(canUpgrade('auto-harvest', 2, 249_999)).toBe(false)
    })
  })
})
