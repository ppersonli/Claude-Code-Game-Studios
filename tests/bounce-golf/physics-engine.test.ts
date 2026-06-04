import { describe, it, expect } from 'vitest'
import { PhysicsEngine, Vec2, Ball } from '../../src/games/bounce-golf/logic/physics'

describe('PhysicsEngine', () => {
  /** Default bounds: 800x600 play area */
  const BOUNDS = { x: 0, y: 0, width: 800, height: 600 }
  const GRAVITY = new Vec2(0, 400) // downward gravity in px/s^2

  function makeEngine(overrides?: Partial<{ bounds: typeof BOUNDS; gravity: Vec2 }>) {
    return new PhysicsEngine(
      overrides?.bounds ?? BOUNDS,
      overrides?.gravity ?? GRAVITY,
    )
  }

  function makeBall(x: number, y: number, vx = 0, vy = 0) {
    const ball = new Ball(new Vec2(x, y), 10, 0.7)
    ball.vel = new Vec2(vx, vy)
    return ball
  }

  /** Ball with friction=1.0 for pure integration tests */
  function makeFrictionlessBall(x: number, y: number, vx = 0, vy = 0) {
    const ball = new Ball(new Vec2(x, y), 10, 0.7)
    Object.defineProperty(ball, 'friction', { value: 1.0 })
    ball.vel = new Vec2(vx, vy)
    return ball
  }

  describe('gravity', () => {
    it('test_physics_gravity_accelerates_ball_downward', () => {
      const engine = makeEngine()
      const ball = makeBall(400, 100, 0, 0)
      engine.step(ball, 1 / 60)
      expect(ball.vel.y).toBeGreaterThan(0) // gravity pulls down
      expect(ball.pos.y).toBeGreaterThan(100)
    })

    it('test_physics_gravity_does_not_affect_horizontal_velocity', () => {
      const engine = makeEngine()
      const ball = makeFrictionlessBall(400, 100, 200, 0)
      engine.step(ball, 1 / 60)
      expect(ball.vel.x).toBeCloseTo(200, 0)
    })

    it('test_physics_gravity_increases_speed_over_time', () => {
      const engine = makeEngine()
      const ball = makeBall(400, 100, 0, 0)
      const speedBefore = ball.speed
      engine.step(ball, 1 / 60)
      expect(ball.speed).toBeGreaterThan(speedBefore)
    })
  })

  describe('wall bouncing', () => {
    it('test_physics_wall_bounce_bottom_reflects_velocity_y', () => {
      const engine = makeEngine()
      const ball = makeBall(400, 597, 100, 500) // near bottom, moving down fast
      engine.step(ball, 1 / 60)
      // After bounce, y velocity should be negative (upward)
      expect(ball.vel.y).toBeLessThan(0)
    })

    it('test_physics_wall_bounce_bottom_applies_bounciness', () => {
      const engine = makeEngine()
      const ball = makeBall(400, 597, 0, 500)
      const velBefore = Math.abs(ball.vel.y)
      engine.step(ball, 1 / 60)
      const velAfter = Math.abs(ball.vel.y)
      // Bounciness < 1 means speed should decrease
      expect(velAfter).toBeLessThan(velBefore)
    })

    it('test_physics_wall_bounce_left_reflects_velocity_x', () => {
      const engine = makeEngine()
      const ball = makeBall(3, 300, -5000, 0) // near left wall, moving left fast
      engine.step(ball, 1 / 60)
      expect(ball.vel.x).toBeGreaterThan(0)
    })

    it('test_physics_wall_bounce_right_reflects_velocity_x', () => {
      const engine = makeEngine()
      const ball = makeBall(797, 300, 5000, 0) // near right wall, moving right fast
      engine.step(ball, 1 / 60)
      expect(ball.vel.x).toBeLessThan(0)
    })

    it('test_physics_wall_bounce_top_reflects_velocity_y', () => {
      const engine = makeEngine()
      const ball = makeBall(400, 3, 0, -5000) // near top, moving up fast
      engine.step(ball, 1 / 60)
      expect(ball.vel.y).toBeGreaterThan(0)
    })

    it('test_physics_wall_bounce_clamps_position_inside_bounds', () => {
      const engine = makeEngine()
      const ball = makeBall(400, 598, 0, 500) // very close to bottom
      engine.step(ball, 1 / 60)
      expect(ball.pos.y).toBeLessThanOrEqual(BOUNDS.height - ball.radius)
    })
  })

  describe('friction', () => {
    it('test_physics_friction_reduces_speed_each_step', () => {
      const engine = makeEngine()
      const ball = makeBall(400, 500, 300, 0)
      ball.vel = new Vec2(300, 0) // horizontal roll on "ground"
      // Apply friction manually (engine applies gravity, but we test friction effect)
      const speedBefore = ball.speed
      // Run multiple steps so friction accumulates
      for (let i = 0; i < 60; i++) {
        engine.step(ball, 1 / 60)
      }
      // After many steps with friction, horizontal speed should decrease
      expect(Math.abs(ball.vel.x)).toBeLessThan(speedBefore)
    })
  })

  describe('circle obstacle collision', () => {
    it('test_physics_circle_collision_bounces_ball_outside', () => {
      const engine = makeEngine()
      const ball = makeBall(300, 300, 200, 0) // moving right toward obstacle
      const obstacleCenter = new Vec2(330, 300)
      const obstacleRadius = 20
      // Place ball so it overlaps obstacle
      engine.stepWithObstacles(ball, 1 / 60, [{ center: obstacleCenter, radius: obstacleRadius }])
      // Ball should be pushed outside obstacle
      const dist = ball.pos.sub(obstacleCenter).length()
      expect(dist).toBeGreaterThanOrEqual(ball.radius + obstacleRadius - 1) // -1 for float tolerance
    })

    it('test_physics_circle_collision_reflects_velocity', () => {
      const engine = makeEngine()
      const ball = makeBall(300, 300, 200, 0)
      const obstacle = { center: new Vec2(330, 300), radius: 20 }
      engine.stepWithObstacles(ball, 1 / 60, [obstacle])
      // After hitting obstacle on the right, x velocity should be negative
      expect(ball.vel.x).toBeLessThan(0)
    })

    it('test_physics_circle_collision_no_effect_when_far_away', () => {
      const engine = makeEngine()
      const ball = makeBall(100, 100, 0, 0)
      const velBefore = { x: ball.vel.x, y: ball.vel.y }
      engine.stepWithObstacles(ball, 1 / 60, [{ center: new Vec2(700, 500), radius: 20 }])
      // Velocity should only change due to gravity, not collision
      expect(ball.vel.x).toBeCloseTo(velBefore.x, 0)
    })
  })

  describe('hole detection', () => {
    it('test_physics_inHole_true_when_ball_center_inside_hole', () => {
      const engine = makeEngine()
      const ball = new Ball(new Vec2(700, 550), 10, 0.7)
      const hole = { center: new Vec2(700, 550), radius: 15 }
      expect(engine.isInHole(ball, hole)).toBe(true)
    })

    it('test_physics_inHole_false_when_ball_center_outside_hole', () => {
      const engine = makeEngine()
      const ball = new Ball(new Vec2(100, 100), 10, 0.7)
      const hole = { center: new Vec2(700, 550), radius: 15 }
      expect(engine.isInHole(ball, hole)).toBe(false)
    })

    it('test_physics_inHole_false_when_ball_touches_edge_but_center_outside', () => {
      const engine = makeEngine()
      // Ball center is at distance 20 from hole center, hole radius 15, ball radius 10
      // Ball edge touches hole edge but center is outside
      const ball = new Ball(new Vec2(720, 550), 10, 0.7)
      const hole = { center: new Vec2(700, 550), radius: 15 }
      expect(engine.isInHole(ball, hole)).toBe(false)
    })
  })

  describe('trajectory prediction', () => {
    it('test_physics_trajectory_returns_array_of_positions', () => {
      const engine = makeEngine()
      const ball = new Ball(new Vec2(100, 500), 10, 0.7)
      const trajectory = engine.predictTrajectory(ball, new Vec2(300, -400), 60)
      expect(trajectory.length).toBeGreaterThan(0)
      expect(trajectory[0].x).toBeDefined()
      expect(trajectory[0].y).toBeDefined()
    })

    it('test_physics_trajectory_length_matches_requested_steps', () => {
      const engine = makeEngine()
      const ball = new Ball(new Vec2(100, 500), 10, 0.7)
      const trajectory = engine.predictTrajectory(ball, new Vec2(300, -400), 30)
      expect(trajectory.length).toBe(30)
    })

    it('test_physics_trajectory_shows_gravity_arc', () => {
      const engine = makeEngine()
      const ball = new Ball(new Vec2(100, 500), 10, 0.7)
      const trajectory = engine.predictTrajectory(ball, new Vec2(300, -400), 60)
      // Trajectory should go up then come down (gravity arc)
      const firstY = trajectory[0].y
      const midY = trajectory[15].y
      const lastY = trajectory[59].y
      // First point should be higher than some later point (arc goes up then down)
      // At least one point should be above the start
      const minY = Math.min(...trajectory.map(p => p.y))
      expect(minY).toBeLessThan(firstY)
    })

    it('test_physics_trajectory_stops_at_wall', () => {
      const engine = makeEngine()
      const ball = new Ball(new Vec2(400, 500), 10, 0.7)
      const trajectory = engine.predictTrajectory(ball, new Vec2(0, -600), 120)
      // All points should be within bounds (with ball radius margin)
      for (const point of trajectory) {
        expect(point.x).toBeGreaterThanOrEqual(ball.radius)
        expect(point.x).toBeLessThanOrEqual(BOUNDS.width - ball.radius)
        expect(point.y).toBeGreaterThanOrEqual(ball.radius)
        expect(point.y).toBeLessThanOrEqual(BOUNDS.height - ball.radius)
      }
    })
  })

  describe('step integration', () => {
    it('test_physics_step_updates_position_based_on_velocity', () => {
      const engine = makeEngine({ gravity: new Vec2(0, 0) }) // no gravity
      const ball = makeFrictionlessBall(100, 100, 60, 0) // moving right at 60 px/s
      engine.step(ball, 1) // 1 second
      expect(ball.pos.x).toBeCloseTo(160, 0)
      expect(ball.pos.y).toBeCloseTo(100, 0)
    })

    it('test_physics_step_uses_dt_for_timestep', () => {
      const engine = makeEngine({ gravity: new Vec2(0, 0) })
      const ball = makeFrictionlessBall(100, 100, 60, 0)
      engine.step(ball, 0.5) // half second
      expect(ball.pos.x).toBeCloseTo(130, 0)
    })

    it('test_physics_step_multiple_steps_accumulate', () => {
      const engine = makeEngine({ gravity: new Vec2(0, 0) })
      const ball = makeFrictionlessBall(0, 0, 10, 0)
      for (let i = 0; i < 10; i++) {
        engine.step(ball, 1)
      }
      expect(ball.pos.x).toBeCloseTo(100, 0)
    })
  })
})
