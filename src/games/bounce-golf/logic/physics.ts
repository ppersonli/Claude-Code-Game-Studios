/** 2D vector for physics calculations */
export class Vec2 {
  x: number
  y: number

  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y)
  }

  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s)
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize(): Vec2 {
    const len = this.length()
    if (len === 0) return new Vec2(0, 0)
    return new Vec2(this.x / len, this.y / len)
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y
  }

  /** Reflect velocity off a surface with given normal: v - 2(v·n)n */
  reflect(normal: Vec2): Vec2 {
    const d = this.dot(normal)
    return this.sub(normal.scale(2 * d))
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y)
  }

  distanceTo(v: Vec2): number {
    return this.sub(v).length()
  }
}

/** Speed threshold below which a ball is considered stopped (px/s) */
const STOP_THRESHOLD = 5

/** A ball with position, velocity, and physical properties */
export class Ball {
  pos: Vec2
  vel: Vec2
  readonly radius: number
  readonly bounciness: number
  readonly friction: number

  constructor(pos: Vec2, radius: number, bounciness: number) {
    this.pos = pos.clone()
    this.vel = new Vec2(0, 0)
    this.radius = radius
    this.bounciness = bounciness
    this.friction = 0.98
  }

  get speed(): number {
    return this.vel.length()
  }

  get isStopped(): boolean {
    return this.speed < STOP_THRESHOLD
  }

  applyImpulse(impulse: Vec2): void {
    this.vel = this.vel.add(impulse)
  }

  stop(): void {
    this.vel = new Vec2(0, 0)
  }
}

/** Rectangular wall obstacle */
export interface Wall {
  x: number
  y: number
  width: number
  height: number
  bounciness: number
  solid?: boolean
  type?: 'wall' | 'bounce'
}

/** Circular or special obstacle */
export interface Obstacle {
  type: 'circle' | 'portal' | 'wind'
  center: Vec2
  radius: number
  exit?: Vec2
  windDirection?: Vec2
  windStrength?: number
}

/** Hole (goal) */
export interface Hole {
  center: Vec2
  radius: number
}

/** Star objective for a level */
export interface Star {
  type: 'par' | 'time' | 'collect'
  target: number
  description: string
}

/** Complete level data structure */
export interface LevelData {
  id: number
  name: string
  ballStart: Vec2
  hole: Hole
  par: number
  obstacles: Obstacle[]
  walls: Wall[]
  stars: Star[]
}

/** Axis-aligned bounding box */
interface AABB {
  left: number
  right: number
  top: number
  bottom: number
}

/** Core physics simulation engine */
export class PhysicsEngine {
  private readonly bounds: AABB
  private readonly gravity: Vec2
  private readonly walls: Wall[]

  constructor(
    bounds: { x: number; y: number; width: number; height: number },
    gravity: Vec2,
    walls: Wall[] = [],
  ) {
    this.bounds = {
      left: bounds.x,
      right: bounds.x + bounds.width,
      top: bounds.y,
      bottom: bounds.y + bounds.height,
    }
    this.gravity = gravity
    this.walls = walls
  }

  /** Advance ball physics by dt seconds */
  step(ball: Ball, dt: number): void {
    // Apply gravity
    ball.vel = ball.vel.add(this.gravity.scale(dt))

    // Apply air friction
    ball.vel = ball.vel.scale(ball.friction)

    // Update position
    ball.pos = ball.pos.add(ball.vel.scale(dt))

    // Collide with boundary walls
    this.collideWithBounds(ball)

    // Collide with level walls
    this.collideWithWalls(ball)
  }

  /** Step with additional circle obstacles */
  stepWithObstacles(ball: Ball, dt: number, obstacles: { center: Vec2; radius: number }[]): void {
    // Apply gravity
    ball.vel = ball.vel.add(this.gravity.scale(dt))

    // Apply air friction
    ball.vel = ball.vel.scale(ball.friction)

    // Update position
    ball.pos = ball.pos.add(ball.vel.scale(dt))

    // Collide with boundary walls
    this.collideWithBounds(ball)

    // Collide with circle obstacles
    for (const obs of obstacles) {
      this.collideWithCircle(ball, obs.center, obs.radius)
    }

    // Collide with level walls
    this.collideWithWalls(ball)
  }

  /** Check if ball center is inside the hole */
  isInHole(ball: Ball, hole: Hole): boolean {
    return ball.pos.distanceTo(hole.center) <= hole.radius
  }

