import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, PREP_DURATION, WALK_DURATION, POSE_DURATION } from '../../data/constants'
import { RUNWAY_ACTIONS, BASE_REWARD } from '../../data/scoring'
import { ScoringSystem } from '../../systems/ScoringSystem'
import { fadeIn, fadeOut, spawnParticles, shakeCamera } from '@shared/utils/poki-polish'
import { audioEngine } from '@shared/phaser/audio'
import { t } from '../../i18n'
import type { Theme, Clothing, ScoreBreakdown } from '../../data/types'

type RunwayPhase = 'prepare' | 'walk' | 'pose' | 'done'

export class RunwayScene extends Phaser.Scene {
  private scoring!: ScoringSystem
  private theme!: Theme
  private outfit!: Clothing[]

  private phase: RunwayPhase = 'prepare'
  private phaseTimer = 0
  private actionsPerformed: string[] = []
  private actionButtons: Phaser.GameObjects.Container[] = []

  // UI
  private timerText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private modelSprite!: Phaser.GameObjects.Container
  private judges: Phaser.GameObjects.Text[] = []

  // Model position on runway
  private modelStartX = -100
  private modelEndX = GAME_WIDTH + 100
  private modelY = GAME_HEIGHT / 2 - 80

  constructor() {
    super({ key: 'RunwayScene' })
  }

  init(data: { theme: Theme; outfit: Clothing[] }): void {
    this.theme = data.theme
    this.outfit = data.outfit
    this.scoring = new ScoringSystem()
    this.phase = 'prepare'
    this.phaseTimer = PREP_DURATION
    this.actionsPerformed = []
    this.actionButtons = []
    this.judges = []
  }

  create(): void {
    fadeIn(this, 300)

    // Runway background
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-runway')
    bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x1a0a2e, 0.5)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Runway track (center strip)
    this.drawRunwayTrack()

    // Judges (top area)
    this.createJudges()

    // Model on runway
    this.createModel()

    // Timer
    this.timerText = this.add.text(GAME_WIDTH / 2, 60, '', {
      fontFamily: 'Fredoka One, cursive', fontSize: '36px', color: '#FFD700',
      stroke: '#1a0a2e', strokeThickness: 4,
    }).setOrigin(0.5)

    // Phase text
    this.phaseText = this.add.text(GAME_WIDTH / 2, 110, '', {
      fontFamily: 'Fredoka One, cursive', fontSize: '28px', color: '#FF6B9D',
      stroke: '#1a0a2e', strokeThickness: 3,
    }).setOrigin(0.5)

    // Action buttons (hidden during prepare)
    this.createActionButtons()
    this.setActionButtonsVisible(false)

