import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../../data/constants'
import { ThemeSystem } from '../../systems/ThemeSystem'
import { fadeIn, fadeOut, spawnParticles } from '@shared/utils/poki-polish'
import { audioEngine } from '@shared/phaser/audio'
import { t } from '../../i18n'
import { SaveSystem } from '../../systems/SaveSystem'
import type { Theme } from '../../data/types'

export class ThemeSelectScene extends Phaser.Scene {
  private themeSystem!: ThemeSystem
  private saveSystem = new SaveSystem()
  private playerLevel = 1

  constructor() {
    super({ key: 'ThemeSelectScene' })
  }

  create(): void {
    const cx = GAME_WIDTH / 2
    this.themeSystem = new ThemeSystem()

    // Load player level
    this.playerLevel = this.saveSystem.getPlayerLevel()

    // Background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x2d1b4e, 0x2d1b4e, 0x1a0a2e, 0x1a0a2e, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Title
    this.add.text(cx, 100, t('chooseTheme'), {
      fontFamily: 'Fredoka One, cursive', fontSize: '40px', color: '#FF6B9D',
      stroke: '#2d1b4e', strokeThickness: 4,
    }).setOrigin(0.5)

    // Theme cards
    const themes = this.themeSystem.getAvailableThemes(this.playerLevel)
    const weeklyTheme = this.themeSystem.getWeeklyTheme()
    const startY = 220
    const cardH = 150
    const gap = 18

    // Show weekly theme first if available
    const allThemes: { theme: Theme; locked: boolean; isWeekly: boolean }[] = []

    if (weeklyTheme) {
      allThemes.push({ theme: weeklyTheme, locked: false, isWeekly: true })
    }

    for (const theme of themes) {
      if (!allThemes.some(t => t.theme.id === theme.id)) {
        allThemes.push({ theme, locked: false, isWeekly: false })
      }
    }

    // Add locked themes
    const allBaseThemes = this.themeSystem.getAvailableThemes(99)
    for (const theme of allBaseThemes) {
      if (!allThemes.some(t => t.theme.id === theme.id)) {
        allThemes.push({ theme, locked: true, isWeekly: false })
      }
    }

    for (let i = 0; i < allThemes.length; i++) {
      const { theme, locked, isWeekly } = allThemes[i]
      const y = startY + i * (cardH + gap)
      this.createThemeCard(cx, y, 600, cardH, theme, locked, isWeekly, i)
    }

    // Back button (top left)
    const backBtn = this.add.text(40, 50, '< ' + t('menu'), {
      fontFamily: 'Nunito, sans-serif', fontSize: '22px', color: '#E8B4CB',
    }).setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => {
      audioEngine.play('tick')
      fadeOut(this, 200).then(() => this.scene.start('MenuScene'))
    })

    fadeIn(this, 300)
  }

  private createThemeCard(
    x: number, y: number, w: number, h: number,
    theme: Theme, locked: boolean, isWeekly: boolean,
    index: number,
  ): void {
    const container = this.add.container(x, y)
    const bgColor = locked ? 0x333333 : 0x3d2b5e
    const borderColor = isWeekly ? 0xFFD700 : (locked ? 0x555555 : 0xFF6B9D)

    // Card background
    const bg = this.add.graphics()
    bg.lineStyle(3, borderColor, 1)
    bg.fillStyle(bgColor, 0.9)
    bg.fillRoundedRect(-w / 2, 0, w, h, 16)
    container.add(bg)

    // Theme name
    const nameColor = locked ? '#666666' : '#FFFFFF'
    const nameText = this.add.text(-w / 2 + 30, 18, theme.name, {
      fontFamily: 'Fredoka One, cursive', fontSize: '28px', color: nameColor,
    })
    container.add(nameText)

    // Weekly badge
    if (isWeekly) {
      const badge = this.add.text(w / 2 - 30, 18, t('weekly'), {
        fontFamily: 'Fredoka One, cursive', fontSize: '16px', color: '#1a0a2e',
        backgroundColor: '#FFD700', padding: { x: 10, y: 4 },
      }).setOrigin(1, 0)
      container.add(badge)
    }

    // Required styles
    const stylesText = `${t('required')}: ${theme.requiredStyles.join(' + ')}`
    const stylesColor = locked ? '#555555' : '#E8B4CB'
    const stylesLabel = this.add.text(-w / 2 + 30, 55, stylesText, {
      fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: stylesColor,
    })
    container.add(stylesLabel)

    // Reward multiplier
    const rewardText = `x${theme.rewardMultiplier} ${t('coinsEarned')}`
    const rewardColor = locked ? '#555555' : '#FFD700'
    const rewardLabel = this.add.text(-w / 2 + 30, 82, rewardText, {
      fontFamily: 'Nunito, sans-serif', fontSize: '16px', color: rewardColor,
    })
    container.add(rewardLabel)

    // Lock indicator
    if (locked) {
      const lockText = this.add.text(w / 2 - 30, h / 2, `${t('locked')} Lv.${theme.unlockLevel}`, {
        fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#888888',
      }).setOrigin(1, 0.5)
      container.add(lockText)
    } else {
      // Arrow indicator
      const arrow = this.add.text(w / 2 - 30, h / 2, '>', {
        fontFamily: 'Fredoka One, cursive', fontSize: '32px', color: '#FF6B9D',
      }).setOrigin(1, 0.5)
      container.add(arrow)

      // Make interactive
      const hitZone = this.add.zone(0, h / 2, w, h).setInteractive({ useHandCursor: true })
      hitZone.on('pointerover', () => {
        container.setScale(1.02)
        bg.clear()
        bg.lineStyle(3, 0xFFFFFF, 1)
        bg.fillStyle(0x4d3b6e, 1)
        bg.fillRoundedRect(-w / 2, 0, w, h, 16)
      })
      hitZone.on('pointerout', () => {
        container.setScale(1)
        bg.clear()
        bg.lineStyle(3, borderColor, 1)
        bg.fillStyle(bgColor, 0.9)
        bg.fillRoundedRect(-w / 2, 0, w, h, 16)
      })
      hitZone.on('pointerdown', () => {
        audioEngine.play('add')
        spawnParticles(this, x, h / 2, [0xFF6B9D, 0xFFD700], 8)
        this.time.delayedCall(200, () => {
          this.scene.start('DressUpScene', { theme })
        })
      })
      container.add(hitZone)
    }

    // Entrance animation
    container.setAlpha(0)
    container.x = x + 100
    this.tweens.add({
      targets: container, alpha: 1, x: x,
      duration: 400, delay: 100 * index,
      ease: 'Power2',
    })
  }
}
