import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RunwaySystem } from '../../src/games/runway-fashion/systems/RunwaySystem'
import { PREP_DURATION, WALK_DURATION, POSE_DURATION } from '../../src/games/runway-fashion/data/constants'
import type { Theme } from '../../src/games/runway-fashion/data/types'

describe('RunwaySystem', () => {
  let system: RunwaySystem

  const galaTheme: Theme = {
    id: 'evening_gala',
    name: 'Gala',
    scene: 'red_carpet',
    requiredStyles: ['elegant', 'glamorous'],
    bonusStyles: ['elegant'],
    timeLimit: 18000,
    rewardMultiplier: 1.5,
    unlockLevel: 1,
    isWeekly: false,
  }

  beforeEach(() => {
    system = new RunwaySystem()
  })

  describe('start', () => {
    it('should initialize with prepare phase', () => {
      system.start(galaTheme)
      expect(system.getPhase()).toBe('prepare')
    })

    it('should set the theme', () => {
      system.start(galaTheme)
      expect(system.getTheme()).toBe(galaTheme)
    })

    it('should start with no actions performed', () => {
      system.start(galaTheme)
      expect(system.getActionsPerformed()).toEqual([])
    })

    it('should have prep duration as initial time', () => {
      system.start(galaTheme)
      expect(system.getTimeRemaining()).toBe(PREP_DURATION)
    })
  })

  describe('update', () => {
    it('should decrease time remaining', () => {
      system.start(galaTheme)
      system.update(500)
      expect(system.getTimeRemaining()).toBe(PREP_DURATION - 500)
    })

    it('should transition from prepare to walk when timer expires', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100)
      expect(system.getPhase()).toBe('walk')
    })

    it('should transition from walk to pose when timer expires', () => {
      system.start(galaTheme)
      // prepare -> walk
      system.update(PREP_DURATION + 100)
      expect(system.getPhase()).toBe('walk')
      // walk -> pose
      system.update(WALK_DURATION + 100)
      expect(system.getPhase()).toBe('pose')
    })

    it('should transition from pose to done when timer expires', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100)
      system.update(WALK_DURATION + 100)
      system.update(POSE_DURATION + 100)
      expect(system.getPhase()).toBe('done')
    })

    it('should reset timer on each phase transition', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100) // -> walk
      expect(system.getTimeRemaining()).toBe(WALK_DURATION)
    })

    it('should not go negative on time remaining (transitions to next phase)', () => {
      system.start(galaTheme)
      // Over-shoot by 500ms → transitions to walk, timer resets to WALK_DURATION
      system.update(PREP_DURATION + 500)
      expect(system.getPhase()).toBe('walk')
      expect(system.getTimeRemaining()).toBe(WALK_DURATION)
    })
  })

  describe('performAction', () => {
    it('should record an action during walk phase', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100) // -> walk
      system.performAction('twirl')
      expect(system.getActionsPerformed()).toContain('twirl')
    })

    it('should ignore actions outside walk phase', () => {
      system.start(galaTheme)
      // still in prepare phase
      system.performAction('twirl')
      expect(system.getActionsPerformed()).toEqual([])
    })

    it('should ignore actions in pose phase', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100) // -> walk
      system.update(WALK_DURATION + 100) // -> pose
      system.performAction('wave')
      expect(system.getActionsPerformed()).toEqual([])
    })

    it('should record multiple actions in order', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100) // -> walk
      system.performAction('twirl')
      system.performAction('wave')
      system.performAction('pose')
      expect(system.getActionsPerformed()).toEqual(['twirl', 'wave', 'pose'])
    })

    it('should allow duplicate actions', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100) // -> walk
      system.performAction('twirl')
      system.performAction('twirl')
      expect(system.getActionsPerformed()).toEqual(['twirl', 'twirl'])
    })
  })

  describe('isFinished', () => {
    it('should return false before done phase', () => {
      system.start(galaTheme)
      expect(system.isFinished()).toBe(false)
    })

    it('should return true when phase is done', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100)
      system.update(WALK_DURATION + 100)
      system.update(POSE_DURATION + 100)
      expect(system.isFinished()).toBe(true)
    })
  })

  describe('getFinalActions', () => {
    it('should return all performed actions when finished', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100) // -> walk
      system.performAction('twirl')
      system.performAction('wave')
      system.update(WALK_DURATION + 100) // -> pose
      system.update(POSE_DURATION + 100) // -> done
      expect(system.getFinalActions()).toEqual(['twirl', 'wave'])
    })

    it('should return empty array if no actions performed', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100)
      system.update(WALK_DURATION + 100)
      system.update(POSE_DURATION + 100)
      expect(system.getFinalActions()).toEqual([])
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION + 100)
      system.performAction('twirl')
      system.reset()
      expect(system.getPhase()).toBe('idle')
      expect(system.getTimeRemaining()).toBe(0)
      expect(system.getActionsPerformed()).toEqual([])
    })
  })

  describe('getPhaseProgress', () => {
    it('should return 0 at phase start', () => {
      system.start(galaTheme)
      expect(system.getPhaseProgress()).toBe(0)
    })

    it('should return 1 at phase end (just before transition)', () => {
      system.start(galaTheme)
      // Just before the timer expires — progress should be ~1
      system.update(PREP_DURATION - 1)
      expect(system.getPhaseProgress()).toBeCloseTo(1, 0)
    })

    it('should return partial progress mid-phase', () => {
      system.start(galaTheme)
      system.update(PREP_DURATION / 2)
      expect(system.getPhaseProgress()).toBeCloseTo(0.5, 1)
    })
  })
})
