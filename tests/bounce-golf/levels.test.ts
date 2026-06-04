import { describe, it, expect } from 'vitest'
import {
  Vec2,
  Ball,
  PhysicsEngine,
  type LevelData,
  type Obstacle,
  type Wall,
} from '../../src/games/bounce-golf/logic/physics'

describe('Level & Obstacles', () => {
  const BOUNDS = { x: 0, y: 0, width: 800, height: 600 }
  const GRAVITY = new Vec2(0, 400)

  function makeEngine(walls?: Wall[]) {
    return new PhysicsEngine(BOUNDS, GRAVITY, walls)
  }

  describe('wall obstacles (rectangular)', () => {
    it('test_wall_collision_ball_bounces_off_top_of_wall', () => {
      // Wall at y=400, height=20 → top surface at y=400
      const wall: Wall = { x: 300, y: 400, width: 200, height: 20, bounciness: 0.7 }
      const engine = makeEngine([wall])
      const ball = new Ball(new Vec2(400, 398), 10, 0.7)
      ball.vel = new Vec2(0, 500) // falling down fast
      engine.step(ball, 1 / 60)
      // Ball should bounce upward (vel.y < 0)
      expect(ball.vel.y).toBeLessThan(0)
    })

    it('test_wall_collision_ball_bounces_off_left_side_of_wall', () => {
      const wall: Wall = { x: 300, y: 300, width: 20, height: 200, bounciness: 0.7 }
      const engine = makeEngine([wall])
      const ball = new Ball(new Vec2(298, 400), 10, 0.7)
      ball.vel = new Vec2(500, 0) // moving right fast
      engine.step(ball, 1 / 60)
      // Ball should bounce left (vel.x < 0)
      expect(ball.vel.x).toBeLessThan(0)
    })

    it('test_wall_collision_ball_passes_through_non_solid_wall', () => {
      const wall: Wall = { x: 300, y: 400, width: 200, height: 20, bounciness: 0.7, solid: false }
      const engine = makeEngine([wall])
      const ball = new Ball(new Vec2(400, 398), 10, 0.7)
      ball.vel = new Vec2(0, 500)
      engine.step(ball, 1 / 60)
      // Non-solid wall should not block (ball passes through)
      expect(ball.vel.y).toBeGreaterThan(0)
    })
  })

  describe('bounce pad', () => {
    it('test_bounce_pad_applies_extra_bounciness', () => {
      const pad: Wall = { x: 300, y: 500, width: 100, height: 10, bounciness: 1.5, type: 'bounce' }
      const engine = makeEngine([pad])
      const ball = new Ball(new Vec2(350, 498), 10, 0.7)
      ball.vel = new Vec2(0, 500)
      const speedBefore = Math.abs(ball.vel.y)
      engine.step(ball, 1 / 60)
      // Bounce pad should make ball go faster than it came in
      expect(Math.abs(ball.vel.y)).toBeGreaterThan(speedBefore)
    })
  })

  describe('LevelData structure', () => {
    it('test_level_data_has_required_fields', () => {
      const level: LevelData = {
        id: 1,
        name: 'Hole in One?',
        ballStart: new Vec2(100, 500),
        hole: { center: new Vec2(700, 550), radius: 15 },
        par: 3,
        obstacles: [],
        walls: [],
        stars: [
          { type: 'par', target: 2, description: 'Complete in 2 strokes or less' },
          { type: 'time', target: 10, description: 'Complete in under 10 seconds' },
        ],
      }
      expect(level.id).toBe(1)
      expect(level.ballStart).toBeInstanceOf(Vec2)
      expect(level.hole.center).toBeInstanceOf(Vec2)
      expect(level.par).toBeGreaterThan(0)
      expect(level.stars).toHaveLength(2)
    })
  })

  describe('obstacle types', () => {
    it('test_obstacle_circle_has_center_and_radius', () => {
      const obs: Obstacle = { type: 'circle', center: new Vec2(400, 300), radius: 25 }
      expect(obs.type).toBe('circle')
      expect(obs.center).toBeInstanceOf(Vec2)
      expect(obs.radius).toBeGreaterThan(0)
    })

    it('test_obstacle_portal_has_entry_and_exit', () => {
      const obs: Obstacle = {
        type: 'portal',
        center: new Vec2(200, 300),
        radius: 20,
        exit: new Vec2(600, 300),
      }
      expect(obs.type).toBe('portal')
      expect(obs.exit).toBeDefined()
      expect(obs.exit!.x).toBe(600)
    })

    it('test_obstacle_wind_has_direction_and_strength', () => {
      const obs: Obstacle = {
        type: 'wind',
        center: new Vec2(400, 300),
        radius: 100,
        windDirection: new Vec2(1, 0),
        windStrength: 200,
      }
      expect(obs.type).toBe('wind')
      expect(obs.windDirection).toBeDefined()
      expect(obs.windStrength).toBeGreaterThan(0)
    })
  })
})
