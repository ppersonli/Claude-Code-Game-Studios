import Phaser from 'phaser'
import { GAME_W, GAME_H, LAUNCHER_X, LAUNCHER_Y, BUBBLE_RADIUS, SHOOT_SPEED, GRID_OFFSET_X, GRID_OFFSET_Y, ROW_HEIGHT, COLS } from '../../logic/constants'
import { getColorById, BUBBLE_COLORS } from '../../data/colors'
import { getCellCenter, getNearestCell, type Grid } from '../../logic/grid'
import { createLevelState, shootBubble, type GameState } from '../../logic/game-state'
import { saveProgress, loadSave, saveFull } from '../../logic/save'
import { levelCoins } from '../../logic/meta'

export class GameScene extends Phaser.Scene {
  private state!: GameState
  private gridGfx!: Phaser.GameObjects.Graphics
  private aimLine!: Phaser.GameObjects.Graphics
  private launcherGfx!: Phaser.GameObjects.Graphics
  private shooterBubble!: Phaser.GameObjects.Graphics
  private nextBubble!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private shotsText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private isAnimating = false
  private shootingBubble: { gfx: Phaser.GameObjects.Graphics; vx: number; vy: number } | null = null
  private sessionPopped = 0
  private sessionFallen = 0
  private sessionShots = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  create(data: { level?: number }): void {
    const level = data.level ?? 1
    const save = loadSave()
    this.state = createLevelState(level, save.highScore, save.levelsCompleted)
    this.isAnimating = false
    this.shootingBubble = null
    this.sessionPopped = 0
    this.sessionFallen = 0
    this.sessionShots = 0

    this.drawBackground()
    this.createHUD()
    this.createLauncher()
    this.drawGrid()

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating) return
      this.drawAimLine(pointer.x, pointer.y)
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating) return
      if (pointer.y > LAUNCHER_Y - 50) return
      this.shoot(pointer.x, pointer.y)
    })
  }

  // ─── Background ──────────────────────────────────────────────────────────

  private drawBackground(): void {
    const gfx = this.add.graphics()
    gfx.fillGradientStyle(0x2d1b4e, 0x2d1b4e, 0x1a0a2e, 0x1a0a2e, 1)
    gfx.fillRect(0, 0, GAME_W, GAME_H)
    // Danger line
    gfx.lineStyle(2, 0xff4444, 0.3)
    gfx.lineBetween(0, LAUNCHER_Y - 80, GAME_W, LAUNCHER_Y - 80)
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private createHUD(): void {
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.4)
    bg.fillRoundedRect(10, 10, GAME_W - 20, 40, 10)

    this.levelText = this.add.text(20, 22, `关卡 ${this.state.level}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#CE93D8', fontStyle: 'bold',
    })
    this.scoreText = this.add.text(GAME_W / 2, 22, `分数: 0`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    this.shotsText = this.add.text(GAME_W - 20, 22, `剩余: ${this.state.shotsLeft}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#FFF',
    }).setOrigin(1, 0)
  }

  private updateHUD(): void {
    this.scoreText.setText(`分数: ${this.state.score}`)
    this.shotsText.setText(`剩余: ${this.state.shotsLeft}`)
  }

  // ─── Launcher ────────────────────────────────────────────────────────────

  private createLauncher(): void {
    this.launcherGfx = this.add.graphics()
    this.drawLauncher()

    this.aimLine = this.add.graphics()

    this.shooterBubble = this.add.graphics()
    this.drawBubble(this.shooterBubble, LAUNCHER_X, LAUNCHER_Y, this.state.currentColor)

    this.nextBubble = this.add.graphics()
    this.drawBubble(this.nextBubble, LAUNCHER_X + 45, LAUNCHER_Y + 10, this.state.nextColor, 0.6)
  }

  private drawLauncher(): void {
    this.launcherGfx.clear()
    this.launcherGfx.fillStyle(0x555555, 1)
    this.launcherGfx.fillRoundedRect(LAUNCHER_X - 30, LAUNCHER_Y - 10, 60, 20, 6)
    this.launcherGfx.fillStyle(0x777777, 1)
    this.launcherGfx.fillCircle(LAUNCHER_X, LAUNCHER_Y, 12)
  }

  private drawBubble(gfx: Phaser.GameObjects.Graphics, x: number, y: number, colorId: number, scale: number = 1): void {
    gfx.clear()
    const color = getColorById(colorId)
    const r = BUBBLE_RADIUS * scale

    gfx.fillStyle(color.hex, 1)
    gfx.fillCircle(x, y, r)

    // Gloss effect
    gfx.fillStyle(0xffffff, 0.25)
    gfx.fillCircle(x - r * 0.25, y - r * 0.25, r * 0.4)

    gfx.lineStyle(1.5, 0xffffff, 0.15)
    gfx.strokeCircle(x, y, r)
  }

  private drawAimLine(px: number, py: number): void {
    this.aimLine.clear()
    const dx = px - LAUNCHER_X
    const dy = py - LAUNCHER_Y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 10 || dy > -10) return

    const nx = dx / len
    const ny = dy / len

    this.aimLine.lineStyle(2, 0xffffff, 0.3)
    for (let i = 0; i < 8; i++) {
      const d = 30 + i * 20
      const x = LAUNCHER_X + nx * d
      const y = LAUNCHER_Y + ny * d
      if (y < 50) break
      this.aimLine.fillStyle(0xffffff, 0.3 - i * 0.03)
      this.aimLine.fillCircle(x, y, 2)
    }
  }

  // ─── Grid ────────────────────────────────────────────────────────────────

  private drawGrid(): void {
    if (this.gridGfx) this.gridGfx.destroy()
    this.gridGfx = this.add.graphics()

    for (let r = 0; r < this.state.grid.length; r++) {
      for (let c = 0; c < (this.state.grid[r]?.length ?? 0); c++) {
        const colorId = this.state.grid[r][c]
        if (colorId === null) continue
        const { x, y } = getCellCenter(r, c)
        this.drawBubble(this.gridGfx, x, y, colorId)
      }
    }
  }

  // ─── Shooting ────────────────────────────────────────────────────────────

  shoot(targetX: number, targetY: number): void {
    if (this.state.gameOver || this.state.levelComplete) return

    const dx = targetX - LAUNCHER_X
    const dy = targetY - LAUNCHER_Y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 10) return

    const vx = (dx / len) * SHOOT_SPEED
    const vy = (dy / len) * SHOOT_SPEED

    const gfx = this.add.graphics()
    this.drawBubble(gfx, LAUNCHER_X, LAUNCHER_Y, this.state.currentColor)

    this.shootingBubble = { gfx, vx, vy }
    this.isAnimating = true
    this.aimLine.clear()
    this.shooterBubble.clear()
  }

  update(time: number): void {
    if (!this.shootingBubble) return

    const { gfx, vx, vy } = this.shootingBubble
    gfx.x += vx
    gfx.y += vy

    // Wall bounce
    if (gfx.x < BUBBLE_RADIUS + 10 || gfx.x > GAME_W - BUBBLE_RADIUS - 10) {
      this.shootingBubble.vx = -this.shootingBubble.vx
    }

    // Check grid collision
    const cell = getNearestCell(gfx.x, gfx.y)
    const cellCenter = getCellCenter(cell.row, cell.col)
    const dx = gfx.x - cellCenter.x
    const dy = gfx.y - cellCenter.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Check if hit another bubble or reached top
    const hitBubble = dist < BUBBLE_RADIUS * 1.8 && this.state.grid[cell.row]?.[cell.col] !== null
    const hitTop = gfx.y <= GRID_OFFSET_Y + BUBBLE_RADIUS

    if (hitBubble || hitTop) {
      // Find an empty cell near the collision point
      const target = hitBubble ? this.findEmptyNeighbor(cell.row, cell.col, gfx.x, gfx.y) : cell
      if (target && this.state.grid[target.row]?.[target.col] === null) {
        const result = shootBubble(this.state, target.row, target.col)
        this.sessionPopped += result.popped
        this.sessionFallen += result.fallen
        this.sessionShots++

        // Pop animation
        if (result.popped > 0 || result.fallen > 0) {
          const center = getCellCenter(target.row, target.col)
          this.popParticles(center.x, center.y, result.popped + result.fallen)
          if (result.points > 0) {
            const popup = this.add.text(center.x, center.y - 20, `+${result.points}`, {
              fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
              stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5)
            this.tweens.add({ targets: popup, y: popup.y - 40, alpha: 0, duration: 600, onComplete: () => popup.destroy() })
          }
        }
      }

      gfx.destroy()
      this.shootingBubble = null
      this.drawGrid()
      this.updateHUD()

      // Load next bubble
      this.drawBubble(this.shooterBubble, LAUNCHER_X, LAUNCHER_Y, this.state.currentColor)
      this.drawBubble(this.nextBubble, LAUNCHER_X + 45, LAUNCHER_Y + 10, this.state.nextColor, 0.6)

      // Check end conditions
      if (this.state.levelComplete) {
        const save = loadSave()
        this.updateMetaStats(save, true)
        saveProgress(this.state.totalScore, this.state.level, this.state.levelsCompleted)
        const earnedCoins = levelCoins(true, this.state.shotsLeft, this.state.maxShots)
        this.time.delayedCall(500, () => {
          this.scene.start('ResultScene', {
            level: this.state.level,
            score: this.state.totalScore,
            won: true,
            highScore: Math.max(save.highScore, this.state.totalScore),
            coins: earnedCoins,
          })
        })
      } else if (this.state.gameOver) {
        const save = loadSave()
        this.updateMetaStats(save, false)
        saveProgress(this.state.totalScore, this.state.level, this.state.levelsCompleted)
        this.time.delayedCall(500, () => {
          this.scene.start('ResultScene', {
            level: this.state.level,
            score: this.state.totalScore,
            won: false,
            highScore: Math.max(save.highScore, this.state.totalScore),
            coins: 0,
          })
        })
      } else {
        this.isAnimating = false
      }
    }
  }

  private findEmptyNeighbor(row: number, col: number, x: number, y: number): { row: number; col: number } | null {
    // Get all neighbors and find the closest empty one
    const neighbors = this.getNeighborCells(row, col)
    let best: { row: number; col: number } | null = null
    let bestDist = Infinity
    for (const n of neighbors) {
      if (this.state.grid[n.row]?.[n.col] !== null) continue
      const center = getCellCenter(n.row, n.col)
      const dx = x - center.x
      const dy = y - center.y
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        best = n
      }
    }
    // If no empty neighbor, find any nearby empty cell
    if (!best) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr
          const c = col + dc
          if (r >= 0 && r < this.state.grid.length && c >= 0 && c < COLS && this.state.grid[r]?.[c] === null) {
            const center = getCellCenter(r, c)
            const dx = x - center.x
            const dy = y - center.y
            const dist = dx * dx + dy * dy
            if (dist < bestDist) {
              bestDist = dist
              best = { row: r, col: c }
            }
          }
        }
      }
    }
    return best
  }

  private getNeighborCells(row: number, col: number): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = []
    const isOdd = row % 2 === 1

    if (col > 0) neighbors.push({ row, col: col - 1 })
    if (col < COLS - 1) neighbors.push({ row, col: col + 1 })

    if (row > 0) {
      const aboveCol = isOdd ? col : col - 1
      if (aboveCol >= 0) neighbors.push({ row: row - 1, col: aboveCol })
      if (aboveCol + 1 < COLS) neighbors.push({ row: row - 1, col: aboveCol + 1 })
    }
    if (row < this.state.grid.length - 1) {
      const belowCol = isOdd ? col : col - 1
      if (belowCol >= 0) neighbors.push({ row: row + 1, col: belowCol })
      if (belowCol + 1 < COLS) neighbors.push({ row: row + 1, col: belowCol + 1 })
    }

    return neighbors.filter(n => n.row >= 0 && n.row < this.state.grid.length && n.col >= 0 && n.col < COLS)
  }

  private popParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < Math.min(count * 2, 16); i++) {
      const p = this.add.graphics()
      p.fillStyle(0xffffff, 0.8)
      p.fillCircle(0, 0, 3)
      p.setPosition(x, y)
      const angle = (i / 16) * Math.PI * 2
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      })
    }
  }

  private updateMetaStats(save: ReturnType<typeof loadSave>, won: boolean): void {
    save.stats.totalPopped += this.sessionPopped
    save.stats.totalFallen += this.sessionFallen
    save.stats.totalShots += this.sessionShots
    save.stats.highScore = Math.max(save.stats.highScore, this.state.totalScore)
    save.stats.levelsCompleted = save.levelsCompleted.length + (won ? 1 : 0)
    save.stats.maxLevel = Math.max(save.stats.maxLevel, this.state.level)
    if (won && this.sessionShots === this.state.maxShots - this.state.shotsLeft) {
      // All shots used efficiently (no misses tracked by shotsLeft == maxShots - shotsFired)
    }
    if (won && this.state.shotsLeft === this.state.maxShots) {
      save.stats.perfectLevels++
    }
    save.coins += levelCoins(won, this.state.shotsLeft, this.state.maxShots)
    saveFull(save)
  }
}
