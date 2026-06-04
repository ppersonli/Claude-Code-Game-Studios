import { describe, it, expect } from 'vitest'
import { Ball, Vec2 } from '../../src/games/bounce-golf/logic/physics'

describe('Ball', () => {
  describe('construction', () => {
    it('test_ball_create_stores_position_radius_and_bounciness', () => {
      const ball = new Ball(new Vec2(100, 200), 10, 0.8)
      expect(ball.pos.x).toBe(100)
      expect(ball.pos.y).toBe(200)
      expect(ball.radius).toBe(10)
      expect(ball.bounciness).toBe(0.8)
    })

    it('test_ball_create_default_velocity_is_zero', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      expect(ball.vel.x).toBe(0)
      expect(ball.vel.y).toBe(0)
    })

    it('test_ball_create_default_friction_is_set', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      expect(ball.friction).toBeGreaterThan(0)
      expect(ball.friction).toBeLessThan(1)
    })
  })

  describe('speed', () => {
    it('test_ball_speed_returns_velocity_magnitude', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      ball.vel = new Vec2(3, 4)
      expect(ball.speed).toBe(5)
    })

    it('test_ball_speed_zero_when_stationary', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      expect(ball.speed).toBe(0)
    })
  })

  describe('isStopped', () => {
    it('test_ball_isStopped_true_when_speed_below_threshold', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      ball.vel = new Vec2(0.01, 0.01)
      expect(ball.isStopped).toBe(true)
    })

    it('test_ball_isStopped_false_when_moving_fast', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      ball.vel = new Vec2(100, 0)
      expect(ball.isStopped).toBe(false)
    })
  })

  describe('applyImpulse', () => {
    it('test_ball_applyImpulse_adds_to_velocity', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      ball.vel = new Vec2(10, 0)
      ball.applyImpulse(new Vec2(5, 5))
      expect(ball.vel.x).toBe(15)
      expect(ball.vel.y).toBe(5)
    })
  })

  describe('stop', () => {
    it('test_ball_stop_sets_velocity_to_zero', () => {
      const ball = new Ball(new Vec2(0, 0), 10, 0.8)
      ball.vel = new Vec2(500, -300)
      ball.stop()
      expect(ball.vel.x).toBe(0)
      expect(ball.vel.y).toBe(0)
    })
  })
})
