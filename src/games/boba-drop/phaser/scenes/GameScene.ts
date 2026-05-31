import Phaser from 'phaser'
import { INGREDIENTS, MAX_INGREDIENT_LEVEL } from '../../data/ingredients'
import {
  GAME_W,
  CUP_TOP,
  CUP_BOTTOM,
  DROP_ZONE_Y,
  CUP_LEFT_TOP,
  CUP_RIGHT_TOP,
  CUP_LEFT_BOTTOM,
  CUP_RIGHT_BOTTOM,
  DROP_COOLDOWN,
  OVERFLOW_TIME,
  BG_COLOR,
  WALL_THICKNESS,
} from '../../logic/constants'
import { loadSave, updateHighScore } from '../../logic/save'
import { calculateMergeScore } from '../../logic/scoring'
import {
  getRandomLevel,
  canMerge,
  clampDropX,
  type IngredientBody,
} from '../../logic/game-state'
import { drawIngredient, drawSparkles } from '../helpers'

interface IngredientGfxData {
  gfx: Phaser.GameObjects.Graphics
  body: MatterJS.BodyType
  level: number
  droppedAt: number
}

export class GameScene extends Phaser.Scene {
  private score = 0
  private ingredients: Phaser.GameObjects.Graphics[] = []
  private ingredientMap = new Map<number, IngredientGfxData>()
  private canDrop = true
  private gameOver = false
  private nextLevel = 0
  private merging = new Set<Phaser.GameObjects.Graphics>()
  private cupGfx!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private nextPreviewGfx!: Phaser.GameObjects.Graphics
  private nextPreviewText!: Phaser.GameObjects.Text

  constructor() {
    super('GameScene')
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR)
    this.score = 0
    this.ingredients = []
    this.ingredientMap = new Map()
    this.canDrop = true
    this.gameOver = false
    this.nextLevel = getRandomLevel()
    this.merging = new Set()

    // Background bubbles
    for (let i = 0; i < 10; i++) {
      const bx = Phaser.Math.Between(20, GAME_W - 20)
      const by = Phaser.Math.Between(CUP_TOP + 50, CUP_BOTTOM)
      const br = Phaser.Math.Between(3, 12)
      const bubble = this.add.circle(bx, by, br, 0x6a1b9a, 0.1)
      this.tweens.add({
        targets: bubble,
        y: CUP_TOP,
        alpha: 0,
        duration: Phaser.Math.Between(5000, 10000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          bubble.y = CUP_BOTTOM
          bubble.alpha = 0.1
        },
      })
    }

    // Draw cup
    this.cupGfx = this.add.graphics()
    this.drawCup()

    // Matter.js cup walls
    this.createCupWalls()