    // Start prepare countdown
    this.startPreparePhase()
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'done') return

    this.phaseTimer -= delta

    const remaining = Math.max(0, Math.ceil(this.phaseTimer / 1000))
    this.timerText.setText(`${remaining}s`)

    if (this.phaseTimer <= 0) {
      switch (this.phase) {
        case 'prepare':
          this.startWalkPhase()
          break
        case 'walk':
          this.startPosePhase()
          break
        case 'pose':
          this.finishRunway()
          break
      }
    }
  }

  private drawRunwayTrack(): void {
    const track = this.add.graphics()
    // Red carpet
    track.fillStyle(0x8B0000, 0.6)
    track.fillRect(GAME_WIDTH / 2 - 120, 200, 240, GAME_HEIGHT - 300)
    // Gold edges
    track.lineStyle(3, 0xFFD700, 0.8)
    track.strokeRect(GAME_WIDTH / 2 - 120, 200, 240, GAME_HEIGHT - 300)
    // Center line
    track.lineStyle(2, 0xFFD700, 0.3)
    track.lineBetween(GAME_WIDTH / 2, 200, GAME_WIDTH / 2, GAME_HEIGHT - 100)
  }

  private createJudges(): void {
    const judgeEmojis = ['‍⚖️', '‍⚖️', '‍⚖️']
    const judgeNames = ['Judge A', 'Judge B', 'Judge C']

    for (let i = 0; i < 3; i++) {
      const x = 100 + i * 220
      const y = 200

      const judgeBg = this.add.graphics()
      judgeBg.fillStyle(0x2d1b4e, 0.8)
      judgeBg.fillRoundedRect(x - 50, y - 30, 100, 60, 12)

      const judge = this.add.text(x, y, judgeEmojis[i], {
        fontSize: '32px',
      }).setOrigin(0.5)
      this.judges.push(judge)

      this.add.text(x, y + 38, judgeNames[i], {
        fontFamily: 'Nunito, sans-serif', fontSize: '12px', color: '#E8B4CB',
      }).setOrigin(0.5)
    }
  }

  private createModel(): void {
    this.modelSprite = this.add.container(this.modelStartX, this.modelY)

    // Model image
    const model = this.add.image(0, 0, 'model_default')
    model.setDisplaySize(140, 200)
    this.modelSprite.add(model)

    // Show equipped clothing overlays
    for (const item of this.outfit) {
      const overlay = this.add.image(0, 0, item.id)
      overlay.setDisplaySize(60, 60)
      const offsets: Record<string, { x: number; y: number }> = {
        top: { x: 0, y: -40 },
        bottom: { x: 0, y: 10 },
        shoes: { x: 0, y: 70 },
        accessory: { x: 30, y: -20 },
        hair: { x: 0, y: -75 },
      }
      const pos = offsets[item.category] ?? { x: 0, y: 0 }
      overlay.setPosition(pos.x, pos.y)
      this.modelSprite.add(overlay)
    }
  }

  private createActionButtons(): void {
    const btnY = GAME_HEIGHT - 140
    const actions = RUNWAY_ACTIONS

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const x = 100 + i * 160

      const btn = this.add.container(x, btnY)

      const bg = this.add.graphics()
      bg.fillStyle(0x3d2b5e, 0.9)
      bg.lineStyle(2, 0xFF6B9D, 1)
      bg.fillRoundedRect(-60, -30, 120, 60, 12)
      bg.strokeRoundedRect(-60, -30, 120, 60, 12)
      btn.add(bg)

      const label = this.add.text(0, 0, t(action.id), {
        fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#FFFFFF',
        fontStyle: 'bold',
      }).setOrigin(0.5)
      btn.add(label)

      const hit = this.add.zone(0, 0, 120, 60).setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => {
        this.performAction(action.id)
      })
      hit.on('pointerover', () => btn.setScale(1.1))
      hit.on('pointerout', () => btn.setScale(1))
      btn.add(hit)

      this.actionButtons.push(btn)
    }
  }

  private setActionButtonsVisible(visible: boolean): void {
    for (const btn of this.actionButtons) {
      btn.setVisible(visible)
    }
  }

  private startPreparePhase(): void {
    this.phase = 'prepare'
    this.phaseTimer = PREP_DURATION
    this.phaseText.setText(t('prepare'))

    // Countdown numbers
    let count = 3
    const countText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, String(count), {
      fontFamily: 'Fredoka One, cursive', fontSize: '120px', color: '#FFD700',
      stroke: '#1a0a2e', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(100)

    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--
        if (count > 0) {
          countText.setText(String(count))
          countText.setScale(1.5)
          this.tweens.add({
            targets: countText, scaleX: 1, scaleY: 1,
            duration: 300, ease: 'Back.easeOut',
          })
          audioEngine.play('tick')
        } else {
          countText.setText(t('ready'))
          countText.setFontSize('64px')
          audioEngine.play('levelup')
          this.tweens.add({
            targets: countText, alpha: 0, scaleX: 2, scaleY: 2,
            duration: 500, ease: 'Power2',
            onComplete: () => countText.destroy(),
          })
        }
      },
    })
  }

  private startWalkPhase(): void {
    this.phase = 'walk'
    this.phaseTimer = WALK_DURATION
    this.phaseText.setText(t('walk') + '!')
    this.setActionButtonsVisible(true)

    // Animate model walking down the runway
    this.tweens.add({
      targets: this.modelSprite,
      x: GAME_WIDTH / 2,
      duration: WALK_DURATION,
      ease: 'Sine.easeInOut',
    })

    audioEngine.startBGM()
  }

  private startPosePhase(): void {
    this.phase = 'pose'
    this.phaseTimer = POSE_DURATION
    this.phaseText.setText(t('pose') + '!')
    this.setActionButtonsVisible(false)

    // Model stops at center
    this.tweens.killTweensOf(this.modelSprite)
    this.modelSprite.x = GAME_WIDTH / 2

    // Auto-perform pose
    this.actionsPerformed.push('pose')
    this.performModelAction('pose')

    audioEngine.stopBGM()
  }

  private performAction(actionId: string): void {
    if (this.phase !== 'walk') return

    this.actionsPerformed.push(actionId)
    this.performModelAction(actionId)
    audioEngine.play('add')

    // Button cooldown visual
    const btnIndex = RUNWAY_ACTIONS.findIndex(a => a.id === actionId)
    if (btnIndex >= 0) {
      const btn = this.actionButtons[btnIndex]
      btn.setAlpha(0.5)
      this.time.delayedCall(500, () => btn.setAlpha(1))
    }
  }

  private performModelAction(actionId: string): void {
    switch (actionId) {
      case 'twirl':
        this.tweens.add({
          targets: this.modelSprite, angle: 360,
          duration: 600, ease: 'Power2',
          onComplete: () => { this.modelSprite.angle = 0 },
        })
        break
      case 'pose':
        this.tweens.add({
          targets: this.modelSprite, scaleX: 1.15, scaleY: 1.15,
          duration: 300, ease: 'Back.easeOut', yoyo: true,
        })
        spawnParticles(this, this.modelSprite.x, this.modelSprite.y, [0xFFD700, 0xFF6B9D], 10)
        break
      case 'wave':
        this.tweens.add({
          targets: this.modelSprite, x: this.modelSprite.x + 20,
          duration: 200, yoyo: true, repeat: 2,
        })
        break
      case 'walk':
        this.tweens.add({
          targets: this.modelSprite, y: this.modelSprite.y - 10,
          duration: 150, yoyo: true,
        })
        break
    }

    // Judge reactions
    this.judgeReact(actionId)
  }

  private judgeReact(actionId: string): void {
    const reactions: Record<string, string[]> = {
      walk: ['👍', '👍', '👌'],
      twirl: ['😍', '🤩', '👏'],
      pose: ['🔥', '💯', '⭐'],
      wave: ['😊', '😄', '👋'],
    }
    const emojis = reactions[actionId] ?? ['👍', '👍', '👍']

    for (let i = 0; i < this.judges.length; i++) {
      const judge = this.judges[i]
      const emoji = emojis[i % emojis.length]
      judge.setText(emoji)
      judge.setScale(1.3)
      this.tweens.add({
        targets: judge, scaleX: 1, scaleY: 1,
        duration: 400, ease: 'Back.easeOut',
      })
    }
  }

  private finishRunway(): void {
    this.phase = 'done'

    // Calculate final score
    const breakdown = this.scoring.evaluate(this.outfit, this.theme, this.actionsPerformed)
    const coinsEarned = Math.round(BASE_REWARD * this.theme.rewardMultiplier * breakdown.rewardMultiplier)

    // Show brief score flash
    this.phaseText.setText(t(breakdown.grade === 'S' ? 'perfect' : breakdown.grade === 'A' ? 'excellent' : 'nice'))
    this.timerText.setText(`${breakdown.total}`)

    if (breakdown.grade === 'S' || breakdown.grade === 'A') {
      spawnParticles(this, GAME_WIDTH / 2, this.modelSprite.y, [0xFFD700, 0xFF6B9D, 0xFFFFFF], 20)
      shakeCamera(this, 200, 0.008)
    }

    audioEngine.play('perfect')

    // Transition to result
    this.time.delayedCall(1500, () => {
      fadeOut(this, 400).then(() => {
        this.scene.start('ResultScene', {
          theme: this.theme,
          outfit: this.outfit,
          breakdown,
          actions: this.actionsPerformed,
          coinsEarned,
        })
      })
    })
  }
}
