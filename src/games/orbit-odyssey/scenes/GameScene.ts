/**
 * Main game scene for Orbit Odyssey
 * Handles physics simulation, rendering, and gameplay
 */
import Phaser from 'phaser'
import { GAME_CONFIG } from '../config'
import { STAR_SYSTEMS, type PlanetDef } from '../data/planets'
import { SaveSystem } from '../systems/SaveSystem'

interface CelestialBody {
  sprite: Phaser.GameObjects.Arc
  glow: Phaser.GameObjects.Arc
  label: Phaser.GameObjects.Text
  data: PlanetDef
}

interface ResourceOrb {
  sprite: Phaser.GameObjects.Arc
  value: number
  type: 'stardust' | 'crystal' | 'plasma' | 'void'
}

export class GameScene extends Phaser.Scene {
  private saveSystem!: SaveSystem
  private ship!: Phaser.GameObjects.Triangle
  private shipTrail!: Phaser.GameObjects.Graphics
  private planets: CelestialBody[] = []
  private resourceOrbs: ResourceOrb[] = []
  private trajectoryLine!: Phaser.GameObjects.Graphics
  private starField!: Phaser.GameObjects.Graphics
  private launchParticles!: Phaser.GameObjects.Graphics
  private collectParticles!: Phaser.GameObjects.Graphics

  // Game state
  private isLaunching = false
  private isFlying = false
  private isAiming = false
  private aimAngle = -Math.PI / 4
  private launchSpeed = 300

  // Ship physics
  private shipVx = 0
  private shipVy = 0
  private shipTrailPoints: { x: number; y: number }[] = []

