import Phaser from 'phaser'
import { MOCHI_TYPES, MAX_MOCHI_LEVEL } from '../../data/mochi-types'
import {
  GAME_W,
  GAME_H,
  BOX_TOP,
  BOX_BOTTOM,
  BOX_LEFT,
  BOX_RIGHT,
  BOX_WIDTH,
  BOX_CENTER_X,
  DROP_ZONE_Y,
  DROP_COOLDOWN,
  OVERFLOW_TIME,
  BG_COLOR,
  WALL_THICKNESS,
} from '../../logic/constants'
import { loadSave, saveSave } from '../../logic/save'
import { onMerge, onGameEnd, type MochiSaveData } from '../../logic/meta'
import { calculateMergeScore } from '../../logic/scoring'
import {
  getRandomLevel,
  canMerge,
  clampDropX,
  type MochiBody,
} from '../../logic/game-state'
import { drawMochi, drawSparkles } from '../helpers'

interface MochiGfxData {
  gfx: Phaser.GameObjects.Graphics
  body: MatterJS.BodyType
  level: number
  droppedAt: number
}

export class GameScene extends Phaser.Scene {
  private score = 0
  private mochis: Phaser.GameObjects.Graphics[] = []
  private mochiMap = new Map<number, MochiGfxData>()
  private canDrop = true
  private gameOver = false
  private nextLevel = 0
  private merging = new Set<Phaser.GameObjects.Graphics>()
  private mergeCombo = 0
  private lastMergeTime = 0
  private dropSave!: MochiSaveData
  private isDaily = false
  private boxGfx!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private nextPreviewGfx!: Phaser.GameObjects.Graphics
  private nextPreviewText!: Phaser.GameObjects.Text

  constructor() {
    super('GameScene')
  }

  create(data?: { isDaily?: boolean }): void {
    this.cameras.main.setBackgroundColor(BG_COLOR)
    this.cameras.main.fadeIn(300)
    this.score = 0
    this.mochis = []
    this.mochiMap = new Map()
    this.canDrop = true
    this.gameOver = false
    this.nextLevel = getRandomLevel()
    this.merging = new Set()
    this.mergeCombo = 0
    this.lastMergeTime = 0
    this.dropSave = loadSave()
    this.isDaily = data?.isDaily ?? false

    // Background particles
    for (let i = 0; i < 10; i++) {
      const bx = Phaser.Math.Between(BOX_LEFT, BOX_RIGHT)
      const by = Phaser.Math.Between(BOX_TOP + 50, BOX_BOTTOM)
      const br = Phaser.Math.Between(3, 10)
      const particle = this.add.circle(bx, by, br, 0xFFB7C5, 0.1)
      this.tweens.add({
        targets: particle,
        y: BOX_TOP,
        alpha: 0,
        duration: Phaser.Math.Between(5000, 10000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          particle.y = BOX_BOTTOM
          particle.alpha = 0.1
        },
      })
    }

    // Draw box
    this.boxGfx = this.add.graphics()
    this.drawBox()

    // Matter.js box walls
    this.createBoxWalls()

    // Score
    this.scoreText = this.add
      .text(15, 10, 'Score: 0', {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#FF69B4',
        fontStyle: 'bold',
        stroke: '#FFFFFF',
        strokeThickness: 3,
      })
      .setDepth(100)

    const save = loadSave()
    this.add
      .text(GAME_W - 15, 10, `Best: ${save.highScore}`, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFB7C5',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(1, 0)
      .setDepth(100)

    // Next preview
    this.nextPreviewGfx = this.add.graphics().setDepth(100)
    this.nextPreviewText = this.add
      .text(GAME_W / 2, DROP_ZONE_Y + 55, '', {
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        color: '#D81B60',
        stroke: '#FFFFFF',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(100)
    this.updateNextPreview()

    // Pause button
    const pauseBtn = this.add
      .text(GAME_W - 50, 50, '⏸', {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#FF69B4',
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive()

    pauseBtn.on('pointerdown', () => {
      this.scene.pause()
      this.scene.launch('PauseOverlay')
    })

    // Drop zone line
    const dzLine = this.add.graphics().setDepth(50)
    dzLine.lineStyle(2, 0xFF69B4, 0.3)
    dzLine.lineBetween(BOX_LEFT, DROP_ZONE_Y, BOX_RIGHT, DROP_ZONE_Y)

    // Input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver) return
      if (pointer.y < DROP_ZONE_Y && this.canDrop) {
        this.dropMochi(pointer.x)
      }
    })

    // Collision detection
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        this.handleCollision(pair.bodyA as MatterJS.BodyType, pair.bodyB as MatterJS.BodyType)
      }
    })

    // Game over check loop
    this.time.addEvent({
      delay: 100,
      callback: this.checkGameOver,
      callbackScope: this,
      loop: true,
    })

    // Tutorial for first-time players
    if (this.dropSave.stats.totalMerges === 0) {
      this.showTutorial()
    }
  }

