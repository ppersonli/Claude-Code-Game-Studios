import Phaser from 'phaser'
import { Ball, Vec2, PhysicsEngine, type LevelData, type Hole, type Wall, type Obstacle } from '../../logic/physics'
import { LEVELS } from '../../data/levels'
import { GAME_CONFIG } from '../../config'
import { createInitialState, getCurrentLevel, completeLevel, type GameState } from '../../logic/game-state'
import { audioEngine } from '@shared/phaser/audio'
import type { GameCallbacks } from './BootScene'

export class GameScene extends Phaser.Scene {
  private ball!: Ball
  private physicsEngine!: PhysicsEngine
  private level!: LevelData
  private graphics!: Phaser.GameObjects.Graphics
  // Aiming
  private isAiming = false
  private aimStart = new Vec2(0, 0)
  private aimEnd = new Vec2(0, 0)
  private aimLine!: Phaser.GameObjects.Graphics

  // Game state
  private strokes = 0
  private ballMoving = false
  private levelStartTime = 0
  private trajectoryPoints: Vec2[] = []

  // Visual elements
  private ballImage!: Phaser.GameObjects.Image
  private holeImage!: Phaser.GameObjects.Image
  private bgImage!: Phaser.GameObjects.Image
  private hudText!: Phaser.GameObjects.Text
  private levelNameText!: Phaser.GameObjects.Text

  // Bounce tracking
  private prevVelX = 0
  private prevVelY = 0

  // Callbacks from registry
  private callbacks!: GameCallbacks

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.callbacks = this.registry.get('callbacks')
    this.level = getCurrentLevel(this.callbacks.getState())
    this.strokes = 0
    this.ballMoving = false
    this.levelStartTime = Date.now()

    audioEngine.init()

