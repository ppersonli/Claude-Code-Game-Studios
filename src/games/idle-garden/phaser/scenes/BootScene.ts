/**
 * Idle Garden Tycoon — Boot Scene
 * Loads all game assets and shows a loading bar.
 * Receives GameSceneData via init() and passes it to GameScene.
 */
import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config'
import type { GameSceneData } from './GameScene'

export class BootScene extends Phaser.Scene {
  private sceneData!: GameSceneData

  constructor() {
    super({ key: 'BootScene' })
  }

  init(data: GameSceneData): void {
    this.sceneData = data
  }

  preload(): void {
    const barW = 280
    const barH = 24
    const barX = (GAME_WIDTH - barW) / 2
    const barY = GAME_HEIGHT / 2

    // Loading bar background
    const bg = this.add.graphics()
    bg.fillStyle(0x2d5a3f, 1)
    bg.fillRoundedRect(barX - 4, barY - 4, barW + 8, barH + 8, 8)

    const bar = this.add.graphics()
    const text = this.add.text(GAME_WIDTH / 2, barY - 40, 'Loading...', {
      fontFamily: 'Fredoka One, cursive',
      fontSize: '22px',
      color: COLORS.accent,
    }).setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      bar.clear()
      bar.fillStyle(0x4CAF50, 1)
      bar.fillRoundedRect(barX, barY, barW * value, barH, 6)
    })

    this.load.on('complete', () => {
      text.setText('Ready!')
    })

    // Load game assets
    const base = import.meta.env.BASE_URL || './'
    this.load.image('bg-game', `${base}assets/idle-garden/bg-game.webp`)
    this.load.image('flower-sunflower', `${base}assets/idle-garden/flower-sunflower.webp`)
    this.load.image('flower-tulip', `${base}assets/idle-garden/flower-tulip.webp`)
    this.load.image('flower-rose', `${base}assets/idle-garden/flower-rose.webp`)
    this.load.image('flower-peony', `${base}assets/idle-garden/flower-peony.webp`)
    this.load.image('flower-orchid', `${base}assets/idle-garden/flower-orchid.webp`)
    this.load.image('flower-rainbow', `${base}assets/idle-garden/flower-rainbow.webp`)
    this.load.image('pot-empty', `${base}assets/idle-garden/pot-empty.webp`)
    this.load.image('coin', `${base}assets/idle-garden/coin.webp`)
  }

  create(): void {
    this.scene.start('GameScene', this.sceneData)
  }
}
