import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../../logic/constants'
import { AdManager } from '../../../../services/AdManager'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene')
  }

  create(data: { score?: number; coins?: number; level?: number; served?: number }): void {
    const score = data.score ?? 0
    const coins = data.coins ?? 0
    const level = data.level ?? 1
    const served = data.served ?? 0
    const adManager = AdManager.getInstance()
    let rewarded = false

    this.cameras.main.setBackgroundColor(0x2d1b4e)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, GAME_W, GAME_H)

    this.add.text(GAME_W / 2, 180, '营业结束!', {
      fontSize: '40px', fontFamily: 'Arial', color: '#FF69B4', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 240, `等级 ${level}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFF',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 280, `服务 ${served} 位顾客`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#CCC',
    }).setOrigin(0.5)

    const scoreText = this.add.text(GAME_W / 2, 330, `💰 ${coins}`, {
      fontSize: '36px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Rewarded ad: +30s time
    const rewardBtnGfx = this.add.graphics()
    rewardBtnGfx.fillStyle(0xe056fd, 1)
    rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, 380, 180, 45, 12)
    const rewardText = this.add.text(GAME_W / 2, 402, '🎬 +30秒继续', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5)
    const rewardZone = this.add.zone(GAME_W / 2, 402, 180, 45).setInteractive()
    rewardZone.on('pointerdown', async () => {
      if (rewarded) return
      const success = await adManager.requestRewardedAd()
      if (success) {
        rewarded = true
        rewardBtnGfx.clear()
        rewardBtnGfx.fillStyle(0x666666, 1)
        rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, 380, 180, 45, 12)
        rewardText.setText('✅ 已领取')
      }
    })

    // Play Again
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 90, 450, 180, 55, 14)
    this.add.text(GAME_W / 2, 477, '▶ 再来一局', {
      fontSize: '24px', fontFamily: 'Arial', color: '#2d1b4e', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.zone(GAME_W / 2, 477, 180, 55).setInteractive().on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    // Menu
    this.add.text(GAME_W / 2, 540, '🏠 主页', {
      fontSize: '20px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.scene.start('GameScene')
    })
  }
}
