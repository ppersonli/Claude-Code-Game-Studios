/**
 * Idle Garden Tycoon — Decoration System Tests
 * TDD: tests written before implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createDefaultState } from '../../src/games/idle-garden/systems/GameState'
import {
  DECORATIONS,
  getDecorationById,
  getAvailableDecorations,
  buyDecoration,
  isDecorationOwned,
  getDecorationBonus,
} from '../../src/games/idle-garden/systems/DecorationSystem'
import type { GameState } from '../../src/games/idle-garden/data/types'

describe('DecorationSystem', () => {
  let state: GameState

  beforeEach(() => {
    state = createDefaultState()
    state.coins = 1_000_000
  })

  // ── Data ─────────────────────────────────────────────────────

  describe('DECORATIONS data', () => {
    it('has 8 decorations', () => {
      expect(DECORATIONS.length).toBe(8)
    })

    it('each decoration has required fields', () => {
      for (const d of DECORATIONS) {
        expect(d.id).toBeTruthy()
        expect(d.name).toBeTruthy()
        expect(d.description).toBeTruthy()
        expect(d.cost).toBeGreaterThan(0)
        expect(['growth', 'price', 'none']).toContain(d.bonusType)
        expect(d.bonusValue).toBeGreaterThanOrEqual(0)
        expect(d.unlockLevel).toBeGreaterThanOrEqual(1)
      }
    })

    it('has unique ids', () => {
      const ids = DECORATIONS.map(d => d.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  // ── getDecorationById ────────────────────────────────────────

  describe('getDecorationById', () => {
    it('returns decoration for valid id', () => {
      const d = getDecorationById('garden-gnome')
      expect(d).toBeDefined()
      expect(d!.name).toBe('Garden Gnome')
    })

    it('returns undefined for unknown id', () => {
      expect(getDecorationById('nonexistent')).toBeUndefined()
    })
  })

  // ── getAvailableDecorations ──────────────────────────────────

  describe('getAvailableDecorations', () => {
    it('returns level 1 decorations at level 1', () => {
      const available = getAvailableDecorations(1, [])
      expect(available.length).toBeGreaterThanOrEqual(2)
      for (const d of available) {
        expect(d.unlockLevel).toBeLessThanOrEqual(1)
      }
    })

    it('excludes already-owned decorations', () => {
      const available = getAvailableDecorations(10, ['garden-gnome'])
      expect(available.find(d => d.id === 'garden-gnome')).toBeUndefined()
    })

    it('returns more decorations at higher levels', () => {
      const atLevel1 = getAvailableDecorations(1, [])
      const atLevel5 = getAvailableDecorations(5, [])
      expect(atLevel5.length).toBeGreaterThan(atLevel1.length)
    })

    it('returns all decorations at max level when none owned', () => {
      const available = getAvailableDecorations(100, [])
      expect(available.length).toBe(DECORATIONS.length)
    })

    it('returns empty when all are owned', () => {
      const allIds = DECORATIONS.map(d => d.id)
      const available = getAvailableDecorations(100, allIds)
      expect(available.length).toBe(0)
    })
  })

  // ── buyDecoration ────────────────────────────────────────────

  describe('buyDecoration', () => {
    it('buys a decoration and deducts coins', () => {
      const gnome = getDecorationById('garden-gnome')!
      state.coins = gnome.cost + 100
      state.level = gnome.unlockLevel

      const result = buyDecoration(state, 'garden-gnome')

      expect(result).toBe(true)
      expect(state.coins).toBe(100)
      expect(state.decorations).toContain('garden-gnome')
    })

    it('returns false if already owned', () => {
      state.decorations = ['garden-gnome']
      state.coins = 1_000_000

      expect(buyDecoration(state, 'garden-gnome')).toBe(false)
    })

    it('returns false if cannot afford', () => {
      state.coins = 0
      state.level = 10

      expect(buyDecoration(state, 'garden-gnome')).toBe(false)
    })

    it('returns false if level too low', () => {
      state.coins = 1_000_000
      state.level = 1

      // enchanted-tree requires level 5
      expect(buyDecoration(state, 'enchanted-tree')).toBe(false)
    })

    it('returns false for unknown decoration id', () => {
      expect(buyDecoration(state, 'nonexistent')).toBe(false)
    })
  })

  // ── isDecorationOwned ───────────────────────────────────────

  describe('isDecorationOwned', () => {
    it('returns true when owned', () => {
      state.decorations = ['garden-gnome']
      expect(isDecorationOwned(state, 'garden-gnome')).toBe(true)
    })

    it('returns false when not owned', () => {
      expect(isDecorationOwned(state, 'garden-gnome')).toBe(false)
    })
  })

  // ── getDecorationBonus ───────────────────────────────────────

  describe('getDecorationBonus', () => {
    it('returns zero bonuses when no decorations owned', () => {
      const bonus = getDecorationBonus(state)
      expect(bonus.growth).toBe(0)
      expect(bonus.price).toBe(0)
    })

    it('sums growth bonuses from owned decorations', () => {
      // garden-gnome: +5% growth (0.05)
      state.decorations = ['garden-gnome']
      const bonus = getDecorationBonus(state)
      expect(bonus.growth).toBeCloseTo(0.05)
      expect(bonus.price).toBe(0)
    })

    it('sums price bonuses from owned decorations', () => {
      // bird-bath: +5% price (0.05)
      state.decorations = ['bird-bath']
      const bonus = getDecorationBonus(state)
      expect(bonus.growth).toBe(0)
      expect(bonus.price).toBeCloseTo(0.05)
    })

    it('sums multiple bonuses correctly', () => {
      // garden-gnome: +5% growth, fairy-lights: +10% growth, bird-bath: +5% price
      state.decorations = ['garden-gnome', 'fairy-lights', 'bird-bath']
      const bonus = getDecorationBonus(state)
      expect(bonus.growth).toBeCloseTo(0.15) // 0.05 + 0.10
      expect(bonus.price).toBeCloseTo(0.05)
    })

    it('handles empty decorations array', () => {
      state.decorations = []
      const bonus = getDecorationBonus(state)
      expect(bonus.growth).toBe(0)
      expect(bonus.price).toBe(0)
    })
  })
})
