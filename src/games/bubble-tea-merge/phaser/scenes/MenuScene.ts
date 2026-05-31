import Phaser from 'phaser'
import { GAME_W, GAME_H, BG_COLOR } from '../../logic/constants'
import { loadSave } from '../../logic/save'
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
      .text(GAME_W / 2, 220, '🧋 奶茶合成大作战', {
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 270, 'Bubble Tea Merge', {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#CE93D8',
      })
      .setOrigin(0.5)

    // Floating ingredients decoration
    for (let i = 0; i < 5; i++) {
      const gfx = this.add.graphics()
      drawIngredient(gfx, 0, 0, i % 4, 0.8)
      gfx.setPosition(80 + i * 80, 380)
      this.tweens.add({
        targets: gfx,
        y: 370 + Math.sin(i) * 15,
        duration: 1500 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // High score
    if (save.highScore > 0) {
      this.add
        .text(GAME_W / 2, 440, `🏆 Best: ${save.highScore}`, {
          fontSize: '20px',
          fontFamily: 'Arial, sans-serif',
          color: '#FFD700',
        })
        .setOrigin(0.5)
    }

    // Play button
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xffd700, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 100, 500, 200, 60, 15)

    this.add
      .text(GAME_W / 2, 530, '▶ 开始游戏', {
        fontSize: '26px',
        fontFamily: 'Arial, sans-serif',
        color: '#1a0a2e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const btnZone = this.add.zone(GAME_W / 2, 530, 200, 60).setInteractive()
    btnZone.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    // Instructions
    this.add
      .text(GAME_W / 2, 650, '相同配料碰撞合成更高级配料\n溢出杯口则游戏结束', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#9E9E9E',
        align: 'center',
      })
      .setOrigin(0.5)
  }
}
