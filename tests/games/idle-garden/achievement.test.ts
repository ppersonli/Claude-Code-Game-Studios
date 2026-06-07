/**
 * Idle Garden Tycoon — Achievement System Tests
 * TDD: Tests achievement checking, claiming, and progress tracking
 */

import { describe, it, expect } from 'vitest'
import type { GameState } from '../../../src/games/idle-garden/data/types'
import { createDefaultPots } from '../../../src/games/idle-garden/systems/GardenSystem'
import {
  ACHIEVEMENTS,
  checkAchievements,
  claimAchievement,
  getAchievementProgress,
} from '../../../src/games/idle-garden/systems/AchievementSystem'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
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
      totalCoinsEarned: 0,
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

describe('ACHIEVEMENTS data', () => {
  it('has achievements defined', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0)
  })

  it('each achievement has unique ID', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each achievement has positive reward', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.reward).toBeGreaterThan(0)
    }
  })

  it('first-harvest achievement exists', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'first-harvest')
    expect(a).toBeDefined()
    expect(a!.reward).toBe(50)
  })
})

describe('checkAchievements', () => {
  it('returns empty array when no conditions met', () => {
    const state = createTestState()
    const result = checkAchievements(state)
    expect(result).toEqual([])
  })

  it('detects first-harvest achievement', () => {
    const state = createTestState({
      stats: { ...createTestState().stats, totalHarvests: 1 },
    })
    const result = checkAchievements(state)
    expect(result).toContain('first-harvest')
  })

  it('does not return already claimed achievements', () => {
    const state = createTestState({
      achievements: ['first-harvest'],
      stats: { ...createTestState().stats, totalHarvests: 5 },
    })
    const result = checkAchievements(state)
    expect(result).not.toContain('first-harvest')
  })

  it('detects multiple achievements at once', () => {
    const state = createTestState({
      stats: {
        totalCoinsEarned: 100_000,
        totalFlowersGrown: 100,
        totalHarvests: 100,
        totalPlayTime: 0,
        maxComboCount: 0,
      },
      level: 10,
    })
    const result = checkAchievements(state)
    expect(result).toContain('first-harvest')
    expect(result).toContain('harvest-100')
    expect(result).toContain('first-flower')
    expect(result).toContain('flowers-100')
    expect(result).toContain('coins-100k')
    expect(result).toContain('level-10')
  })
})

describe('claimAchievement', () => {
  it('claims an achievement and awards coins', () => {
    const state = createTestState({
      stats: { ...createTestState().stats, totalHarvests: 1 },
    })
    const reward = claimAchievement(state, 'first-harvest')
    expect(reward).toBe(50)
    expect(state.achievements).toContain('first-harvest')
    expect(state.coins).toBe(50)
  })

  it('returns 0 for already claimed achievement', () => {
    const state = createTestState({
      achievements: ['first-harvest'],
      stats: { ...createTestState().stats, totalHarvests: 1 },
    })
    const reward = claimAchievement(state, 'first-harvest')
    expect(reward).toBe(0)
  })

  it('returns 0 for non-existent achievement', () => {
    const state = createTestState()
    const reward = claimAchievement(state, 'nonexistent')
    expect(reward).toBe(0)
  })

  it('returns 0 when condition not met', () => {
    const state = createTestState() // totalHarvests = 0
    const reward = claimAchievement(state, 'first-harvest')
    expect(reward).toBe(0)
    expect(state.achievements).not.toContain('first-harvest')
  })

  it('adds coins to stats.totalCoinsEarned', () => {
    const state = createTestState({
      stats: { ...createTestState().stats, totalHarvests: 1 },
    })
    claimAchievement(state, 'first-harvest')
    expect(state.stats.totalCoinsEarned).toBe(50)
  })
})

describe('getAchievementProgress', () => {
  it('returns progress for all achievements', () => {
    const state = createTestState()
    const progress = getAchievementProgress(state)
    expect(progress.length).toBe(ACHIEVEMENTS.length)
  })

  it('shows unlocked when condition met', () => {
    const state = createTestState({
      stats: { ...createTestState().stats, totalHarvests: 1 },
    })
    const progress = getAchievementProgress(state)
    const first = progress.find(p => p.id === 'first-harvest')
    expect(first?.unlocked).toBe(true)
    expect(first?.claimable).toBe(true)
  })

  it('shows not claimable when already claimed', () => {
    const state = createTestState({
      achievements: ['first-harvest'],
      stats: { ...createTestState().stats, totalHarvests: 1 },
    })
    const progress = getAchievementProgress(state)
    const first = progress.find(p => p.id === 'first-harvest')
    expect(first?.unlocked).toBe(true)
    expect(first?.claimable).toBe(false)
  })

  it('shows not unlocked when condition not met', () => {
    const state = createTestState()
    const progress = getAchievementProgress(state)
    const first = progress.find(p => p.id === 'first-harvest')
    expect(first?.unlocked).toBe(false)
    expect(first?.claimable).toBe(false)
  })
})
