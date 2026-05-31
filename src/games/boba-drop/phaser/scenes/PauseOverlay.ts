import Phaser from 'phaser'
import { GAME_W, BG_COLOR, GAME_H } from '../../logic/constants'

export class PauseOverlay extends Phaser.Scene {
  constructor() {
    super('PauseOverlay')
  }

  create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0.6)')

    this.add
      .text(GAME_W / 2, GAME_H / 2 - 40, 'PAUSED', {
        fontSize: '48px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const resumeBtn = this.add
      .text(GAME_W / 2, GAME_H / 2 + 30, '▶ Resume', {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
      })
      .setOrigin(0.5)
      .setInteractive()

    resumeBtn.on('pointerdown', () => {
      this.scene.stop()
      this.scene.resume('GameScene')
    })
  }
}
