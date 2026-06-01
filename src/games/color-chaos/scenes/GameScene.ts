import Phaser from 'phaser'
import { GameState, GAME_COLORS, type LevelConfig } from '../core'
import { LevelManager } from '../services/LevelManager'
import { AudioManager } from '../services/AudioManager'
import { SkinManager } from '../services/SkinManager'
import { TubeRenderer } from '../renderers/TubeRenderer'
import { AdManager } from '../services/AdManager'
import { fadeIn, addHapticFeedback } from '../../../shared/utils/poki-polish'


/** Maximum undos allowed per level */
const MAX_UNDOS = 10

/**
 * GameScene - main gameplay scene.
 * Renders tubes, handles pouring animations, undo, and level progression.
 */
export class GameScene extends Phaser.Scene {
  private gameState!: GameState
  private tubeRenderers: TubeRenderer[] = []
  private selectedTubeIndex: number | null = null
  private currentLevel: number = 1
  private isAnimating: boolean = false

  // Undo system
  private undoHistory: number[][][] = []
  private undoCount: number = MAX_UNDOS

  // Audio
  private audioManager: AudioManager = new AudioManager()

  // Ad manager
  private adManager: AdManager = AdManager.getInstance()

  // UI elements
  private moveText!: Phaser.GameObjects.Text
  private undoText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private undoButton!: Phaser.GameObjects.Container
  private menuButton!: Phaser.GameObjects.Container

  // Level config (needed for rendering)
  private levelConfig!: LevelConfig

  // Level complete overlay elements (for cleanup)
  private levelCompleteElements: Phaser.GameObjects.GameObject[] = []

  // Track whether tickets were doubled for this level
  private ticketsDoubled: boolean = false

