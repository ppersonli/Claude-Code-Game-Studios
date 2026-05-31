/** Menu scene for Sweet Sort */

import Phaser from 'phaser'
import { getDefaultSave, type SaveData } from '../core/GameState'

const GAME_WIDTH = 480
const GAME_HEIGHT = 854
const SAVE_KEY = 'sweet_sort_save'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0xFFF5E6)

    const bg = this.add.graphics()
    bg.fillGradientStyle(0xFFF5E6, 0xFFF5E6, 0xFFDAB9, 0xFFDAB9, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.add.text(GAME_WIDTH / 2, 150, '🍬 Sweet Sort 🍬', {
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 200, 'Color Sorting Puzzle', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513'
    }).setOrigin(0.5)

    // Play button
    const playBtn = this.add.graphics()
    playBtn.fillStyle(0x4CAF50, 1)
    playBtn.fillRoundedRect(GAME_WIDTH / 2 - 80, 320, 160, 50, 15)

    this.add.text(GAME_WIDTH / 2, 345, '▶ Play', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const playZone = this.add.zone(GAME_WIDTH / 2, 345, 160, 50).setInteractive()
    playZone.on('pointerdown', () => {
      const save = this.loadSave()
      this.scene.start('GameScene')
      const gameScene = this.scene.get('GameScene') as Phaser.Scene & { loadLevel: (level: number) => void }
      if (gameScene && 'loadLevel' in gameScene) {
        gameScene.loadLevel(save.currentLevel)
      }
    })

    // Level select button
    const selectBtn = this.add.graphics()
    selectBtn.fillStyle(0x2196F3, 1)
    selectBtn.fillRoundedRect(GAME_WIDTH / 2 - 80, 400, 160, 50, 15)

    this.add.text(GAME_WIDTH / 2, 425, '📋 Levels', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const selectZone = this.add.zone(GAME_WIDTH / 2, 425, 160, 50).setInteractive()
    selectZone.on('pointerdown', () => {
      this.scene.start('LevelSelectScene')
    })

    // Stats
    const save = this.loadSave()
    this.add.text(GAME_WIDTH / 2, 520, `⭐ Total Stars: ${save.totalStars}`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513'
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 550, `🏆 Highest Level: ${save.currentLevel - 1}`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#8B4513'
    }).setOrigin(0.5)
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
