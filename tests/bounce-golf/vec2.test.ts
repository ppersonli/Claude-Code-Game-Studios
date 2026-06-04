import { describe, it, expect } from 'vitest'
import { Vec2 } from '../../src/games/bounce-golf/logic/physics'

describe('Vec2', () => {
  describe('constructor and basic properties', () => {
    it('test_vec2_create_default_has_zero_components', () => {
      const v = new Vec2()
      expect(v.x).toBe(0)
      expect(v.y).toBe(0)
    })

    it('test_vec2_create_with_values_stores_components', () => {
      const v = new Vec2(3, 4)
      expect(v.x).toBe(3)
      expect(v.y).toBe(4)
    })
  })

  describe('arithmetic operations', () => {
    it('test_vec2_add_returns_componentwise_sum', () => {
      const a = new Vec2(1, 2)
      const b = new Vec2(3, 4)
      const result = a.add(b)
      expect(result.x).toBe(4)
      expect(result.y).toBe(6)
    })

    it('test_vec2_add_does_not_mutate_original', () => {
      const a = new Vec2(1, 2)
      a.add(new Vec2(3, 4))
      expect(a.x).toBe(1)
      expect(a.y).toBe(2)
    })

    it('test_vec2_sub_returns_componentwise_difference', () => {
      const a = new Vec2(5, 7)
      const b = new Vec2(2, 3)
      const result = a.sub(b)
      expect(result.x).toBe(3)
      expect(result.y).toBe(4)
    })

    it('test_vec2_scale_multiplies_both_components', () => {
      const v = new Vec2(3, 4)
      const result = v.scale(2)
      expect(result.x).toBe(6)
      expect(result.y).toBe(8)
    })

    it('test_vec2_scale_negative_flips_direction', () => {
      const v = new Vec2(3, -4)
      const result = v.scale(-1)
      expect(result.x).toBe(-3)
      expect(result.y).toBe(4)
    })
  })

  describe('length and normalization', () => {
    it('test_vec2_length_returns_euclidean_distance', () => {
      const v = new Vec2(3, 4)
      expect(v.length()).toBe(5)
    })

    it('test_vec2_length_zero_vector_returns_zero', () => {
      const v = new Vec2(0, 0)
      expect(v.length()).toBe(0)
    })

    it('test_vec2_normalize_returns_unit_vector', () => {
      const v = new Vec2(3, 4)
      const n = v.normalize()
      expect(n.length()).toBeCloseTo(1.0, 10)
      expect(n.x).toBeCloseTo(0.6, 10)
      expect(n.y).toBeCloseTo(0.8, 10)
    })

    it('test_vec2_normalize_zero_vector_returns_zero', () => {
      const v = new Vec2(0, 0)
      const n = v.normalize()
      expect(n.x).toBe(0)
      expect(n.y).toBe(0)
    })
  })

  describe('dot product', () => {
    it('test_vec2_dot_returns_scalar_product', () => {
      const a = new Vec2(1, 2)
      const b = new Vec2(3, 4)
      expect(a.dot(b)).toBe(11) // 1*3 + 2*4
    })

    it('test_vec2_dot_perpendicular_vectors_returns_zero', () => {
      const a = new Vec2(1, 0)
      const b = new Vec2(0, 1)
      expect(a.dot(b)).toBe(0)
    })

    it('test_vec2_dot_parallel_vectors_returns_product_of_lengths', () => {
      const a = new Vec2(3, 0)
      const b = new Vec2(5, 0)
      expect(a.dot(b)).toBe(15)
    })
  })

  describe('reflection', () => {
    it('test_vec2_reflect_off_horizontal_normal_bounces_y', () => {
      // Ball hitting floor: velocity (0, 5), normal (0, -1)
      const vel = new Vec2(0, 5)
      const normal = new Vec2(0, -1)
      const reflected = vel.reflect(normal)
      expect(reflected.x).toBeCloseTo(0, 10)
      expect(reflected.y).toBeCloseTo(-5, 10)
    })

    it('test_vec2_reflect_off_vertical_normal_bounces_x', () => {
      // Ball hitting right wall: velocity (5, 0), normal (-1, 0)
      const vel = new Vec2(5, 0)
      const normal = new Vec2(-1, 0)
      const reflected = vel.reflect(normal)
      expect(reflected.x).toBeCloseTo(-5, 10)
      expect(reflected.y).toBeCloseTo(0, 10)
    })

    it('test_vec2_reflect_off_diagonal_surface', () => {
      // Ball hitting 45-degree surface: velocity (3, 0), normal (-1/sqrt2, 1/sqrt2)
      const vel = new Vec2(3, 0)
      const normal = new Vec2(-Math.SQRT1_2, Math.SQRT1_2)
      const reflected = vel.reflect(normal)
      // Expected: v - 2(v.n)n = (3,0) - 2*(3*-0.707)*(-0.707, 0.707)
      // = (3,0) - 2*(-2.121)*(-0.707, 0.707)
      // = (3,0) - (3, -3) = (0, 3)
      expect(reflected.x).toBeCloseTo(0, 5)
      expect(reflected.y).toBeCloseTo(3, 5)
    })
  })

  describe('utility methods', () => {
    it('test_vec2_clone_returns_independent_copy', () => {
      const v = new Vec2(3, 4)
      const c = v.clone()
      expect(c.x).toBe(3)
      expect(c.y).toBe(4)
      c.x = 99
      expect(v.x).toBe(3)
    })

    it('test_vec2_distanceTo_returns_distance_between_points', () => {
      const a = new Vec2(0, 0)
      const b = new Vec2(3, 4)
      expect(a.distanceTo(b)).toBe(5)
    })
  })
})
