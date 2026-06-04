import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../../src/games/bounce-golf/config'

describe('Star Threshold Calculations', () => {
  describe('par star', () => {
    it('test_par_star_earned_when_strokes_at_or_below_par', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.par(3, 3)).toBe(true)
      expect(GAME_CONFIG.STAR_THRESHOLDS.par(3, 2)).toBe(true)
      expect(GAME_CONFIG.STAR_THRESHOLDS.par(3, 1)).toBe(true)
    })

    it('test_par_star_not_earned_when_strokes_above_par', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.par(3, 4)).toBe(false)
      expect(GAME_CONFIG.STAR_THRESHOLDS.par(3, 5)).toBe(false)
    })

    it('test_par_star_edge_case_zero_strokes', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.par(1, 0)).toBe(true)
    })
  })

  describe('time star', () => {
    it('test_time_star_earned_when_within_target', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.time(10, 5)).toBe(true)
      expect(GAME_CONFIG.STAR_THRESHOLDS.time(10, 10)).toBe(true)
    })

    it('test_time_star_not_earned_when_exceeded', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.time(10, 11)).toBe(false)
      expect(GAME_CONFIG.STAR_THRESHOLDS.time(10, 20)).toBe(false)
    })

    it('test_time_star_edge_case_exact_target', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.time(8, 8)).toBe(true)
    })
  })

  describe('collect star', () => {
    it('test_collect_star_earned_when_target_met', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.collect(3, 3)).toBe(true)
      expect(GAME_CONFIG.STAR_THRESHOLDS.collect(3, 5)).toBe(true)
    })

    it('test_collect_star_not_earned_when_below_target', () => {
      expect(GAME_CONFIG.STAR_THRESHOLDS.collect(3, 2)).toBe(false)
      expect(GAME_CONFIG.STAR_THRESHOLDS.collect(3, 0)).toBe(false)
    })
  })
})
