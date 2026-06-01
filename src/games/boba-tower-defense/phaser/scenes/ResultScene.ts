import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../../logic/constants'
import { AdManager } from '../../../../services/AdManager'
import { fadeIn } from '../../../../shared/utils/poki-polish'

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene') }

  create(data: { score?: number; level?: number; won?: boolean; lives?: number; enemiesDefeated?: number; coins?: number }): void {
    const score = data.score ?? 0
    const level = data.level ?? 1
    const won = data.won ?? false
    const lives = data.lives ?? 0
    const defeated = data.enemiesDefeated ?? 0
    const coins = data.coins ?? 0
    const adManager = AdManager.getInstance()
    let rewarded = false

    fadeIn(this)
    this.cameras.main.setBackgroundColor(0x1a0a2e)

    this.add.graphics().fillStyle(0x000000, 0.6).fillRect(0, 0, GAME_W, GAME_H)

    this.add.text(GAME_W / 2, 160, won ? '🎉 关卡通过!' : '💀 防线失守', {
      fontSize: '36px', fontFamily: 'Arial',
      color: won ? '#66BB6A' : '#FF5252', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 220, `关卡 ${level}`, {
      fontSize: '18px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 260, `Score: ${score}`, {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 300, `💰 ${coins}  |  💀 ${defeated} defeated  |  ❤️ ${lives} lives`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5)

    // Rewarded ad: 2x coins
    let rewardY = 340
    const rBg = this.add.graphics()
    rBg.fillStyle(0xe056fd, 1)
    rBg.fillRoundedRect(GAME_W / 2 - 90, rewardY, 180, 40, 10)
    const rText = this.add.text(GAME_W / 2, rewardY + 20, '🎬 2x Coins', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.zone(GAME_W / 2, rewardY + 20, 180, 40).setInteractive().on('pointerdown', async () => {
      if (rewarded) return
      const ok = await adManager.requestRewardedAd()
      if (ok) {
        rewarded = true
        rBg.clear().fillStyle(0x666, 1).fillRoundedRect(GAME_W / 2 - 90, rewardY, 180, 40, 10)
        rText.setText('✅ Claimed')
      }
    })

    // Retry
    const playY = rewardY + 60
    this.add.graphics().fillStyle(0xffd700, 1).fillRoundedRect(GAME_W / 2 - 90, playY, 180, 50, 12)
    this.add.text(GAME_W / 2, playY + 25, '▶ Retry', {
      fontSize: '22px', fontFamily: 'Arial', color: '#1a0a2e', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.zone(GAME_W / 2, playY + 25, 180, 50).setInteractive().on('pointerdown', () => {
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level })
      })
    })

    // Menu
    this.add.text(GAME_W / 2, playY + 80, '🏠 Menu', {
      fontSize: '18px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.scene.start('MenuScene')
    })
  }
}
