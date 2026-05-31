import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../../logic/constants'
import { AdManager } from '../../../../services/AdManager'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene')
  }

  create(data: { level?: number; score?: number; won?: boolean; highScore?: number }): void {
    const level = data.level ?? 1
    const score = data.score ?? 0
    const won = data.won ?? false
    const highScore = data.highScore ?? 0
    const adManager = AdManager.getInstance()
    let rewarded = false

    this.cameras.main.setBackgroundColor(0x2d1b4e)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, GAME_W, GAME_H)

    this.add.text(GAME_W / 2, 180, won ? '🎉 通关!' : '😤 挑战失败', {
      fontSize: '40px', fontFamily: 'Arial',
      color: won ? '#66BB6A' : '#FF5252', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 240, `关卡 ${level}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFF',
    }).setOrigin(0.5)

    const scoreText = this.add.text(GAME_W / 2, 290, `分数: ${score}`, {
      fontSize: '30px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 330, `最高分: ${highScore}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5)

    // Rewarded ad: 2x score
    const rewardBtnGfx = this.add.graphics()
    rewardBtnGfx.fillStyle(0xe056fd, 1)
    rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, 370, 180, 45, 12)
    const rewardText = this.add.text(GAME_W / 2, 392, '🎬 2x Score', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5)
    const rewardZone = this.add.zone(GAME_W / 2, 392, 180, 45).setInteractive()
    rewardZone.on('pointerdown', async () => {
      if (rewarded) return
      const success = await adManager.requestRewardedAd()
      if (success) {
        rewarded = true
        scoreText.setText(`分数: ${score * 2}`)
        rewardBtnGfx.clear()
        rewardBtnGfx.fillStyle(0x666666, 1)
        rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, 370, 180, 45, 12)
        rewardText.setText('✅ Claimed')
      }
    })

    // Next / Retry
    const nextLabel = won ? '▶ 下一关' : '🔄 重试'
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 90, 440, 180, 50, 12)
    this.add.text(GAME_W / 2, 465, nextLabel, {
      fontSize: '22px', fontFamily: 'Arial', color: '#2d1b4e', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.zone(GAME_W / 2, 465, 180, 50).setInteractive().on('pointerdown', () => {
      const nextLevel = won && level < 50 ? level + 1 : level
      this.scene.start('GameScene', { level: nextLevel })
    })

    // Level select
    this.add.text(GAME_W / 2, 530, '📋 选择关卡', {
      fontSize: '18px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.scene.start('LevelSelectScene')
    })
  }
}
