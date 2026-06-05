/**
 * Idle Garden Tycoon — Achievement System Tests
 * TDD: tests written before implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createDefaultState } from '../../src/games/idle-garden/systems/GameState'
import {
  ACHIEVEMENTS,
  checkAchievements,
  claimAchievement,
  getAchievementProgress,
} from '../../src/games/idle-garden/systems/AchievementSystem'
import type { GameState } from '../../src/games/idle-garden/data/types'

describe('AchievementSystem', () => {
  let state: GameState

  beforeEach(() => {
    state = createDefaultState()
  })

  // ── Data ─────────────────────────────────────────────────────

  describe('ACHIEVEMENTS data', () => {
    it('has 15 achievements', () => {
      expect(ACHIEVEMENTS.length).toBe(15)
    })

    it('each achievement has required fields', () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.id).toBeTruthy()
        expect(a.name).toBeTruthy()
        expect(a.description).toBeTruthy()
        expect(typeof a.condition).toBe('function')
        expect(a.reward).toBeGreaterThan(0)
        expect(a.icon).toBeTruthy()
      }
    })

    it('has unique ids', () => {
      const ids = ACHIEVEMENTS.map(a => a.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  // ── checkAchievements ────────────────────────────────────────

  describe('checkAchievements', () => {
    it('returns empty array when no conditions met', () => {
      const newIds = checkAchievements(state)
      expect(newIds).toEqual([])
    })

    it('returns achievement id when first harvest condition met', () => {
      state.stats.totalHarvests = 1
      const newIds = checkAchievements(state)
      expect(newIds).toContain('first-harvest')
    })

    it('returns multiple achievement ids when multiple conditions met', () => {
      state.stats.totalHarvests = 1
      state.stats.totalFlowersGrown = 1
      const newIds = checkAchievements(state)
      expect(newIds).toContain('first-harvest')
      expect(newIds).toContain('first-flower')
    })

    it('excludes already-claimed achievements', () => {
      state.stats.totalHarvests = 1
      state.achievements = ['first-harvest']
      const newIds = checkAchievements(state)
      expect(newIds).not.toContain('first-harvest')
    })

    it('detects level achievements', () => {
      state.level = 5
      const newIds = checkAchievements(state)
      expect(newIds).toContain('level-5')
    })

    it('detects coin achievements', () => {
      state.stats.totalCoinsEarned = 10_000
      const newIds = checkAchievements(state)
      expect(newIds).toContain('coins-10k')
    })

    it('detects prestige achievements', () => {
      state.prestigeCount = 1
      const newIds = checkAchievements(state)
      expect(newIds).toContain('first-prestige')
    })

    it('detects decoration achievements', () => {
      state.decorations = ['a', 'b', 'c', 'd', 'e']
      const newIds = checkAchievements(state)
      expect(newIds).toContain('decorations-5')
    })
  })

  // ── claimAchievement ─────────────────────────────────────────

  describe('claimAchievement', () => {
    it('claims achievement and returns reward', () => {
      state.stats.totalHarvests = 1
      state.coins = 0
      const reward = claimAchievement(state, 'first-harvest')

      expect(reward).toBe(50)
      expect(state.coins).toBe(50)
      expect(state.achievements).toContain('first-harvest')
    })

    it('returns 0 if already claimed', () => {
      state.achievements = ['first-harvest']
      const reward = claimAchievement(state, 'first-harvest')
      expect(reward).toBe(0)
    })

    it('returns 0 if condition not met', () => {
      state.stats.totalHarvests = 0
      const reward = claimAchievement(state, 'first-harvest')
      expect(reward).toBe(0)
      expect(state.achievements).not.toContain('first-harvest')
    })

    it('returns 0 for unknown achievement', () => {
      const reward = claimAchievement(state, 'nonexistent')
      expect(reward).toBe(0)
    })

    it('adds reward to totalCoinsEarned', () => {
      state.stats.totalHarvests = 1
      state.stats.totalCoinsEarned = 100
      claimAchievement(state, 'first-harvest')
      expect(state.stats.totalCoinsEarned).toBe(150)
    })
  })

  // ── getAchievementProgress ───────────────────────────────────

  describe('getAchievementProgress', () => {
    it('returns all achievements with unlocked status', () => {
      const progress = getAchievementProgress(state)
      expect(progress.length).toBe(ACHIEVEMENTS.length)
      for (const p of progress) {
        expect(p.id).toBeTruthy()
        expect(typeof p.unlocked).toBe('boolean')
        expect(typeof p.claimable).toBe('boolean')
      }
    })

    it('marks unlocked achievements correctly', () => {
      state.stats.totalHarvests = 1
      const progress = getAchievementProgress(state)
      const firstHarvest = progress.find(p => p.id === 'first-harvest')!
      expect(firstHarvest.unlocked).toBe(true)
      expect(firstHarvest.claimable).toBe(true)
    })

    it('marks claimed achievements as unlocked but not claimable', () => {
      state.stats.totalHarvests = 1
      state.achievements = ['first-harvest']
      const progress = getAchievementProgress(state)
      const firstHarvest = progress.find(p => p.id === 'first-harvest')!
      expect(firstHarvest.unlocked).toBe(true)
      expect(firstHarvest.claimable).toBe(false)
    })

    it('marks locked achievements correctly', () => {
      const progress = getAchievementProgress(state)
      const harvest1000 = progress.find(p => p.id === 'harvest-1000')!
      expect(harvest1000.unlocked).toBe(false)
      expect(harvest1000.claimable).toBe(false)
    })
  })
})
