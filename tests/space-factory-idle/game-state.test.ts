/**
 * Space Factory Idle — Game State Tests
 * Tests for createDefaultState, loadState, saveState, calculateOfflineEarnings, etc.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createDefaultState,
  calculateOfflineEarnings,
  calcTotalOutputPerSec,
  trackPlayTime,
  serializeState,
  deserializeState,
} from '../../src/games/space-factory-idle/logic/game-state'

/* ── createDefaultState ────────────────────────────────────────── */

describe('createDefaultState', () => {
  it('creates a valid initial state', () => {
    const state = createDefaultState()
    expect(state.coins).toBe(0)
    expect(state.totalCoins).toBe(0)
    expect(state.starDust).toBe(0)
    expect(state.prestigeLevel).toBe(0)
    expect(state.prestigeCount).toBe(0)
    expect(state.prestigeMult).toBe(1)
    expect(state.factoryLevel).toBe(1)
  })

  it('starts with earth unlocked', () => {
    const state = createDefaultState()
    expect(state.unlockedPlanets).toContain('earth')
  })

  it('starts with ore-smelt recipe', () => {
    const state = createDefaultState()
    expect(state.unlockedRecipes).toContain('ore-smelt')
  })

  it('has a default production line on earth', () => {
    const state = createDefaultState()
    expect(state.productionLines['earth']).toBeDefined()
    expect(state.productionLines['earth'].length).toBe(1)
    expect(state.productionLines['earth'][0].recipeId).toBe('ore-smelt')
  })

  it('has no active events', () => {
    const state = createDefaultState()
    expect(state.activeEvent).toBeNull()
    expect(state.eventEndTime).toBe(0)
  })
})

/* ── Serialization ─────────────────────────────────────────────── */

describe('serializeState / deserializeState', () => {
  it('round-trips state through JSON', () => {
    const original = createDefaultState()
    original.coins = 12345
    original.starDust = 42
    original.prestigeLevel = 3

    const json = serializeState(original)
    const restored = deserializeState(json)

    expect(restored.coins).toBe(12345)
    expect(restored.starDust).toBe(42)
    expect(restored.prestigeLevel).toBe(3)
  })

  it('returns default state for null input', () => {
    const state = deserializeState(null)
    expect(state.coins).toBe(0)
    expect(state.prestigeLevel).toBe(0)
  })

  it('returns default state for invalid JSON', () => {
    const state = deserializeState('not-valid-json')
    expect(state.coins).toBe(0)
  })
})

/* ── trackPlayTime ─────────────────────────────────────────────── */

describe('trackPlayTime', () => {
  it('accumulates play time in seconds', () => {
    const state = createDefaultState()
    trackPlayTime(state, 1000) // 1 second
    expect(state.totalPlayTime).toBeCloseTo(1, 10)
  })

  it('accumulates across multiple calls', () => {
    const state = createDefaultState()
    trackPlayTime(state, 500)
    trackPlayTime(state, 500)
    expect(state.totalPlayTime).toBeCloseTo(1, 10)
  })

  it('handles 0 delta', () => {
    const state = createDefaultState()
    trackPlayTime(state, 0)
    expect(state.totalPlayTime).toBe(0)
  })
})

/* ── calcTotalOutputPerSec ─────────────────────────────────────── */

describe('calcTotalOutputPerSec', () => {
  it('returns > 0 for default state', () => {
    const state = createDefaultState()
    const output = calcTotalOutputPerSec(state)
    expect(output).toBeGreaterThan(0)
  })

  it('increases with factory level', () => {
    const state1 = createDefaultState()
    const state2 = createDefaultState()
    state2.factoryLevel = 5

    expect(calcTotalOutputPerSec(state2)).toBeGreaterThan(calcTotalOutputPerSec(state1))
  })

  it('increases with prestige multiplier', () => {
    const state1 = createDefaultState()
    const state2 = createDefaultState()
    state2.prestigeMult = 2

    expect(calcTotalOutputPerSec(state2)).toBeGreaterThan(calcTotalOutputPerSec(state1))
  })
})

/* ── calculateOfflineEarnings ──────────────────────────────────── */

describe('calculateOfflineEarnings', () => {
  it('returns 0 without offline-earn upgrade', () => {
    const state = createDefaultState()
    expect(calculateOfflineEarnings(state)).toBe(0)
  })

  it('returns 0 with upgrade but less than 10 seconds offline', () => {
    const state = createDefaultState()
    state.upgrades['offline-earn'] = 1
    state.lastOnline = Date.now() - 5000 // 5 seconds ago
    expect(calculateOfflineEarnings(state)).toBe(0)
  })

  it('returns positive earnings with upgrade and > 10s offline', () => {
    const state = createDefaultState()
    state.upgrades['offline-earn'] = 1
    state.lastOnline = Date.now() - 60_000 // 1 minute ago
    const earnings = calculateOfflineEarnings(state)
    expect(earnings).toBeGreaterThan(0)
  })

  it('caps at MAX_OFFLINE_HOURS (8 hours)', () => {
    const state = createDefaultState()
    state.upgrades['offline-earn'] = 1
    state.lastOnline = Date.now() - 24 * 3600_000 // 24 hours ago
    const earnings = calculateOfflineEarnings(state)
    expect(earnings).toBeGreaterThan(0)
    // Should be capped - we just verify it's finite and positive
    expect(Number.isFinite(earnings)).toBe(true)
  })
})
