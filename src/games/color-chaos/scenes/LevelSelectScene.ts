import Phaser from 'phaser'
import { LevelManager, type LevelProgress } from '../services/LevelManager'
import { SkinManager } from '../services/SkinManager'
import { isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_TICKETS, checkChaosAchievements, type ChaosStats } from '../logic/meta'
import { CHAOS_ACHIEVEMENTS } from '../data/achievements'

const META_STORAGE_KEY = 'color-chaos-meta'
const PALETTES_STORAGE_KEY = 'color-chaos-palettes'
const ACHIEVEMENTS_STORAGE_KEY = 'color-chaos-achievements'

interface MetaData {
  lastDailyDate: string
  dailyCount: number
  totalMoves: number
  threeStarLevels: number
  levelsCompleted: number
}

function loadMeta(): MetaData {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* */ }
  return { lastDailyDate: '', dailyCount: 0, totalMoves: 0, threeStarLevels: 0, levelsCompleted: 0 }
}

function saveMeta(meta: MetaData): void {
  try { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta)) } catch { /* */ }
}

function loadAchievements(): string[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* */ }
  return []
}

function saveAchievements(achievements: string[]): void {
  try { localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements)) } catch { /* */ }
}

function loadPalettes(): string[] {
  try {
    const raw = localStorage.getItem(PALETTES_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* */ }
  return ['classic']
}

function savePalettes(palettes: string[]): void {
  try { localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(palettes)) } catch { /* */ }
}

/**
 * LevelSelectScene - grid-based level selection screen.
 * Shows levels 1-100 with completion status and star ratings.
 */
export class LevelSelectScene extends Phaser.Scene {
  private progress: Map<number, LevelProgress> = new Map()
  private highestUnlocked: number = 1
  private scrollY: number = 0
  private gridContainer!: Phaser.GameObjects.Container
  private maxScroll: number = 0
  private achievementNotif: Phaser.GameObjects.Container | null = null

  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor('#1a1a2e')

    this.progress = LevelManager.loadProgress()
    this.highestUnlocked = LevelManager.getHighestUnlockedLevel(this.progress)

