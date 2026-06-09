import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../../data/constants'
import { fadeIn, spawnParticles } from '@shared/utils/poki-polish'
import { audioEngine } from '@shared/phaser/audio'
import { t } from '../../i18n'
import { SaveSystem } from '../../systems/SaveSystem'

const SAVE_KEY = 'runway-fashion-save'

export class MenuScene extends Phaser.Scene {
  private saveSystem = new SaveSystem()

  constructor() {
    super({ key: 'MenuScene' })
  }

  create(): void {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2

    // Background
    const bg = this.add.image(cx, cy, 'bg-menu')
    bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    // Dark overlay for readability
    const overlay = this.add.graphics()
    overlay.fillStyle(0x1a0a2e, 0.55)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Title
    const title = this.add.text(cx, 220, t('title'), {
      fontFamily: 'Fredoka One, cursive', fontSize: '52px', color: '#FF6B9D',
      stroke: '#2d1b4e', strokeThickness: 6,
      align: 'center', wordWrap: { width: GAME_WIDTH - 80 },
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(cx, 290, t('subtitle'), {
      fontFamily: 'Nunito, sans-serif', fontSize: '22px', color: '#E8B4CB',
      align: 'center', wordWrap: { width: GAME_WIDTH - 100 },
    }).setOrigin(0.5)

    // Fashion icon
    const icon = this.add.image(cx, 450, 'icon')
    icon.setDisplaySize(200, 200)
    this.tweens.add({
      targets: icon, y: 460, duration: 2000,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    })

    // Play button
    this.createButton(cx, 680, 300, 70, t('play'), 0xFF6B9D, () => {
      audioEngine.play('levelup')
      this.scene.start('ThemeSelectScene')
    })

    // High score
    const save = this.loadSave()
    if (save.highScore > 0) {
      this.add.text(cx, 790, `${t('highScore')}: ${save.highScore}`, {
        fontFamily: 'Nunito, sans-serif', fontSize: '20px', color: '#FFD700',
      }).setOrigin(0.5)
    }

    // Coin display
    if (save.coins > 0) {
      const coinIcon = this.add.image(cx - 50, 840, 'icon_coin')
      coinIcon.setDisplaySize(32, 32)
      this.add.text(cx - 20, 840, save.coins.toLocaleString(), {
        fontFamily: 'Nunito, sans-serif', fontSize: '22px', color: '#FFD700',
      }).setOrigin(0, 0.5)
    }

    // Version
    this.add.text(cx, GAME_HEIGHT - 40, 'v1.0.0', {
      fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.3)',
    }).setOrigin(0.5)

    // Title entrance animation
    title.setScale(0)
    this.tweens.add({
      targets: title, scaleX: 1, scaleY: 1,
      duration: 600, ease: 'Back.easeOut',
    })

    // Sparkle particles on title after entrance
    this.time.delayedCall(700, () => {
      spawnParticles(this, cx, 220, [0xFF6B9D, 0xFFD700, 0xE8B4CB, 0xFFFFFF], 12)
    })

    fadeIn(this, 300)
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, color: number, onClick: () => void,
  ): void {
    const btn = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(color, 1)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20)
    // Shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.2)
    shadow.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w, h, 20)
    btn.add(shadow)
    btn.add(bg)

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Fredoka One, cursive', fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5)
    btn.add(txt)

    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => btn.setScale(1.05))
    hit.on('pointerout', () => btn.setScale(1))
    hit.on('pointerdown', () => {
      btn.setScale(0.92)
      this.time.delayedCall(100, () => { btn.setScale(1); onClick() })
    })
    btn.add(hit)

    // Pulse animation
    this.tweens.add({
      targets: btn, scaleX: 1.03, scaleY: 1.03,
      duration: 1500, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    })
  }

  private loadSave() {
    return this.saveSystem.load()
  }
}
