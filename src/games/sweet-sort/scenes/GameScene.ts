/** Game scene for Sweet Sort - main gameplay */

import Phaser from 'phaser'
import { COLOR_VALUES } from '../core/Color'
import { generateLevel, getStarRating, type LevelData } from '../core/LevelGenerator'
import { isValidMove, executeMove, checkCompletion, getDefaultSave, updateLevelResult, type SaveData } from '../core/GameState'
import { AdManager } from '../../../services/AdManager'
import { levelCoins, checkSweetAchievements, type SweetStats } from '../logic/meta'

const GAME_WIDTH = 480
const GAME_HEIGHT = 854

const UI = {
  TUBE_WIDTH: 52,
  TUBE_HEIGHT: 160,
  CANDY_SIZE: 42,
  CANDY_SPACING: 8,
  TUBE_MARGIN: 16,
  TOP_MARGIN: 180,
  BOTTOM_MARGIN: 120
} as const

const SAVE_KEY = 'sweet_sort_save'

export class GameScene extends Phaser.Scene {
  private tubes: number[][] = []
  private tubeGraphicsObjects: Phaser.GameObjects.Graphics[] = []
  private candyGraphicsObjects: Phaser.GameObjects.Graphics[] = []
  private zoneObjects: Phaser.GameObjects.Zone[] = []
  private highlightGraphics!: Phaser.GameObjects.Graphics
  private selectedTube = -1
  private moveCount = 0
  private currentLevel = 1
  private levelData!: LevelData
  private isAnimating = false
  private isPaused = false
  private isComplete = false
  private pauseOverlay: Phaser.GameObjects.Graphics | null = null
  private pauseText: Phaser.GameObjects.Text | null = null

