import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../../data/constants'
import { fadeIn, spawnParticles } from '@shared/utils/poki-polish'
import { audioEngine } from '@shared/phaser/audio'
import { AdManager } from '../../../../services/AdManager'
import { t } from '../../i18n'
import type { Theme, Clothing, ScoreBreakdown } from '../../data/types'

const SAVE_KEY = 'runway-fashion-save'

interface ResultData {
  theme: Theme
  outfit: Clothing[]
  breakdown: ScoreBreakdown
  actions: string[]
  coinsEarned: number
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' })
  }

  create(data: ResultData): void {
    const cx = GAME_WIDTH / 2
    const { breakdown, coinsEarned } = data

    fadeIn(this, 400)

    // Background gradient
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x2d1b4e, 0x2d1b4e, 0x1a0a2e, 0x1a0a2e, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Header
    this.add.text(cx, 80, t('scoreBreakdown'), {
      fontFamily: 'Fredoka One, cursive', fontSize: '36px', color: '#FF6B9D',
      stroke: '#1a0a2e', strokeThickness: 4,
    }).setOrigin(0.5)

    // Score dimensions with animated reveal
    const dimensions = [
      { key: 'styleMatchScore', value: breakdown.styleMatch, color: 0xFF6B9D },
      { key: 'coordination', value: breakdown.coordination, color: 0x9B59B6 },
      { key: 'performance', value: breakdown.performance, color: 0x4ECDC4 },
      { key: 'creativity', value: breakdown.creativity, color: 0xFFD700 },
    ]

    const startY = 180
    const rowH = 90

    for (let i = 0; i < dimensions.length; i++) {
      const dim = dimensions[i]
      const y = startY + i * rowH
      this.animateScoreRow(cx, y, dim.key, dim.value, dim.color, i * 300)
    }

    // Total score
    const totalY = startY + dimensions.length * rowH + 20
    const totalContainer = this.add.container(cx, totalY).setAlpha(0)

    const totalBg = this.add.graphics()
    totalBg.fillStyle(0x3d2b5e, 0.9)
    totalBg.lineStyle(3, 0xFFD700, 1)
    totalBg.fillRoundedRect(-250, -25, 500, 50, 14)
    totalBg.strokeRoundedRect(-250, -25, 500, 50, 14)
    totalContainer.add(totalBg)

    const totalLabel = this.add.text(-230, 0, t('total'), {
      fontFamily: 'Fredoka One, cursive', fontSize: '24px', color: '#FFD700',
    }).setOrigin(0, 0.5)
    totalContainer.add(totalLabel)

    const totalValue = this.add.text(230, 0, String(breakdown.total), {
      fontFamily: 'Fredoka One, cursive', fontSize: '32px', color: '#FFFFFF',
    }).setOrigin(1, 0.5)
    totalContainer.add(totalValue)

    this.tweens.add({
      targets: totalContainer, alpha: 1, y: totalY,
      duration: 500, delay: 1500, ease: 'Power2',
    })

    // Grade badge
    const gradeY = totalY + 100
    this.createGradeBadge(cx, gradeY, breakdown.grade, 1800)

    // Coins earned
    const coinsY = gradeY + 120
    this.animateCoinsEarned(cx, coinsY, coinsEarned, 2200)

    // Buttons
    const btnY = GAME_HEIGHT - 120
    this.createButton(cx - 140, btnY, 240, 55, t('playAgain'), 0xFF6B9D, () => {
      audioEngine.play('levelup')
      this.saveProgress(coinsEarned, breakdown.total)
      this.scene.start('ThemeSelectScene')
    }, 2800)

    this.createButton(cx + 140, btnY, 240, 55, t('menu'), 0x3d2b5e, () => {
      audioEngine.play('tick')
      this.saveProgress(coinsEarned, breakdown.total)
      this.scene.start('MenuScene')
    }, 3000)

    // Rewarded ad button
    const adBtnY = btnY - 70
    this.createButton(cx, adBtnY, 300, 50, '📺 x2 Coins', 0x4CAF50, () => {
      const adManager = AdManager.getInstance()
      adManager.requestRewardedAd(
        () => {
          // Reward: double coins
          this.saveProgress(coinsEarned * 2, breakdown.total)
          audioEngine.play('perfect')
          spawnParticles(this, cx, adBtnY, [0xFFD700, 0x4CAF50], 15)
        },
        () => { /* ad closed without reward */ },
      )
    }, 3000)

    // Save once immediately
    this.saveProgress(coinsEarned, breakdown.total)
  }

  private animateScoreRow(
    cx: number, y: number, labelKey: string, value: number, color: number, delay: number,
  ): void {
    const container = this.add.container(cx, y).setAlpha(0)

    const bg = this.add.graphics()
    bg.fillStyle(0x2d1b4e, 0.7)
    bg.fillRoundedRect(-280, -25, 560, 50, 12)
    container.add(bg)

    const label = this.add.text(-260, 0, t(labelKey), {
      fontFamily: 'Nunito, sans-serif', fontSize: '20px', color: '#E8B4CB',
    }).setOrigin(0, 0.5)
    container.add(label)

    // Progress bar
    const barBg = this.add.graphics()
    barBg.fillStyle(0x1a0a2e, 1)
    barBg.fillRoundedRect(40, -8, 160, 16, 8)
    container.add(barBg)

    const barFill = this.add.graphics()
    container.add(barFill)

    const valueText = this.add.text(250, 0, '0', {
      fontFamily: 'Fredoka One, cursive', fontSize: '24px', color: '#FFFFFF',
    }).setOrigin(0.5)
    container.add(valueText)

    // Animate in
    this.tweens.add({
      targets: container, alpha: 1, x: cx,
      duration: 400, delay, ease: 'Power2',
      onComplete: () => {
        // Animate bar fill
        const fillW = (value / 100) * 156
        this.tweens.add({
          targets: { val: 0 },
          val: value,
          duration: 800,
          ease: 'Power2',
          onUpdate: (_tween, target) => {
            const v = Math.round(target.val)
            valueText.setText(String(v))
            barFill.clear()
            barFill.fillStyle(color, 1)
            barFill.fillRoundedRect(42, -6, Math.max(0, (v / 100) * 156), 12, 6)
          },
        })
      },
    })
  }

  private createGradeBadge(cx: number, y: number, grade: string, delay: number): void {
    const gradeColors: Record<string, number> = {
      S: 0xFFD700, A: 0xFF6B9D, B: 0x4ECDC4, C: 0x9B59B6, D: 0x888888,
    }
    const color = gradeColors[grade] ?? 0xFFFFFF

    const badge = this.add.container(cx, y).setAlpha(0)

    const circle = this.add.graphics()
    circle.fillStyle(color, 1)
    circle.fillCircle(0, 0, 50)
    circle.lineStyle(4, 0xFFFFFF, 0.5)
    circle.strokeCircle(0, 0, 50)
    badge.add(circle)

    const gradeText = this.add.text(0, 0, grade, {
      fontFamily: 'Fredoka One, cursive', fontSize: '48px', color: '#1a0a2e',
    }).setOrigin(0.5)
    badge.add(gradeText)

    const gradeLabel = this.add.text(0, 60, t('grade'), {
      fontFamily: 'Nunito, sans-serif', fontSize: '16px', color: '#E8B4CB',
    }).setOrigin(0.5)
    badge.add(gradeLabel)

    // Animate in with bounce
    this.tweens.add({
      targets: badge, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 600, delay, ease: 'Back.easeOut',
      onStart: () => {
        badge.setScale(0.3)
        audioEngine.play('perfect')
        if (grade === 'S' || grade === 'A') {
          spawnParticles(this, cx, y, [color, 0xFFFFFF, 0xFF6B9D], 20)
        }
      },
    })
  }

  private animateCoinsEarned(cx: number, y: number, coins: number, delay: number): void {
    const container = this.add.container(cx, y).setAlpha(0)

    const icon = this.add.image(-60, 0, 'icon_coin')
    icon.setDisplaySize(40, 40)
    container.add(icon)

    const text = this.add.text(-10, 0, `+0`, {
      fontFamily: 'Fredoka One, cursive', fontSize: '32px', color: '#FFD700',
    }).setOrigin(0, 0.5)
    container.add(text)

    this.tweens.add({
      targets: container, alpha: 1,
      duration: 300, delay,
      onComplete: () => {
        // Count up animation
        this.tweens.add({
          targets: { val: 0 },
          val: coins,
          duration: 1000,
          ease: 'Power2',
          onUpdate: (_tween, target) => {
            text.setText(`+${Math.round(target.val)}`)
          },
          onComplete: () => {
            text.setText(`+${coins}`)
            audioEngine.play('add')
          },
        })
      },
    })
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, color: number, onClick: () => void, delay: number,
  ): void {
    const btn = this.add.container(x, y).setAlpha(0)

    const bg = this.add.graphics()
    bg.fillStyle(color, 1)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16)
    btn.add(bg)

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Fredoka One, cursive', fontSize: '20px', color: '#FFFFFF',
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

    this.tweens.add({
      targets: btn, alpha: 1, y,
      duration: 400, delay, ease: 'Power2',
    })
  }

  private saveProgress(coinsEarned: number, score: number): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      const save = raw ? JSON.parse(raw) : { highScore: 0, coins: 0, playerLevel: 1 }
      save.coins = (save.coins ?? 0) + coinsEarned
      save.highScore = Math.max(save.highScore ?? 0, score)
      localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    } catch { /* ignore */ }
  }
}
