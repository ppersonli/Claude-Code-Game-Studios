import Phaser from 'phaser'
import { GAME_CONFIG } from '../../config'
import type { GameCallbacks } from './BootScene'

export interface ResultSceneData {
  strokes: number
  par: number
  starsEarned: boolean[]
  levelId: number
}

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultSceneData

  constructor() {
    super({ key: 'ResultScene' })
  }

  init(data: ResultSceneData): void {
    this.resultData = data
  }

  create(): void {
    const { width, height } = this.scale

    // Background overlay
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.fillRect(0, 0, width, height)

    // Result panel
    const panelWidth = 320
    const panelHeight = 350
    const panelX = (width - panelWidth) / 2
    const panelY = (height - panelHeight) / 2

    const panel = this.add.graphics()
    panel.fillStyle(GAME_CONFIG.COLORS.BG_LIGHT, 0.95)
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16)
    panel.lineStyle(2, GAME_CONFIG.COLORS.NEON_GREEN, 0.8)
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16)

    // Title
    const isHoleInOne = this.resultData.strokes === 1
    const titleText = isHoleInOne ? 'HOLE IN ONE!' : 'LEVEL COMPLETE!'
    const titleColor = isHoleInOne ? '#ffd700' : '#00ff88'

    this.add.text(width / 2, panelY + 30, titleText, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '28px',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Level info
    this.add.text(width / 2, panelY + 70, `Level ${this.resultData.levelId}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5)

    // Strokes
    this.add.text(width / 2, panelY + 110, `Strokes: ${this.resultData.strokes}`, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5)

    // Par comparison
    const parDiff = this.resultData.strokes - this.resultData.par
    let parText: string
    let parColor: string
    if (parDiff < 0) {
      parText = `${Math.abs(parDiff)} under par!`
      parColor = '#00ff88'
    } else if (parDiff === 0) {
      parText = 'Even par'
      parColor = '#ffffff'
    } else {
      parText = `${parDiff} over par`
      parColor = '#ff6b35'
    }

    this.add.text(width / 2, panelY + 145, parText, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      color: parColor,
    }).setOrigin(0.5)

    // Stars
    const starY = panelY + 190
    const starSpacing = 50
    const starStartX = width / 2 - starSpacing

    for (let i = 0; i < 3; i++) {
      const earned = this.resultData.starsEarned[i]
      const starX = starStartX + i * starSpacing

      const starG = this.add.graphics()
      if (earned) {
        starG.fillStyle(GAME_CONFIG.COLORS.STAR_GOLD, 1)
      } else {
        starG.fillStyle(0x555555, 0.5)
      }
      this.drawStar(starG, starX, starY, 5, 16, 8)
    }

    // Buttons
    const buttonY = panelY + panelHeight - 80
    const buttonWidth = 130
    const buttonHeight = 44

    // Retry button — restart same level
    this.createButton(
      width / 2 - buttonWidth / 2 - 10,
      buttonY,
      buttonWidth,
      buttonHeight,
      'RETRY',
      GAME_CONFIG.COLORS.NEON_ORANGE,
      () => {
        this.scene.start('GameScene')
      },
    )

    // Next Level button — also restart (GameScene reads currentLevel from state)
    this.createButton(
      width / 2 + 10,
      buttonY,
      buttonWidth,
      buttonHeight,
      'NEXT',
      GAME_CONFIG.COLORS.NEON_GREEN,
      () => {
        this.scene.start('GameScene')
      },
    )
  }

  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void,
  ): void {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(color, 1)
    bg.fillRoundedRect(0, 0, w, h, 8)
    container.add(bg)

    const text = this.add.text(w / 2, h / 2, label, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add(text)

    const hitArea = this.add.rectangle(x + w / 2, y + h / 2, w, h)
    hitArea.setInteractive({ useHandCursor: true })
    hitArea.on('pointerover', () => { container.setScale(1.05) })
    hitArea.on('pointerout', () => { container.setScale(1) })
    hitArea.on('pointerdown', () => { container.setScale(0.95) })
    hitArea.on('pointerup', () => { container.setScale(1); onClick() })
  }

  private drawStar(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    const points: Phaser.Math.Vector2[] = []
    let rot = Math.PI / 2 * 3
    const step = Math.PI / spikes

    for (let i = 0; i < spikes; i++) {
      points.push(new Phaser.Math.Vector2(
        cx + Math.cos(rot) * outerRadius,
        cy + Math.sin(rot) * outerRadius,
      ))
      rot += step

      points.push(new Phaser.Math.Vector2(
        cx + Math.cos(rot) * innerRadius,
        cy + Math.sin(rot) * innerRadius,
      ))
      rot += step
    }

    graphics.fillPoints(points, true)
  }
}
