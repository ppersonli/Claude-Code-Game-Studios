import Phaser from 'phaser'
import {
  type RunnerState, createInitialState,
  jump, slide, updatePlayer, getPlayerHitbox,
  checkObstacleCollision, updateWorld, collectPearls, collectPowerUps,
  updatePowerUps, handleHit, getSpeedPercent, getPlayerHeight,
} from '../../logic/game-state'
import { saveProgress, loadSave } from '../../logic/save'
import { gameCoins, checkRunnerAchievements, type RunnerStats } from '../../logic/meta'
import {
  GAME_W, GAME_H, GROUND_Y, PLAYER_X, PLAYER_WIDTH,
  PLAYER_HEIGHT, PEARL_RADIUS, SLIDE_DURATION,
} from '../../logic/constants'
import { OBSTACLES } from '../../data/obstacles'
import { POWERUPS } from '../../data/powerups'
import { fadeIn, addHapticFeedback } from '../../../../shared/utils/poki-polish'


const COLORS = {
  SKY_TOP: 0x1a0a2e, SKY_BOT: 0x2d1b4e,
  GROUND: 0x3d2b1a, GROUND_LINE: 0x5d4b3a,
  PLAYER: 0xFF69B4, PLAYER_SLIDE: 0xCC5599,
  PEARL: 0x4E342E, PEARL_SHINE: 0x8D6E63,
  SHIELD: 0x4488FF, MAGNET: 0xFF4444, DOUBLE: 0xFFD700,
}

export class GameScene extends Phaser.Scene {
  state!: RunnerState
  private playerGfx!: Phaser.GameObjects.Graphics
  private worldGfx!: Phaser.GameObjects.Graphics
  private hudScore!: Phaser.GameObjects.Text
  private hudPearls!: Phaser.GameObjects.Text
  private hudSpeed!: Phaser.GameObjects.Text
  private hudPower!: Phaser.GameObjects.Text
  private bgTiles: { x: number }[] = []
  private groundOffset = 0
  private META_KEY = 'boba-runner-meta'
  private metaCoins = 0
  private metaUnlockedThemes: string[] = ['classic']
  private metaAchievements: string[] = []
  private metaStats: RunnerStats = {
    totalScore: 0, highScore: 0, totalPearls: 0, totalDistance: 0,
    totalJumps: 0, totalSlides: 0, shieldsUsed: 0,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0,
  }
  private metaLastDaily = ''
  private sessionJumps = 0
  private sessionSlides = 0

  constructor() { super({ key: 'GameScene' }) }

  create(): void {
    fadeIn(this)
    const save = loadSave()
    this.state = createInitialState(save.highScore)
    this.bgTiles = []
    for (let x = 0; x < GAME_W + 100; x += 80) this.bgTiles.push({ x })
    this.loadMeta()
    this.metaStats.gamesPlayed++
    this.sessionJumps = 0
    this.sessionSlides = 0

    this.drawStaticBg()
    this.worldGfx = this.add.graphics()
    this.playerGfx = this.add.graphics()
    this.createHUD()
    this.setupInput()
  }

  private drawStaticBg(): void {
    const bg = this.add.graphics()
    bg.fillGradientStyle(COLORS.SKY_TOP, COLORS.SKY_TOP, COLORS.SKY_BOT, COLORS.SKY_BOT, 1)
    bg.fillRect(0, 0, GAME_W, GROUND_Y)
    bg.fillStyle(COLORS.GROUND, 1)
    bg.fillRect(0, GROUND_Y, GAME_W, GAME_H - GROUND_Y)
    bg.lineStyle(2, COLORS.GROUND_LINE, 1)
    bg.lineBetween(0, GROUND_Y, GAME_W, GROUND_Y)
  }

