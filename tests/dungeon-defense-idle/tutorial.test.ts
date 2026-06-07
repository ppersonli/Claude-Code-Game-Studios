import { describe, it, expect, beforeEach } from 'vitest'
import {
  getTutorialSteps,
  getNextStep,
  isTutorialComplete,
  markStepComplete,
  startTutorial,
  resetTutorial,
  getTutorialProgress,
  type TutorialState,
  type TutorialStep,
} from '../../src/games/dungeon-defense-idle/logic/tutorial'

describe('Tutorial', () => {
  let state: TutorialState

  beforeEach(() => {
    state = startTutorial()
  })

  describe('getTutorialSteps', () => {
    it('returns all tutorial steps', () => {
      const steps = getTutorialSteps()
      expect(steps.length).toBeGreaterThan(0)
    })

    it('steps have required fields', () => {
      const steps = getTutorialSteps()
      for (const step of steps) {
        expect(step.id).toBeTruthy()
        expect(step.title).toBeTruthy()
        expect(step.description).toBeTruthy()
        expect(typeof step.order).toBe('number')
        expect(typeof step.targetElement).toBe('string')
      }
    })

    it('steps are ordered sequentially', () => {
      const steps = getTutorialSteps()
      const orders = steps.map(s => s.order)
      const sorted = [...orders].sort((a, b) => a - b)
      expect(orders).toEqual(sorted)
    })

    it('first step is about placing a tower', () => {
      const steps = getTutorialSteps()
      const first = steps.find(s => s.order === 1)
      expect(first?.id).toBe('place-tower')
    })
  })

  describe('startTutorial', () => {
    it('creates initial tutorial state', () => {
      const s = startTutorial()
      expect(s.completedSteps).toEqual([])
      expect(s.currentStepIndex).toBe(0)
      expect(s.isActive).toBe(true)
    })

    it('is not complete when started', () => {
      const s = startTutorial()
      expect(isTutorialComplete(s)).toBe(false)
    })
  })

  describe('markStepComplete', () => {
    it('adds step to completed list', () => {
      const steps = getTutorialSteps()
      const updated = markStepComplete(state, steps[0].id)
      expect(updated.completedSteps).toContain(steps[0].id)
    })

    it('advances current step index', () => {
      const steps = getTutorialSteps()
      const updated = markStepComplete(state, steps[0].id)
      expect(updated.currentStepIndex).toBe(1)
    })

    it('does not duplicate completed steps', () => {
      const steps = getTutorialSteps()
      let updated = markStepComplete(state, steps[0].id)
      updated = markStepComplete(updated, steps[0].id)
      expect(updated.completedSteps.filter(s => s === steps[0].id).length).toBe(1)
    })

    it('marks tutorial complete after all steps', () => {
      const steps = getTutorialSteps()
      let updated = state
      for (const step of steps) {
        updated = markStepComplete(updated, step.id)
      }
      expect(isTutorialComplete(updated)).toBe(true)
      expect(updated.isActive).toBe(false)
    })
  })

  describe('getNextStep', () => {
    it('returns first step when no steps completed', () => {
      const next = getNextStep(state)
      expect(next).not.toBeNull()
      expect(next?.order).toBe(1)
    })

    it('returns next uncompleted step', () => {
      const steps = getTutorialSteps()
      const updated = markStepComplete(state, steps[0].id)
      const next = getNextStep(updated)
      expect(next?.order).toBe(2)
    })

    it('returns null when all steps completed', () => {
      const steps = getTutorialSteps()
      let updated = state
      for (const step of steps) {
        updated = markStepComplete(updated, step.id)
      }
      expect(getNextStep(updated)).toBeNull()
    })
  })

  describe('getTutorialProgress', () => {
    it('returns 0% when started', () => {
      const progress = getTutorialProgress(state)
      expect(progress.completed).toBe(0)
      expect(progress.total).toBe(getTutorialSteps().length)
      expect(progress.percentage).toBe(0)
    })

    it('returns correct percentage', () => {
      const steps = getTutorialSteps()
      const updated = markStepComplete(state, steps[0].id)
      const progress = getTutorialProgress(updated)
      expect(progress.completed).toBe(1)
      expect(progress.percentage).toBe(Math.round((1 / steps.length) * 100))
    })
  })

  describe('resetTutorial', () => {
    it('resets state to initial', () => {
      const steps = getTutorialSteps()
      let updated = state
      for (const step of steps) {
        updated = markStepComplete(updated, step.id)
      }
      const reset = resetTutorial()
      expect(reset.completedSteps).toEqual([])
      expect(reset.currentStepIndex).toBe(0)
      expect(reset.isActive).toBe(true)
    })
  })
})
