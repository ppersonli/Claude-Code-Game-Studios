import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../../logic/constants'
import { AdManager } from '../../../../services/AdManager'

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }) }

  create(data: { score?: number; pearls?: number; highScore?: number; distance?: number; metaCoins?: number }): void {
    const score = data.score ?? 0
    const pearls = data.pearls ?? 0
    const highScore = data.highScore ?? 0
    const distance = data.distance ?? 0
    const metaCoins = data.metaCoins ?? 0
    const adManager = AdManager.getInstance()
    let rewarded = false

    this.cameras.main.setBackgroundColor(0x1a0a2e)
    this.add.graphics().fillStyle(0x000000, 0.6).fillRect(0, 0, GAME_W, GAME_H)

    this.add.text(GAME_W / 2, 180, '💥 Game Over', {
      fontSize: '40px', fontFamily: 'Arial', color: '#FF5252', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 240, `分数: ${score}`, {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 280, `距离: ${distance}m  |  珍珠: ${pearls}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#CCC',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 310, `最高分: ${highScore}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5)

    if (metaCoins > 0) {
      this.add.text(GAME_W / 2, 335, `💰 累计: ${metaCoins}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
      }).setOrigin(0.5)
    }

    // Rewarded ad: continue
    const rBg = this.add.graphics().fillStyle(0xe056fd, 1).fillRoundedRect(GAME_W / 2 - 90, 350, 180, 45, 12)
    const rText = this.add.text(GAME_W / 2, 372, '🎬 继续奔跑', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.zone(GAME_W / 2, 372, 180, 45).setInteractive().on('pointerdown', async () => {
      if (rewarded) return
      const ok = await adManager.requestRewardedAd()
      if (ok) {
        rewarded = true
        rBg.clear().fillStyle(0x666, 1).fillRoundedRect(GAME_W / 2 - 90, 350, 180, 45, 12)
        rText.setText('✅ 已使用')
        this.scene.start('GameScene')
      }
    })

    // Retry
    this.add.graphics().fillStyle(0xffd700, 1).fillRoundedRect(GAME_W / 2 - 90, 420, 180, 50, 12)
    this.add.text(GAME_W / 2, 445, '▶ 再来', {
      fontSize: '22px', fontFamily: 'Arial', color: '#1a0a2e', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.zone(GAME_W / 2, 445, 180, 50).setInteractive().on('pointerdown', () => {
      this.scene.start('GameScene')
    })
  }
}