  private titleText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private moveText!: Phaser.GameObjects.Text
  private starsText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0xFFF5E6)
    this.createBackground()
    this.createUI()
    this.loadLevel(1)
  }

  private createBackground(): void {
    const bg = this.add.graphics()
    bg.fillGradientStyle(0xFFF5E6, 0xFFF5E6, 0xFFDAB9, 0xFFDAB9, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  private createUI(): void {
    this.titleText = this.add.text(GAME_WIDTH / 2, 30, '🍬 Sweet Sort 🍬', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.levelText = this.add.text(GAME_WIDTH / 2, 65, 'Level 1', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513'
    }).setOrigin(0.5)

    this.moveText = this.add.text(GAME_WIDTH / 2, 95, 'Moves: 0', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513'
    }).setOrigin(0.5)

    this.starsText = this.add.text(GAME_WIDTH / 2, 125, '', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700'
    }).setOrigin(0.5)

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Next Level', () => this.nextLevel(), '#4CAF50')
    this.createButton(GAME_WIDTH / 2 - 80, GAME_HEIGHT - 100, 'Pause', () => this.togglePause(), '#2196F3')
    this.createButton(GAME_WIDTH / 2 + 80, GAME_HEIGHT - 100, 'Restart', () => this.restartLevel(), '#F44336')

    this.highlightGraphics = this.add.graphics()
    this.highlightGraphics.setVisible(false)
  }

  private createButton(x: number, y: number, text: string, callback: () => void, color: string): void {
    const btn = this.add.graphics()
    btn.fillStyle(parseInt(color.replace('#', '0x')), 1)
    btn.fillRoundedRect(x - 60, y - 18, 120, 36, 10)

    this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const hitArea = this.add.zone(x, y, 120, 36).setInteractive()
    hitArea.on('pointerdown', callback)
  }

  private getTubePosition(tubeIndex: number): { x: number; y: number } {
    const numTubes = this.tubes.length
    const totalWidth = numTubes * (UI.TUBE_WIDTH + UI.TUBE_MARGIN) - UI.TUBE_MARGIN
    const startX = (GAME_WIDTH - totalWidth) / 2 + UI.TUBE_WIDTH / 2
    const x = startX + tubeIndex * (UI.TUBE_WIDTH + UI.TUBE_MARGIN)
    const y = UI.TOP_MARGIN + UI.TUBE_HEIGHT / 2
    return { x, y }
  }

  loadLevel(levelNum: number): void {
    this.currentLevel = levelNum
    this.moveCount = 0
    this.selectedTube = -1
    this.isAnimating = false
    this.isComplete = false

    // Clear previous graphics
    this.tubeGraphicsObjects.forEach(g => g.destroy())
    this.candyGraphicsObjects.forEach(g => g.destroy())
    this.zoneObjects.forEach(z => z.destroy())
    this.tubeGraphicsObjects = []
    this.candyGraphicsObjects = []
    this.zoneObjects = []

    if (this.highlightGraphics) {
      this.highlightGraphics.setVisible(false)
    }

    // Generate level
    this.levelData = generateLevel(levelNum)
    this.tubes = JSON.parse(JSON.stringify(this.levelData.tubes))

    // Update UI
    this.levelText.setText(`Level ${levelNum}`)
    this.moveText.setText('Moves: 0')
    this.updateStarsDisplay()

    this.drawGame()
  }

  private drawGame(): void {
    const numTubes = this.tubes.length

    for (let i = 0; i < numTubes; i++) {
      const { x, y } = this.getTubePosition(i)

      const tube = this.add.graphics()
      tube.fillStyle(0xFFFFFF, 0.4)
      tube.fillRoundedRect(x - UI.TUBE_WIDTH / 2, y - UI.TUBE_HEIGHT / 2, UI.TUBE_WIDTH, UI.TUBE_HEIGHT, 8)
      tube.lineStyle(3, 0x8B4513, 1)
      tube.strokeRoundedRect(x - UI.TUBE_WIDTH / 2, y - UI.TUBE_HEIGHT / 2, UI.TUBE_WIDTH, UI.TUBE_HEIGHT, 8)
      this.tubeGraphicsObjects.push(tube)

      this.drawCandiesInTube(i)

      const zone = this.add.zone(x, y, UI.TUBE_WIDTH, UI.TUBE_HEIGHT).setInteractive()
      const tubeIndex = i
      zone.on('pointerdown', () => this.onTubeClick(tubeIndex))
      this.zoneObjects.push(zone)
    }
  }

  private drawCandiesInTube(tubeIndex: number): void {
    const { x, y } = this.getTubePosition(tubeIndex)
    const tube = this.tubes[tubeIndex]
    const bottomY = y + UI.TUBE_HEIGHT / 2 - UI.CANDY_SIZE / 2 - 5

    for (let i = 0; i < tube.length; i++) {
      const colorIndex = tube[i]
      const candyColor = COLOR_VALUES[colorIndex]
      const candyY = bottomY - i * (UI.CANDY_SIZE + UI.CANDY_SPACING)

      const candy = this.add.graphics()
      candy.fillStyle(0x000000, 0.1)
      candy.fillCircle(x + 2, candyY + 2, UI.CANDY_SIZE / 2)
      candy.fillStyle(candyColor, 1)
      candy.fillCircle(x, candyY, UI.CANDY_SIZE / 2)
      candy.lineStyle(2, 0xFFFFFF, 0.6)
      candy.strokeCircle(x, candyY, UI.CANDY_SIZE / 2)
      candy.fillStyle(0xFFFFFF, 0.4)
      candy.fillCircle(x - 6, candyY - 6, 5)

      this.candyGraphicsObjects.push(candy)
    }
  }

  private onTubeClick(tubeIndex: number): void {
    if (this.isAnimating || this.isPaused || this.isComplete) return

    if (this.selectedTube === -1) {
      if (this.tubes[tubeIndex].length > 0) {
        this.selectedTube = tubeIndex
        this.showSelectionHighlight(tubeIndex)
      }
    } else {
      if (tubeIndex === this.selectedTube) {
        this.hideSelectionHighlight()
        this.selectedTube = -1
      } else if (isValidMove(this.tubes, this.selectedTube, tubeIndex, this.levelData.capacity)) {
        this.moveCandy(this.selectedTube, tubeIndex)
      } else {
        this.shakeTube(tubeIndex)
        this.hideSelectionHighlight()
        this.selectedTube = -1
      }
    }
  }

  private showSelectionHighlight(tubeIndex: number): void {
    const { x, y } = this.getTubePosition(tubeIndex)
    this.highlightGraphics.clear()
    this.highlightGraphics.lineStyle(4, 0xFFD700, 1)
    this.highlightGraphics.strokeRoundedRect(
      x - UI.TUBE_WIDTH / 2 - 4,
      y - UI.TUBE_HEIGHT / 2 - 4,
      UI.TUBE_WIDTH + 8,
      UI.TUBE_HEIGHT + 8,
      10
    )
    this.highlightGraphics.setVisible(true)
  }

  private hideSelectionHighlight(): void {
    this.highlightGraphics.setVisible(false)
  }

  private shakeTube(tubeIndex: number): void {
    const zone = this.zoneObjects[tubeIndex]
    if (!zone) return

    const origX = zone.x
    this.tweens.add({
      targets: zone,
      x: origX + 5,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        zone.x = origX
      }
    })
  }

  private moveCandy(from: number, to: number): void {
    this.isAnimating = true
    this.hideSelectionHighlight()

    executeMove(this.tubes, from, to)
    this.moveCount++

    this.redrawCandies()

    this.time.delayedCall(250, () => {
      this.isAnimating = false
      this.selectedTube = -1
      this.moveText.setText(`Moves: ${this.moveCount}`)
      this.checkGameCompletion()
    })
  }

  private redrawCandies(): void {
    this.candyGraphicsObjects.forEach(g => g.destroy())
    this.candyGraphicsObjects = []

    for (let i = 0; i < this.tubes.length; i++) {
      this.drawCandiesInTube(i)
    }
  }

  private checkGameCompletion(): void {
    if (checkCompletion(this.tubes)) {
      this.onLevelComplete()
    }
  }

  private onLevelComplete(): void {
    this.isComplete = true
    const stars = getStarRating(this.moveCount, this.levelData.optimalMoves)

    const save = this.loadSave()
    updateLevelResult(save, this.currentLevel, stars, this.moveCount)
    this.saveToStorage(save)

    // Meta: update stats and award coins
    const meta = this.loadMeta()
    meta.stats.levelsCompleted = Math.max(meta.stats.levelsCompleted, this.currentLevel)
    meta.stats.totalStars = save.totalStars
    meta.stats.threeStarLevels = Object.values(save.stars).filter(s => s === 3).length
    meta.stats.highestLevel = Math.max(meta.stats.highestLevel, this.currentLevel)
    meta.stats.totalMoves += this.moveCount
    meta.stats.gamesPlayed++
    const earnedCoins = levelCoins(stars)
    meta.coins += earnedCoins
    const newAchievements = checkSweetAchievements(meta.stats, meta.achievements)
    for (const a of newAchievements) {
      meta.achievements.push(a.id)
      meta.coins += a.reward
    }
    this.saveMeta(meta)

    this.showCompletionScreen(stars)
  }

  private showCompletionScreen(stars: number): void {
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.5)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const panel = this.add.graphics()
    panel.fillStyle(0xFFFFFF, 0.95)
    panel.fillRoundedRect(GAME_WIDTH / 2 - 140, GAME_HEIGHT / 2 - 120, 280, 240, 20)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, '🎉 Level Complete! 🎉', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars)
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, starsStr, {
      fontSize: '40px'
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Moves: ${this.moveCount}`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513'
    }).setOrigin(0.5)

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, '🎬 2x Stars', async () => {
      const adManager = AdManager.getInstance()
      const success = await adManager.requestRewardedAd()
      if (success) {
        const bonusStars = Math.min(3, stars * 2)
        const bonusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, `⭐ ${bonusStars} Stars Recorded!`, {
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
          color: '#FFD700',
          fontStyle: 'bold'
        }).setOrigin(0.5)
      }
    }, '#9C27B0')

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'Next Level', () => {
      this.scene.restart()
    }, '#4CAF50')
  }

  private nextLevel(): void {
    this.loadLevel(this.currentLevel + 1)
  }

  private restartLevel(): void {
    this.loadLevel(this.currentLevel)
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused
    if (this.isPaused) {
      this.showPauseScreen()
    } else {
      this.hidePauseScreen()
    }
  }

  private showPauseScreen(): void {
    this.pauseOverlay = this.add.graphics()
    this.pauseOverlay.fillStyle(0x000000, 0.7)
    this.pauseOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⏸️ PAUSED', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5)
  }

  private hidePauseScreen(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy()
      this.pauseOverlay = null
    }
    if (this.pauseText) {
      this.pauseText.destroy()
      this.pauseText = null
    }
  }

  private updateStarsDisplay(): void {
    const save = this.loadSave()
    const stars = save.stars[this.currentLevel] || 0
    if (stars > 0) {
      this.starsText.setText('⭐'.repeat(stars) + '☆'.repeat(3 - stars))
    } else {
      this.starsText.setText('☆☆☆')
    }
  }

  private loadSave(): SaveData {
    try {
      const data = localStorage.getItem(SAVE_KEY)
      if (data) {
        return JSON.parse(data) as SaveData
      }
    } catch (e) {
      console.warn('Failed to load save:', e)
    }
    return getDefaultSave()
  }

  private saveToStorage(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save:', e)
    }
  }

  // ─── Meta persistence ──────────────────────────────────────────────────

  private META_KEY = 'sweet-sort-meta'

  private loadMeta(): { coins: number; unlockedThemes: string[]; achievements: string[]; stats: SweetStats; lastDailyDate: string } {
    try {
      const raw = localStorage.getItem(this.META_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        return {
          coins: data.coins ?? 0,
          unlockedThemes: Array.isArray(data.unlockedThemes) ? data.unlockedThemes : ['classic'],
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
          stats: { levelsCompleted: 0, totalStars: 0, threeStarLevels: 0, highestLevel: 0, totalMoves: 0, bestCombo: 0, themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0, ...(data.stats ?? {}) },
          lastDailyDate: data.lastDailyDate ?? '',
        }
      }
    } catch { /* corrupted */ }
    return { coins: 0, unlockedThemes: ['classic'], achievements: [], stats: { levelsCompleted: 0, totalStars: 0, threeStarLevels: 0, highestLevel: 0, totalMoves: 0, bestCombo: 0, themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0 }, lastDailyDate: '' }
  }

  private saveMeta(meta: ReturnType<typeof this.loadMeta>): void {
    try { localStorage.setItem(this.META_KEY, JSON.stringify(meta)) } catch { /* */ }
  }
}
