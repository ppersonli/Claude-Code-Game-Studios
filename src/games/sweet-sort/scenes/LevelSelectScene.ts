/** Level select scene for Sweet Sort */

import Phaser from 'phaser'
import { getDefaultSave, type SaveData } from '../core/GameState'

const GAME_WIDTH = 480
const GAME_HEIGHT = 854
const SAVE_KEY = 'sweet_sort_save'

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0xFFF5E6)

    const bg = this.add.graphics()
    bg.fillGradientStyle(0xFFF5E6, 0xFFF5E6, 0xFFDAB9, 0xFFDAB9, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.add.text(GAME_WIDTH / 2, 40, 'Select Level', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const save = this.loadSave()
    const levelsPerRow = 5
    const startX = 60
    const startY = 100
    const spacing = 75

    for (let i = 1; i <= 30; i++) {
      const row = Math.floor((i - 1) / levelsPerRow)
      const col = (i - 1) % levelsPerRow
      const x = startX + col * spacing
      const y = startY + row * spacing

      const unlocked = i <= save.currentLevel
      const stars = save.stars[i] || 0

      const btn = this.add.graphics()
      btn.fillStyle(unlocked ? 0x4CAF50 : 0xCCCCCC, 1)
      btn.fillRoundedRect(x - 25, y - 25, 50, 50, 8)

      this.add.text(x, y, `${i}`, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      if (stars > 0) {
        this.add.text(x, y + 30, '⭐'.repeat(stars), {
          fontSize: '10px'
        }).setOrigin(0.5)
      }

      if (unlocked) {
        const zone = this.add.zone(x, y, 50, 50).setInteractive()
        const levelNum = i
        zone.on('pointerdown', () => {
          this.scene.start('GameScene')
          const gameScene = this.scene.get('GameScene') as Phaser.Scene & { loadLevel: (level: number) => void }
          if (gameScene && 'loadLevel' in gameScene) {
            gameScene.loadLevel(levelNum)
          }
        })
      }
    }

    // Back button
    const backBtn = this.add.graphics()
    backBtn.fillStyle(0xF44336, 1)
    backBtn.fillRoundedRect(GAME_WIDTH / 2 - 60, GAME_HEIGHT - 80, 120, 40, 10)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '← Back', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const backZone = this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT - 60, 120, 40).setInteractive()
    backZone.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })
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
}
