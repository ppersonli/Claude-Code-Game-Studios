import Phaser from 'phaser'
import { GAME_W, GAME_H, BG_COLOR } from '../../logic/constants'
import { AdManager } from '../../../../services/AdManager'

interface AchievementInfo { name: string; emoji: string; reward: number }

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene')
  }

  create(data: { score?: number; highScore?: number; scoreCoins?: number; dailyCoins?: number; newAchievements?: AchievementInfo[] }): void {
    const score = data.score ?? 0
    const highScore = data.highScore ?? 0
    const scoreCoins = data.scoreCoins ?? 0
    const dailyCoins = data.dailyCoins ?? 0
    const achievements = data.newAchievements ?? []
    const adManager = AdManager.getInstance()
    let rewarded = false

    this.cameras.main.setBackgroundColor(BG_COLOR)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, GAME_W, GAME_H)

    this.add.text(GAME_W / 2, 170, 'Game Over', {
      fontSize: '48px', fontFamily: 'Arial, sans-serif', color: '#FF5252', fontStyle: 'bold',
    }).setOrigin(0.5)

    const scoreText = this.add.text(GAME_W / 2, 240, `Score: ${score}`, {
      fontSize: '32px', fontFamily: 'Arial, sans-serif', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 280, `Best: ${highScore}`, {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF',
    }).setOrigin(0.5)

    // Coins earned
    let coinY = 310
    const coinParts = [`💰 +${scoreCoins}`]
    if (dailyCoins > 0) coinParts.push(`+${dailyCoins} daily`)
    this.add.text(GAME_W / 2, coinY, coinParts.join(' '), {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#FFD700',
    }).setOrigin(0.5)
    coinY += 25

    // Achievement notifications
    if (achievements.length > 0) {
      for (const a of achievements.slice(0, 3)) {
        this.add.text(GAME_W / 2, coinY, `${a.emoji} ${a.name} +💰${a.reward}`, {
          fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#66BB6A',
        }).setOrigin(0.5)
        coinY += 20
      }
    }

    // Rewarded ad: 2x score
    const rewardY = coinY + 15
    const rewardBtnGfx = this.add.graphics()
    rewardBtnGfx.fillStyle(0xe056fd, 1)
    rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, rewardY, 180, 40, 10)

    const rewardText = this.add.text(GAME_W / 2, rewardY + 20, '🎬 2x Score', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.zone(GAME_W / 2, rewardY + 20, 180, 40).setInteractive().on('pointerdown', async () => {
      if (rewarded) return
      const success = await adManager.requestRewardedAd()
      if (success) {
        rewarded = true
        scoreText.setText(`Score: ${score * 2}`)
        rewardBtnGfx.clear()
        rewardBtnGfx.fillStyle(0x666666, 1)
        rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 90, rewardY, 180, 40, 10)
        rewardText.setText('✅ Claimed')
      }
    })

    // Play Again
    const playY = rewardY + 60
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 90, playY, 180, 50, 12)

    this.add.text(GAME_W / 2, playY + 25, '▶ Play Again', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', color: '#3E2723', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.zone(GAME_W / 2, playY + 25, 180, 50).setInteractive().on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    // Menu
    this.add.text(GAME_W / 2, playY + 80, '🏠 Menu', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#CE93D8',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.scene.start('MenuScene')
    })
  }
}
