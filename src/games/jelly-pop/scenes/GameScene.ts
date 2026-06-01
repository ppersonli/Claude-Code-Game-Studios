import Phaser from 'phaser'
import {
  GAME_W,
  GAME_H,
  ROWS,
  COLS,
  CELL_SIZE,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  SWAP_DURATION,
  FALL_DURATION,
  ELIMINATE_DURATION,
  CHAIN_DELAY,
  JELLY_TYPES,
  JELLY_COLORS,
  SPECIAL,
  type JellyType,
  type SpecialKind,
  type CellPos,
  type Grid,
  type JellyPopState,
  createInitialState,
  createGrid,
  findAllMatches,
  groupMatches,
  calculateMatchScore,
  determineSpecials,
  bombTargets,
  rainbowTargets,
  dropAndFill,
  removeCells,
  hasValidMoves,
  swapCells,
  movesForLevel,
  numColorsForLevel,
  cloneGrid,
  loadHighScore,
  saveHighScore,
} from '../core'
import { AdManager } from '../services/AdManager'
import { AdManager as SharedAdManager } from '../../../services/AdManager'
import { levelCoins, checkJellyAchievements, type JellyStats } from '../logic/meta'
import { fadeIn, addHapticFeedback, showComboText, spawnParticles } from '../../../shared/utils/poki-polish'


/**
 * GameScene – the main Jelly Pop gameplay scene.
 * Handles rendering, animation, and user interaction.
 * All pure logic lives in ../core/gameLogic.ts.
 */
export class GameScene extends Phaser.Scene {
  // ─── Grid data ──────────────────────────────────────────────────────────────
  private state!: JellyPopState
  private sprites: (Phaser.GameObjects.Container | null)[][] = []
  private highlights: (Phaser.GameObjects.Graphics | null)[][] = []
  private selected: CellPos | null = null
  private isAnimating = false
  private sdk: any = null

  // ─── Meta state ─────────────────────────────────────────────────────────────
  private metaCoins = 0
  private metaLevel = 0
  private metaUnlockedThemes: string[] = ['classic']
  private metaAchievements: string[] = []
  private metaStats: JellyStats = {
    totalScore: 0, highScore: 0, highestLevel: 0, totalMatches: 0,
    totalChains: 0, bestChain: 0, specialBombs: 0, specialRainbows: 0,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0,
  }
  private metaLastDaily = ''
  private sessionMatches = 0
  private sessionChains = 0

  // ─── UI refs ────────────────────────────────────────────────────────────────
  private scoreText!: Phaser.GameObjects.Text
  private highScoreLabel!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private movesText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    fadeIn(this)
    // Expose for external testing
    ;(window as any).__PHASER_GAME = this.game

    this.state = createInitialState({ highScore: loadHighScore() })
    this.selected = null
    this.sessionMatches = 0
    this.sessionChains = 0
    this.loadMeta()
    this.isAnimating = false

    this.drawBackground()
    this.createUI()
    this.initGrid()
    this.updateUI()

    this.input.on('pointerdown', this.handleClick, this)

