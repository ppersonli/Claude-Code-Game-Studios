import Phaser from 'phaser'
import { GAME_W, GAME_H, BG_COLOR } from '../../logic/constants'
import { loadSave } from '../../logic/save'
import { isDailyAvailable } from '../../logic/meta'
import { drawIngredient } from '../helpers'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  create(): void {
    const save = loadSave()

    this.cameras.main.setBackgroundColor(BG_COLOR)

    // Title
    this.add
      .text(GAME_W / 2, 200, '🧋 奶茶合成大作战', {
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 245, 'Bubble Tea Merge', {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#CE93D8',
      })
      .setOrigin(0.5)

    // Coins + high score bar
    this.add.text(GAME_W / 2, 285, `💰 ${save.coins}  |  🏆 Best: ${save.highScore}  |  ⭐ ${save.stats.totalMerges} merges`, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#FFD700',
    }).setOrigin(0.5)

    // Floating ingredients decoration
    for (let i = 0; i < 5; i++) {
      const gfx = this.add.graphics()
      drawIngredient(gfx, 0, 0, i % 4, 0.8)
      gfx.setPosition(80 + i * 80, 360)
      this.tweens.add({
        targets: gfx,
        y: 350 + Math.sin(i) * 15,
        duration: 1500 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // Play button
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 100, 460, 200, 55, 15)

    this.add
      .text(GAME_W / 2, 487, '▶ 开始游戏', {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#1a0a2e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add.zone(GAME_W / 2, 487, 200, 55).setInteractive().on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    // Daily challenge button
    if (isDailyAvailable(save)) {
      const dailyGfx = this.add.graphics()
      dailyGfx.fillStyle(0xFF8C00, 1)
      dailyGfx.fillRoundedRect(GAME_W / 2 - 100, 530, 200, 40, 10)

      this.add.text(GAME_W / 2, 550, '📅 每日挑戰 (+50💰)', {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#fff', fontStyle: 'bold',
      }).setOrigin(0.5)

      this.add.zone(GAME_W / 2, 550, 200, 40).setInteractive().on('pointerdown', () => {
        this.scene.start('GameScene', { isDaily: true })
      })
    }

    // Instructions
    this.add
      .text(GAME_W / 2, 640, '相同配料碰撞合成更高级配料\n溢出杯口则游戏结束', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#9E9E9E',
        align: 'center',
      })
      .setOrigin(0.5)
  }
}