    // Score
    this.scoreText = this.add
      .text(15, 10, 'Score: 0', {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setDepth(100)

    const save = loadSave()
    this.add
      .text(GAME_W - 15, 10, `Best: ${save.highScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(1, 0)
      .setDepth(100)

    // Next preview
    this.nextPreviewGfx = this.add.graphics().setDepth(100)
    this.nextPreviewText = this.add
      .text(GAME_W / 2, DROP_ZONE_Y + 60, '', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        stroke: '#000000',
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
        color: '#FFFFFF',
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
    dzLine.lineStyle(2, 0xffffff, 0.3)
    dzLine.lineBetween(30, DROP_ZONE_Y, GAME_W - 30, DROP_ZONE_Y)

    // Input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver) return
      if (pointer.y < DROP_ZONE_Y && this.canDrop) {
        this.dropIngredient(pointer.x)
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
  }

  private handleCollision(bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType): void {
    if (this.gameOver) return

    const resolvedA = (bodyA as any).gameObject ? bodyA : ((bodyA as any).parent || bodyA)
    const resolvedB = (bodyB as any).gameObject ? bodyB : ((bodyB as any).parent || bodyB)

    const dataA = this.ingredientMap.get(resolvedA.id)
    const dataB = this.ingredientMap.get(resolvedB.id)

    if (!dataA || !dataB) return
    if (!canMerge(
      { id: resolvedA.id, x: 0, y: 0, level: dataA.level, droppedAt: 0 },
      { id: resolvedB.id, x: 0, y: 0, level: dataB.level, droppedAt: 0 },
      this.merging as unknown as Set<number>,
    )) return

    this.mergeIngredients(dataA.gfx, dataB.gfx)
  }

  private drawCup(): void {
    const g = this.cupGfx
    g.clear()
    g.fillStyle(0x1a0a2e, 0.8)
    g.beginPath()
    g.moveTo(CUP_LEFT_TOP, DROP_ZONE_Y)
    g.lineTo(CUP_LEFT_BOTTOM, CUP_BOTTOM)
    g.lineTo(CUP_RIGHT_BOTTOM, CUP_BOTTOM)
    g.lineTo(CUP_RIGHT_TOP, DROP_ZONE_Y)
    g.closePath()
    g.fillPath()
    g.lineStyle(4, 0x6a1b9a, 1)
    g.beginPath()
    g.moveTo(CUP_LEFT_TOP, DROP_ZONE_Y)
    g.lineTo(CUP_LEFT_BOTTOM, CUP_BOTTOM)
    g.lineTo(CUP_RIGHT_BOTTOM, CUP_BOTTOM)
    g.lineTo(CUP_RIGHT_TOP, DROP_ZONE_Y)
    g.strokePath()
  }

  private createCupWalls(): void {
    const wallOpts = {
      isStatic: true,
      restitution: 0.1,
      friction: 0.5,
      label: 'wall',
    }

    const midY = (DROP_ZONE_Y + CUP_BOTTOM) / 2

    // Left wall
    this.matter.add.fromVertices(
      (CUP_LEFT_TOP + CUP_LEFT_BOTTOM) / 2,
      midY,
      [
        { x: CUP_LEFT_TOP - (CUP_LEFT_TOP + CUP_LEFT_BOTTOM) / 2, y: DROP_ZONE_Y - midY },
        { x: CUP_LEFT_BOTTOM - (CUP_LEFT_TOP + CUP_LEFT_BOTTOM) / 2, y: CUP_BOTTOM - midY },
        { x: CUP_LEFT_BOTTOM - (CUP_LEFT_TOP + CUP_LEFT_BOTTOM) / 2 + WALL_THICKNESS, y: CUP_BOTTOM - midY },
        { x: CUP_LEFT_TOP - (CUP_LEFT_TOP + CUP_LEFT_BOTTOM) / 2 + WALL_THICKNESS, y: DROP_ZONE_Y - midY },
      ],
      wallOpts,
    )

    // Right wall
    this.matter.add.fromVertices(
      (CUP_RIGHT_TOP + CUP_RIGHT_BOTTOM) / 2,
      midY,
      [
        { x: CUP_RIGHT_TOP - (CUP_RIGHT_TOP + CUP_RIGHT_BOTTOM) / 2, y: DROP_ZONE_Y - midY },
        { x: CUP_RIGHT_TOP - (CUP_RIGHT_TOP + CUP_RIGHT_BOTTOM) / 2 - WALL_THICKNESS, y: DROP_ZONE_Y - midY },
        { x: CUP_RIGHT_BOTTOM - (CUP_RIGHT_TOP + CUP_RIGHT_BOTTOM) / 2 - WALL_THICKNESS, y: CUP_BOTTOM - midY },
        { x: CUP_RIGHT_BOTTOM - (CUP_RIGHT_TOP + CUP_RIGHT_BOTTOM) / 2, y: CUP_BOTTOM - midY },
      ],
      wallOpts,
    )

    // Bottom wall
    this.matter.add.rectangle(GAME_W / 2, CUP_BOTTOM + 25, GAME_W, 50, wallOpts)
  }

  private dropIngredient(rawX: number): void {
    if (this.gameOver || !this.canDrop) return
    this.canDrop = false

    const x = clampDropX(rawX, CUP_LEFT_TOP, CUP_RIGHT_TOP)
    const level = this.nextLevel
    this.nextLevel = getRandomLevel()
    this.updateNextPreview()

    const info = INGREDIENTS[level]
    const dropY = DROP_ZONE_Y - info.radius

    const body = this.matter.add.circle(x, dropY, info.radius, {
      restitution: 0.2,
      friction: 0.5,
      density: 0.001,
      label: 'ingredient',
    })

    const gfx = this.add.graphics()
    gfx.setDepth(10 + level)
    this.redrawIngredient(gfx, level)
    gfx.x = x
    gfx.y = dropY

    body.gameObject = gfx
    gfx.setData('body', body)
    gfx.setData('level', level)
    gfx.setData('droppedAt', this.time.now)
    gfx.setData('bodyId', body.id)

    this.ingredients.push(gfx)
    this.ingredientMap.set(body.id, { gfx, body, level, droppedAt: this.time.now })

    this.time.delayedCall(DROP_COOLDOWN, () => {
      this.canDrop = true
    })
  }

  private redrawIngredient(gfx: Phaser.GameObjects.Graphics, level: number): void {
    gfx.clear()
    drawIngredient(gfx, 0, 0, level, 1)
    if (level === MAX_INGREDIENT_LEVEL) {
      drawSparkles(gfx, 0, 0, INGREDIENTS[level].radius, this.time.now / 1000)
    }
  }

  private updateNextPreview(): void {
    const g = this.nextPreviewGfx
    g.clear()
    const info = INGREDIENTS[this.nextLevel]
    g.fillStyle(info.color, 1)
    g.fillCircle(GAME_W / 2, DROP_ZONE_Y + 50, info.radius * 0.6)
    g.lineStyle(2, 0x000000, 0.3)
    g.strokeCircle(GAME_W / 2, DROP_ZONE_Y + 50, info.radius * 0.6)
    this.nextPreviewText.setText(info.name)
  }

  private mergeIngredients(
    gfxA: Phaser.GameObjects.Graphics,
    gfxB: Phaser.GameObjects.Graphics,
  ): void {
    if (!gfxA || !gfxB || !gfxA.scene || !gfxB.scene) return

    const levelA = gfxA.getData('level') as number
    const levelB = gfxB.getData('level') as number
    if (levelA !== levelB) return
    if (levelA >= MAX_INGREDIENT_LEVEL) return
    if (this.merging.has(gfxA) || this.merging.has(gfxB)) return

    this.merging.add(gfxA)
    this.merging.add(gfxB)

    const bodyA = gfxA.getData('body') as MatterJS.BodyType
    const bodyB = gfxB.getData('body') as MatterJS.BodyType
    if (!bodyA || !bodyB) return

    const mx = (bodyA.position.x + bodyB.position.x) / 2
    const my = (bodyA.position.y + bodyB.position.y) / 2

    // Remove old
    this.ingredientMap.delete(bodyA.id)
    this.ingredientMap.delete(bodyB.id)
    this.matter.world.remove(bodyA)
    this.matter.world.remove(bodyB)
    gfxA.destroy()
    gfxB.destroy()
    this.ingredients = this.ingredients.filter((g) => g !== gfxA && g !== gfxB)
    this.merging.delete(gfxA)
    this.merging.delete(gfxB)

    // Create merged ingredient
    const newLevel = levelA + 1
    const newInfo = INGREDIENTS[newLevel]
    const newBody = this.matter.add.circle(mx, my, newInfo.radius, {
      restitution: 0.2,
      friction: 0.5,
      density: 0.001,
      label: 'ingredient',
    })

    const newGfx = this.add.graphics()
    newGfx.setDepth(10 + newLevel)
    this.redrawIngredient(newGfx, newLevel)
    newGfx.x = mx
    newGfx.y = my

    newBody.gameObject = newGfx
    newGfx.setData('body', newBody)
    newGfx.setData('level', newLevel)
    newGfx.setData('droppedAt', this.time.now)
    newGfx.setData('bodyId', newBody.id)

    this.ingredients.push(newGfx)
    this.ingredientMap.set(newBody.id, { gfx: newGfx, body: newBody, level: newLevel, droppedAt: this.time.now })

    // Effects
    this.mergeParticles(mx, my, newInfo.color)
    this.mergeScorePopup(mx, my, newLevel)
    newGfx.setScale(1.5)
    this.tweens.add({
      targets: newGfx,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    })

    // Score
    const pts = calculateMergeScore(levelA)
    this.score += pts
    this.scoreText.setText(`Score: ${this.score}`)
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
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
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

  private checkGameOver(): void {
    if (this.gameOver) return
    const now = this.time.now

    const bodies: IngredientBody[] = []
    for (const gfx of this.ingredients) {
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

    if (bodies.some((b) => b.y < CUP_TOP && now - b.droppedAt > OVERFLOW_TIME)) {
      this.triggerGameOver()
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true

    const save = updateHighScore(this.score)

    this.cameras.main.shake(500, 0.01)
    for (const gfx of this.ingredients) {
      const body = gfx.getData('body') as MatterJS.BodyType
      if (body) {
        this.matter.body.setVelocity(body, {
          x: Phaser.Math.Between(-5, 5),
          y: Phaser.Math.Between(-15, -5),
        })
      }
    }

    this.time.delayedCall(1500, () => {
      this.scene.start('ResultScene', { score: this.score })
    })
  }

  update(time: number): void {
    for (const gfx of this.ingredients) {
      const body = gfx.getData('body') as MatterJS.BodyType
      if (!body) continue
      gfx.x = body.position.x
      gfx.y = body.position.y
      gfx.rotation = body.angle

      const level = gfx.getData('level') as number
      if (level === MAX_INGREDIENT_LEVEL) {
        gfx.clear()
        drawIngredient(gfx, 0, 0, level, 1)
        drawSparkles(gfx, 0, 0, INGREDIENTS[level].radius, time / 1000)
      }
    }

    // Update next preview sparkle
    if (this.nextLevel === MAX_INGREDIENT_LEVEL) {
      this.nextPreviewGfx.clear()
      const info = INGREDIENTS[this.nextLevel]
      this.nextPreviewGfx.fillStyle(info.color, 1)
      this.nextPreviewGfx.fillCircle(GAME_W / 2, DROP_ZONE_Y + 50, info.radius * 0.6)
      this.nextPreviewGfx.lineStyle(2, 0x000000, 0.3)
      this.nextPreviewGfx.strokeCircle(GAME_W / 2, DROP_ZONE_Y + 50, info.radius * 0.6)
      drawSparkles(this.nextPreviewGfx, GAME_W / 2, DROP_ZONE_Y + 50, info.radius * 0.6, time / 1000)
    }
  }
}
