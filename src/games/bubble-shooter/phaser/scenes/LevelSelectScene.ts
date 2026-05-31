import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../../logic/constants'
import { loadSave, saveFull } from '../../logic/save'
import { getLevelConfig } from '../../logic/levels'
import { isDailyRewardAvailable, claimDailyReward, dailyRewardCoins, checkShooterAchievements, type ShooterStats } from '../../logic/meta'
import { SHOOTER_ACHIEVEMENTS } from '../../data/achievements'

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene')
  }

  create(): void {
    const save = loadSave()
    const completed = new Set(save.levelsCompleted)

    this.cameras.main.setBackgroundColor(0x2d1b4e)

    this.add.text(GAME_W / 2, 45, '🧋 选择关卡', {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Stats bar
    this.add.text(GAME_W / 2, 75, `💰 ${save.coins}  |  🏆 ${save.highScore}  |  🏅 ${save.levelsCompleted.length}/50  |  🏆 ${save.achievements.length}/${SHOOTER_ACHIEVEMENTS.length}`, {
      fontSize: '12px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5)

    // Daily reward button
    if (isDailyRewardAvailable(save.lastDailyDate)) {
      const dailyBtn = this.add.text(GAME_W / 2, 95, `🎁 每日奖励 +${dailyRewardCoins()}💰`, {
        fontSize: '13px', fontFamily: 'Arial', color: '#00b894', fontStyle: 'bold',
        backgroundColor: '#1a3a2a', padding: { x: 10, y: 4 },
      }).setOrigin(0.5).setInteractive()
      dailyBtn.on('pointerdown', () => {
        const result = claimDailyReward(save.lastDailyDate)
        if (result.claimed) {
          save.lastDailyDate = result.today
          save.stats.dailyCompleted++
          save.coins += dailyRewardCoins()
          saveFull(save)
          dailyBtn.setText('✅ 已领取').setColor('#666').disableInteractive()
          this.checkAchievements()
        }
      })
    }

    const cols = 5
    const startX = 55
    const startY = 115
    const spacing = 78

    for (let i = 1; i <= 50; i++) {
      const col = (i - 1) % cols
      const row = Math.floor((i - 1) / cols)
      const x = startX + col * spacing
      const y = startY + row * 60
      const isComplete = completed.has(i)
      const isUnlocked = i === 1 || completed.has(i - 1)
      const config = getLevelConfig(i)

      const gfx = this.add.graphics()
      gfx.fillStyle(isComplete ? 0x66bb6a : isUnlocked ? 0xce93d8 : 0x444444, 1)
      gfx.fillRoundedRect(x - 28, y - 22, 56, 44, 10)

      this.add.text(x, y - 5, `${i}`, {
        fontSize: '18px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold',
      }).setOrigin(0.5)

      this.add.text(x, y + 14, `${config.colors}色`, {
        fontSize: '10px', fontFamily: 'Arial', color: 'rgba(255,255,255,0.7)',
      }).setOrigin(0.5)

      if (isUnlocked) {
        const zone = this.add.zone(x, y, 56, 44).setInteractive()
        zone.on('pointerdown', () => {
          this.scene.start('GameScene', { level: i })
        })
      } else {
        this.add.text(x, y - 5, '🔒', { fontSize: '14px' }).setOrigin(0.5)
      }
    }

    // Back
    this.add.text(GAME_W / 2, GAME_H - 40, '← 返回', {
      fontSize: '16px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.scene.start('LevelSelectScene')
    })
  }

  private checkAchievements(): void {
    const save = loadSave()
    const newAchievements = checkShooterAchievements(save.stats, save.achievements)
    for (const a of newAchievements) {
      save.achievements.push(a.id)
      save.coins += a.reward
    }
    if (newAchievements.length > 0) saveFull(save)
  }
}
