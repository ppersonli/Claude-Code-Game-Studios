/** GameScene — Core tower defense gameplay with procedural Phaser Graphics rendering.
 *  Towers and monsters are drawn with shapes (circles, triangles, etc.) — no sprites.
 */

import Phaser from 'phaser'
import { TOWERS, type TowerDef } from '../../data/towers'
import { HEROES } from '../../data/heroes'
import { DUNGEONS } from '../../data/dungeons'
import { CONSTANTS, calcCost, calcDamage } from '../../logic/constants'
import { DEFAULT_WAYPOINTS, waypointsToPixels, getPathCells, moveAlongPath, type Point } from '../../logic/pathfinding'
import { spawnWave, processCombatTick, getTowerUpgradeCost } from '../../logic/combat'
import type { GameState, TowerState, MonsterInstance } from '../../logic/game-state'

/* ── Types ────────────────────────────────────────────────────── */

export interface GameSceneData {
  getState: () => GameState
  onCoinsChanged: (coins: number) => void
  onWaveChanged: (wave: number) => void
  onWaveComplete: (wave: number, gold: number) => void
  onMonsterLeaked: () => void
  onTowerPlaced: (key: string, tower: TowerState) => void
  onTowerUpgraded: (key: string, level: number) => void
  onRequestSync: () => void
}

interface Projectile {
  from: Point
  to: Point
  color: number
  startTime: number
  duration: number
}

/* ── Constants ────────────────────────────────────────────────── */

const CELL = CONSTANTS.CELL_SIZE
const COLS = CONSTANTS.GRID_COLS
const ROWS = CONSTANTS.GRID_ROWS
const GRID_OFFSET_X = 0
const GRID_OFFSET_Y = 80

/* ── Scene ────────────────────────────────────────────────────── */

export class GameScene extends Phaser.Scene {
  private sceneData!: GameSceneData
  private gridGfx!: Phaser.GameObjects.Graphics
  private towerGfx!: Phaser.GameObjects.Graphics
  private monsterGfx!: Phaser.GameObjects.Graphics
  private projectileGfx!: Phaser.GameObjects.Graphics
  private rangeGfx!: Phaser.GameObjects.Graphics
  private infoText!: Phaser.GameObjects.Text

  private pathCells = new Set<string>()
  private pixelWaypoints: Point[] = []
  private monsters: MonsterInstance[] = []
  private projectiles: Projectile[] = []
  private waveInProgress = false
  private waveTimer = 0
  private selectedCell: { col: number; row: number } | null = null
  private towerDefs = new Map<string, TowerDef>()
  private totalWaveGold = 0

  constructor() { super({ key: 'GameScene' }) }

  init(data: GameSceneData): void {
    this.sceneData = data
    this.monsters = []
    this.projectiles = []
    this.waveInProgress = false
    this.waveTimer = 0
    this.selectedCell = null
    this.totalWaveGold = 0
  }