    // Background image
    if (this.textures.exists('bg-game')) {
      this.bgImage = this.add.image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'bg-game')
      this.bgImage.setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)
      this.bgImage.setAlpha(0.4)
    }

    // Graphics layers for dynamic elements
    this.graphics = this.add.graphics()
    this.aimLine = this.add.graphics()

    // Hole image
    if (this.textures.exists('hole')) {
      this.holeImage = this.add.image(this.level.hole.center.x, this.level.hole.center.y, 'hole')
      const holeScale = (this.level.hole.radius * 2) / this.holeImage.width
      this.holeImage.setScale(holeScale)
    }

    // Create physics ball
    this.ball = new Ball(
      this.level.ballStart.clone(),
      GAME_CONFIG.BALL_RADIUS,
      GAME_CONFIG.BALL_BOUNCINESS,
    )

    // Ball image
    if (this.textures.exists('ball')) {
      this.ballImage = this.add.image(this.ball.pos.x, this.ball.pos.y, 'ball')
      const ballScale = (this.ball.radius * 2) / this.ballImage.width
      this.ballImage.setScale(ballScale)
    }

    // Create physics engine
    this.physicsEngine = new PhysicsEngine(
      { x: 0, y: 0, width: GAME_CONFIG.WIDTH, height: GAME_CONFIG.HEIGHT },
      new Vec2(0, GAME_CONFIG.GRAVITY),
      this.level.walls,
    )

    // Draw static level elements (walls, obstacles)
    this.drawLevel()

    // HUD
    this.hudText = this.add.text(GAME_CONFIG.WIDTH / 2, 20, '', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0)

    this.levelNameText = this.add.text(GAME_CONFIG.WIDTH / 2, 50, this.level.name, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5, 0)

    this.updateHUD()

    // Input handling
    this.input.on('pointerdown', this.onPointerDown, this)
    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerup', this.onPointerUp, this)
  }

  update(_time: number, delta: number): void {
    if (this.ballMoving) {
      const dt = delta / 1000

      // Track velocity before physics step for bounce detection
      this.prevVelX = this.ball.vel.x
      this.prevVelY = this.ball.vel.y

      // Step physics
      const obstacles = this.level.obstacles.map(o => ({
        center: o.center,
        radius: o.radius,
      }))
      this.physicsEngine.stepWithObstacles(this.ball, dt, obstacles)

      // Detect wall/obstacle bounces (velocity direction reversed)
      this.detectBounce()

      // Check portal collisions
      this.checkPortalCollisions()

      // Check if ball entered hole
      if (this.physicsEngine.isInHole(this.ball, this.level.hole)) {
        this.onHoleComplete()
        return
      }

      // Check if ball stopped
      if (this.ball.isStopped) {
        this.ballMoving = false
        this.ball.stop()
        this.callbacks.onBallStopped()
      }
    }

    // Update ball image position
    if (this.ballImage) {
      this.ballImage.setPosition(this.ball.pos.x, this.ball.pos.y)
    }

    this.drawAimLine()
  }

  // --- Input handlers ---

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.ballMoving) return

    this.isAiming = true
    this.aimStart = new Vec2(pointer.x, pointer.y)
    this.aimEnd = new Vec2(pointer.x, pointer.y)
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isAiming) return
    this.aimEnd = new Vec2(pointer.x, pointer.y)
  }

  private onPointerUp(_pointer: Phaser.Input.Pointer): void {
    if (!this.isAiming) return
    this.isAiming = false

    // Calculate impulse from aim
    const delta = this.aimStart.sub(this.aimEnd)
    const power = Math.min(delta.length(), GAME_CONFIG.MAX_POWER)
    const minPower = GAME_CONFIG.MIN_POWER

    if (power < minPower) {
      this.aimLine.clear()
      return
    }

    // Apply power upgrade
    const powerMult = GAME_CONFIG.UPGRADES.power.effect(this.callbacks.getState().upgrades.power)
    const adjustedPower = power * powerMult

    // Normalize and scale
    const direction = delta.normalize()
    const impulse = direction.scale(adjustedPower)

    this.ball.applyImpulse(impulse)
    this.ballMoving = true
    this.strokes++

    audioEngine.play('add')

    this.callbacks.onStroke(this.level.id, this.strokes)
    this.updateHUD()

    // Clear aim line
    this.aimLine.clear()
  }

  // --- Sound ---

  private detectBounce(): void {
    // Check if velocity direction reversed on either axis (wall bounce)
    const bouncedX = (this.prevVelX > 0 && this.ball.vel.x < 0) || (this.prevVelX < 0 && this.ball.vel.x > 0)
    const bouncedY = (this.prevVelY > 0 && this.ball.vel.y < 0) || (this.prevVelY < 0 && this.ball.vel.y > 0)

    if (bouncedX || bouncedY) {
      audioEngine.play('tick')
    }
  }

  // --- Rendering ---

  private drawLevel(): void {
    const g = this.graphics
    g.clear()

    // Draw walls
    for (const wall of this.level.walls) {
      if (wall.solid === false) continue
      const color = wall.type === 'bounce' ? GAME_CONFIG.COLORS.BOUNCE_PAD : GAME_CONFIG.COLORS.WALL_GRAY
      g.fillStyle(color, 1)
      g.fillRoundedRect(wall.x, wall.y, wall.width, wall.height, 4)

      if (wall.type === 'bounce') {
        g.lineStyle(2, GAME_CONFIG.COLORS.NEON_PINK, 0.8)
        g.strokeRoundedRect(wall.x - 1, wall.y - 1, wall.width + 2, wall.height + 2, 4)
      }
    }

    // Draw circle obstacles
    for (const obs of this.level.obstacles) {
      if (obs.type === 'circle') {
        g.fillStyle(GAME_CONFIG.COLORS.WALL_GRAY, 0.8)
        g.fillCircle(obs.center.x, obs.center.y, obs.radius)
        g.lineStyle(2, GAME_CONFIG.COLORS.NEON_BLUE, 0.6)
        g.strokeCircle(obs.center.x, obs.center.y, obs.radius)
      } else if (obs.type === 'portal') {
        g.fillStyle(GAME_CONFIG.COLORS.NEON_PURPLE, 0.6)
        g.fillCircle(obs.center.x, obs.center.y, obs.radius)
        g.lineStyle(3, GAME_CONFIG.COLORS.NEON_PURPLE, 1)
        g.strokeCircle(obs.center.x, obs.center.y, obs.radius)

        if (obs.exit) {
          g.fillStyle(GAME_CONFIG.COLORS.NEON_PURPLE, 0.4)
          g.fillCircle(obs.exit.x, obs.exit.y, obs.radius * 0.8)
          g.lineStyle(2, GAME_CONFIG.COLORS.NEON_PURPLE, 0.8)
          g.strokeCircle(obs.exit.x, obs.exit.y, obs.radius * 0.8)
        }
      } else if (obs.type === 'wind') {
        g.fillStyle(GAME_CONFIG.COLORS.NEON_GREEN, 0.15)
        g.fillCircle(obs.center.x, obs.center.y, obs.radius)
        g.lineStyle(1, GAME_CONFIG.COLORS.NEON_GREEN, 0.4)
        g.strokeCircle(obs.center.x, obs.center.y, obs.radius)
      }
    }

    // If no hole texture, draw with graphics
    if (!this.textures.exists('hole')) {
      const hole = this.level.hole
      g.lineStyle(3, GAME_CONFIG.COLORS.NEON_GREEN, 0.8)
      g.strokeCircle(hole.center.x, hole.center.y, hole.radius + 4)
      g.fillStyle(GAME_CONFIG.COLORS.HOLE_BLACK, 1)
      g.fillCircle(hole.center.x, hole.center.y, hole.radius)
    }
  }

  private drawAimLine(): void {
    this.aimLine.clear()

    if (!this.isAiming) return

    const delta = this.aimStart.sub(this.aimEnd)
    const power = Math.min(delta.length(), GAME_CONFIG.MAX_POWER)

    if (power < GAME_CONFIG.MIN_POWER) return

    // Draw power indicator line from ball
    const direction = delta.normalize()
    const lineLength = power * 0.5

    const endX = this.ball.pos.x + direction.x * lineLength
    const endY = this.ball.pos.y + direction.y * lineLength

    // Dotted trajectory preview
    const powerMult = GAME_CONFIG.UPGRADES.power.effect(this.callbacks.getState().upgrades.power)
    const impulse = direction.scale(power * powerMult)
    this.trajectoryPoints = this.physicsEngine.predictTrajectory(this.ball, impulse, 30)

    // Draw trajectory dots
    for (let i = 0; i < this.trajectoryPoints.length; i++) {
      const p = this.trajectoryPoints[i]
      const alpha = 1 - (i / this.trajectoryPoints.length)
      this.aimLine.fillStyle(GAME_CONFIG.COLORS.NEON_GREEN, alpha * 0.6)
      this.aimLine.fillCircle(p.x, p.y, 2)
    }

    // Draw aim direction line
    this.aimLine.lineStyle(3, GAME_CONFIG.COLORS.NEON_GREEN, 0.8)
    this.aimLine.lineBetween(
      this.ball.pos.x, this.ball.pos.y,
      endX, endY,
    )

    // Power bar background
    const barWidth = 100
    const barHeight = 8
    const barX = this.ball.pos.x - barWidth / 2
    const barY = this.ball.pos.y - 25

    this.aimLine.fillStyle(0x333333, 0.8)
    this.aimLine.fillRect(barX, barY, barWidth, barHeight)

    // Power bar fill
    const powerRatio = power / GAME_CONFIG.MAX_POWER
    const barColor = powerRatio < 0.5 ? GAME_CONFIG.COLORS.NEON_GREEN
      : powerRatio < 0.8 ? GAME_CONFIG.COLORS.NEON_ORANGE
      : GAME_CONFIG.COLORS.NEON_PINK
    this.aimLine.fillStyle(barColor, 1)
    this.aimLine.fillRect(barX, barY, barWidth * powerRatio, barHeight)
  }

  // --- Game logic ---

  private checkPortalCollisions(): void {
    for (const obs of this.level.obstacles) {
      if (obs.type === 'portal' && obs.exit) {
        const dist = this.ball.pos.distanceTo(obs.center)
        if (dist < obs.radius) {
          this.ball.pos = obs.exit.clone()
          this.ball.stop()
          audioEngine.play('levelup')
          break
        }
      }
    }
  }

  private onHoleComplete(): void {
    this.ballMoving = false
    this.ball.stop()

    audioEngine.play('perfect')

    // Calculate stars
    const elapsed = (Date.now() - this.levelStartTime) / 1000
    const stars = [
      GAME_CONFIG.STAR_THRESHOLDS.par(this.level.par, this.strokes),
      GAME_CONFIG.STAR_THRESHOLDS.time(this.level.stars[1]?.target ?? 999, elapsed),
      GAME_CONFIG.STAR_THRESHOLDS.collect(this.level.stars[2]?.target ?? 0, 0),
    ]

    this.callbacks.onLevelComplete(this.level.id, this.strokes, stars)

    // Show result after brief delay
    this.time.delayedCall(500, () => {
      this.scene.start('ResultScene', {
        strokes: this.strokes,
        par: this.level.par,
        starsEarned: stars,
        levelId: this.level.id,
      })
    })
  }

  private updateHUD(): void {
    const parStatus = this.strokes <= this.level.par ? '✓' : ''
    this.hudText.setText(`Stroke: ${this.strokes}  Par: ${this.level.par} ${parStatus}`)
  }
}
