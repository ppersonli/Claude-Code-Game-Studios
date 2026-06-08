import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../../data/constants'
import { fadeIn } from '@shared/utils/poki-polish'
import { audioEngine } from '@shared/phaser/audio'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2

    // Loading bar
    const barW = 400
    const barH = 30
    const barBg = this.add.graphics()
    barBg.fillStyle(0x2d1b4e, 0.8)
    barBg.fillRoundedRect(cx - barW / 2 - 10, cy - barH / 2 - 10, barW + 20, barH + 20, 16)

    const bar = this.add.graphics()
    const loadText = this.add.text(cx, cy - 50, 'Loading...', {
      fontFamily: 'Nunito, sans-serif', fontSize: '24px', color: '#FF6B9D',
    }).setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      bar.clear()
      bar.fillStyle(0xff6b9d, 1)
      bar.fillRoundedRect(cx - barW / 2, cy - barH / 2, barW * value, barH, 10)
    })

    this.load.on('complete', () => {
      bar.destroy()
      barBg.destroy()
      loadText.setText('Ready!')
    })

    // Load all assets
    const base = import.meta.env.BASE_URL || './'
    const assets = `${base}assets/runway-fashion`

    // Backgrounds
    this.load.image('bg-menu', `${assets}/bg-menu.webp`)
    this.load.image('bg-runway', `${assets}/bg-runway.webp`)
    this.load.image('bg-dressup', `${assets}/bg-dressup.webp`)
    this.load.image('icon', `${assets}/icon.webp`)

    // Models
    this.load.image('model_default', `${assets}/models/model_default.webp`)
    this.load.image('model_curvy', `${assets}/models/model_curvy.webp`)
    this.load.image('model_petite', `${assets}/models/model_petite.webp`)

    // Clothing
    const clothingIds = [
      'top_tshirt', 'top_blouse', 'top_evening', 'top_crop',
      'bottom_skirt', 'bottom_jeans', 'bottom_evening',
      'shoes_sneakers', 'shoes_heels', 'shoes_boots',
      'acc_necklace', 'acc_bag', 'acc_sunglasses',
      'hair_long', 'hair_short', 'hair_updo',
    ]
    for (const id of clothingIds) {
      this.load.image(id, `${assets}/clothing/${id}.webp`)
    }

    // UI icons
    this.load.image('icon_coin', `${assets}/ui/icon_coin.webp`)
    this.load.image('icon_star', `${assets}/ui/icon_star.webp`)
    this.load.image('icon_heart', `${assets}/ui/icon_heart.webp`)
  }

  create(): void {
    audioEngine.init()
    fadeIn(this, 400)
    this.scene.start('MenuScene')
  }
}