  create(): void {
    // Pre-index tower defs
    for (const t of TOWERS) this.towerDefs.set(t.id, t)

    // Calculate pixel waypoints
    this.pixelWaypoints = waypointsToPixels(DEFAULT_WAYPOINTS, CELL, GRID_OFFSET_X, GRID_OFFSET_Y)
    this.pathCells = getPathCells(DEFAULT_WAYPOINTS)

    // Dungeon background
    const dungeon = DUNGEONS.find(d => d.id === this.sceneData.getState().currentDungeon) || DUNGEONS[0]
    this.cameras.main.setBackgroundColor(dungeon.bgColor)

    // Draw layers
    this.gridGfx = this.add.graphics()
    this.rangeGfx = this.add.graphics()
    this.towerGfx = this.add.graphics()
    this.monsterGfx = this.add.graphics()
    this.projectileGfx = this.add.graphics()

    this.drawGrid(dungeon)
    this.drawPath(dungeon)

    // Info text
    this.infoText = this.add.text(GRID_OFFSET_X, GRID_OFFSET_Y + ROWS * CELL + 8, '', {
      fontFamily: 'Exo 2, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)',
    })

    // Click handler for tower placement / selection
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const col = Math.floor((pointer.x - GRID_OFFSET_X) / CELL)
      const row = Math.floor((pointer.y - GRID_OFFSET_Y) / CELL)
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return
      this.handleGridClick(col, row)
    })

    this.refresh()
  }

  /* ── Public API ─────────────────────────────────────────────── */

  refresh(): void {
    if (!this.scene.isActive()) return
    const state = this.sceneData.getState()
    this.drawTowers(state)
    this.drawRange(state)
  }

  startWave(): void {
    if (this.waveInProgress) return
    const state = this.sceneData.getState()
    state.currentWave++
    this.waveInProgress = true
    this.waveTimer = 0
    this.totalWaveGold = 0
    this.monsters = spawnWave(state.currentWave, this.pixelWaypoints)
    this.sceneData.onWaveChanged(state.currentWave)
  }

  /* ── update loop ────────────────────────────────────────────── */

  update(_time: number, delta: number): void {
    if (!this.waveInProgress) return

    const state = this.sceneData.getState()
    const deltaSec = delta / 1000
    this.waveTimer += deltaSec

    // Spawn delayed monsters
    for (const m of this.monsters) {
      if (!m.spawned && this.waveTimer >= m.spawnDelay) {
        m.spawned = true
      }
    }

    // Move monsters
    const pixelsPerCell = CELL
    for (const m of this.monsters) {
      if (!m.alive || !m.spawned) continue
      const effectiveSpeed = m.speed * pixelsPerCell * (m.slowUntil > Date.now() ? 0.5 : 1)
      const result = moveAlongPath(m.pos, m.waypointIdx, this.pixelWaypoints, effectiveSpeed, deltaSec)
      m.pos = result.pos
      m.waypointIdx = result.waypointIdx
      if (result.reachedEnd) m.reachedEnd = true
    }

    // Build tower list for combat
    const towers: TowerState[] = Object.values(state.towers)

    // Hero multipliers
    let heroAtkMult = 1
    for (const heroId of state.activeHeroes) {
      const hero = HEROES.find(h => h.id === heroId)
      if (hero && hero.effectType === 'atk_boost') heroAtkMult += hero.effectValue
    }

    // Combat tick
    const prevAlive = this.monsters.filter(m => m.alive).length
    const combat = processCombatTick(towers, this.monsters, this.towerDefs, heroAtkMult, state.prestigeMult, Date.now(), deltaSec)

    // Track new attacks for projectile visuals
    for (const tower of towers) {
      const def = this.towerDefs.get(tower.defId)
      if (!def || def.attackType === 'heal') continue
      const interval = 1 / (def.attackSpeed * (1 + (tower.level - 1) * 0.05))
      if (Date.now() - tower.lastAttackTime < interval + 50) {
        // Find nearest alive monster for visual
        const targets = this.monsters.filter(m => m.alive && m.spawned)
        if (targets.length > 0) {
          const closest = targets.reduce((a, b) =>
            Math.hypot(tower.pos.x - a.pos.x, tower.pos.y - a.pos.y) <
            Math.hypot(tower.pos.x - b.pos.x, tower.pos.y - b.pos.y) ? a : b
          )
          this.projectiles.push({
            from: { ...tower.pos },
            to: { ...closest.pos },
            color: def.color,
            startTime: Date.now(),
            duration: 200,
          })
        }
      }
    }

    // Apply gold
    if (combat.goldEarned > 0) {
      state.coins += combat.goldEarned
      state.totalCoins += combat.goldEarned
      state.totalKills += combat.kills
      state.sessionKills += combat.kills
      state.sessionGoldEarned += combat.goldEarned
      this.totalWaveGold += combat.goldEarned
      this.sceneData.onCoinsChanged(state.coins)
    }

    // Track leaks
    if (combat.leaked > 0) {
      state.consecutiveNoLeak = 0
      this.sceneData.onMonsterLeaked()
    }

    // Check wave complete
    const allDead = this.monsters.every(m => !m.alive || m.reachedEnd)
    if (allDead && this.monsters.length > 0) {
      this.waveInProgress = false
      if (combat.leaked === 0) state.consecutiveNoLeak++
      if (state.currentWave > state.bestWave) state.bestWave = state.currentWave
      this.sceneData.onWaveComplete(state.currentWave, this.totalWaveGold)
    }

    // Redraw
    this.drawMonsters()
    this.drawProjectiles()
  }

  /* ── Drawing ────────────────────────────────────────────────── */

  private drawGrid(dungeon: typeof DUNGEONS[0]): void {
    this.gridGfx.clear()
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = GRID_OFFSET_X + c * CELL
        const y = GRID_OFFSET_Y + r * CELL
        const onPath = this.pathCells.has(`${c},${r}`)
        this.gridGfx.fillStyle(onPath ? dungeon.pathColor : dungeon.terrainColor, 1)
        this.gridGfx.fillRect(x, y, CELL, CELL)
        this.gridGfx.lineStyle(1, 0xffffff, 0.05)
        this.gridGfx.strokeRect(x, y, CELL, CELL)
      }
    }
  }

  private drawPath(dungeon: typeof DUNGEONS[0]): void {
    // Draw path direction arrows
    const gfx = this.gridGfx
    gfx.lineStyle(3, dungeon.pathColor, 0.5)
    for (let i = 0; i < this.pixelWaypoints.length - 1; i++) {
      gfx.lineBetween(
        this.pixelWaypoints[i].x, this.pixelWaypoints[i].y,
        this.pixelWaypoints[i + 1].x, this.pixelWaypoints[i + 1].y,
      )
    }
  }

  private drawTowers(state: GameState): void {
    this.towerGfx.clear()
    for (const [key, tower] of Object.entries(state.towers)) {
      const def = this.towerDefs.get(tower.defId)
      if (!def) continue
      this.drawTowerShape(this.towerGfx, tower.pos.x, tower.pos.y, def, tower.level)
    }
  }

  /** Draw a tower as a procedural shape */
  private drawTowerShape(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, def: TowerDef, level: number): void {
    const r = CELL * 0.35

    // Base circle
    gfx.fillStyle(def.color, 1)
    gfx.fillCircle(cx, cy, r)

    // Inner accent
    gfx.fillStyle(def.accentColor, 1)
    gfx.fillCircle(cx, cy, r * 0.5)

    // Shape indicator based on type
    gfx.lineStyle(2, 0xffffff, 0.8)
    switch (def.attackType) {
      case 'single': // Arrow: triangle
        gfx.beginPath()
        gfx.moveTo(cx, cy - r * 0.6)
        gfx.lineTo(cx - r * 0.4, cy + r * 0.3)
        gfx.lineTo(cx + r * 0.4, cy + r * 0.3)
        gfx.closePath()
        gfx.strokePath()
        break
      case 'aoe': // Magic: diamond
        gfx.beginPath()
        gfx.moveTo(cx, cy - r * 0.6)
        gfx.lineTo(cx + r * 0.5, cy)
        gfx.lineTo(cx, cy + r * 0.6)
        gfx.lineTo(cx - r * 0.5, cy)
        gfx.closePath()
        gfx.strokePath()
        break
      case 'slow': // Ice: snowflake lines
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2
          gfx.lineBetween(cx, cy, cx + Math.cos(angle) * r * 0.5, cy + Math.sin(angle) * r * 0.5)
        }
        break
      case 'pierce': // Cannon: square
        gfx.strokeRect(cx - r * 0.4, cy - r * 0.4, r * 0.8, r * 0.8)
        break
      case 'dot': // Poison: hexagon
        gfx.beginPath()
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2 - Math.PI / 6
          const px = cx + Math.cos(angle) * r * 0.5
          const py = cy + Math.sin(angle) * r * 0.5
          if (a === 0) gfx.moveTo(px, py)
          else gfx.lineTo(px, py)
        }
        gfx.closePath()
        gfx.strokePath()
        break
      case 'heal': // Holy: cross/plus
        gfx.lineBetween(cx - r * 0.4, cy, cx + r * 0.4, cy)
        gfx.lineBetween(cx, cy - r * 0.4, cx, cy + r * 0.4)
        break
    }

    // Level indicator dots
    if (level > 1) {
      const dotCount = Math.min(level - 1, 5)
      for (let i = 0; i < dotCount; i++) {
        const angle = -Math.PI / 2 + (i - (dotCount - 1) / 2) * 0.4
        gfx.fillStyle(0xffffff, 0.9)
        gfx.fillCircle(cx + Math.cos(angle) * (r + 4), cy + Math.sin(angle) * (r + 4), 2)
      }
    }
  }

  private drawMonsters(): void {
    this.monsterGfx.clear()
    for (const m of this.monsters) {
      if (!m.alive || !m.spawned) continue
      this.drawMonsterShape(m)
    }
  }

  /** Draw a monster as a procedural shape with eyes */
  private drawMonsterShape(m: MonsterInstance): void {
    const gfx = this.monsterGfx
    const { x, y } = m.pos
    const s = m.size

    // Body
    gfx.fillStyle(m.color, 1)
    if (m.special === 'boss') {
      // Boss: larger with spikes
      gfx.fillCircle(x, y, s)
      gfx.lineStyle(2, 0xff0000, 0.8)
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2
        gfx.lineBetween(
          x + Math.cos(angle) * s, y + Math.sin(angle) * s,
          x + Math.cos(angle) * (s + 5), y + Math.sin(angle) * (s + 5),
        )
      }
    } else if (m.special === 'fly') {
      // Dragon: triangle
      gfx.beginPath()
      gfx.moveTo(x, y - s)
      gfx.lineTo(x - s, y + s * 0.6)
      gfx.lineTo(x + s, y + s * 0.6)
      gfx.closePath()
      gfx.fillPath()
    } else if (m.special === 'ghost') {
      // Ghost: rounded top, wavy bottom
      gfx.fillCircle(x, y - s * 0.3, s * 0.8)
      gfx.fillRect(x - s * 0.8, y - s * 0.3, s * 1.6, s)
    } else if (m.special === 'armor') {
      // Troll: square
      gfx.fillRect(x - s, y - s, s * 2, s * 2)
      gfx.lineStyle(2, 0x5D4037, 1)
      gfx.strokeRect(x - s, y - s, s * 2, s * 2)
    } else {
      // Default: circle
      gfx.fillCircle(x, y, s)
    }

    // Eyes
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(x - s * 0.3, y - s * 0.2, s * 0.2)
    gfx.fillCircle(x + s * 0.3, y - s * 0.2, s * 0.2)
    gfx.fillStyle(0x000000, 1)
    gfx.fillCircle(x - s * 0.25, y - s * 0.2, s * 0.1)
    gfx.fillCircle(x + s * 0.35, y - s * 0.2, s * 0.1)

    // Health bar
    const barW = s * 2.5
    const barH = 3
    const barY = y - s - 6
    gfx.fillStyle(0x333333, 1)
    gfx.fillRect(x - barW / 2, barY, barW, barH)
    const hpPct = Math.max(0, m.hp / m.maxHp)
    const hpColor = hpPct > 0.5 ? 0x4CAF50 : hpPct > 0.25 ? 0xFFC107 : 0xF44336
    gfx.fillStyle(hpColor, 1)
    gfx.fillRect(x - barW / 2, barY, barW * hpPct, barH)

    // Slow indicator
    if (m.slowUntil > Date.now()) {
      gfx.fillStyle(0x00BCD4, 0.3)
      gfx.fillCircle(x, y, s + 3)
    }
    // Poison indicator
    if (m.poisonUntil > Date.now()) {
      gfx.fillStyle(0x4CAF50, 0.3)
      gfx.fillCircle(x, y, s + 3)
    }
  }

  private drawProjectiles(): void {
    this.projectileGfx.clear()
    const now = Date.now()
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      const elapsed = now - p.startTime
      if (elapsed > p.duration) {
        this.projectiles.splice(i, 1)
        continue
      }
      const t = elapsed / p.duration
      const x = p.from.x + (p.to.x - p.from.x) * t
      const y = p.from.y + (p.to.y - p.from.y) * t
      this.projectileGfx.fillStyle(p.color, 1 - t)
      this.projectileGfx.fillCircle(x, y, 3)
      // Trail
      const tx = p.from.x + (p.to.x - p.from.x) * (t - 0.15)
      const ty = p.from.y + (p.to.y - p.from.y) * (t - 0.15)
      this.projectileGfx.fillStyle(p.color, 0.3)
      this.projectileGfx.fillCircle(tx, ty, 2)
    }
  }

  private drawRange(state: GameState): void {
    this.rangeGfx.clear()
    if (!this.selectedCell) return
    const key = `${this.selectedCell.col},${this.selectedCell.row}`
    const tower = state.towers[key]
    if (!tower) return
    const def = this.towerDefs.get(tower.defId)
    if (!def) return
    const rangePx = def.range * CELL
    this.rangeGfx.lineStyle(1, 0x00e5ff, 0.3)
    this.rangeGfx.strokeCircle(tower.pos.x, tower.pos.y, rangePx)
    this.rangeGfx.fillStyle(0x00e5ff, 0.05)
    this.rangeGfx.fillCircle(tower.pos.x, tower.pos.y, rangePx)
  }

  /* ── Input handling ─────────────────────────────────────────── */

  private handleGridClick(col: number, row: number): void {
    const state = this.sceneData.getState()
    const key = `${col},${row}`
    const onPath = this.pathCells.has(key)

    if (state.towers[key]) {
      // Select existing tower
      this.selectedCell = { col, row }
      this.drawRange(state)
      const tower = state.towers[key]
      const def = this.towerDefs.get(tower.defId)
      if (def) {
        this.infoText.setText(`${def.name} Lv${tower.level} | Upgrade: ${getTowerUpgradeCost(def, tower.level)} coins`)
      }
      return
    }

    if (onPath) return

    // Place new tower — find the first available tower type
    const availableTowers = TOWERS.filter(t => t.unlockWave <= state.currentWave || t.id === 'arrow')
    if (availableTowers.length === 0) return

    // Cycle through available towers on repeated clicks to same empty cell
    if (this.selectedCell && this.selectedCell.col === col && this.selectedCell.row === row) {
      // Second click on same empty cell: try to place
      const towerToUse = availableTowers.find(t => state.coins >= calcCost(t.baseCost, t.costMultiplier, 0)) || availableTowers[0]
      if (state.coins < calcCost(towerToUse.baseCost, towerToUse.costMultiplier, 0)) {
        this.infoText.setText('Not enough coins!')
        return
      }

      const cost = calcCost(towerToUse.baseCost, towerToUse.costMultiplier, 0)
      state.coins -= cost

      const tower: TowerState = {
        defId: towerToUse.id,
        level: 1,
        pos: {
          x: GRID_OFFSET_X + col * CELL + CELL / 2,
          y: GRID_OFFSET_Y + row * CELL + CELL / 2,
        },
        lastAttackTime: 0,
      }
      state.towers[key] = tower
      this.sceneData.onTowerPlaced(key, tower)
      this.sceneData.onCoinsChanged(state.coins)
      this.selectedCell = null
      this.infoText.setText(`Placed ${towerToUse.name}!`)
      this.drawTowers(state)
      this.drawRange(state)
    } else {
      this.selectedCell = { col, row }
      this.infoText.setText(`Click again to place a tower (${availableTowers[0].name}: ${calcCost(availableTowers[0].baseCost, availableTowers[0].costMultiplier, 0)} coins)`)
    }
  }

  /** Called from Vue to upgrade the selected tower */
  upgradeSelectedTower(): void {
    if (!this.selectedCell) return
    const state = this.sceneData.getState()
    const key = `${this.selectedCell.col},${this.selectedCell.row}`
    const tower = state.towers[key]
    if (!tower) return
    const def = this.towerDefs.get(tower.defId)
    if (!def) return
    if (tower.level >= CONSTANTS.TOWER_MAX_LEVEL) {
      this.infoText.setText('Tower is max level!')
      return
    }
    const cost = getTowerUpgradeCost(def, tower.level)
    if (state.coins < cost) {
      this.infoText.setText('Not enough coins!')
      return
    }
    state.coins -= cost
    tower.level++
    this.sceneData.onTowerUpgraded(key, tower.level)
    this.sceneData.onCoinsChanged(state.coins)
    this.infoText.setText(`${def.name} upgraded to Lv${tower.level}!`)
    this.drawTowers(state)
    this.drawRange(state)
  }

  /** Called from Vue to sell the selected tower */
  sellSelectedTower(): void {
    if (!this.selectedCell) return
    const state = this.sceneData.getState()
    const key = `${this.selectedCell.col},${this.selectedCell.row}`
    const tower = state.towers[key]
    if (!tower) return
    const def = this.towerDefs.get(tower.defId)
    if (!def) return
    const refund = Math.floor(calcCost(def.baseCost, def.costMultiplier, tower.level - 1) * 0.5)
    state.coins += refund
    delete state.towers[key]
    this.sceneData.onCoinsChanged(state.coins)
    this.selectedCell = null
    this.infoText.setText(`Sold for ${refund} coins`)
    this.drawTowers(state)
    this.drawRange(state)
  }

  /** Check if a wave is in progress */
  isWaveActive(): boolean {
    return this.waveInProgress
  }
}
