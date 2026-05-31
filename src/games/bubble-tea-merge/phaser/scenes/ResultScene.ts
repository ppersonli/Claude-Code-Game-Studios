import Phaser from 'phaser'
import { GAME_W, GAME_H, BG_COLOR } from '../../logic/constants'
import { AdManager } from '../../../../services/AdManager'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene')
  }

  create(data: { score?: number; highScore?: number }): void {
    const score = data.score ?? 0
    const highScore = data.highScore ?? 0
    const adManager = AdManager.getInstance()
    let rewarded = false

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

    const scoreText = this.add
      .text(GAME_W / 2, 280, `Score: ${score}`, {
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 330, `Best: ${highScore}`, {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
      })
      .setOrigin(0.5)

    // Rewarded ad: 2x score
    const rewardBtnGfx = this.add.graphics()
    rewardBtnGfx.fillStyle(0xe056fd, 1)
    rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, 370, 180, 45, 12)

    const rewardText = this.add
      .text(GAME_W / 2, 392, '🎬 2x Score', {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const rewardZone = this.add.zone(GAME_W / 2, 392, 180, 45).setInteractive()
    rewardZone.on('pointerdown', async () => {
      if (rewarded) return
      const success = await adManager.requestRewardedAd()
      if (success) {
        rewarded = true
        scoreText.setText(`Score: ${score * 2}`)
        rewardBtnGfx.clear()
        rewardBtnGfx.fillStyle(0x666666, 1)
        rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, 370, 180, 45, 12)
        rewardText.setText('✅ Claimed')
      }
    })

    // Play Again button
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 90, 440, 180, 60, 15)

    this.add
      .text(GAME_W / 2, 470, '▶ Play Again', {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#1a0a2e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const playZone = this.add.zone(GAME_W / 2, 470, 180, 60).setInteractive()
    playZone.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    // Menu button
    this.add
      .text(GAME_W / 2, 540, '🏠 Menu', {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#CE93D8',
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('MenuScene')
      })
  }
}