  private showTutorial(): void {
    const overlay = this.add.container(0, 0).setDepth(500)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.6)
    bg.fillRect(0, 0, GAME_W, GAME_H)
    overlay.add(bg)

    const card = this.add.graphics()
    card.fillStyle(0xFFE4E9, 0.95)
    card.fillRoundedRect(GAME_W / 2 - 140, GAME_H / 2 - 80, 280, 160, 16)
    overlay.add(card)

    const lines = [
      '👆 點擊上方掉落麻糬',
      '🍡 相同麻糬碰撞合成',
      '🎯 合成越大分數越高！',
    ]
    lines.forEach((line, i) => {
      const t = this.add.text(GAME_W / 2, GAME_H / 2 - 50 + i * 35, line, {
        fontSize: '16px', fontFamily: 'Arial', color: '#D81B60', fontStyle: 'bold',
      }).setOrigin(0.5)
      overlay.add(t)
    })

    const okText = this.add.text(GAME_W / 2, GAME_H / 2 + 60, '點擊開始', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF69B4',
    }).setOrigin(0.5)
    overlay.add(okText)

    this.input.once('pointerdown', () => {
      overlay.destroy()
    })
  }

  private handleCollision(bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType): void {
    if (this.gameOver) return

    const resolvedA = (bodyA as any).gameObject ? bodyA : ((bodyA as any).parent || bodyA)
    const resolvedB = (bodyB as any).gameObject ? bodyB : ((bodyB as any).parent || bodyB)

    const dataA = this.mochiMap.get(resolvedA.id)
    const dataB = this.mochiMap.get(resolvedB.id)

    if (!dataA || !dataB) return
    if (!canMerge(
      { id: resolvedA.id, x: 0, y: 0, level: dataA.level, droppedAt: 0 },
      { id: resolvedB.id, x: 0, y: 0, level: dataB.level, droppedAt: 0 },
      this.merging as unknown as Set<number>,
    )) return

    this.mergeMochis(dataA.gfx, dataB.gfx)
  }

  private drawBox(): void {
    const g = this.boxGfx
    g.clear()
    // Box fill
    g.fillStyle(0xFFE4E9, 0.4)
    g.fillRect(BOX_LEFT, DROP_ZONE_Y, BOX_WIDTH, BOX_BOTTOM - DROP_ZONE_Y)
    // Box border
    g.lineStyle(4, 0xFFB7C5, 1)
    g.strokeRect(BOX_LEFT, DROP_ZONE_Y, BOX_WIDTH, BOX_BOTTOM - DROP_ZONE_Y)
    // Floor highlight
    g.lineStyle(2, 0xFF69B4, 0.5)
    g.lineBetween(BOX_LEFT, BOX_BOTTOM, BOX_RIGHT, BOX_BOTTOM)
  }

  private createBoxWalls(): void {
    const wallOpts = {
      isStatic: true,
      restitution: 0.1,
      friction: 0.5,
      label: 'wall',
    }

    // Left wall
    this.matter.add.rectangle(
      BOX_LEFT - WALL_THICKNESS / 2,
      (DROP_ZONE_Y + BOX_BOTTOM) / 2,
      WALL_THICKNESS,
      BOX_BOTTOM - DROP_ZONE_Y,
      wallOpts,
    )

    // Right wall
    this.matter.add.rectangle(
      BOX_RIGHT + WALL_THICKNESS / 2,
      (DROP_ZONE_Y + BOX_BOTTOM) / 2,
      WALL_THICKNESS,
      BOX_BOTTOM - DROP_ZONE_Y,
      wallOpts,
    )

    // Floor
    this.matter.add.rectangle(
      BOX_CENTER_X,
      BOX_BOTTOM + 25,
      BOX_WIDTH + WALL_THICKNESS * 2,
      50,
      wallOpts,
    )
  }

  private dropMochi(rawX: number): void {
    if (this.gameOver || !this.canDrop) return
    this.canDrop = false

    const x = clampDropX(rawX, BOX_LEFT, BOX_RIGHT)
    const level = this.nextLevel
    this.nextLevel = getRandomLevel()
    this.updateNextPreview()

    const info = MOCHI_TYPES[level]
    const dropY = DROP_ZONE_Y - info.radius

    const body = this.matter.add.circle(x, dropY, info.radius, {
      restitution: 0.3,
      friction: 0.4,
      density: 0.001,
      label: 'mochi',
    })

    const gfx = this.add.graphics()
    gfx.setDepth(10 + level)
    this.redrawMochi(gfx, level)
    gfx.x = x
    gfx.y = dropY

    body.gameObject = gfx
    gfx.setData('body', body)
    gfx.setData('level', level)
    gfx.setData('droppedAt', this.time.now)
    gfx.setData('bodyId', body.id)

    this.mochis.push(gfx)
    this.mochiMap.set(body.id, { gfx, body, level, droppedAt: this.time.now })

    this.time.delayedCall(DROP_COOLDOWN, () => {
      this.canDrop = true
    })
  }

  private redrawMochi(gfx: Phaser.GameObjects.Graphics, level: number): void {
    gfx.clear()
    drawMochi(gfx, 0, 0, level, 1)
    if (level === MAX_MOCHI_LEVEL) {
      drawSparkles(gfx, 0, 0, MOCHI_TYPES[level].radius, this.time.now / 1000)
    }
  }

  private updateNextPreview(): void {
    const g = this.nextPreviewGfx
    g.clear()
    const info = MOCHI_TYPES[this.nextLevel]
    g.fillStyle(info.color, 1)
    g.fillCircle(GAME_W / 2, DROP_ZONE_Y + 45, info.radius * 0.6)
    g.lineStyle(2, 0x000000, 0.2)
    g.strokeCircle(GAME_W / 2, DROP_ZONE_Y + 45, info.radius * 0.6)
    // Eyes on preview
    g.fillStyle(0x000000, 1)
    g.fillCircle(GAME_W / 2 - 4, DROP_ZONE_Y + 43, 2)
    g.fillCircle(GAME_W / 2 + 4, DROP_ZONE_Y + 43, 2)
    this.nextPreviewText.setText(info.name)
  }

  private mergeMochis(
    gfxA: Phaser.GameObjects.Graphics,
    gfxB: Phaser.GameObjects.Graphics,
  ): void {
    if (!gfxA || !gfxB || !gfxA.scene || !gfxB.scene) return

    const levelA = gfxA.getData('level') as number
    const levelB = gfxB.getData('level') as number
    if (levelA !== levelB) return
    if (levelA >= MAX_MOCHI_LEVEL) return
    if (this.merging.has(gfxA) || this.merging.has(gfxB)) return

    this.merging.add(gfxA)
    this.merging.add(gfxB)

    const bodyA = gfxA.getData('body') as MatterJS.BodyType
    const bodyB = gfxB.getData('body') as MatterJS.BodyType
    if (!bodyA || !bodyB) return

    const mx = (bodyA.position.x + bodyB.position.x) / 2
    const my = (bodyA.position.y + bodyB.position.y) / 2

    // Remove old
    this.mochiMap.delete(bodyA.id)
    this.mochiMap.delete(bodyB.id)
    this.matter.world.remove(bodyA)
    this.matter.world.remove(bodyB)
    gfxA.destroy()
    gfxB.destroy()
    this.mochis = this.mochis.filter((g) => g !== gfxA && g !== gfxB)
    this.merging.delete(gfxA)
    this.merging.delete(gfxB)

    // Create merged mochi
    const newLevel = levelA + 1
    const newInfo = MOCHI_TYPES[newLevel]
    const newBody = this.matter.add.circle(mx, my, newInfo.radius, {
      restitution: 0.3,
      friction: 0.4,
      density: 0.001,
      label: 'mochi',
    })

    const newGfx = this.add.graphics()
    newGfx.setDepth(10 + newLevel)
    this.redrawMochi(newGfx, newLevel)
    newGfx.x = mx
    newGfx.y = my

    newBody.gameObject = newGfx
    newGfx.setData('body', newBody)
    newGfx.setData('level', newLevel)
    newGfx.setData('droppedAt', this.time.now)
    newGfx.setData('bodyId', newBody.id)

    this.mochis.push(newGfx)
    this.mochiMap.set(newBody.id, { gfx: newGfx, body: newBody, level: newLevel, droppedAt: this.time.now })

    // Effects
    this.mergeParticles(mx, my, newInfo.color)
    this.mergeScorePopup(mx, my, newLevel)
    this.cameras.main.shake(150, 0.005)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20)
    this.mergeCombo++
    this.lastMergeTime = this.time.now
    if (this.mergeCombo >= 3) {
      this.showComboText(this.mergeCombo)
    }
    newGfx.setScale(1.5)
    this.tweens.add({
      targets: newGfx,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    })

    // Score + coins
    const pts = calculateMergeScore(levelA)
    this.score += pts
    onMerge(this.dropSave, newLevel, this.mochis.length)
    saveSave(this.dropSave)
    this.scoreText.setText(`Score: ${this.score} 💰${this.dropSave.coins}`)
  }

  private mergeParticles(x: number, y: number, color: number): void {
    const count = 12
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const particle = this.add.circle(x, y, 4, color, 1).setDepth(200)
      const dist = 30 + Math.random() * 40
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      })
    }
  }

  private mergeScorePopup(x: number, y: number, level: number): void {
    const pts = calculateMergeScore(level - 1)
    const text = this.add
      .text(x, y - 20, `+${pts}`, {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#FF69B4',
        fontStyle: 'bold',
        stroke: '#FFFFFF',
        strokeThickness: 3,
      })
      .setDepth(300)

    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }

  private showComboText(combo: number): void {
    const labels = ['', '', 'Double!', 'Triple!', 'AMAZING!', 'INCREDIBLE!']
    const label = combo >= 5 ? 'LEGENDARY!' : labels[combo] || `${combo}x COMBO!`
    const text = this.add
      .text(GAME_W / 2, GAME_H / 2 - 100, `🔥 ${label}`, {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#FF69B4',
        fontStyle: 'bold',
        stroke: '#FFFFFF',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(400)
      .setScale(0.5)

    this.tweens.add({
      targets: text,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      y: GAME_H / 2 - 160,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }

  private checkGameOver(): void {
    if (this.gameOver) return
    const now = this.time.now

    const bodies: MochiBody[] = []
    for (const gfx of this.mochis) {
      const body = gfx.getData('body') as MatterJS.BodyType
      if (!body) continue
      bodies.push({
        id: body.id,
        x: body.position.x,
        y: body.position.y,
        level: gfx.getData('level') as number,
        droppedAt: (gfx.getData('droppedAt') as number) ?? now,
      })
    }

    if (bodies.some((b) => b.y < BOX_TOP && now - b.droppedAt > OVERFLOW_TIME)) {
      this.triggerGameOver()
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true

    const gameResult = onGameEnd(this.dropSave, this.score, this.isDaily)
    saveSave(this.dropSave)

    this.cameras.main.shake(500, 0.01)
    for (const gfx of this.mochis) {
      const body = gfx.getData('body') as MatterJS.BodyType
      if (body) {
        this.matter.body.setVelocity(body, {
          x: Phaser.Math.Between(-5, 5),
          y: Phaser.Math.Between(-15, -5),
        })
      }
    }

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ResultScene', {
          score: this.score,
          highScore: this.dropSave.highScore,
          scoreCoins: gameResult.scoreCoins,
          dailyCoins: gameResult.dailyCoins,
          newAchievements: gameResult.newAchievements.map(a => ({ name: a.name, emoji: a.emoji, reward: a.reward })),
        })
      })
    })
  }

  update(time: number): void {
    // Combo decay
    if (this.mergeCombo > 0 && time - this.lastMergeTime > 2000) {
      this.mergeCombo = 0
    }

    for (const gfx of this.mochis) {
      const body = gfx.getData('body') as MatterJS.BodyType
      if (!body) continue
      gfx.x = body.position.x
      gfx.y = body.position.y
      gfx.rotation = body.angle

      const level = gfx.getData('level') as number
      if (level === MAX_MOCHI_LEVEL) {
        gfx.clear()
        drawMochi(gfx, 0, 0, level, 1)
        drawSparkles(gfx, 0, 0, MOCHI_TYPES[level].radius, time / 1000)
      }
    }

    // Update next preview sparkle
    if (this.nextLevel === MAX_MOCHI_LEVEL) {
      this.nextPreviewGfx.clear()
      const info = MOCHI_TYPES[this.nextLevel]
      this.nextPreviewGfx.fillStyle(info.color, 1)
      this.nextPreviewGfx.fillCircle(GAME_W / 2, DROP_ZONE_Y + 45, info.radius * 0.6)
      this.nextPreviewGfx.lineStyle(2, 0x000000, 0.2)
      this.nextPreviewGfx.strokeCircle(GAME_W / 2, DROP_ZONE_Y + 45, info.radius * 0.6)
      drawSparkles(this.nextPreviewGfx, GAME_W / 2, DROP_ZONE_Y + 45, info.radius * 0.6, time / 1000)
    }
  }
}
