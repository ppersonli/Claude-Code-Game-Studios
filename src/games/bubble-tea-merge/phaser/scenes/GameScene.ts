import Phaser from 'phaser'
import {
  GAME_W, GAME_H, CUP_TOP, CUP_BOTTOM,
  CUP_LEFT_TOP, CUP_RIGHT_TOP, CUP_LEFT_BOTTOM, CUP_RIGHT_BOTTOM,
  CUP_TOP_WIDTH, CUP_BOTTOM_WIDTH, WALL_THICKNESS,
  DROP_ZONE_Y, DROP_MARGIN, DROP_COOLDOWN,
  GAME_OVER_CHECK_INTERVAL,
  INGREDIENT_RESTITUTION, INGREDIENT_FRICTION, INGREDIENT_DENSITY,
  WALL_RESTITUTION, WALL_FRICTION, BG_COLOR,
} from '../../logic/constants'
import { INGREDIENTS, MAX_INGREDIENT_LEVEL, getIngredientByLevel } from '../../data/ingredients'
import { canMerge, processMerge, checkGameOver, clampDropX, getRandomLevel, type IngredientBody } from '../../logic/game-state'
import { calculateMergeScore } from '../../logic/scoring'
import { updateHighScore } from '../../logic/save'
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
    this.score = 0
    this.ingredients = []
    this.ingredientMap = new Map()
    this.canDrop = true
    this.gameOver = false
    this.nextLevel = getRandomLevel()
    this.merging = new Set()

    this.cameras.main.setBackgroundColor(BG_COLOR)

    this.drawCup()
    this.createCupWalls()
    this.createUI()
    this.setupInput()
    this.setupCollision()
    this.setupGameOverCheck()
  }

  // ─── Cup ─────────────────────────────────────────────────────────────────

  private drawCup(): void {
    this.cupGfx = this.add.graphics()
    this.cupGfx.lineStyle(3, 0xCE93D8, 0.8)
    this.cupGfx.fillStyle(0xCE93D8, 0.08)

    this.cupGfx.beginPath()
    this.cupGfx.moveTo(CUP_LEFT_TOP, CUP_TOP)
    this.cupGfx.lineTo(CUP_RIGHT_TOP, CUP_TOP)
    this.cupGfx.lineTo(CUP_RIGHT_BOTTOM, CUP_BOTTOM)
    this.cupGfx.lineTo(CUP_LEFT_BOTTOM, CUP_BOTTOM)
    this.cupGfx.closePath()
    this.cupGfx.fillPath()
    this.cupGfx.strokePath()

    // Overflow line
    this.cupGfx.lineStyle(2, 0xFF5252, 0.5)
    this.cupGfx.beginPath()
    this.cupGfx.moveTo(CUP_LEFT_TOP, CUP_TOP)
    this.cupGfx.lineTo(CUP_RIGHT_TOP, CUP_TOP)
    this.cupGfx.strokePath()
  }

  private createCupWalls(): void {
    const wallOpts = {
      isStatic: true,
      restitution: WALL_RESTITUTION,
      friction: WALL_FRICTION,
      label: 'wall',
    }

    const midY = (DROP_ZONE_Y + CUP_BOTTOM) / 2

    // Left wall (trapezoid)
    const lwTopInner = CUP_LEFT_TOP
    const lwTopOuter = CUP_LEFT_TOP - WALL_THICKNESS
    const lwBotInner = CUP_LEFT_BOTTOM
    const lwBotOuter = CUP_LEFT_BOTTOM - WALL_THICKNESS
    this.matter.add.fromVertices(
      (lwTopInner + lwTopOuter + lwBotInner + lwBotOuter) / 4,
      midY,
      [
        { x: 0, y: DROP_ZONE_Y - midY },
        { x: lwTopInner - lwTopOuter, y: DROP_ZONE_Y - midY },
        { x: lwBotInner - lwTopOuter, y: CUP_BOTTOM - midY },
        { x: lwBotOuter - lwTopOuter, y: CUP_BOTTOM - midY },
      ],
      wallOpts,
    )

    // Right wall (trapezoid)
    const rwTopInner = CUP_RIGHT_TOP
    const rwTopOuter = CUP_RIGHT_TOP + WALL_THICKNESS
    const rwBotInner = CUP_RIGHT_BOTTOM
    const rwBotOuter = CUP_RIGHT_BOTTOM + WALL_THICKNESS
    this.matter.add.fromVertices(
      (rwTopInner + rwTopOuter + rwBotInner + rwBotOuter) / 4,
      midY,
      [
        { x: rwTopOuter - rwTopInner, y: DROP_ZONE_Y - midY },
        { x: 0, y: DROP_ZONE_Y - midY },
        { x: 0, y: CUP_BOTTOM - midY },
        { x: rwBotOuter - rwTopInner, y: CUP_BOTTOM - midY },
      ],
      wallOpts,
    )

    // Bottom wall
    this.matter.add.rectangle(GAME_W / 2, CUP_BOTTOM + 25, GAME_W, 50, wallOpts)
  }

  // ─── UI ──────────────────────────────────────────────────────────────────

  private createUI(): void {
    // Score
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold',
    })

    // Next preview
    this.add.text(GAME_W / 2, 60, 'Next:', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#9E9E9E',
    }).setOrigin(0.5)

    this.nextPreviewGfx = this.add.graphics()
    this.nextPreviewText = this.add.text(GAME_W / 2, 90, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#CE93D8',
    }).setOrigin(0.5)
    this.updateNextPreview()
  }

  private updateNextPreview(): void {
    this.nextPreviewGfx.clear()
    drawIngredient(this.nextPreviewGfx, GAME_W / 2, 72, this.nextLevel, 0.5)
    const info = getIngredientByLevel(this.nextLevel)
    this.nextPreviewText.setText(info.name)
  }

  // ─── Input ───────────────────────────────────────────────────────────────

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || !this.canDrop) return
      if (pointer.y > DROP_ZONE_Y) return
      this.dropIngredient(pointer.x)
    })
  }

  private dropIngredient(rawX: number): void {
    this.canDrop = false
    const x = clampDropX(rawX)
    const level = this.nextLevel
    this.nextLevel = getRandomLevel()
    this.updateNextPreview()

    const info = getIngredientByLevel(level)
    const dropY = DROP_ZONE_Y - info.radius

    const body = this.matter.add.circle(x, dropY, info.radius, {
      restitution: INGREDIENT_RESTITUTION,
      friction: INGREDIENT_FRICTION,
      density: INGREDIENT_DENSITY,
      label: 'ingredient',
    })

    const gfx = this.add.graphics()
    drawIngredient(gfx, 0, 0, level)
    gfx.setPosition(x, dropY)
    gfx.setData('body', body)
    gfx.setData('level', level)
    gfx.setData('bodyId', body.id)

    body.gameObject = gfx
    this.ingredients.push(gfx)
    this.ingredientMap.set(body.id, {
      gfx,
      body,
      level,
      droppedAt: Date.now(),
    })

    this.time.delayedCall(DROP_COOLDOWN, () => {
      this.canDrop = !this.gameOver
    })
  }

  // ─── Collision & Merge ───────────────────────────────────────────────────

  private setupCollision(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        this.handleCollision(pair.bodyA as MatterJS.BodyType, pair.bodyB as MatterJS.BodyType)
      }
    })
  }

  private handleCollision(bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType): void {
    if (this.gameOver) return

    const resolvedA = bodyA.gameObject ? bodyA : (bodyA.parent || bodyA)
    const resolvedB = bodyB.gameObject ? bodyB : (bodyB.parent || bodyB)

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

  private mergeIngredients(gfxA: Phaser.GameObjects.Graphics, gfxB: Phaser.GameObjects.Graphics): void {
    const dataA = this.ingredientMap.get(gfxA.getData('bodyId'))
    const dataB = this.ingredientMap.get(gfxB.getData('bodyId'))
    if (!dataA || !dataB) return
    if (dataA.level !== dataB.level) return
    if (dataA.level >= MAX_INGREDIENT_LEVEL) return
    if (this.merging.has(gfxA) || this.merging.has(gfxB)) return

    this.merging.add(gfxA)
    this.merging.add(gfxB)

    const bodyA = dataA.body
    const bodyB = dataB.body
    const mx = (bodyA.position.x + bodyB.position.x) / 2
    const my = (bodyA.position.y + bodyB.position.y) / 2

    // Remove old
    this.ingredientMap.delete(bodyA.id)
    this.ingredientMap.delete(bodyB.id)
    this.matter.world.remove(bodyA)
    this.matter.world.remove(bodyB)
    gfxA.destroy()
    gfxB.destroy()
    this.ingredients = this.ingredients.filter(g => g !== gfxA && g !== gfxB)

    this.merging.delete(gfxA)
    this.merging.delete(gfxB)

    // Create merged
    const mergeResult = processMerge(
      { id: 0, x: bodyA.position.x, y: bodyA.position.y, level: dataA.level, droppedAt: 0 },
      { id: 1, x: bodyB.position.x, y: bodyB.position.y, level: dataB.level, droppedAt: 0 },
    )

    const newInfo = getIngredientByLevel(mergeResult.newLevel)
    const newBody = this.matter.add.circle(mx, my, newInfo.radius, {
      restitution: INGREDIENT_RESTITUTION,
      friction: INGREDIENT_FRICTION,
      density: INGREDIENT_DENSITY,
      label: 'ingredient',
    })

    const newGfx = this.add.graphics()
    drawIngredient(newGfx, 0, 0, mergeResult.newLevel)
    newGfx.setPosition(mx, my)
    newGfx.setData('body', newBody)
    newGfx.setData('level', mergeResult.newLevel)
    newGfx.setData('bodyId', newBody.id)
    newBody.gameObject = newGfx

    this.ingredients.push(newGfx)
    this.ingredientMap.set(newBody.id, {
      gfx: newGfx,
      body: newBody,
      level: mergeResult.newLevel,
      droppedAt: Date.now(),
    })

    // Score
    const points = calculateMergeScore(dataA.level)
    this.score += points
    this.scoreText.setText(`Score: ${this.score}`)

    // Effects
    this.mergeParticles(mx, my, newInfo.color)
    this.mergeScorePopup(mx, my - newInfo.radius - 10, `+${points}`)

    // Spring tween
    newGfx.setScale(1.5)
    this.tweens.add({
      targets: newGfx,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    })
  }

  private mergeParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 10; i++) {
      const p = this.add.graphics()
      p.fillStyle(color, 0.8)
      p.fillCircle(0, 0, 4)
      p.setPosition(x, y)
      const angle = (i / 10) * Math.PI * 2
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      })
    }
  }

  private mergeScorePopup(x: number, y: number, text: string): void {
    const popup = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    })
  }

  // ─── Game-Over ───────────────────────────────────────────────────────────

  private setupGameOverCheck(): void {
    this.time.addEvent({
      delay: GAME_OVER_CHECK_INTERVAL,
      loop: true,
      callback: () => this.checkGameOver(),
    })
  }

  private checkGameOver(): void {
    if (this.gameOver) return

    const now = Date.now()
    const bodies: IngredientBody[] = this.ingredients.map(gfx => {
      const body = gfx.getData('body')
      const data = this.ingredientMap.get(body.id)
      return {
        id: body.id,
        x: body.position.x,
        y: body.position.y,
        level: data?.level ?? 0,
        droppedAt: data?.droppedAt ?? now,
      }
    })

    if (checkGameOver(bodies, now)) {
      this.triggerGameOver()
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true
    this.canDrop = false
    const save = updateHighScore(this.score)

    this.cameras.main.shake(300, 0.01)

    // Scatter ingredients
    for (const gfx of this.ingredients) {
      const body = gfx.getData('body')
      if (body) {
        this.matter.body.setVelocity(body, {
          x: (Math.random() - 0.5) * 10,
          y: -5 - Math.random() * 8,
        })
      }
    }

    this.time.delayedCall(1500, () => {
      this.scene.start('ResultScene', { score: this.score, highScore: save.highScore })
    })
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(time: number): void {
    for (const gfx of this.ingredients) {
      const body = gfx.getData('body')
      if (!body) continue
      gfx.x = body.position.x
      gfx.y = body.position.y
      gfx.rotation = body.angle

      const level = gfx.getData('level')
      if (level === MAX_INGREDIENT_LEVEL) {
        gfx.clear()
        drawIngredient(gfx, 0, 0, level)
        drawSparkles(gfx, 0, 0, getIngredientByLevel(level).radius, time / 1000)
      }
    }
  }
}
