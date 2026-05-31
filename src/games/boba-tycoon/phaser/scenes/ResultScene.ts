import Phaser from 'phaser'
import { AdManager } from '../../../../services/AdManager'

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }) }

  create(data: { score?: number; level?: number }): void {
    const score = data.score ?? 0
    const level = data.level ?? 1
    const adManager = AdManager.getInstance()
    let rewarded = false

    this.cameras.main.setBackgroundColor(0x1a0a2e)
    this.add.graphics().fillStyle(0x000000, 0.6).fillRect(0, 0, 480, 854)
    this.add.text(240, 200, '营业结束!', { fontSize: '40px', fontFamily: 'Arial', color: '#f48fb1', fontStyle: 'bold' }).setOrigin(0.5)
    this.add.text(240, 260, `等级 ${level}`, { fontSize: '20px', fontFamily: 'Arial', color: '#fff' }).setOrigin(0.5)
    const scoreText = this.add.text(240, 310, `$${score}`, { fontSize: '34px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5)

    // Rewarded ad: 2x income boost
    const rBg = this.add.graphics().fillStyle(0xe056fd, 1).fillRoundedRect(150, 370, 180, 40, 10)
    const rText = this.add.text(240, 390, '🎬 2x 收入', { fontSize: '16px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)
    this.add.zone(240, 390, 180, 40).setInteractive().on('pointerdown', async () => {
      if (rewarded) return
      const ok = await adManager.requestRewardedAd()
      if (ok) { rewarded = true; scoreText.setText(`$${score * 2}`); rBg.clear().fillStyle(0x666, 1).fillRoundedRect(150, 370, 180, 40, 10); rText.setText('✅ 已领取') }
    })

    this.add.graphics().fillStyle(0xffd700, 1).fillRoundedRect(150, 430, 180, 50, 12)
    this.add.text(240, 455, '▶ 再来', { fontSize: '22px', fontFamily: 'Arial', color: '#1a0a2e', fontStyle: 'bold' }).setOrigin(0.5)
    this.add.zone(240, 455, 180, 50).setInteractive().on('pointerdown', () => this.scene.start('GameScene'))
  }
}
