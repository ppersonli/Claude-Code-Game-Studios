import Phaser from 'phaser'
import { GAME_W, GAME_H, TOWER_STATS, TOTAL_LEVELS } from '../../logic/constants'
import { loadSave } from '../../logic/save'

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene') }

  create(): void {
    const save = loadSave()
    this.cameras.main.setBackgroundColor(0x2d1b4e)
    this.cameras.main.fadeIn(300)

    // Background bubbles
    for (let i = 0; i < 12; i++) {
      const b = this.add.circle(
        Phaser.Math.Between(20, GAME_W - 20),
        Phaser.Math.Between(50, GAME_H - 50),
        Phaser.Math.Between(4, 16),
        0x6a1b9a, 0.12,
      )
      this.tweens.add({ targets: b, y: -30, duration: Phaser.Math.Between(3000, 7000), repeat: -1, delay: Phaser.Math.Between(0, 2000) })
    }

    // Title
    this.add.text(GAME_W / 2, 140, '🧋 BOBA', {
      fontSize: '56px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 210, 'TOWER DEFENSE', {
      fontSize: '28px', fontFamily: 'Arial', color: '#FF9800', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 250, '波波塔防', {
      fontSize: '20px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5)

    // Stats
    if (save.highScore > 0) {
      this.add.text(GAME_W / 2, 290, `🏆 Best: ${save.highScore}  |  💰 ${save.coins}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
      }).setOrigin(0.5)
    }

    // Tower preview
    const towerKeys = Object.keys(TOWER_STATS) as (keyof typeof TOWER_STATS)[]
    const startX = 60
    towerKeys.forEach((key, i) => {
      const stats = TOWER_STATS[key]
      const x = startX + i * 90
      this.add.text(x, 350, stats.emoji, { fontSize: '32px' }).setOrigin(0.5)
      this.add.text(x, 380, stats.name, { fontSize: '10px', fontFamily: 'Arial', color: '#CE93D8' }).setOrigin(0.5)
    })

    // Play button
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 80, 430, 160, 55, 14)

    this.add.text(GAME_W / 2, 457, '▶ 开始游戏', {
      fontSize: '22px', fontFamily: 'Arial', color: '#2d1b4e', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.zone(GAME_W / 2, 457, 160, 55).setInteractive().on('pointerdown', () => {
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene')
      })
    })

    // Level select
    this.add.text(GAME_W / 2, 520, '选择关卡:', {
      fontSize: '14px', fontFamily: 'Arial', color: '#CE93D8',
    }).setOrigin(0.5)

    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const completed = save.levelsCompleted.includes(i + 1)
      const unlocked = i === 0 || save.levelsCompleted.includes(i)
      const x = 100 + i * 70
      const color = completed ? 0x66bb6a : unlocked ? 0xce93d8 : 0x444444
      const gfx = this.add.graphics()
      gfx.fillStyle(color, 1)
      gfx.fillRoundedRect(x - 22, 540, 44, 36, 8)
      this.add.text(x, 558, `${i + 1}`, { fontSize: '16px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)

      if (unlocked) {
        this.add.zone(x, 558, 44, 36).setInteractive().on('pointerdown', () => {
          this.cameras.main.fadeOut(300)
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { level: i + 1 })
          })
        })
      }
    }
  }
}