  /** Predict ball trajectory for aiming line */
  predictTrajectory(
    ball: Ball,
    impulse: Vec2,
    steps: number,
  ): Vec2[] {
    const simBall = new Ball(ball.pos, ball.radius, ball.bounciness)
    simBall.vel = ball.vel.add(impulse)

    const points: Vec2[] = []
    const dt = 1 / 60

    for (let i = 0; i < steps; i++) {
      // Apply gravity
      simBall.vel = simBall.vel.add(this.gravity.scale(dt))
      simBall.vel = simBall.vel.scale(simBall.friction)
      simBall.pos = simBall.pos.add(simBall.vel.scale(dt))

      // Bounce off bounds
      this.collideWithBounds(simBall)
      this.collideWithWalls(simBall)

      points.push(simBall.pos.clone())
    }

    return points
  }

  /** Collide ball with play-area boundaries */
  private collideWithBounds(ball: Ball): void {
    const b = this.bounds

    // Bottom
    if (ball.pos.y + ball.radius > b.bottom) {
      ball.pos.y = b.bottom - ball.radius
      ball.vel.y = -ball.vel.y * ball.bounciness
    }
    // Top
    if (ball.pos.y - ball.radius < b.top) {
      ball.pos.y = b.top + ball.radius
      ball.vel.y = -ball.vel.y * ball.bounciness
    }
    // Right
    if (ball.pos.x + ball.radius > b.right) {
      ball.pos.x = b.right - ball.radius
      ball.vel.x = -ball.vel.x * ball.bounciness
    }
    // Left
    if (ball.pos.x - ball.radius < b.left) {
      ball.pos.x = b.left + ball.radius
      ball.vel.x = -ball.vel.x * ball.bounciness
    }
  }

  /** Collide ball with rectangular wall obstacles */
  private collideWithWalls(ball: Ball): void {
    for (const wall of this.walls) {
      if (wall.solid === false) continue

      const bounciness = wall.type === 'bounce'
        ? wall.bounciness
        : wall.bounciness

      // Find closest point on wall AABB to ball center
      const closestX = Math.max(wall.x, Math.min(ball.pos.x, wall.x + wall.width))
      const closestY = Math.max(wall.y, Math.min(ball.pos.y, wall.y + wall.height))

      const dx = ball.pos.x - closestX
      const dy = ball.pos.y - closestY
      const distSq = dx * dx + dy * dy

      if (distSq < ball.radius * ball.radius) {
        const dist = Math.sqrt(distSq)

        if (dist === 0) {
          // Ball center is inside wall — push out based on smallest penetration
          const overlapLeft = ball.pos.x - wall.x
          const overlapRight = wall.x + wall.width - ball.pos.x
          const overlapTop = ball.pos.y - wall.y
          const overlapBottom = wall.y + wall.height - ball.pos.y
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

          if (minOverlap === overlapLeft) {
            ball.pos.x = wall.x - ball.radius
            ball.vel.x = -Math.abs(ball.vel.x) * bounciness
          } else if (minOverlap === overlapRight) {
            ball.pos.x = wall.x + wall.width + ball.radius
            ball.vel.x = Math.abs(ball.vel.x) * bounciness
          } else if (minOverlap === overlapTop) {
            ball.pos.y = wall.y - ball.radius
            ball.vel.y = -Math.abs(ball.vel.y) * bounciness
          } else {
            ball.pos.y = wall.y + wall.height + ball.radius
            ball.vel.y = Math.abs(ball.vel.y) * bounciness
          }
        } else {
          // Normal from closest point to ball center
          const nx = dx / dist
          const ny = dy / dist

          // Push ball out
          const overlap = ball.radius - dist
          ball.pos.x += nx * overlap
          ball.pos.y += ny * overlap

          // Reflect velocity
          const dot = ball.vel.x * nx + ball.vel.y * ny
          ball.vel.x = (ball.vel.x - 2 * dot * nx) * bounciness
          ball.vel.y = (ball.vel.y - 2 * dot * ny) * bounciness
        }
      }
    }
  }

  /** Collide ball with a circle obstacle */
  private collideWithCircle(ball: Ball, center: Vec2, radius: number): void {
    const delta = ball.pos.sub(center)
    const dist = delta.length()
    const minDist = ball.radius + radius

    if (dist < minDist && dist > 0) {
      const normal = delta.normalize()
      const overlap = minDist - dist

      // Push ball outside
      ball.pos = ball.pos.add(normal.scale(overlap))

      // Reflect velocity
      const dot = ball.vel.dot(normal)
      ball.vel = ball.vel.sub(normal.scale(2 * dot))
      ball.vel = ball.vel.scale(ball.bounciness)
    }
  }
}
