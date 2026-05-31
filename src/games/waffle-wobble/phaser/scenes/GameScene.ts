import Phaser from 'phaser'
import {
  type GameState, type Customer,
  createInitialState, spawnCustomer, getSpawnInterval,
  startCooking, checkWaffleDone, checkWaffleBurned,
  addToppingToWaffle, discardWaffle, serveToCustomer,
  updateCustomerPatience, canUnlockTopping, unlockTopping,
} from '../../logic/game-state'
import { TOPPINGS, getToppingById, MAX_TOPPINGS_PER_ORDER } from '../../data/toppings'
import { COOK_TIME, BURN_TIME, LEVEL_DURATION, GAME_W, GAME_H, SERVE_ANIM_TIME } from '../../logic/constants'
import { saveGame, loadGame } from '../../logic/save'
import { checkWaffleAchievements, type WaffleStats } from '../../logic/meta'

const COLORS = {
  BG: 0xFFF5E6,
  BROWN: 0x8B4513,
  BROWN_LIGHT: 0xD2691E,
  GOLD: 0xFFD700,
  RED: 0xE53935,
  GREEN: 0x4CAF50,
  PINK: 0xFF69B4,
  CREAM: 0xFFF8DC,
  WHITE: 0xFFFFFF,
}

export class GameScene extends Phaser.Scene {
  state!: GameState
  private lastSpawnTime = 0
  private customerSlots: { x: number; y: number }[] = []
  private META_KEY = 'waffle-wobble-meta'
  private metaCoins = 0
  private metaUnlockedThemes: string[] = ['classic']
  private metaAchievements: string[] = []
  private metaStats: WaffleStats = {
    totalServed: 0, perfectServed: 0, totalLost: 0, highestLevel: 0,
    bestCombo: 0, totalCoinsEarned: 0, toppingsUnlocked: 2,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0,
  }
  private metaLastDaily = ''

  // UI refs
  private scoreText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private livesGfx!: Phaser.GameObjects.Graphics
  private timerText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private ironGfx!: Phaser.GameObjects.Graphics
  private ironStatusText!: Phaser.GameObjects.Text
  private ironProgressBar!: Phaser.GameObjects.Graphics
  private toppingButtons: { id: string; zone: Phaser.GameObjects.Zone; gfx: Phaser.GameObjects.Graphics }[] = []
  private customerDisplays: { customer: Customer; container: Phaser.GameObjects.Container }[] = []
  private serveMode = false
  private levelStart = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    const saved = loadGame()
    this.state = { ...createInitialState(), ...saved, customers: [], waffle: { state: 'empty', startedAt: 0, addedToppings: [] }, gameOver: false, paused: false }
    this.loadMeta()
    this.metaStats.gamesPlayed++
    this.customerSlots = [
      { x: 80, y: 140 },
      { x: 240, y: 140 },
      { x: 400, y: 140 },
    ]
    this.serveMode = false
    this.lastSpawnTime = 0
    this.levelStart = this.time.now