  // Rewarded ad undo button (near undo button)
  private undoRewardButton!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: { level?: number }): void {
    this.currentLevel = data.level ?? LevelManager.loadCurrentLevel()
    this.ticketsDoubled = false
  }

  create(): void {
    fadeIn(this)
    const { width, height } = this.scale

    // Set up ad callbacks
    this.adManager.setAdCallbacks(
      () => {
        this.audioManager.muted = true
        this.scene.pause()
      },
      () => {
        this.audioManager.muted = false
        this.scene.resume()
      }
    )

    // Notify SDK that gameplay started
    this.adManager.gameplayStart()

    // Initialize audio on first user interaction
    this.input.once('pointerdown', () => {
      this.audioManager.init()
    })

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Generate level based on difficulty
    this.levelConfig = LevelManager.generateLevel(this.currentLevel)
    this.gameState = new GameState(this.levelConfig)

    // Reset undo
    this.undoHistory = []
    this.undoCount = MAX_UNDOS
    this.isAnimating = false
    this.ticketsDoubled = false

    // Save initial state for undo
    this.undoHistory.push(this.gameState.getStateSnapshot())

    // Calculate tube dimensions and positions
    const tubeWidth = 60
    const tubeHeight = 200
    const padding = 20
    const totalWidth = this.levelConfig.tubeCount * (tubeWidth + padding) - padding
    const startX = (width - totalWidth) / 2 + tubeWidth / 2
    const startY = height / 2 + 20

    // Create tube renderers
    const equippedSkin = SkinManager.getEquippedSkin()
    for (let i = 0; i < this.levelConfig.tubeCount; i++) {
      const x = startX + i * (tubeWidth + padding)
      const renderer = new TubeRenderer(this, i, x, startY, tubeWidth, tubeHeight, this.levelConfig.tubeCapacity)
      renderer.setSkin(equippedSkin.visuals)
      this.tubeRenderers.push(renderer)

      // Make tube interactive
      const container = renderer.getContainer()
      container.setSize(tubeWidth, tubeHeight)
      container.setInteractive()
      container.on('pointerdown', () => this.onTubeClick(i))

      // Update visual
      renderer.updateLayers(this.gameState.tubes[i].getLayers())
    }

    // UI: Level indicator at top center
    this.levelText = this.add.text(width / 2, 30, `Level ${this.currentLevel}`, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // UI: Move counter
    this.moveText = this.add.text(width / 2, 60, 'Moves: 0', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
    }).setOrigin(0.5)

    // UI: Target moves indicator
    const optimal = LevelManager.getOptimalMoves(this.currentLevel)
    this.add.text(width / 2, 82, `Target: ${optimal} moves for ⭐⭐⭐`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
    }).setOrigin(0.5)

    // UI: Undo button (bottom left)
    this.undoButton = this.createUndoButton(60, height - 50)
    this.undoText = this.undoButton.getByName('undoCount') as Phaser.GameObjects.Text
    this.updateUndoDisplay()

    // UI: Rewarded ad undo button (bottom left, next to undo)
    this.undoRewardButton = this.createUndoRewardButton(120, height - 50)

    // UI: Menu/Level Select button (bottom right)
    this.menuButton = this.createMenuButton(width - 60, height - 50)

    // Instructions at bottom center
    this.add.text(width / 2, height - 50, 'Click two tubes to pour', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666',
    }).setOrigin(0.5)
  }

  private createUndoButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x334455, 0.8)
    bg.fillCircle(0, 0, 28)
    bg.lineStyle(2, 0x4488ff, 0.6)
    bg.strokeCircle(0, 0, 28)
    container.add(bg)

    const icon = this.add.text(0, -6, '↩', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#4488ff',
    }).setOrigin(0.5)
    container.add(icon)

    const countText = this.add.text(0, 14, `${MAX_UNDOS}`, {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#88aacc',
    }).setOrigin(0.5).setName('undoCount')
    container.add(countText)

    const hitArea = this.add.circle(0, 0, 28, 0x000000, 0).setInteractive({ useHandCursor: true })
    container.add(hitArea)

    hitArea.on('pointerdown', () => {
      this.performUndo()
    })

    hitArea.on('pointerover', () => {
      container.setScale(1.1)
    })

    hitArea.on('pointerout', () => {
      container.setScale(1.0)
    })

    return container
  }

  private createUndoRewardButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x553322, 0.8)
    bg.fillCircle(0, 0, 28)
    bg.lineStyle(2, 0xff8844, 0.6)
    bg.strokeCircle(0, 0, 28)
    container.add(bg)

    const icon = this.add.text(0, -6, '🎬', {
      fontSize: '16px',
    }).setOrigin(0.5)
    container.add(icon)

    const label = this.add.text(0, 14, '+5', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff8844',
    }).setOrigin(0.5)
    container.add(label)

    const hitArea = this.add.circle(0, 0, 28, 0x000000, 0).setInteractive({ useHandCursor: true })
    container.add(hitArea)

    hitArea.on('pointerdown', () => {
      this.onUndoRewardClick()
    })

    hitArea.on('pointerover', () => {
      container.setScale(1.1)
    })

    hitArea.on('pointerout', () => {
      container.setScale(1.0)
    })

    container.setVisible(false)

    return container
  }

  private async onUndoRewardClick(): Promise<void> {
    if (this.isAnimating) return

    const rewarded = await this.adManager.requestRewardedAd()
    if (rewarded) {
      this.undoCount += 5
      this.updateUndoDisplay()
      this.undoRewardButton.setVisible(false)
    }
  }

  private createMenuButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0x334455, 0.8)
    bg.fillCircle(0, 0, 28)
    bg.lineStyle(2, 0x4488ff, 0.6)
    bg.strokeCircle(0, 0, 28)
    container.add(bg)

    const icon = this.add.text(0, -4, '≡', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#4488ff',
    }).setOrigin(0.5)
    container.add(icon)

    const hitArea = this.add.circle(0, 0, 28, 0x000000, 0).setInteractive({ useHandCursor: true })
    container.add(hitArea)

    hitArea.on('pointerdown', () => {
      this.scene.start('LevelSelectScene')
    })

    hitArea.on('pointerover', () => {
      container.setScale(1.1)
    })

    hitArea.on('pointerout', () => {
      container.setScale(1.0)
    })

    return container
  }

  /**
   * Handle tube click - select or attempt pour.
   */
  private onTubeClick(index: number): void {
    if (this.isAnimating) return

    this.audioManager.resume()

    if (this.selectedTubeIndex === null) {
      this.selectedTubeIndex = index
      this.tubeRenderers[index].setSelected(true)
      this.audioManager.playClick()
    } else if (this.selectedTubeIndex === index) {
      this.tubeRenderers[index].setSelected(false)
      this.selectedTubeIndex = null
      this.audioManager.playClick()
    } else {
      const fromIndex = this.selectedTubeIndex
      const toIndex = index

      this.tubeRenderers[fromIndex].setSelected(false)

      const fromTube = this.gameState.tubes[fromIndex]
      const toTube = this.gameState.tubes[toIndex]

      let isValid = true
      if (fromTube.isEmpty()) isValid = false
      else if (toTube.isFull()) isValid = false
      else if (!toTube.isEmpty() && toTube.peekTop() !== fromTube.peekTop()) isValid = false

      if (!isValid) {
        this.audioManager.playError()
        this.shakeTube(toIndex)
        this.selectedTubeIndex = null
        return
      }

      const snapshotBeforeMove = this.gameState.getStateSnapshot()
      const result = this.gameState.move(fromIndex, toIndex)

      if (result.success) {
        this.undoHistory.push(snapshotBeforeMove)
        this.animatePour(fromIndex, toIndex, result.layersMoved)
      }

      this.selectedTubeIndex = null
    }
  }

  private shakeTube(index: number): void {
    const container = this.tubeRenderers[index].getContainer()
    const originalX = container.x

    this.tweens.add({
      targets: container,
      x: originalX + 8,
      duration: 50,
      yoyo: true,
      repeat: 2,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        container.x = originalX
      },
    })
  }

  /**
   * Animate liquid pouring from one tube to another.
   */
  private animatePour(fromIndex: number, toIndex: number, layersMoved: number): void {
    this.isAnimating = true

    const fromRenderer = this.tubeRenderers[fromIndex]
    const toRenderer = this.tubeRenderers[toIndex]

    const fromTop = fromRenderer.getTopPosition()
    const toTop = toRenderer.getTopPosition()

    const toLayers = this.gameState.tubes[toIndex].getLayers()
    const pouredColorId = toLayers.length > 0 ? toLayers[toLayers.length - 1] : 0
    const pouredColor = GAME_COLORS[pouredColorId]
    const colorHex = pouredColor ? parseInt(pouredColor.hex.replace('#', ''), 16) : 0xff0000

    const liquidGraphics = this.add.graphics()

    const layerHeight = (200 - 16) / this.levelConfig.tubeCapacity
    const liquidHeight = layerHeight * layersMoved - 2
    const liquidWidth = 60 - 12

    const startX = fromTop.x
    const startY = fromTop.y
    const endX = toTop.x
    const endY = toTop.y

    const midX = (startX + endX) / 2
    const midY = Math.min(startY, endY) - 80

    this.audioManager.playPour()

    const drawLiquid = (x: number, y: number) => {
      liquidGraphics.clear()
      liquidGraphics.fillStyle(colorHex, 0.9)
      liquidGraphics.fillRoundedRect(
        x - liquidWidth / 2,
        y - liquidHeight,
        liquidWidth,
        liquidHeight,
        4
      )
      liquidGraphics.fillStyle(0xffffff, 0.25)
      liquidGraphics.fillRoundedRect(
        x - liquidWidth / 2,
        y - liquidHeight,
        liquidWidth,
        liquidHeight / 2,
        { tl: 4, tr: 4, bl: 0, br: 0 }
      )
    }

    const animObj = { progress: 0 }

    // Phase 1: rise up from source tube
    this.tweens.add({
      targets: animObj,
      progress: 1,
      duration: 150,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        const currentY = startY - animObj.progress * 30
        drawLiquid(startX, currentY)
      },
      onComplete: () => {
        // Phase 2: arc to target
        const arcObj = { progress: 0 }

        this.tweens.add({
          targets: arcObj,
          progress: 1,
          duration: 250,
          ease: 'Quad.easeInOut',
          onUpdate: () => {
            const t = arcObj.progress
            const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX
            const y = (1 - t) * (1 - t) * (startY - 30) + 2 * (1 - t) * t * midY + t * t * endY
            drawLiquid(x, y)
          },
          onComplete: () => {
            // Phase 3: settle into target tube
            const settleObj = { progress: 0 }
            const settleStartY = endY

            this.tweens.add({
              targets: settleObj,
              progress: 1,
              duration: 100,
              ease: 'Quad.easeIn',
              onUpdate: () => {
                const currentY = settleStartY + settleObj.progress * 10
                drawLiquid(endX, currentY)
              },
              onComplete: () => {
                this.audioManager.playSettle()
                liquidGraphics.destroy()

                fromRenderer.updateLayers(this.gameState.tubes[fromIndex].getLayers())
                toRenderer.updateLayers(this.gameState.tubes[toIndex].getLayers())

                this.wobbleTube(toIndex)
                this.updateUI()
                this.isAnimating = false

                if (this.gameState.isComplete) {
                  this.time.delayedCall(400, () => {
                    this.showLevelComplete()
                  })
                }
              },
            })
          },
        })
      },
    })
  }

  private wobbleTube(index: number): void {
    const container = this.tubeRenderers[index].getContainer()
    const originalScaleX = 1.0
    const originalScaleY = 1.0

    this.tweens.add({
      targets: container,
      scaleX: 1.03,
      scaleY: 0.97,
      duration: 80,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        container.setScale(originalScaleX, originalScaleY)
      },
    })
  }

  private performUndo(): void {
    if (this.isAnimating) return
    if (this.undoCount <= 0) return
    if (this.undoHistory.length <= 1) return

    this.audioManager.playUndo()

    this.undoHistory.pop()
    const previousSnapshot = this.undoHistory[this.undoHistory.length - 1]

    this.gameState.restoreState(previousSnapshot)
    this.gameState.moveCount = Math.max(0, this.gameState.moveCount - 1)

    this.undoCount--

    for (let i = 0; i < this.gameState.tubeCount; i++) {
      this.tubeRenderers[i].updateLayers(this.gameState.tubes[i].getLayers())
    }

    this.updateUI()
    this.updateUndoDisplay()
  }

  private updateUndoDisplay(): void {
    if (this.undoText) {
      this.undoText.setText(`${this.undoCount}`)
      if (this.undoCount === 0) {
        this.undoText.setColor('#555555')
      } else {
        this.undoText.setColor('#88aacc')
      }
    }

    if (this.undoRewardButton) {
      this.undoRewardButton.setVisible(this.undoCount <= 0 && this.adManager.isEnabled)
    }
  }

  private updateUI(): void {
    if (this.moveText) {
      this.moveText.setText(`Moves: ${this.gameState.moveCount}`)
    }
  }

  /**
   * Show the level complete screen with star rating.
   */
  private showLevelComplete(): void {
    const { width, height } = this.scale

    this.adManager.gameplayStop()

    this.levelCompleteElements.forEach(el => el.destroy())
    this.levelCompleteElements = []

    this.audioManager.playWin()

    const progressResult = LevelManager.saveLevelProgress(this.currentLevel, this.gameState.moveCount)
    const ticketsEarned = SkinManager.addTickets(progressResult.stars)
    const baseTickets = progressResult.stars

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
    this.levelCompleteElements.push(overlay)

    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.7,
      duration: 300,
    })

    const title = this.add.text(width / 2, height / 2 - 130, '🎉 Level Complete!', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    this.levelCompleteElements.push(title)

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: height / 2 - 140,
      duration: 400,
      ease: 'Back.easeOut',
    })

    const starString = this.getStarString(progressResult.stars)
    const stars = this.add.text(width / 2, height / 2 - 70, starString, {
      fontSize: '40px',
    }).setOrigin(0.5).setAlpha(0)
    this.levelCompleteElements.push(stars)

    this.tweens.add({
      targets: stars,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      delay: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 200,
    })

    const optimal = LevelManager.getOptimalMoves(this.currentLevel)
    const movesInfo = this.add.text(
      width / 2,
      height / 2 - 10,
      `${this.gameState.moveCount} moves (target: ${optimal})`,
      {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#cccccc',
      }
    ).setOrigin(0.5).setAlpha(0)
    this.levelCompleteElements.push(movesInfo)

    this.tweens.add({
      targets: movesInfo,
      alpha: 1,
      duration: 400,
      delay: 300,
    })

    const ticketText = this.add.text(
      width / 2,
      height / 2 + 20,
      `🎫 +${baseTickets} tickets (Total: ${ticketsEarned})`,
      {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
      }
    ).setOrigin(0.5).setAlpha(0)
    this.levelCompleteElements.push(ticketText)

    this.tweens.add({
      targets: ticketText,
      alpha: 1,
      duration: 400,
      delay: 350,
    })

    // Rewarded ad button: "🎬 2x Tickets"
    if (this.adManager.isEnabled && !this.ticketsDoubled) {
      const doubleBtn = this.add.text(width / 2, height / 2 + 50, '[ 🎬 2x Tickets ]', {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ff8844',
        fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })
      this.levelCompleteElements.push(doubleBtn)

      this.tweens.add({
        targets: doubleBtn,
        alpha: 1,
        duration: 400,
        delay: 375,
      })

      doubleBtn.on('pointerdown', async () => {
        const rewarded = await this.adManager.requestRewardedAd()
        if (rewarded && !this.ticketsDoubled) {
          this.ticketsDoubled = true
          const newBalance = SkinManager.addTickets(baseTickets)
          ticketText.setText(`🎫 +${baseTickets * 2} tickets (Total: ${newBalance})`)
          doubleBtn.setText('[ ✓ 2x Claimed ]')
          doubleBtn.disableInteractive()
          doubleBtn.setColor('#44ff44')
        }
      })

      doubleBtn.on('pointerover', () => doubleBtn.setScale(1.1))
      doubleBtn.on('pointerout', () => doubleBtn.setScale(1.0))
    }

    // Next Level button
    const nextLevel = LevelManager.getNextLevel(this.currentLevel)
    if (nextLevel) {
      const nextBtn = this.add.text(width / 2, height / 2 + 80, '[ NEXT LEVEL ]', {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#44ff44',
        fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })
      this.levelCompleteElements.push(nextBtn)

      this.tweens.add({
        targets: nextBtn,
        alpha: 1,
        duration: 400,
        delay: 400,
      })

      nextBtn.on('pointerdown', async () => {
        LevelManager.saveCurrentLevel(nextLevel)
        this.cleanUp()

        if (this.currentLevel % 3 === 0) {
          await this.adManager.requestMidgameAd()
        }

        this.scene.restart({ level: nextLevel })
      })

      nextBtn.on('pointerover', () => nextBtn.setScale(1.1))
      nextBtn.on('pointerout', () => nextBtn.setScale(1.0))
    }

    // Level Select button
    const selectBtn = this.add.text(width / 2, height / 2 + 130, '[ LEVEL SELECT ]', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#88aaff',
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })
    this.levelCompleteElements.push(selectBtn)

    this.tweens.add({
      targets: selectBtn,
      alpha: 1,
      duration: 400,
      delay: 500,
    })

    selectBtn.on('pointerdown', () => {
      this.cleanUp()
      this.scene.start('LevelSelectScene')
    })

    selectBtn.on('pointerover', () => selectBtn.setScale(1.1))
    selectBtn.on('pointerout', () => selectBtn.setScale(1.0))

    // Restart button
    const restartBtn = this.add.text(width / 2, height / 2 + 170, '[ RESTART ]', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff8844',
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })
    this.levelCompleteElements.push(restartBtn)

    this.tweens.add({
      targets: restartBtn,
      alpha: 1,
      duration: 400,
      delay: 600,
    })

    restartBtn.on('pointerdown', () => {
      this.cleanUp()
      this.scene.restart({ level: this.currentLevel })
    })

    restartBtn.on('pointerover', () => restartBtn.setScale(1.1))
    restartBtn.on('pointerout', () => restartBtn.setScale(1.0))
  }

  private getStarString(stars: number): string {
    switch (stars) {
      case 3: return '⭐⭐⭐'
      case 2: return '⭐⭐'
      case 1: return '⭐'
      default: return '☆'
    }
  }

  private cleanUp(): void {
    this.levelCompleteElements.forEach(el => el.destroy())
    this.levelCompleteElements = []
    this.tubeRenderers.forEach(r => r.destroy())
    this.tubeRenderers = []
    this.audioManager.destroy()
  }
}
