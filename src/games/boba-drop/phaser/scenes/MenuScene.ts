import Phaser from 'phaser'
import { GAME_W, GAME_H, BG_COLOR } from '../../logic/constants'
import { loadSave } from '../../logic/save'
import { isDailyAvailable } from '../../logic/meta'
import { drawIngredient } from '../helpers'
import { INGREDIENTS } from '../../data/ingredients'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  create(): void {
    const save = loadSave()
    this.cameras.main.setBackgroundColor(BG_COLOR)

    // Floating bubbles
    for (let i = 0; i < 15; i++) {
      const bx = Phaser.Math.Between(20, GAME_W - 20)
      const by = Phaser.Math.Between(50, GAME_H - 50)
      const br = Phaser.Math.Between(5, 20)
      const bubble = this.add.circle(bx, by, br, 0x6a1b9a, 0.15)
      this.tweens.add({
        targets: bubble,
        y: -50,
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      })
    }

    // Title
    this.add.text(GAME_W / 2, 180, 'BOBA', {
      fontSize: '72px', fontFamily: 'Arial, sans-serif', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 260, 'DROP', {
      fontSize: '72px', fontFamily: 'Arial, sans-serif', color: '#FF9800', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_W / 2, 320, '🧋 Bubble Tea Merge Game', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#CE93D8',
    }).setOrigin(0.5)

    // Coins + stats bar
    this.add.text(GAME_W / 2, 360, `💰 ${save.coins}  |  🏆 Best: ${save.highScore}  |  🔮 ${save.stats.totalMerges} merges`, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#FFD700',
    }).setOrigin(0.5)

    // Play button
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 80, 400, 160, 55, 15)

    this.add.text(GAME_W / 2, 427, '▶ Play', {
      fontSize: '30px', fontFamily: 'Arial, sans-serif', color: '#3E2723', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.zone(GAME_W / 2, 427, 160, 55).setInteractive().on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    // Daily challenge button
    if (isDailyAvailable(save)) {
      const dailyGfx = this.add.graphics()
      dailyGfx.fillStyle(0xFF8C00, 1)
      dailyGfx.fillRoundedRect(GAME_W / 2 - 80, 470, 160, 40, 10)

      this.add.text(GAME_W / 2, 490, '📅 Daily (+50💰)', {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#fff', fontStyle: 'bold',
      }).setOrigin(0.5)

      this.add.zone(GAME_W / 2, 490, 160, 40).setInteractive().on('pointerdown', () => {
        this.scene.start('GameScene', { isDaily: true })
      })
    }

    // Floating ingredients
    for (let i = 0; i < INGREDIENTS.length; i++) {
      const ix = Phaser.Math.Between(30, GAME_W - 30)
      const iy = Phaser.Math.Between(600, 750)
      const igfx = this.add.graphics()
      drawIngredient(igfx, ix, iy, i, 1)
      this.tweens.add({
        targets: igfx,
        y: -50,
        duration: Phaser.Math.Between(6000, 12000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
      })
    }
  }
}