    this.initSDK()
  }

  // ─── Background ─────────────────────────────────────────────────────────────

  private drawBackground(): void {
    const gfx = this.add.graphics()
    for (let y = 0; y < GAME_H; y++) {
      const t = y / GAME_H
      const r = Math.floor(255 - t * 80)
      const g = Math.floor(180 - t * 100)
      const b = Math.floor(200 + t * 55)
      gfx.fillStyle((r << 16) | (g << 8) | b, 1)
      gfx.fillRect(0, y, GAME_W, 1)
    }
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  private createUI(): void {
    this.add
      .text(GAME_W / 2, 40, '🍬 Jelly Pop', {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#6622aa',
        strokeThickness: 4,
        shadow: { offsetX: 2, offsetY: 2, color: '#333', blur: 4, fill: true },
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_W / 2, 80, 'Score', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffccdd',
      })
      .setOrigin(0.5)

    this.scoreText = this.add
      .text(GAME_W / 2, 105, '0', {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#6622aa',
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    this.highScoreLabel = this.add
      .text(GAME_W / 2, 140, 'Best: ' + this.state.highScore, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffeedd',
      })
      .setOrigin(0.5)

    this.levelText = this.add
      .text(30, 40, 'Lv.' + this.state.level, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#6622aa',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5)

    this.movesText = this.add
      .text(GAME_W - 30, 40, 'Moves: ' + this.state.movesLeft, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#6622aa',
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5)

    this.comboText = this.add
      .text(GAME_W / 2, GAME_H / 2, '', {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#AA4400',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(100)
  }

  private updateUI(): void {
    this.scoreText.setText(this.state.score.toString())
    this.highScoreLabel.setText('Best: ' + this.state.highScore)
    this.levelText.setText('Lv.' + this.state.level)
    this.movesText.setText('Moves: ' + this.state.movesLeft)

    if (this.state.movesLeft <= 5 && this.state.movesLeft > 0) {
      this.movesText.setColor('#FF4444')
    } else {
      this.movesText.setColor('#ffffff')
    }
  }

  // ─── Grid init ──────────────────────────────────────────────────────────────

  private initGrid(): void {
    // Destroy old sprites
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.sprites[r]?.[c]?.destroy()
        this.highlights[r]?.[c]?.destroy()
      }
    }

    this.sprites = []
    this.highlights = []

    for (let r = 0; r < ROWS; r++) {
      this.sprites[r] = []
      this.highlights[r] = []
      for (let c = 0; c < COLS; c++) {
        const cell = this.state.grid[r][c]
        if (!cell) continue
        const pos = this.cellToPixel(r, c)
        this.sprites[r][c] = this.createJellySprite(pos.x, pos.y, cell.type, cell.special)
        this.highlights[r][c] = this.createHighlight(pos.x, pos.y)
        this.highlights[r][c]!.setVisible(false)
      }
    }
  }

  // ─── Sprite factories ──────────────────────────────────────────────────────

  private createJellySprite(x: number, y: number, type: JellyType, special: SpecialKind): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const gfx = this.add.graphics()

    if (special === SPECIAL.RAINBOW) {
      const colors = [0xff4466, 0xffdd44, 0x44dd88, 0x4488ff, 0xbb44ff, 0xff8844]
      const angle = Math.random() * Math.PI * 2
      for (let i = 0; i < colors.length; i++) {
        const a = angle + (i / colors.length) * Math.PI * 2
        gfx.fillStyle(colors[i], 0.8)
        gfx.fillCircle(Math.cos(a) * 8 + 20, Math.sin(a) * 8 + 20, 14)
      }
      gfx.fillStyle(0xffffff, 0.6)
      gfx.fillCircle(20, 20, 12)
    } else if (special === SPECIAL.BOMB) {
      const colors = JELLY_COLORS[type]
      gfx.fillStyle(0x333333, 0.9)
      gfx.fillCircle(20, 20, 18)
      gfx.fillStyle(colors.main, 0.5)
      gfx.fillCircle(20, 20, 12)
      gfx.fillStyle(0xffdd00, 1)
      this.drawStar(gfx, 20, 20, 5, 8, 4)
    } else {
      const colors = JELLY_COLORS[type]
      gfx.fillStyle(0x000000, 0.15)
      gfx.fillCircle(22, 22, 18)
      gfx.fillStyle(colors.main, 0.85)
      gfx.fillCircle(20, 20, 18)
      gfx.fillStyle(colors.light, 0.6)
      gfx.fillCircle(15, 14, 8)
      gfx.fillStyle(0xffffff, 0.5)
      gfx.fillCircle(13, 12, 4)
    }

    container.add(gfx)
    container.setSize(40, 40)
    container.setDepth(1)
    return container
  }

  private drawStar(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, spikes: number, outerR: number, innerR: number): void {
    let rot = (Math.PI / 2) * 3
    const step = Math.PI / spikes
    gfx.beginPath()
    gfx.moveTo(cx, cy - outerR)
    for (let i = 0; i < spikes; i++) {
      gfx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
      rot += step
      gfx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
      rot += step
    }
    gfx.closePath()
    gfx.fillPath()
  }

  private createHighlight(x: number, y: number): Phaser.GameObjects.Graphics {
    const gfx = this.add.graphics()
    gfx.lineStyle(3, 0xffffff, 0.9)
    gfx.strokeCircle(x, y, 22)
    gfx.setDepth(2)
    return gfx
  }

  // ─── Coordinate conversion ─────────────────────────────────────────────────

  private cellToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
      y: BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
    }
  }

  private pixelToCell(x: number, y: number): CellPos | null {
    const col = Math.floor((x - BOARD_OFFSET_X) / CELL_SIZE)
    const row = Math.floor((y - BOARD_OFFSET_Y) / CELL_SIZE)
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      return { row, col }
    }
    return null
  }

  // ─── Input handling ─────────────────────────────────────────────────────────

  private handleClick(pointer: Phaser.Input.Pointer): void {
    if (this.isAnimating || this.state.gameOver) return

    const cell = this.pixelToCell(pointer.x, pointer.y)
    if (!cell) return

    if (!this.selected) {
      this.selected = cell
      this.highlights[cell.row]?.[cell.col]?.setVisible(true)
      this.tweens.add({
        targets: this.sprites[cell.row]?.[cell.col],
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 100,
        yoyo: true,
      })
    } else {
      const { row: sr, col: sc } = this.selected
      this.highlights[sr]?.[sc]?.setVisible(false)

      if (
        (Math.abs(cell.row - sr) === 1 && cell.col === sc) ||
        (Math.abs(cell.col - sc) === 1 && cell.row === sr)
      ) {
        this.trySwap(sr, sc, cell.row, cell.col)
      } else {
        // Re-select
        this.selected = cell
        this.highlights[cell.row]?.[cell.col]?.setVisible(true)
        this.tweens.add({
          targets: this.sprites[cell.row]?.[cell.col],
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 100,
          yoyo: true,
        })
      }
    }
  }

  // ─── Swap logic ─────────────────────────────────────────────────────────────

  private trySwap(r1: number, c1: number, r2: number, c2: number): void {
    this.isAnimating = true
    this.selected = null

    this.animateSwap(r1, c1, r2, c2, () => {
      swapCells(this.state.grid, r1, c1, r2, c2)

      const matches = findAllMatches(this.state.grid)
      if (matches.length > 0) {
        this.state.movesLeft--
        this.updateUI()
        this.state.chainCount = 0
        this.processMatches(matches)
      } else {
        // No match – swap back
        this.animateSwap(r1, c1, r2, c2, () => {
          swapCells(this.state.grid, r1, c1, r2, c2)
          this.isAnimating = false
        })
      }
    })
  }

  private animateSwap(r1: number, c1: number, r2: number, c2: number, onComplete: () => void): void {
    const pos1 = this.cellToPixel(r1, c1)
    const pos2 = this.cellToPixel(r2, c2)

    this.tweens.add({
      targets: this.sprites[r1]?.[c1],
      x: pos2.x,
      y: pos2.y,
      duration: SWAP_DURATION,
      ease: 'Back.easeOut',
    })

    this.tweens.add({
      targets: this.sprites[r2]?.[c2],
      x: pos1.x,
      y: pos1.y,
      duration: SWAP_DURATION,
      ease: 'Back.easeOut',
      onComplete,
    })
  }

  // ─── Match processing ──────────────────────────────────────────────────────

  private processMatches(matches: CellPos[]): void {
    this.state.chainCount++
    const multiplier =
      this.state.chainCount >= 3 ? 3 : this.state.chainCount === 2 ? 2 : 1

    const specialsToCreate = determineSpecials(this.state.grid, matches)

    const matchScore = calculateMatchScore(matches, this.state.chainCount)

    // Special activations
    let specialBonus = 0
    for (const m of matches) {
      const cell = this.state.grid[m.row]?.[m.col]
      if (cell?.special === SPECIAL.BOMB) {
        specialBonus += 150
      } else if (cell?.special === SPECIAL.RAINBOW) {
        specialBonus += 150
      }
    }

    this.state.score += matchScore + specialBonus
        addHapticFeedback('medium')
        if (this.state.chainCount >= 2) showComboText(this, this.state.chainCount)
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score
      saveHighScore(this.state.highScore)
    }
    this.updateUI()

    // Score popup
    if (matches.length > 0) {
      const mid = matches[Math.floor(matches.length / 2)]
      const pos = this.cellToPixel(mid.row, mid.col)
      this.showScorePopup(pos.x, pos.y, matchScore + specialBonus, multiplier)
    }

    // Combo text
    if (this.state.chainCount >= 2) {
      this.showCombo(this.state.chainCount)
      this.cameras.main.shake(100, 0.005 * this.state.chainCount)
    }

    // Animate elimination
    this.animateElimination(matches, () => {
      // Remove matched cells
      removeCells(this.state.grid, matches)

      // Create special jellies
      for (const sp of specialsToCreate) {
        if (!this.state.grid[sp.row][sp.col]) {
          this.state.grid[sp.row][sp.col] = { type: sp.type, special: sp.special }
          const pos = this.cellToPixel(sp.row, sp.col)
          this.sprites[sp.row][sp.col] = this.createJellySprite(pos.x, pos.y, sp.type, sp.special)
          this.highlights[sp.row][sp.col] = this.createHighlight(pos.x, pos.y)
          this.highlights[sp.row][sp.col]!.setVisible(false)
        }
      }

      // Drop and fill
      this.dropAndFill(() => {
        const newMatches = findAllMatches(this.state.grid)
        if (newMatches.length > 0) {
          this.time.delayedCall(CHAIN_DELAY, () => {
            this.processMatches(newMatches)
          })
        } else {
          this.state.chainCount = 0
          this.isAnimating = false

          if (!hasValidMoves(this.state.grid)) {
            this.time.delayedCall(500, () => this.triggerGameOver())
          }

          if (this.state.movesLeft <= 0) {
            this.time.delayedCall(500, () => this.levelUp())
          }
        }
      })
    })
  }

  // ─── Elimination animation ──────────────────────────────────────────────────

  private animateElimination(matches: CellPos[], onComplete: () => void): void {
    let completed = 0
    const total = matches.length

    if (total === 0) {
      onComplete()
      return
    }

    for (const m of matches) {
      const sprite = this.sprites[m.row]?.[m.col]
      if (!sprite) {
        completed++
        if (completed >= total) onComplete()
        continue
      }

      const pos = this.cellToPixel(m.row, m.col)

      this.tweens.add({
        targets: sprite,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: ELIMINATE_DURATION,
        ease: 'Power2',
        onComplete: () => {
          completed++
          this.createEliminationParticles(pos.x, pos.y, this.state.grid[m.row]?.[m.col]?.type)
          if (completed >= total) onComplete()
        },
      })
    }
  }

  private createEliminationParticles(x: number, y: number, type?: JellyType): void {
    const colors = type ? JELLY_COLORS[type] : JELLY_COLORS.strawberry
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const speed = 80 + Math.random() * 60
      const particle = this.add.graphics()
      particle.fillStyle(colors.main, 0.9)
      particle.fillCircle(0, 0, 4)
      particle.setPosition(x, y)
      particle.setDepth(50)

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - 30,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      })
    }

    // Star particles
    for (let i = 0; i < 3; i++) {
      const star = this.add.graphics()
      star.fillStyle(0xffdd00, 0.9)
      this.drawStar(star, 0, 0, 5, 6, 3)
      star.setPosition(x, y)
      star.setDepth(50)

      this.tweens.add({
        targets: star,
        x: x + (Math.random() - 0.5) * 100,
        y: y - 40 - Math.random() * 60,
        alpha: 0,
        rotation: Math.random() * Math.PI,
        duration: 500,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      })
    }
  }

  // ─── Drop & fill animation ──────────────────────────────────────────────────

  private dropAndFill(onComplete: () => void): void {
    let anyDropped = false

    for (let c = 0; c < COLS; c++) {
      let emptyRow = ROWS - 1
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.state.grid[r][c]) {
          if (r !== emptyRow) {
            // Move data
            this.state.grid[emptyRow][c] = this.state.grid[r][c]
            this.state.grid[r][c] = null

            // Move sprite refs
            this.sprites[emptyRow][c] = this.sprites[r][c]
            this.sprites[r][c] = null
            this.highlights[emptyRow][c] = this.highlights[r][c]
            this.highlights[r][c] = null

            const pos = this.cellToPixel(emptyRow, c)
            this.tweens.add({
              targets: this.sprites[emptyRow][c],
              y: pos.y,
              duration: FALL_DURATION * (emptyRow - r),
              ease: 'Bounce.easeOut',
            })
            anyDropped = true
          }
          emptyRow--
        }
      }

      // Fill from top
      for (let r = emptyRow; r >= 0; r--) {
        const type = JELLY_TYPES[Math.floor(Math.random() * this.state.numColors)]
        this.state.grid[r][c] = { type, special: SPECIAL.NONE }

        const pos = this.cellToPixel(r, c)
        this.sprites[r][c] = this.createJellySprite(pos.x, pos.y, type, SPECIAL.NONE)
        this.highlights[r][c] = this.createHighlight(pos.x, pos.y)
        this.highlights[r][c]!.setVisible(false)

        // Animate from above
        const startY = BOARD_OFFSET_Y - (emptyRow - r + 1) * CELL_SIZE
        this.sprites[r][c]!.y = startY

        this.tweens.add({
          targets: this.sprites[r][c],
          y: pos.y,
          duration: FALL_DURATION * (emptyRow - r + 2),
          ease: 'Bounce.easeOut',
        })
        anyDropped = true
      }
    }

    if (anyDropped) {
      this.time.delayedCall(FALL_DURATION * ROWS + 100, onComplete)
    } else {
      onComplete()
    }
  }

  // ─── Score popup ────────────────────────────────────────────────────────────

  private showScorePopup(x: number, y: number, points: number, multiplier: number): void {
    let text = '+' + points
    if (multiplier > 1) text += ' x' + multiplier

    const popup = this.add
      .text(x, y, text, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#AA4400',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(60)

    this.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => popup.destroy(),
    })
  }

  private showCombo(chain: number): void {
    const labels = ['', '', 'Double!', 'Triple!', 'AMAZING!', 'INCREDIBLE!', 'LEGENDARY!']
    const label = labels[Math.min(chain, labels.length - 1)] || 'x' + chain + '!'

    this.comboText.setText(label)
    this.comboText.setAlpha(1)
    this.comboText.setScale(0.5)

    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    })

    this.tweens.add({
      targets: this.comboText,
      alpha: 0,
      delay: 600,
      duration: 300,
    })
  }

  // ─── Game over ──────────────────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.state.gameOver = true

    // Update meta stats
    this.metaStats.totalScore += this.state.score
    this.metaStats.highScore = Math.max(this.metaStats.highScore, this.state.score)
    this.metaStats.highestLevel = Math.max(this.metaStats.highestLevel, this.state.level)
    this.metaStats.totalMatches += this.sessionMatches
    this.metaStats.totalChains += this.sessionChains
    this.metaStats.gamesPlayed++
    const earnedCoins = levelCoins(this.state.score)
    this.metaCoins += earnedCoins
    this.saveMeta()

    const diff = this.state.highScore - this.state.score
    let message = 'Game Over!'
    if (diff > 0 && diff < this.state.highScore * 0.3) {
      message = 'So close! Only ' + diff + ' away!'
    }

    const gameOverGroup = this.add.container(0, 0).setDepth(90)

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, GAME_W, GAME_H)
    gameOverGroup.add(overlay)

    const titleText = this.add
      .text(GAME_W / 2, GAME_H / 2 - 80, message, {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#AA4400',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
    gameOverGroup.add(titleText)

    const scoreLabel = this.add
      .text(GAME_W / 2, GAME_H / 2 - 30, 'Score: ' + this.state.score, {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5)
    gameOverGroup.add(scoreLabel)

    const bestLabel = this.add
      .text(GAME_W / 2, GAME_H / 2 + 5, 'Best: ' + this.state.highScore, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffccdd',
      })
      .setOrigin(0.5)
    gameOverGroup.add(bestLabel)

    const coinsLabel = this.add
      .text(GAME_W / 2, GAME_H / 2 + 30, `💰 +${levelCoins(this.state.score)} coins`, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#FFD700',
      })
      .setOrigin(0.5)
    gameOverGroup.add(coinsLabel)

    // Try Again button
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xff6688, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 80, GAME_H / 2 + 40, 160, 50, 12)
    gameOverGroup.add(btnGfx)

    const btnText = this.add
      .text(GAME_W / 2, GAME_H / 2 + 65, 'Try Again', {
        fontSize: '22px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#AA2244',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
    gameOverGroup.add(btnText)

    const btnZone = this.add.zone(GAME_W / 2, GAME_H / 2 + 65, 160, 50)
    btnZone.setInteractive()
    btnZone.on('pointerdown', () => this.restartGame())
    gameOverGroup.add(btnZone)

    // Rewarded ad: +5 moves to continue
    const rewardBtnGfx = this.add.graphics()
    rewardBtnGfx.fillStyle(0xe056fd, 1)
    rewardBtnGfx.fillRoundedRect(GAME_W / 2 - 80, GAME_H / 2 + 100, 160, 40, 10)
    gameOverGroup.add(rewardBtnGfx)

    const rewardBtnText = this.add
      .text(GAME_W / 2, GAME_H / 2 + 120, '🎬 +5 Moves', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
    gameOverGroup.add(rewardBtnText)

    const rewardZone = this.add.zone(GAME_W / 2, GAME_H / 2 + 120, 160, 40)
    rewardZone.setInteractive()
    rewardZone.on('pointerdown', async () => {
      const adManager = SharedAdManager.getInstance()
      const success = await adManager.requestRewardedAd()
      if (success) {
        this.state.movesLeft += 5
        this.state.gameOver = false
        this.isAnimating = false
        gameOverGroup.destroy()
        this.updateUI()
      }
    })
    gameOverGroup.add(rewardZone)

    this.showAd()
  }

  private restartGame(): void {
    this.state.score = 0
    this.state.level = 1
    this.state.movesLeft = 30
    this.state.numColors = 5
    this.state.gameOver = false
    this.state.chainCount = 0
    this.isAnimating = false
    this.selected = null
    this.scene.restart()
  }

  // ─── Level up ───────────────────────────────────────────────────────────────

  private levelUp(): void {
    this.state.level++
    this.state.movesLeft = movesForLevel(this.state.level)
    this.state.numColors = numColorsForLevel(this.state.level)
    this.updateUI()

    const levelText = this.add
      .text(GAME_W / 2, GAME_H / 2, 'Level ' + this.state.level + '!', {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: '#FFD700',
        stroke: '#AA4400',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0)

    this.tweens.add({
      targets: levelText,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      hold: 500,
      onComplete: () => levelText.destroy(),
    })

    if (this.state.level % 3 === 0) {
      this.showAd()
    }
  }

  // ─── SDK ────────────────────────────────────────────────────────────────────

  private initSDK(): void {
    try {
      const w = window as any
      if (w.CrazyGames?.SDK) {
        this.sdk = w.CrazyGames.SDK
        this.sdk.game.gameplayStart()
      }
    } catch {
      /* noop */
    }
  }

  private showAd(): void {
    try {
      this.sdk?.ad?.requestAd('midgame')
    } catch {
      /* noop */
    }
  }

  // ─── Meta persistence ──────────────────────────────────────────────────

  private META_KEY = 'jelly-pop-meta'

  private loadMeta(): void {
    try {
      const raw = localStorage.getItem(this.META_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        this.metaCoins = data.coins ?? 0
        this.metaLevel = data.level ?? 0
        this.metaUnlockedThemes = Array.isArray(data.unlockedThemes) ? data.unlockedThemes : ['classic']
        this.metaAchievements = Array.isArray(data.achievements) ? data.achievements : []
        this.metaStats = { ...this.metaStats, ...(data.stats ?? {}) }
        this.metaLastDaily = data.lastDailyDate ?? ''
      }
    } catch { /* corrupted */ }
  }

  private saveMeta(): void {
    try {
      localStorage.setItem(this.META_KEY, JSON.stringify({
        coins: this.metaCoins,
        level: this.state.level,
        unlockedThemes: this.metaUnlockedThemes,
        achievements: this.metaAchievements,
        stats: this.metaStats,
        lastDailyDate: this.metaLastDaily,
      }))
    } catch { /* */ }
  }
}
