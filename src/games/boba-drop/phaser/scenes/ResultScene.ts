import Phaser from 'phaser'
import { GAME_W, GAME_H, BG_COLOR } from '../../logic/constants'
import { loadSave } from '../../logic/save'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene')
  }

  create(data: { score?: number }): void {
    const score = data.score ?? 0
    const save = loadSave()

    this.cameras.main.setBackgroundColor(BG_COLOR)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, GAME_W, GAME_H)

    this.add
      .text(GAME_W / 2, 200, 'Game Over', {
        fontSize: '52px',
        fontFamily: 'Arial, sans-serif',
        color: '#FF5252',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 280, `Score: ${score}`, {
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 330, `Best: ${save.highScore}`, {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
      })
      .setOrigin(0.5)

    // Play Again button
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 90, 400, 180, 60, 15)

    this.add
      .text(GAME_W / 2, 430, '▶ Play Again', {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#3E2723',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const playZone = this.add.zone(GAME_W / 2, 430, 180, 60).setInteractive()
    playZone.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    // Menu button
    const menuBtn = this.add
      .text(GAME_W / 2, 510, '🏠 Menu', {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#CE93D8',
      })
      .setOrigin(0.5)
      .setInteractive()

    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })
  }
}