    this.add.text(width / 2, 40, 'SELECT LEVEL', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const backBtn = this.add.text(30, 40, '← BACK', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#44ff44',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })

    backBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { level: 1 })
    })

    const shopBtn = this.add.text(width - 30, 40, '🎫 SHOP', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })

    shopBtn.on('pointerdown', () => {
      this.scene.start('ShopScene')
    })
    shopBtn.on('pointerover', () => shopBtn.setScale(1.1))
    shopBtn.on('pointerout', () => shopBtn.setScale(1.0))

    const tickets = SkinManager.getTicketBalance()
    this.add.text(width - 30, 62, `🎫 ${tickets}`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
    }).setOrigin(1, 0.5)

    // Daily reward button
    const meta = loadMeta()
    if (isDailyRewardAvailable(meta.lastDailyDate)) {
      const dailyBtn = this.add.text(width / 2, 62, `🎁 Daily +${DAILY_REWARD_TICKETS}🎫`, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#00b894', fontStyle: 'bold',
        backgroundColor: '#1a3a2a', padding: { x: 10, y: 4 },
      }).setOrigin(0.5).setInteractive()
      dailyBtn.on('pointerdown', () => {
        const result = claimDailyReward(meta.lastDailyDate)
        if (result.claimed) {
          meta.lastDailyDate = result.today
          meta.dailyCount++
          saveMeta(meta)
          SkinManager.addTickets(DAILY_REWARD_TICKETS)
          dailyBtn.setText('✅ Claimed').setColor('#666').disableInteractive()
          this.checkAndShowAchievements()
        }
      })
    }

    // Achievement counter
    const achievements = loadAchievements()
    this.add.text(30, 62, `🏆 ${achievements.length}/${CHAOS_ACHIEVEMENTS.length}`, {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#CE93D8',
    }).setOrigin(0, 0.5)

    // Check achievements on load
    this.checkAndShowAchievements()

    this.gridContainer = this.add.container(0, 0)

    const cols = 5
    const cellSize = 70
    const padding = 15
    const gridStartY = 80
    const gridStartX = (width - (cols * (cellSize + padding) - padding)) / 2

    for (let level = 1; level <= 100; level++) {
      const col = (level - 1) % cols
      const row = Math.floor((level - 1) / cols)

      const x = gridStartX + col * (cellSize + padding) + cellSize / 2
      const y = gridStartY + row * (cellSize + padding) + cellSize / 2

      const isUnlocked = LevelManager.isLevelUnlocked(level, this.progress)
      const levelProgress = this.progress.get(level)

      const cell = this.createCell(x, y, cellSize, level, isUnlocked, levelProgress)
      this.gridContainer.add(cell)
    }

    const totalRows = Math.ceil(100 / cols)
    const totalGridHeight = totalRows * (cellSize + padding)
    const visibleHeight = height - gridStartY - 20
    this.maxScroll = Math.max(0, totalGridHeight - visibleHeight)

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScroll)
      this.gridContainer.y = -this.scrollY
    })

    let dragStartY = 0
    let dragStartScroll = 0
    let isDragging = false

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragStartY = pointer.y
      dragStartScroll = this.scrollY
      isDragging = false
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const dy = dragStartY - pointer.y
        if (Math.abs(dy) > 5) {
          isDragging = true
        }
        if (isDragging) {
          this.scrollY = Phaser.Math.Clamp(dragStartScroll + dy, 0, this.maxScroll)
          this.gridContainer.y = -this.scrollY
        }
      }
    })
  }

  private createCell(
    x: number,
    y: number,
    size: number,
    level: number,
    isUnlocked: boolean,
    progress?: LevelProgress
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    if (isUnlocked) {
      if (progress?.completed) {
        bg.fillStyle(0x2a5a2a, 1)
      } else {
        bg.fillStyle(0x334455, 1)
      }
    } else {
      bg.fillStyle(0x222222, 1)
    }
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 8)

    const borderColor = isUnlocked ? 0x4488ff : 0x444444
    bg.lineStyle(2, borderColor, isUnlocked ? 0.8 : 0.4)
    bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 8)

    container.add(bg)

    const levelText = this.add.text(0, -8, level.toString(), {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: isUnlocked ? '#ffffff' : '#666666',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add(levelText)

    if (progress?.completed) {
      const starText = this.getStarString(progress.stars)
      const stars = this.add.text(0, 16, starText, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
      }).setOrigin(0.5)
      container.add(stars)
    } else if (!isUnlocked) {
      const lock = this.add.text(0, 16, '🔒', {
        fontSize: '14px',
      }).setOrigin(0.5)
      container.add(lock)
    }

    if (isUnlocked) {
      const hitArea = this.add.rectangle(0, 0, size, size, 0x000000, 0).setInteractive({ useHandCursor: true })
      container.add(hitArea)

      hitArea.on('pointerdown', () => {
        LevelManager.saveCurrentLevel(level)
        this.scene.start('GameScene', { level })
      })

      hitArea.on('pointerover', () => {
        container.setScale(1.1)
      })

      hitArea.on('pointerout', () => {
        container.setScale(1.0)
      })
    }

    return container
  }

  private getStarString(stars: number): string {
    switch (stars) {
      case 3: return '⭐⭐⭐'
      case 2: return '⭐⭐'
      case 1: return '⭐'
      default: return ''
    }
  }

  private checkAndShowAchievements(): void {
    const meta = loadMeta()
    const existing = loadAchievements()
    const progress = LevelManager.loadProgress()

    let totalStars = 0
    let threeStarLevels = 0
    let levelsCompleted = 0
    progress.forEach((p) => {
      if (p.completed) levelsCompleted++
      totalStars += p.stars
      if (p.stars === 3) threeStarLevels++
    })

    const stats: ChaosStats = {
      levelsCompleted,
      totalStars,
      threeStarLevels,
      totalMoves: meta.totalMoves,
      highestLevel: LevelManager.getHighestUnlockedLevel(progress),
      skinsUnlocked: SkinManager.getUnlockedSkins().length,
      palettesUnlocked: loadPalettes().length,
      dailyCompleted: meta.dailyCount,
    }

    const newAchievements = checkChaosAchievements(stats, existing)
    if (newAchievements.length > 0) {
      for (const a of newAchievements) {
        existing.push(a.id)
        SkinManager.addTickets(a.reward)
      }
      saveAchievements(existing)

      // Show notification
      const a = newAchievements[0]
      this.showAchievementNotif(`${a.emoji} ${a.name}! +${a.reward}🎫`)
    }
  }

  private showAchievementNotif(text: string): void {
    if (this.achievementNotif) this.achievementNotif.destroy()
    const { width } = this.scale
    this.achievementNotif = this.add.container(width / 2, 100)

    const bg = this.add.graphics()
    bg.fillStyle(0x2a5a2a, 0.95)
    bg.fillRoundedRect(-120, -18, 240, 36, 10)
    this.achievementNotif.add(bg)

    const txt = this.add.text(0, 0, text, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.achievementNotif.add(txt)

    this.achievementNotif.setAlpha(0)
    this.tweens.add({
      targets: this.achievementNotif,
      alpha: 1,
      y: 90,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          if (this.achievementNotif) {
            this.tweens.add({
              targets: this.achievementNotif,
              alpha: 0,
              y: 70,
              duration: 300,
              onComplete: () => { this.achievementNotif?.destroy(); this.achievementNotif = null },
            })
          }
        })
      },
    })
  }
}
