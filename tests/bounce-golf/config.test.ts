import { describe, it, expect } from 'vitest'
import { GAME_CONFIG, type UpgradeKey } from '../../src/games/bounce-golf/config'
import { LEVELS } from '../../src/games/bounce-golf/data/levels'

describe('Bounce Golf Config', () => {
  describe('GAME_CONFIG', () => {
    it('test_config_has_valid_canvas_dimensions', () => {
      expect(GAME_CONFIG.WIDTH).toBeGreaterThan(0)
      expect(GAME_CONFIG.HEIGHT).toBeGreaterThan(0)
    })

    it('test_config_has_positive_gravity', () => {
      expect(GAME_CONFIG.GRAVITY).toBeGreaterThan(0)
    })

    it('test_config_ball_radius_is_positive', () => {
      expect(GAME_CONFIG.BALL_RADIUS).toBeGreaterThan(0)
    })

    it('test_config_bounciness_between_0_and_2', () => {
      expect(GAME_CONFIG.BALL_BOUNCINESS).toBeGreaterThan(0)
      expect(GAME_CONFIG.BALL_BOUNCINESS).toBeLessThanOrEqual(2)
    })

    it('test_config_max_power_exceeds_min_power', () => {
      expect(GAME_CONFIG.MAX_POWER).toBeGreaterThan(GAME_CONFIG.MIN_POWER)
    })

    it('test_config_upgrade_multiplier_greater_than_1', () => {
      expect(GAME_CONFIG.UPGRADE_COST_MULTIPLIER).toBeGreaterThan(1)
    })

    it('test_config_all_upgrades_have_valid_max_level', () => {
      for (const [key, upgrade] of Object.entries(GAME_CONFIG.UPGRADES)) {
        expect(upgrade.maxLevel).toBeGreaterThan(0)
        expect(upgrade.baseCost).toBeGreaterThan(0)
        expect(upgrade.effect(0)).toBeDefined()
      }
    })

    it('test_config_upgrade_effects_increase_with_level', () => {
      for (const [key, upgrade] of Object.entries(GAME_CONFIG.UPGRADES)) {
        const val0 = upgrade.effect(0)
        const val1 = upgrade.effect(1)
        const valMax = upgrade.effect(upgrade.maxLevel)
        expect(valMax).toBeGreaterThan(val0)
      }
    })
  })

  describe('LEVELS data', () => {
    it('test_levels_has_50_levels', () => {
      expect(LEVELS).toHaveLength(50)
    })

    it('test_levels_have_unique_ids', () => {
      const ids = LEVELS.map(l => l.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('test_levels_have_sequential_ids_from_1', () => {
      LEVELS.forEach((level, i) => {
        expect(level.id).toBe(i + 1)
      })
    })

    it('test_levels_have_valid_ball_start_position', () => {
      for (const level of LEVELS) {
        expect(level.ballStart.x).toBeGreaterThanOrEqual(0)
        expect(level.ballStart.x).toBeLessThanOrEqual(GAME_CONFIG.WIDTH)
        expect(level.ballStart.y).toBeGreaterThanOrEqual(0)
        expect(level.ballStart.y).toBeLessThanOrEqual(GAME_CONFIG.HEIGHT)
      }
    })

    it('test_levels_have_valid_hole_position', () => {
      for (const level of LEVELS) {
        expect(level.hole.center.x).toBeGreaterThanOrEqual(0)
        expect(level.hole.center.x).toBeLessThanOrEqual(GAME_CONFIG.WIDTH)
        expect(level.hole.center.y).toBeGreaterThanOrEqual(0)
        expect(level.hole.center.y).toBeLessThanOrEqual(GAME_CONFIG.HEIGHT)
        expect(level.hole.radius).toBeGreaterThan(0)
      }
    })

    it('test_levels_have_positive_par', () => {
      for (const level of LEVELS) {
        expect(level.par).toBeGreaterThan(0)
      }
    })

    it('test_levels_have_three_stars', () => {
      for (const level of LEVELS) {
        expect(level.stars).toHaveLength(3)
      }
    })

    it('test_levels_have_valid_star_types', () => {
      const validTypes = ['par', 'time', 'collect']
      for (const level of LEVELS) {
        for (const star of level.stars) {
          expect(validTypes).toContain(star.type)
          expect(star.description).toBeTruthy()
        }
      }
    })

    it('test_levels_have_names', () => {
      for (const level of LEVELS) {
        expect(level.name).toBeTruthy()
      }
    })
  })
})