    this.drawBackground()
    this.createHUD()
    this.createWaffleIron()
    this.createToppingShelf()
    this.updateUI()
  }

  // ─── Background ──────────────────────────────────────────────────────────

  private drawBackground(): void {
    const gfx = this.add.graphics()
    gfx.fillGradientStyle(0xFFE4B5, 0xFFE4B5, 0xFFDAB9, 0xFFDAB9, 1)
    gfx.fillRect(0, 0, GAME_W, GAME_H)

    // Floor tiles pattern
    gfx.fillStyle(0xF5DEB3, 0.3)
    for (let x = 0; x < GAME_W; x += 40) {
      for (let y = 400; y < GAME_H; y += 40) {
        gfx.fillRect(x, y, 38, 38)
      }
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private createHUD(): void {
    const hudBg = this.add.graphics()
    hudBg.fillStyle(0x8B4513, 0.9)
    hudBg.fillRoundedRect(0, 0, GAME_W, 48, { tl: 0, tr: 0, bl: 12, br: 12 })

    this.scoreText = this.add.text(10, 12, '💰 0', { fontSize: '18px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold' })
    this.levelText = this.add.text(140, 12, 'Lv.1', { fontSize: '16px', fontFamily: 'Arial', color: '#FFF' })
    this.livesGfx = this.add.graphics()
    this.comboText = this.add.text(300, 12, '', { fontSize: '14px', fontFamily: 'Arial', color: '#FF69B4' })
    this.timerText = this.add.text(GAME_W - 10, 12, '', { fontSize: '14px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(1, 0)
  }

  private updateUI(): void {
    this.scoreText.setText(`💰 ${this.state.coins}`)
    this.levelText.setText(`Lv.${this.state.level}`)
    this.comboText.setText(this.state.combo > 1 ? `🔥 x${this.state.combo}` : '')

    // Lives
    this.livesGfx.clear()
    for (let i = 0; i < 3; i++) {
      this.livesGfx.fillStyle(i < this.state.lives ? 0xFF4444 : 0x666666, 1)
      this.livesGfx.fillCircle(250 + i * 18, 22, 6)
    }

    // Timer
    const remaining = Math.max(0, Math.floor(this.state.levelTimer / 1000))
    this.timerText.setText(`⏰ ${remaining}s`)
  }

  // ─── Waffle Iron ─────────────────────────────────────────────────────────

  private createWaffleIron(): void {
    const cx = GAME_W / 2, cy = 350

    // Iron body
    this.ironGfx = this.add.graphics()
    this.drawIron(cx, cy)

    // Status text
    this.ironStatusText = this.add.text(cx, cy + 65, '点击开始烤华夫饼', {
      fontSize: '14px', fontFamily: 'Arial', color: '#8B4513', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Progress bar
    this.ironProgressBar = this.add.graphics()
    this.ironProgressBar.setPosition(cx - 60, cy + 80)

    // Tap zone
    const zone = this.add.zone(cx, cy, 140, 120).setInteractive()
    zone.on('pointerdown', () => this.handleIronTap())
  }

  private drawIron(cx: number, cy: number): void {
    this.ironGfx.clear()
    const w = this.state.waffle.state

    // Iron base
    this.ironGfx.fillStyle(0x555555, 1)
    this.ironGfx.fillRoundedRect(cx - 65, cy - 55, 130, 100, 12)
    this.ironGfx.fillStyle(0x444444, 1)
    this.ironGfx.fillRoundedRect(cx - 55, cy - 45, 110, 80, 8)

    // Waffle inside
    if (w === 'cooking') {
      this.ironGfx.fillStyle(0xF5DEB3, 0.6)
      this.ironGfx.fillRoundedRect(cx - 45, cy - 35, 90, 60, 6)
    } else if (w === 'done') {
      this.ironGfx.fillStyle(0xDAA520, 1)
      this.ironGfx.fillRoundedRect(cx - 45, cy - 35, 90, 60, 6)
      // Grid pattern
      this.ironGfx.lineStyle(1, 0xCC8800, 0.5)
      for (let i = 0; i < 4; i++) {
        this.ironGfx.lineBetween(cx - 45 + i * 22, cy - 35, cx - 45 + i * 22, cy + 25)
        this.ironGfx.lineBetween(cx - 45, cy - 35 + i * 15, cx + 45, cy - 35 + i * 15)
      }
      // Show added toppings as dots
      const toppings = this.state.waffle.addedToppings
      toppings.forEach((id, i) => {
        const t = getToppingById(id)
        this.ironGfx.fillStyle(t.color, 1)
        this.ironGfx.fillCircle(cx - 25 + i * 25, cy, 8)
      })
    } else if (w === 'burned') {
      this.ironGfx.fillStyle(0x333333, 1)
      this.ironGfx.fillRoundedRect(cx - 45, cy - 35, 90, 60, 6)
      this.ironGfx.fillStyle(0x222222, 0.5)
      this.ironGfx.fillRoundedRect(cx - 40, cy - 30, 80, 50, 4)
    }
  }

  private handleIronTap(): void {
    const now = this.time.now
    const w = this.state.waffle

    if (w.state === 'empty') {
      startCooking(this.state, now)
      this.updateIronUI(now)
    } else if (w.state === 'burned') {
      discardWaffle(this.state)
      this.updateIronUI(now)
      this.ironStatusText.setText('点击开始烤华夫饼')
    } else if (w.state === 'done' && w.addedToppings.length === 0) {
      // Tap iron when done but no toppings → discard
      discardWaffle(this.state)
      this.updateIronUI(now)
      this.ironStatusText.setText('点击开始烤华夫饼')
    }
  }

  private updateIronUI(now: number): void {
    const cx = GAME_W / 2, cy = 350
    this.drawIron(cx, cy)

    this.ironProgressBar.clear()
    const w = this.state.waffle

    if (w.state === 'cooking') {
      const progress = Math.min(1, (now - w.startedAt) / COOK_TIME)
      this.ironProgressBar.fillStyle(0x333333, 1)
      this.ironProgressBar.fillRoundedRect(0, 0, 120, 8, 4)
      this.ironProgressBar.fillStyle(COLORS.GOLD, 1)
      this.ironProgressBar.fillRoundedRect(0, 0, 120 * progress, 8, 4)
      this.ironStatusText.setText('烤制中...')
    } else if (w.state === 'done') {
      const elapsed = now - w.startedAt
      const burnProgress = Math.min(1, (elapsed - COOK_TIME) / (BURN_TIME - COOK_TIME))
      this.ironProgressBar.fillStyle(0x333333, 1)
      this.ironProgressBar.fillRoundedRect(0, 0, 120, 8, 4)
      this.ironProgressBar.fillStyle(burnProgress > 0.7 ? COLORS.RED : COLORS.GREEN, 1)
      this.ironProgressBar.fillRoundedRect(0, 0, 120 * (1 - burnProgress), 8, 4)
      const remain = MAX_TOPPINGS_PER_ORDER - w.addedToppings.length
      this.ironStatusText.setText(remain > 0 ? `点击配料添加 (${remain})` : '点击顾客送出!')
    } else if (w.state === 'burned') {
      this.ironStatusText.setText('烤焦了! 点击丢弃 😫')
    }
  }

  // ─── Topping Shelf ───────────────────────────────────────────────────────

  private createToppingShelf(): void {
    const shelfY = 500
    const bg = this.add.graphics()
    bg.fillStyle(0x8B4513, 0.15)
    bg.fillRoundedRect(10, shelfY - 20, GAME_W - 20, 130, 12)
    bg.fillStyle(0x8B4513, 0.1)
    bg.fillRoundedRect(10, shelfY - 20, GAME_W - 20, 25, { tl: 12, tr: 12, bl: 0, br: 0 })

    this.add.text(GAME_W / 2, shelfY - 8, '— 配料架 —', {
      fontSize: '11px', fontFamily: 'Arial', color: '#8B4513',
    }).setOrigin(0.5)

    const unlocked = this.state.unlockedToppings
    const cols = 5
    const startX = 55
    const startY = shelfY + 18
    const spacing = 80

    this.toppingButtons = []
    for (let i = 0; i < unlocked.length && i < 10; i++) {
      const topping = getToppingById(unlocked[i])
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * spacing
      const y = startY + row * 55

      const gfx = this.add.graphics()
      gfx.fillStyle(topping.color, 0.3)
      gfx.fillCircle(x, y, 22)
      gfx.lineStyle(2, topping.color, 0.8)
      gfx.strokeCircle(x, y, 22)

      this.add.text(x, y - 2, topping.emoji, { fontSize: '20px' }).setOrigin(0.5)
      this.add.text(x, y + 18, topping.name, { fontSize: '9px', fontFamily: 'Arial', color: '#8B4513' }).setOrigin(0.5)

      const zone = this.add.zone(x, y, 50, 50).setInteractive()
      zone.on('pointerdown', () => this.handleToppingTap(topping.id))
      this.toppingButtons.push({ id: topping.id, zone, gfx })
    }
  }

  private handleToppingTap(toppingId: string): void {
    if (this.state.waffle.state !== 'done') return
    addToppingToWaffle(this.state, toppingId)
    this.updateIronUI(this.time.now)
  }

  // ─── Customers ───────────────────────────────────────────────────────────

  private spawnCustomerUI(customer: Customer): void {
    const slot = this.findEmptySlot()
    if (!slot) return

    const container = this.add.container(slot.x, slot.y)

    // Body
    const body = this.add.graphics()
    body.fillStyle(0xFFE4B5, 1)
    body.fillCircle(0, 0, 30)
    body.lineStyle(2, 0xD2691E, 0.6)
    body.strokeCircle(0, 0, 30)
    container.add(body)

    // Face (kawaii)
    const face = this.add.text(0, -4, '😊', { fontSize: '28px' }).setOrigin(0.5)
    container.add(face)

    // Order bubble
    const bubbleY = -55
    const bubble = this.add.graphics()
    bubble.fillStyle(COLORS.WHITE, 0.95)
    bubble.fillRoundedRect(-40, bubbleY - 15, 80, 30, 8)
    bubble.fillStyle(COLORS.WHITE, 1)
    bubble.fillTriangle(-5, bubbleY + 15, 5, bubbleY + 15, 0, bubbleY + 22)
    container.add(bubble)

    // Order toppings
    const orderToppings = customer.order.toppings
    for (let i = 0; i < orderToppings.length; i++) {
      const t = getToppingById(orderToppings[i])
      const emoji = this.add.text(-15 + i * 20, bubbleY, t.emoji, { fontSize: '14px' }).setOrigin(0.5)
      container.add(emoji)
    }

    // Patience bar
    const patienceBg = this.add.graphics()
    patienceBg.fillStyle(0x333333, 0.3)
    patienceBg.fillRoundedRect(-25, 35, 50, 5, 2)
    container.add(patienceBg)

    const patienceFill = this.add.graphics()
    container.add(patienceFill)
    container.setData('patienceFill', patienceFill)
    container.setData('patienceBg', patienceBg)
    container.setData('face', face)
    container.setData('customer', customer)

    // Tap to serve
    const zone = this.add.zone(0, 0, 70, 90).setInteractive()
    zone.on('pointerdown', () => this.handleCustomerTap(customer.id))
    container.add(zone)

    // Entrance tween
    container.setScale(0)
    this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' })

    this.customerDisplays.push({ customer, container })
  }

  private findEmptySlot(): { x: number; y: number } | null {
    for (const slot of this.customerSlots) {
      const taken = this.customerDisplays.some(d => {
        const c = d.container
        return Math.abs(c.x - slot.x) < 10 && Math.abs(c.y - slot.y) < 10
      })
      if (!taken) return slot
    }
    return null
  }

  private handleCustomerTap(customerId: number): void {
    const result = serveToCustomer(this.state, customerId, this.time.now)
    if (result && result.success) {
      // Remove customer display
      const idx = this.customerDisplays.findIndex(d => d.customer.id === customerId)
      if (idx >= 0) {
        const display = this.customerDisplays[idx]
        // Score popup
        const popup = this.add.text(display.container.x, display.container.y - 30,
          `+${result.points}${result.perfect ? ' ✨' : ''}`, {
          fontSize: '20px', fontFamily: 'Arial', color: result.perfect ? '#FFD700' : '#4CAF50', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5)
        this.tweens.add({ targets: popup, y: popup.y - 50, alpha: 0, duration: 800, onComplete: () => popup.destroy() })

        this.tweens.add({
          targets: display.container,
          scaleX: 0, scaleY: 0, y: display.container.y - 30,
          duration: SERVE_ANIM_TIME,
          onComplete: () => { display.container.destroy(); this.customerDisplays.splice(idx, 1) },
        })
      }
    }
    this.updateUI()
  }

  private removeCustomerDisplay(customer: Customer): void {
    const idx = this.customerDisplays.findIndex(d => d.customer.id === customer.id)
    if (idx >= 0) {
      const display = this.customerDisplays[idx]
      const face = display.container.getData('face') as Phaser.GameObjects.Text
      if (face) face.setText('😡')
      this.tweens.add({
        targets: display.container,
        alpha: 0, y: display.container.y + 30,
        duration: 500,
        onComplete: () => { display.container.destroy(); this.customerDisplays.splice(idx, 1) },
      })
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    if (this.state.gameOver || this.state.paused) return

    const now = time

    // Level timer
    this.state.levelTimer -= delta
    if (this.state.levelTimer <= 0 && !this.state.gameOver) {
      // Level timeout — lose a life
      this.state.lives--
      if (this.state.lives <= 0) {
        this.state.gameOver = true
      } else {
        this.state.levelTimer = LEVEL_DURATION
        this.levelStart = now
      }
    }

    // Spawn customers
    const spawnInterval = getSpawnInterval(this.state.level)
    if (now - this.lastSpawnTime >= spawnInterval && this.findEmptySlot()) {
      const customer = spawnCustomer(this.state, now)
      this.spawnCustomerUI(customer)
      this.lastSpawnTime = now
    }

    // Update waffle iron
    checkWaffleDone(this.state, now)
    checkWaffleBurned(this.state, now)
    this.updateIronUI(now)

    // Update customer patience
    const lost = updateCustomerPatience(this.state, now)
    if (lost > 0) {
      this.metaStats.totalLost += lost
      for (const c of this.state.customers.filter(c => c.lost)) {
        this.removeCustomerDisplay(c)
      }
      // Clean up lost customers from display list
      this.customerDisplays = this.customerDisplays.filter(d => !d.customer.lost)
    }

    // Update patience bars
    for (const display of this.customerDisplays) {
      const c = display.customer
      if (c.served || c.lost) continue
      const elapsed = now - c.arrivedAt
      const pct = Math.max(0, 1 - elapsed / c.patience)
      const fill = display.container.getData('patienceFill') as Phaser.GameObjects.Graphics
      if (fill) {
        fill.clear()
        const color = pct > 0.5 ? COLORS.GREEN : pct > 0.25 ? COLORS.GOLD : COLORS.RED
        fill.fillStyle(color, 1)
        fill.fillRoundedRect(-25, 35, 50 * pct, 5, 2)
      }
    }

    this.updateUI()

    if (this.state.gameOver) {
      saveGame(this.state)
      this.updateMetaStats()
      this.saveMeta()
      this.cameras.main.shake(200, 0.005)
      this.time.delayedCall(1000, () => {
        this.scene.start('ResultScene', {
          score: this.state.score,
          coins: this.state.coins,
          level: this.state.level,
          served: this.state.totalServed,
          metaCoins: this.metaCoins,
        })
      })
    }
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

  private updateMetaStats(): void {
    this.metaStats.totalServed += this.state.totalServed
    this.metaStats.perfectServed += this.state.perfectServed
    this.metaStats.highestLevel = Math.max(this.metaStats.highestLevel, this.state.level)
    this.metaStats.bestCombo = Math.max(this.metaStats.bestCombo, this.state.maxCombo)
    this.metaStats.totalCoinsEarned += this.state.coins
    this.metaStats.toppingsUnlocked = this.state.unlockedToppings.length
    this.metaCoins += this.state.coins

    const newAchievements = checkWaffleAchievements(this.metaStats, this.metaAchievements)
    for (const a of newAchievements) {
      this.metaAchievements.push(a.id)
      this.metaCoins += a.reward
    }
  }
}