  private createHUD(): void {
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.4).fillRoundedRect(8, 8, GAME_W - 16, 50, 10)
    this.hudScore = this.add.text(16, 16, '0', { fontSize: '20px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold' })
    this.hudPearls = this.add.text(16, 38, '🟤 0', { fontSize: '13px', fontFamily: 'Arial', color: '#8D6E63' })
    this.hudSpeed = this.add.text(GAME_W - 16, 16, '', { fontSize: '12px', fontFamily: 'Arial', color: '#66bb6a' }).setOrigin(1, 0)
    this.hudPower = this.add.text(GAME_W - 16, 34, '', { fontSize: '11px', fontFamily: 'Arial', color: '#e056fd' }).setOrigin(1, 0)
  }

  private setupInput(): void {
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.state.gameOver) return
      if (ptr.y > GAME_H / 2) { slide(this.state, this.time.now); this.sessionSlides++ }
      else { jump(this.state); this.sessionJumps++; addHapticFeedback('light') }
    })
    this.input.keyboard?.on('keydown-SPACE', () => { if (!this.state.gameOver) { jump(this.state); this.sessionJumps++ } })
    this.input.keyboard?.on('keydown-DOWN', () => { if (!this.state.gameOver) { slide(this.state, this.time.now); this.sessionSlides++ } })
  }

  update(_time: number, _delta: number): void {
    if (this.state.gameOver) return
    const now = this.time.now

    updatePlayer(this.state, now)
    updateWorld(this.state, GAME_W)
    collectPearls(this.state)
    const puType = collectPowerUps(this.state, now)
    updatePowerUps(this.state, now)

    // Check obstacle collision
    const hit = checkObstacleCollision(this.state)
    if (hit) {
      const died = handleHit(this.state)
      if (died) {
        saveProgress(this.state.score, this.state.pearls)
        this.updateMetaOnGameOver()
        this.cameras.main.shake(200, 0.01)
        this.time.delayedCall(800, () => {
          this.scene.start('ResultScene', {
            score: this.state.score,
            pearls: this.state.pearls,
            highScore: this.state.highScore,
            distance: Math.floor(this.state.distance),
            metaCoins: this.metaCoins,
          })
        })
      }
    }

    // Scroll background
    this.groundOffset = (this.groundOffset + this.state.speed) % 40

    this.drawWorld()
    this.drawPlayer()
    this.updateHUD()
  }

  private drawWorld(): void {
    this.worldGfx.clear()

    // Ground pattern
    this.worldGfx.fillStyle(0x4d3b2a, 0.5)
    for (let x = -this.groundOffset; x < GAME_W; x += 40) {
      this.worldGfx.fillRect(x, GROUND_Y + 5, 20, 5)
    }

    // Obstacles
    for (const obs of this.state.obstacles) {
      const def = OBSTACLES.find(o => o.id === obs.type)
      this.worldGfx.fillStyle(def?.color ?? 0x888888, 1)
      this.worldGfx.fillRoundedRect(obs.x, obs.y, obs.width, obs.height, 4)
      this.worldGfx.lineStyle(1, 0xffffff, 0.2)
      this.worldGfx.strokeRoundedRect(obs.x, obs.y, obs.width, obs.height, 4)
      // Emoji label
      this.worldGfx.fillStyle(0xffffff, 1)
    }

    // Pearls
    for (const p of this.state.pearlEntities) {
      if (p.collected) continue
      this.worldGfx.fillStyle(COLORS.PEARL, 1)
      this.worldGfx.fillCircle(p.x, p.y, PEARL_RADIUS)
      this.worldGfx.fillStyle(COLORS.PEARL_SHINE, 0.5)
      this.worldGfx.fillCircle(p.x - 3, p.y - 3, PEARL_RADIUS * 0.4)
    }

    // Power-ups
    for (const pu of this.state.powerUpEntities) {
      if (pu.collected) continue
      const def = POWERUPS.find(p => p.id === pu.type)
      this.worldGfx.fillStyle(def?.color ?? 0xffffff, 0.9)
      this.worldGfx.fillCircle(pu.x, pu.y, 14)
      this.worldGfx.lineStyle(2, 0xffffff, 0.4)
      this.worldGfx.strokeCircle(pu.x, pu.y, 14)
    }
  }

  private drawPlayer(): void {
    this.playerGfx.clear()
    const h = getPlayerHeight(this.state)
    const y = this.state.playerY

    // Shield glow
    if (this.state.shieldActive) {
      this.playerGfx.fillStyle(COLORS.SHIELD, 0.2)
      this.playerGfx.fillCircle(PLAYER_X + PLAYER_WIDTH / 2, y + h / 2, 30)
    }

    // Player body
    const color = this.state.playerState === 'sliding' ? COLORS.PLAYER_SLIDE : COLORS.PLAYER
    this.playerGfx.fillStyle(color, 1)
    this.playerGfx.fillRoundedRect(PLAYER_X, y, PLAYER_WIDTH, h, 8)

    // Face
    this.playerGfx.fillStyle(0xffffff, 1)
    this.playerGfx.fillCircle(PLAYER_X + 12, y + 12, 3)
    this.playerGfx.fillCircle(PLAYER_X + 24, y + 12, 3)
    this.playerGfx.fillStyle(0x222222, 1)
    this.playerGfx.fillCircle(PLAYER_X + 12, y + 12, 1.5)
    this.playerGfx.fillCircle(PLAYER_X + 24, y + 12, 1.5)

    // Boba cup on head
    if (this.state.playerState !== 'sliding') {
      this.playerGfx.fillStyle(0xffffff, 0.3)
      this.playerGfx.fillRoundedRect(PLAYER_X + 8, y - 12, 20, 14, 4)
      this.worldGfx.fillStyle(COLORS.PEARL, 1)
      this.worldGfx.fillCircle(PLAYER_X + 14, y - 3, 3)
      this.worldGfx.fillCircle(PLAYER_X + 22, y - 5, 3)
    }
  }

  private updateHUD(): void {
    this.hudScore.setText(`${this.state.score}`)
    this.hudPearls.setText(`🟤 ${this.state.pearls}`)
    const pct = Math.floor(getSpeedPercent(this.state) * 100)
    this.hudSpeed.setText(`速度 ${pct}%`)
    const powers = this.state.activePowerUps.map(p => {
      const rem = Math.max(0, Math.floor((p.endsAt - this.time.now) / 1000))
      const def = POWERUPS.find(d => d.id === p.type)
      return `${def?.emoji ?? '?'} ${rem}s`
    })
    const shield = this.state.shieldActive ? '🛡️ ' : ''
    this.hudPower.setText(shield + powers.join(' '))
  }

  // ─── Meta persistence ──────────────────────────────────────────────────

  private loadMeta(): void {
    try {
      const raw = localStorage.getItem(this.META_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        this.metaCoins = data.coins ?? 0
        this.metaUnlockedThemes = Array.isArray(data.unlockedThemes) ? data.unlockedThemes : ['classic']
        this.metaAchievements = Array.isArray(data.achievements) ? data.achievements : []
        this.metaStats = { ...this.metaStats, ...(data.stats ?? {}) }
        this.metaLastDaily = data.lastDailyDate ?? ''
      }
    } catch { /* corrupted */ }
  }

  private saveMeta(): void {
    try {
      localStorage.setItem(this.META_KEY, JSON.stringify({
        coins: this.metaCoins,
        unlockedThemes: this.metaUnlockedThemes,
        achievements: this.metaAchievements,
        stats: this.metaStats,
        lastDailyDate: this.metaLastDaily,
      }))
    } catch { /* */ }
  }

  private updateMetaOnGameOver(): void {
    this.metaStats.totalScore += this.state.score
    this.metaStats.highScore = Math.max(this.metaStats.highScore, this.state.score)
    this.metaStats.totalPearls += this.state.pearls
    this.metaStats.totalDistance += Math.floor(this.state.distance)
    this.metaStats.totalJumps += this.sessionJumps
    this.metaStats.totalSlides += this.sessionSlides
    const earnedCoins = gameCoins(this.state.score, this.state.pearls)
    this.metaCoins += earnedCoins
    const newAchievements = checkRunnerAchievements(this.metaStats, this.metaAchievements)
    for (const a of newAchievements) {
      this.metaAchievements.push(a.id)
      this.metaCoins += a.reward
    }
    this.saveMeta()
  }
}