  // Particle effects
  private launchBurstParticles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number; size: number }[] = []
  private collectSparkles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number; size: number }[] = []

  // Flight stats
  private flightDistance = 0
  private flightStardust = 0
  private flightStartTime = 0
  private flightLaunchAngle = 0
  private flightLaunchSpeed = 0
  private flightLaunchCount = 0

  // UI callbacks
  private onStateChange?: (state: string) => void
  private onFlightUpdate?: (dist: number, stardust: number) => void
  private onFlightEnd?: (data: {
    distance: number
    stardust: number
    angle: number
    speed: number
    launchCount: number
    usedAutoLaunch: boolean
  }) => void

  // Current star system
  private currentSystemIndex = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: {
    saveSystem: SaveSystem
    onStateChange?: (state: string) => void
    onFlightUpdate?: (dist: number, stardust: number) => void
    onFlightEnd?: (data: {
      distance: number
      stardust: number
      angle: number
      speed: number
      launchCount: number
      usedAutoLaunch: boolean
    }) => void
  }) {
    this.saveSystem = data.saveSystem
    this.onStateChange = data.onStateChange
    this.onFlightUpdate = data.onFlightUpdate
    this.onFlightEnd = data.onFlightEnd
  }

  create() {
    const { width, height } = this.scale

    // Draw starfield background
    this.drawStarField(width, height)

    // Create trajectory line
    this.trajectoryLine = this.add.graphics()

    // Create ship trail
    this.shipTrail = this.add.graphics()

    // Create particle layers
    this.launchParticles = this.add.graphics()
    this.launchParticles.setDepth(8)
    this.collectParticles = this.add.graphics()
    this.collectParticles.setDepth(12)

    // Load current star system
    this.loadStarSystem()

    // Create ship
    this.createShip(width, height)

    // Generate initial resource orbs
    this.generateResourceOrbs()

    // Input handling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isFlying) {
        this.isAiming = true
        this.updateAim(pointer)
      }
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isAiming) {
        this.updateAim(pointer)
      }
    })

    this.input.on('pointerup', () => {
      if (this.isAiming) {
        this.isAiming = false
        this.launch()
      }
    })

    // Keyboard support
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.isFlying && !this.isAiming) {
        this.isAiming = true
        this.aimAngle = -Math.PI / 4
        this.updateTrajectory()
      }
    })

    this.input.keyboard?.on('keyup-SPACE', () => {
      if (this.isAiming) {
        this.isAiming = false
        this.launch()
      }
    })

    this.emitState('idle')
  }

  update(_time: number, delta: number) {
    if (this.isFlying) {
      this.updateFlight(delta)
    }

    // Animate planets (subtle pulse)
    this.planets.forEach(p => {
      const pulse = 1 + Math.sin(_time / 1000 + p.data.x) * 0.03
      p.glow.setScale(pulse)
    })

    // Update particle effects
    this.updateParticles(delta)
  }

  private drawStarField(width: number, height: number) {
    this.starField = this.add.graphics()
    const system = STAR_SYSTEMS[this.currentSystemIndex]
    this.starField.fillStyle(system.bgColor)
    this.starField.fillRect(0, 0, width, height)

    // Random stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const size = Math.random() * 2 + 0.5
      const alpha = Math.random() * 0.8 + 0.2
      this.starField.fillStyle(0xffffff, alpha)
      this.starField.fillCircle(x, y, size)
    }
  }

  private loadStarSystem() {
    // Clear existing planets
    this.planets.forEach(p => {
      p.sprite.destroy()
      p.glow.destroy()
      p.label.destroy()
    })
    this.planets = []

    const system = STAR_SYSTEMS[this.currentSystemIndex]
    const { width, height } = this.scale

    system.planets.forEach(planet => {
      // Scale planet positions to screen
      const px = (planet.x / 800) * width
      const py = (planet.y / 600) * height

      // Glow effect
      const glow = this.add.circle(px, py, planet.radius * 1.8, planet.glowColor, 0.2)
      // Planet body
      const sprite = this.add.circle(px, py, planet.radius, planet.color)
      // Label
      const label = this.add.text(px, py + planet.radius + 8, planet.name, {
        fontFamily: 'Exo 2',
        fontSize: '10px',
        color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5, 0)

      this.planets.push({ sprite, glow, label, data: planet })
    })
  }

  private createShip(width: number, height: number) {
    const shipConfig = GAME_CONFIG.SHIPS.find(s => s.id === this.saveSystem.getState().activeShip) || GAME_CONFIG.SHIPS[0]
    this.ship = this.add.triangle(width * 0.15, height * 0.75, 0, -12, -8, 12, 8, 12, shipConfig.color)
    this.ship.setDepth(10)
  }

  private generateResourceOrbs() {
    // Clear existing
    this.resourceOrbs.forEach(o => o.sprite.destroy())
    this.resourceOrbs = []

    const { width, height } = this.scale
    const system = STAR_SYSTEMS[this.currentSystemIndex]

    // Generate orbs near planets
    system.planets.forEach(planet => {
      const px = (planet.x / 800) * width
      const py = (planet.y / 600) * height
      const count = Phaser.Math.Between(3, 6)

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = planet.radius + 15 + Math.random() * 40
        const ox = px + Math.cos(angle) * dist
        const oy = py + Math.sin(angle) * dist

        let color: number
        switch (planet.resourceType) {
          case 'crystal': color = GAME_CONFIG.COLORS.NEON_PURPLE; break
          case 'plasma': color = GAME_CONFIG.COLORS.PLANET_FIRE; break
          case 'void': color = GAME_CONFIG.COLORS.PLANET_VOID; break
          default: color = GAME_CONFIG.COLORS.STARDUST_GOLD; break
        }

        const sprite = this.add.circle(ox, oy, 4, color, 0.8)
        sprite.setDepth(5)

        this.resourceOrbs.push({
          sprite,
          value: planet.resourceValue,
          type: planet.resourceType,
        })
      }
    })
  }

  private updateAim(pointer: Phaser.Input.Pointer) {
    const { width, height } = this.scale
    const shipX = width * 0.15
    const shipY = height * 0.75

    this.aimAngle = Phaser.Math.Angle.Between(shipX, shipY, pointer.x, pointer.y)

    // Clamp angle (only allow upward launches)
    if (this.aimAngle > 0) {
      this.aimAngle = this.aimAngle > Math.PI / 2 ? -Math.PI * 0.9 : -Math.PI * 0.1
    }

    // Calculate launch speed based on distance from ship
    const dist = Phaser.Math.Distance.Between(shipX, shipY, pointer.x, pointer.y)
    const powerLevel = this.saveSystem.getUpgradeLevel('launchPower')
    const maxSpeed = GAME_CONFIG.MAX_LAUNCH_SPEED + powerLevel * GAME_CONFIG.LAUNCH_POWER_PER_LEVEL
    this.launchSpeed = Phaser.Math.Clamp(dist * 2, GAME_CONFIG.MIN_LAUNCH_SPEED, maxSpeed)

    this.updateTrajectory()
  }

  private updateTrajectory() {
    this.trajectoryLine.clear()

    const { width, height } = this.scale
    const startX = width * 0.15
    const startY = height * 0.75

    // Draw aim line
    this.trajectoryLine.lineStyle(2, GAME_CONFIG.COLORS.NEON_BLUE, 0.5)
    this.trajectoryLine.beginPath()
    this.trajectoryLine.moveTo(startX, startY)

    const lineLen = 80
    const endX = startX + Math.cos(this.aimAngle) * lineLen
    const endY = startY + Math.sin(this.aimAngle) * lineLen
    this.trajectoryLine.lineTo(endX, endY)
    this.trajectoryLine.strokePath()

    // Draw power indicator
    const powerRatio = (this.launchSpeed - GAME_CONFIG.MIN_LAUNCH_SPEED) /
      (GAME_CONFIG.MAX_LAUNCH_SPEED - GAME_CONFIG.MIN_LAUNCH_SPEED)
    const indicatorColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(0, 212, 255),
      new Phaser.Display.Color(255, 45, 149),
      100,
      Math.floor(powerRatio * 100)
    )
    const color = Phaser.Display.Color.GetColor(indicatorColor.r, indicatorColor.g, indicatorColor.b)

    this.trajectoryLine.fillStyle(color, 0.8)
    this.trajectoryLine.fillCircle(endX, endY, 4 + powerRatio * 4)
  }

  private launch() {
    this.trajectoryLine.clear()
    this.isFlying = true
    this.flightDistance = 0
    this.flightStardust = 0
    this.flightStartTime = this.time.now
    this.flightLaunchAngle = this.aimAngle
    this.flightLaunchSpeed = this.launchSpeed
    this.flightLaunchCount++
    this.shipTrailPoints = []

    this.shipVx = Math.cos(this.aimAngle) * this.launchSpeed
    this.shipVy = Math.sin(this.aimAngle) * this.launchSpeed

    // Emit launch burst particles
    const { width, height } = this.scale
    this.emitLaunchBurst(width * 0.15, height * 0.75, this.aimAngle, this.launchSpeed)

    this.emitState('flying')
  }

  private updateFlight(delta: number) {
    const dt = delta / 1000
    const { width, height } = this.scale

    const gravityResistLevel = this.saveSystem.getUpgradeLevel('gravityResist')
    const resistFactor = 1 - (gravityResistLevel * 0.02) // 2% per level

    // Apply gravity from each planet
    this.planets.forEach(planet => {
      const dx = planet.sprite.x - this.ship.x
      const dy = planet.sprite.y - this.ship.y
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq)

      if (dist < planet.data.radius * 3) {
        const force = (GAME_CONFIG.GRAVITY_CONSTANT * planet.data.mass * resistFactor) / distSq
        const ax = (dx / dist) * force
        const ay = (dy / dist) * force
        this.shipVx += ax * dt
        this.shipVy += ay * dt
      }
    })

    // Update position
    const dx = this.shipVx * dt
    const dy = this.shipVy * dt
    this.ship.x += dx
    this.ship.y += dy
    this.flightDistance += Math.sqrt(dx * dx + dy * dy)

    // Rotate ship to face velocity direction
    this.ship.rotation = Math.atan2(this.shipVy, this.shipVx) + Math.PI / 2

    // Trail
    this.shipTrailPoints.push({ x: this.ship.x, y: this.ship.y })
    if (this.shipTrailPoints.length > 50) this.shipTrailPoints.shift()
    this.drawTrail()

    // Check resource collection
    this.checkResourceCollection()

    // Check if ship is out of bounds
    if (this.ship.x < -50 || this.ship.x > width + 50 ||
        this.ship.y < -50 || this.ship.y > height + 50) {
      this.endFlight()
    }

    // Update UI
    this.onFlightUpdate?.(Math.floor(this.flightDistance), this.flightStardust)
  }

  private drawTrail() {
    this.shipTrail.clear()

    for (let i = 0; i < this.shipTrailPoints.length; i++) {
      const p = this.shipTrailPoints[i]
      const alpha = i / this.shipTrailPoints.length * 0.5
      const size = 1 + (i / this.shipTrailPoints.length) * 3
      this.shipTrail.fillStyle(GAME_CONFIG.COLORS.NEON_BLUE, alpha)
      this.shipTrail.fillCircle(p.x, p.y, size)
    }
  }

  private checkResourceCollection() {
    const magnetLevel = this.saveSystem.getUpgradeLevel('stardustMagnet')
    const collectionRadius = 20 + magnetLevel * 5

    for (let i = this.resourceOrbs.length - 1; i >= 0; i--) {
      const orb = this.resourceOrbs[i]
      const dist = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, orb.sprite.x, orb.sprite.y)

      if (dist < collectionRadius) {
        this.flightStardust += orb.value

        // Emit collection sparkle particles
        this.emitCollectSparkle(orb.sprite.x, orb.sprite.y, orb.sprite.fillColor)

        // Collection animation
        this.tweens.add({
          targets: orb.sprite,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 200,
          onComplete: () => orb.sprite.destroy(),
        })

        this.resourceOrbs.splice(i, 1)
      }
    }
  }

  private endFlight() {
    this.isFlying = false

    // Save progress
    this.saveSystem.addStardust(this.flightStardust)
    this.saveSystem.recordLaunch(this.flightDistance)

    // Reset ship position
    const { width, height } = this.scale
    this.ship.setPosition(width * 0.15, height * 0.75)
    this.ship.setRotation(0)
    this.shipTrail.clear()
    this.shipTrailPoints = []
    this.launchBurstParticles = []
    this.collectSparkles = []
    this.launchParticles.clear()
    this.collectParticles.clear()

    // Generate new resource orbs
    this.generateResourceOrbs()

    this.onFlightEnd?.({
      distance: Math.floor(this.flightDistance),
      stardust: this.flightStardust,
      angle: this.flightLaunchAngle,
      speed: this.flightLaunchSpeed,
      launchCount: this.flightLaunchCount,
      usedAutoLaunch: false,
    })
    this.emitState('idle')
  }

  private emitState(state: string) {
    this.onStateChange?.(state)
  }

  // ─── Particle Effects ────────────────────────────────────

  private emitLaunchBurst(x: number, y: number, angle: number, speed: number) {
    const count = 12 + Math.floor(speed / 50)
    const shipConfig = GAME_CONFIG.SHIPS.find(s => s.id === this.saveSystem.getState().activeShip) || GAME_CONFIG.SHIPS[0]
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.2
      const vel = speed * 0.3 + Math.random() * speed * 0.5
      this.launchBurstParticles.push({
        x,
        y,
        vx: Math.cos(angle + Math.PI + spread) * vel,
        vy: Math.sin(angle + Math.PI + spread) * vel,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.4 + Math.random() * 0.3,
        color: i % 3 === 0 ? GAME_CONFIG.COLORS.NEON_BLUE : shipConfig.color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  private emitCollectSparkle(x: number, y: number, color: number) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 30 + Math.random() * 60
      this.collectSparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.3 + Math.random() * 0.2,
        color,
        size: 1.5 + Math.random() * 2,
      })
    }
  }

  private updateParticles(delta: number) {
    const dt = delta / 1000

    // Update launch burst
    this.launchParticles.clear()
    for (let i = this.launchBurstParticles.length - 1; i >= 0; i--) {
      const p = this.launchBurstParticles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.96
      p.vy *= 0.96
      p.life -= dt
      if (p.life <= 0) {
        this.launchBurstParticles.splice(i, 1)
        continue
      }
      const alpha = p.life / p.maxLife
      const size = p.size * alpha
      this.launchParticles.fillStyle(p.color, alpha)
      this.launchParticles.fillCircle(p.x, p.y, size)
    }

    // Update collect sparkles
    this.collectParticles.clear()
    for (let i = this.collectSparkles.length - 1; i >= 0; i--) {
      const p = this.collectSparkles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.92
      p.vy *= 0.92
      p.life -= dt
      if (p.life <= 0) {
        this.collectSparkles.splice(i, 1)
        continue
      }
      const alpha = p.life / p.maxLife
      const size = p.size * (0.5 + alpha * 0.5)
      this.collectParticles.fillStyle(p.color, alpha)
      this.collectParticles.fillCircle(p.x, p.y, size)
    }
  }

  /** Switch to a different star system */
  switchStarSystem(index: number) {
    if (index >= 0 && index < STAR_SYSTEMS.length) {
      this.currentSystemIndex = index
      const { width, height } = this.scale

      // Redraw background
      this.starField.destroy()
      this.drawStarField(width, height)

      // Reload planets
      this.loadStarSystem()
      this.generateResourceOrbs()
    }
  }

  /** Get current star system info */
  getCurrentSystem() {
    return STAR_SYSTEMS[this.currentSystemIndex]
  }
}
