import Phaser from 'phaser'
import {
  GAME_W, GAME_H, CELL_SIZE, GRID_COLS, GRID_ROWS,
  TOWER_STATS, ENEMY_STATS, WAVES_PER_LEVEL, STARTING_LIVES, STARTING_COINS,
  WAVE_SPAWN_INTERVAL, WAVE_DELAY, DEFAULT_PATH,
  type TowerType,
} from '../../logic/constants'
import type { Tower, Enemy, Projectile, TDGameState, GridCell } from '../../logic/types'
import { getPath, buildPathGrid, canPlaceTower, distance } from '../../logic/pathfinding'
import { canMerge, mergeTowers, getTowerStats } from '../../logic/merge'
import { generateWave, flattenWave, getEnemyStats, getWaveEnemyCount } from '../../logic/wave'
import { findTarget, canFire, createProjectile, projectileHitTarget, isProjectileOutOfBounds, applyDamage, applySlow, updateEnemySlow } from '../../logic/tower'
import { loadSave, saveFull } from '../../logic/save'
import { fadeIn, addHapticFeedback } from '../../../../shared/utils/poki-polish'

const COLORS = {
  PATH: 0x3d2b1a,
  PATH_BORDER: 0x5d4b3a,
  GRID: 0x2d1b4e,
  GRID_LINE: 0x3d2b5e,
  TOWER_RANGE: 0xffffff,
}

export class GameScene extends Phaser.Scene {
  private state!: TDGameState
  private pathGrid!: boolean[][]
  private selectedTowerType: TowerType | null = null
  private selectedTower: Tower | null = null
  private spawnQueue: string[] = []
  private spawnTimer = 0
  private waveDelay = 0
  private gridGfx!: Phaser.GameObjects.Graphics
  private enemyGfx!: Phaser.GameObjects.Graphics
  private projectileGfx!: Phaser.GameObjects.Graphics
  private towerGfx!: Phaser.GameObjects.Graphics
  private hudLives!: Phaser.GameObjects.Text
  private hudCoins!: Phaser.GameObjects.Text
  private hudWave!: Phaser.GameObjects.Text
  private hudScore!: Phaser.GameObjects.Text
  private towerButtons: { type: TowerType; zone: Phaser.GameObjects.Zone; gfx: Phaser.GameObjects.Graphics }[] = []
  private rangeCircle!: Phaser.GameObjects.Graphics

  constructor() { super({ key: 'GameScene' }) }

  create(data?: { level?: number }): void {
    fadeIn(this)
    const level = data?.level ?? 1
    const save = loadSave()
    const path = getPath()
    this.pathGrid = buildPathGrid(path)

    this.state = {
      level, wave: 0, lives: STARTING_LIVES, coins: save.coins || STARTING_COINS,
      score: 0, towers: [], enemies: [], projectiles: [],
      grid: Array.from({ length: GRID_ROWS }, (_, r) =>
        Array.from({ length: GRID_COLS }, (_, c): GridCell => ({ row: r, col: c, isPath: this.pathGrid[r]?.[c] ?? false, tower: null })),
      ),
      path, isPaused: false, isGameOver: false, isLevelComplete: false,
      waveInProgress: false, nextEnemyId: 1, nextTowerId: 1, nextProjectileId: 1,
      enemiesSpawned: 0, enemiesDefeated: 0,
    }

    this.selectedTowerType = null
    this.selectedTower = null
    this.spawnQueue = []
    this.spawnTimer = 0
    this.waveDelay = 1500

    this.cameras.main.setBackgroundColor(0x1a2e1a)
    this.drawGrid()
    this.createHUD()
    this.createTowerButtons()
    this.setupInput()
    this.rangeCircle = this.add.graphics().setDepth(5)
    this.towerGfx = this.add.graphics().setDepth(10)
    this.enemyGfx = this.add.graphics().setDepth(15)
    this.projectileGfx = this.add.graphics().setDepth(20)
  }

  // ─── Grid ──────────────────────────────────────────────────────────

  private drawGrid(): void {
    this.gridGfx = this.add.graphics()
    const g = this.gridGfx
    // Path cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * CELL_SIZE
        const y = r * CELL_SIZE
        if (this.pathGrid[r]?.[c]) {
          g.fillStyle(COLORS.PATH, 1)
          g.fillRect(x, y, CELL_SIZE, CELL_SIZE)
          g.lineStyle(1, COLORS.PATH_BORDER, 0.3)
          g.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
        } else {
          g.lineStyle(1, COLORS.GRID_LINE, 0.15)
          g.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
        }
      }
    }
  }

  // ─── HUD ───────────────────────────────────────────────────────────

  private createHUD(): void {
    const bg = this.add.graphics().setDepth(100)
    bg.fillStyle(0x000000, 0.5)
    bg.fillRoundedRect(5, 5, GAME_W - 10, 40, 8)

    this.hudLives = this.add.text(15, 15, '', { fontSize: '14px', fontFamily: 'Arial', color: '#FF6B6B' }).setDepth(101)
    this.hudCoins = this.add.text(15, 30, '', { fontSize: '12px', fontFamily: 'Arial', color: '#FFD700' }).setDepth(101)
    this.hudWave = this.add.text(GAME_W / 2, 15, '', { fontSize: '14px', fontFamily: 'Arial', color: '#CE93D8' }).setOrigin(0.5, 0).setDepth(101)
    this.hudScore = this.add.text(GAME_W - 15, 15, '', { fontSize: '14px', fontFamily: 'Arial', color: '#FFD700' }).setOrigin(1, 0).setDepth(101)
  }

  private updateHUD(): void {
    this.hudLives.setText(`❤️ ${this.state.lives}`)
    this.hudCoins.setText(`💰 ${this.state.coins}`)
    this.hudWave.setText(`Wave ${this.state.wave}/${WAVES_PER_LEVEL}`)
    this.hudScore.setText(`Score: ${this.state.score}`)
  }

  // ─── Tower Buttons ─────────────────────────────────────────────────

  private createTowerButtons(): void {
    const types = Object.keys(TOWER_STATS) as TowerType[]
    const btnSize = 50
    const startX = (GAME_W - types.length * (btnSize + 8)) / 2
    const y = GAME_H - 60

    types.forEach((type, i) => {
      const stats = TOWER_STATS[type]
      const x = startX + i * (btnSize + 8) + btnSize / 2

      const gfx = this.add.graphics().setDepth(100)
      gfx.fillStyle(stats.projectileColor, 0.3)
      gfx.fillRoundedRect(x - btnSize / 2, y - btnSize / 2, btnSize, btnSize, 8)
      gfx.lineStyle(2, stats.projectileColor, 0.6)
      gfx.strokeRoundedRect(x - btnSize / 2, y - btnSize / 2, btnSize, btnSize, 8)

      this.add.text(x, y - 8, stats.emoji, { fontSize: '22px' }).setOrigin(0.5).setDepth(101)
      this.add.text(x, y + 14, `$${stats.cost}`, { fontSize: '10px', fontFamily: 'Arial', color: '#FFD700' }).setOrigin(0.5).setDepth(101)

      const zone = this.add.zone(x, y, btnSize, btnSize).setInteractive().setDepth(102)
      zone.on('pointerdown', () => {
        if (this.selectedTowerType === type) {
          this.selectedTowerType = null
          this.rangeCircle.clear()
        } else {
          this.selectedTowerType = type
          this.selectedTower = null
          this.rangeCircle.clear()
        }
      })

      this.towerButtons.push({ type, zone, gfx })
    })
  }

  // ─── Input ─────────────────────────────────────────────────────────

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.state.isGameOver) return
      const col = Math.floor(pointer.x / CELL_SIZE)
      const row = Math.floor(pointer.y / CELL_SIZE)
      if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return
      // Ignore tower button area
      if (pointer.y > GAME_H - 90) return

      const cell = this.state.grid[row]?.[col]
      if (!cell) return

      if (cell.tower) {
        // Click on existing tower — select for merge or show range
        if (this.selectedTower && this.selectedTower.id !== cell.tower.id && canMerge(this.selectedTower, cell.tower)) {
          this.performMerge(this.selectedTower, cell.tower)
          this.selectedTower = null
          this.selectedTowerType = null
          this.rangeCircle.clear()
        } else {
          this.selectedTower = cell.tower
          this.selectedTowerType = null
          this.showRange(cell.tower)
        }
      } else if (this.selectedTowerType) {
        // Place new tower
        this.placeTower(row, col, this.selectedTowerType)
      }
    })
  }

  // ─── Tower Placement ───────────────────────────────────────────────

  private placeTower(row: number, col: number, type: TowerType): void {
    const stats = TOWER_STATS[type]
    if (this.state.coins < stats.cost) return
    if (!canPlaceTower(this.pathGrid, this.state.grid.map(r => r.map(c => c.tower)), row, col)) return

    this.state.coins -= stats.cost
    const x = col * CELL_SIZE + CELL_SIZE / 2
    const y = row * CELL_SIZE + CELL_SIZE / 2

    const tower: Tower = {
      id: this.state.nextTowerId++,
      type, level: 1, row, col, x, y,
      lastFireTime: 0, target: null,
    }

    this.state.towers.push(tower)
    this.state.grid[row][col].tower = tower
    addHapticFeedback('light')
    this.drawTowers()
    this.updateHUD()
  }

  // ─── Merge ─────────────────────────────────────────────────────────

  private performMerge(a: Tower, b: Tower): void {
    const merged = mergeTowers(a, b)

    // Remove old towers
    this.state.towers = this.state.towers.filter(t => t.id !== a.id && t.id !== b.id)
    this.state.grid[a.row][a.col].tower = null
    this.state.grid[b.row][b.col].tower = null

    // Place merged tower at position A
    this.state.towers.push(merged)
    this.state.grid[merged.row][merged.col].tower = merged

    addHapticFeedback('medium')
    this.drawTowers()
    this.updateHUD()
  }

  // ─── Range Display ─────────────────────────────────────────────────

  private showRange(tower: Tower): void {
    const stats = getTowerStats(tower.type, tower.level)
    this.rangeCircle.clear()
    this.rangeCircle.lineStyle(2, COLORS.TOWER_RANGE, 0.2)
    this.rangeCircle.strokeCircle(tower.x, tower.y, stats.range)
    this.rangeCircle.fillStyle(COLORS.TOWER_RANGE, 0.05)
    this.rangeCircle.fillCircle(tower.x, tower.y, stats.range)
  }

  // ─── Tower Rendering ───────────────────────────────────────────────

  private drawTowers(): void {
    this.towerGfx.clear()
    for (const tower of this.state.towers) {
      const stats = getTowerStats(tower.type, tower.level)
      const x = tower.x
      const y = tower.y
      const r = 14 + tower.level * 4

      // Tower base
      this.towerGfx.fillStyle(TOWER_STATS[tower.type as keyof typeof TOWER_STATS].projectileColor, 0.8)
      this.towerGfx.fillCircle(x, y, r)
      this.towerGfx.lineStyle(2, 0xffffff, 0.3)
      this.towerGfx.strokeCircle(x, y, r)

      // Level indicator
      if (tower.level > 1) {
        this.towerGfx.fillStyle(0xffffff, 0.9)
        this.towerGfx.fillCircle(x, y - r - 4, 6)
        this.add.text(x, y - r - 4, `${tower.level}`, {
          fontSize: '9px', fontFamily: 'Arial', color: '#000', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(11)
      }
    }
  }

  // ─── Wave Management ───────────────────────────────────────────────

  private startNextWave(): void {
    this.state.wave++
    if (this.state.wave > WAVES_PER_LEVEL) {
      this.state.isLevelComplete = true
      return
    }

    const wave = generateWave(this.state.wave, this.state.level)
    this.spawnQueue = flattenWave(wave)
    this.state.waveInProgress = true
    this.spawnTimer = 0
    this.updateHUD()
  }

  private spawnEnemy(type: string): void {
    const tier = Math.min(4, this.state.level - 1)
    const stats = getEnemyStats(type as any, tier)
    const start = this.state.path[0]

    const enemy: Enemy = {
      id: this.state.nextEnemyId++,
      type: type as any,
      level: tier,
      hp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      baseSpeed: stats.speed,
      x: start.x,
      y: start.y,
      pathIndex: 0,
      reward: stats.reward,
      alive: true,
      flying: stats.flying,
      isBoss: stats.isBoss,
      slowUntil: 0,
      chainHit: false,
      radius: stats.radius,
    }
    this.state.enemies.push(enemy)
    this.state.enemiesSpawned++
  }

  // ─── Update Loop ───────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.state.isGameOver || this.state.isPaused) return

    const now = performance.now()

    // Wave delay
    if (!this.state.waveInProgress && this.spawnQueue.length === 0) {
      this.waveDelay -= delta
      if (this.waveDelay <= 0) {
        this.startNextWave()
      }
    }

    // Spawn enemies from queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= delta
      if (this.spawnTimer <= 0) {
        const type = this.spawnQueue.shift()!
        this.spawnEnemy(type)
        this.spawnTimer = WAVE_SPAWN_INTERVAL
      }
    }

    // Update enemies
    for (const enemy of this.state.enemies) {
      if (!enemy.alive) continue
      updateEnemySlow(enemy, now)

      // Move along path
      const moved = this.moveEnemy(enemy, delta)
      if (moved.reachedEnd) {
        enemy.alive = false
        this.state.lives--
        addHapticFeedback('heavy')
        if (this.state.lives <= 0) {
          this.triggerGameOver()
          return
        }
      }
    }

    // Tower targeting + firing
    for (const tower of this.state.towers) {
      const stats = getTowerStats(tower.type, tower.level)
      const target = findTarget(tower, this.state.enemies, stats.range)
      if (target && canFire(tower, now, stats.fireRate)) {
        tower.lastFireTime = now
        const { projectile } = createProjectile(tower, target, this.state.nextProjectileId++)
        this.state.projectiles.push(projectile)
        addHapticFeedback('light')
      }
    }

    // Update projectiles
    for (const proj of this.state.projectiles) {
      proj.x += proj.vx
      proj.y += proj.vy

      // Check hit
      const target = this.state.enemies.find(e => e.id === proj.targetId && e.alive)
      if (target && projectileHitTarget(proj, target)) {
        this.handleProjectileHit(proj, target, now)
      } else if (isProjectileOutOfBounds(proj, GAME_W, GAME_H)) {
        proj.speed = -1 // mark for removal
      }
    }

    // Clean up dead enemies and projectiles
    this.state.enemies = this.state.enemies.filter(e => e.alive)
    this.state.projectiles = this.state.projectiles.filter(p => p.speed > 0)

    // Check wave complete
    if (this.state.waveInProgress && this.spawnQueue.length === 0 && this.state.enemies.length === 0) {
      this.state.waveInProgress = false
      this.waveDelay = WAVE_DELAY
      this.state.coins += 10 + this.state.wave * 2
    }

    // Draw
    this.drawEnemies()
    this.drawProjectiles()
    this.updateHUD()
  }

  private moveEnemy(enemy: Enemy, delta: number): { reachedEnd: boolean } {
    const speed = enemy.speed * (delta / 16) // normalize to ~60fps
    const path = this.state.path
    if (enemy.pathIndex >= path.length) return { reachedEnd: true }

    const target = path[enemy.pathIndex]
    const dx = target.x - enemy.x
    const dy = target.y - enemy.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= speed) {
      enemy.x = target.x
      enemy.y = target.y
      enemy.pathIndex++
      if (enemy.pathIndex >= path.length) return { reachedEnd: true }
      // Recurse with remaining speed
      const remaining = speed - dist
      if (remaining > 0) {
        const next = path[enemy.pathIndex]
        const ndx = next.x - enemy.x
        const ndy = next.y - enemy.y
        const ndist = Math.sqrt(ndx * ndx + ndy * ndy)
        if (ndist > 0) {
          enemy.x += (ndx / ndist) * remaining
          enemy.y += (ndy / ndist) * remaining
        }
      }
    } else {
      enemy.x += (dx / dist) * speed
      enemy.y += (dy / dist) * speed
    }
    return { reachedEnd: false }
  }

  private handleProjectileHit(proj: Projectile, target: Enemy, now: number): void {
    // Direct damage
    const killed = applyDamage(target, proj.damage)
    if (killed) {
      this.state.coins += target.reward
      this.state.score += target.reward
      this.state.enemiesDefeated++
    }

    // Splash damage
    if (proj.splashRadius > 0) {
      for (const enemy of this.state.enemies) {
        if (!enemy.alive || enemy.id === target.id) continue
        const dist = distance(target.x, target.y, enemy.x, enemy.y)
        if (dist <= proj.splashRadius) {
          applyDamage(enemy, Math.floor(proj.damage * 0.5))
        }
      }
    }

    // Chain lightning
    if (proj.chainCount > 1) {
      let chained = 0
      for (const enemy of this.state.enemies) {
        if (!enemy.alive || enemy.id === target.id || enemy.chainHit) continue
        const dist = distance(target.x, target.y, enemy.x, enemy.y)
        if (dist <= 100) {
          enemy.chainHit = true
          applyDamage(enemy, Math.floor(proj.damage * 0.3))
          chained++
          if (chained >= proj.chainCount - 1) break
        }
      }
      // Reset chain flags
      for (const e of this.state.enemies) e.chainHit = false
    }

    // Slow effect
    if (proj.slowAmount > 0) {
      applySlow(target, proj.slowAmount, proj.slowDuration, now)
    }

    // Mark projectile as hit
    proj.speed = -1
  }

  // ─── Rendering ─────────────────────────────────────────────────────

  private drawEnemies(): void {
    this.enemyGfx.clear()
    for (const enemy of this.state.enemies) {
      if (!enemy.alive) continue
      const en = ENEMY_STATS[enemy.type as keyof typeof ENEMY_STATS]
      const color = en?.color ?? 0xFFD700
      const r = enemy.radius

      // Body
      this.enemyGfx.fillStyle(color, 1)
      this.enemyGfx.fillCircle(enemy.x, enemy.y, r)

      // Boss indicator
      if (enemy.isBoss) {
        this.enemyGfx.lineStyle(3, 0xFF4444, 0.8)
        this.enemyGfx.strokeCircle(enemy.x, enemy.y, r + 3)
      }

      // Flying indicator
      if (enemy.flying) {
        this.enemyGfx.fillStyle(0xffffff, 0.3)
        this.enemyGfx.fillCircle(enemy.x, enemy.y - r - 3, 3)
      }

      // HP bar
      if (enemy.hp < enemy.maxHp) {
        const barW = r * 2
        const barH = 3
        const barX = enemy.x - barW / 2
        const barY = enemy.y - r - 8
        this.enemyGfx.fillStyle(0x333333, 0.8)
        this.enemyGfx.fillRect(barX, barY, barW, barH)
        const hpPct = Math.max(0, enemy.hp / enemy.maxHp)
        const hpColor = hpPct > 0.5 ? 0x4CAF50 : hpPct > 0.25 ? 0xFFD700 : 0xFF4444
        this.enemyGfx.fillStyle(hpColor, 1)
        this.enemyGfx.fillRect(barX, barY, barW * hpPct, barH)
      }
    }
  }

  private drawProjectiles(): void {
    this.projectileGfx.clear()
    for (const proj of this.state.projectiles) {
      if (proj.speed < 0) continue
      this.projectileGfx.fillStyle(proj.color, 1)
      this.projectileGfx.fillCircle(proj.x, proj.y, 4)
    }
  }

  // ─── Game Over ─────────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.state.isGameOver = true
    this.cameras.main.shake(300, 0.01)

    const save = loadSave()
    save.highScore = Math.max(save.highScore, this.state.score)
    save.coins = this.state.coins
    save.gamesPlayed = (save.gamesPlayed || 0) + 1
    save.totalEnemiesDefeated = (save.totalEnemiesDefeated || 0) + this.state.enemiesDefeated
    saveFull(save)

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(300)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ResultScene', {
          score: this.state.score,
          level: this.state.level,
          won: false,
          lives: this.state.lives,
          enemiesDefeated: this.state.enemiesDefeated,
          coins: this.state.coins,
        })
      })
    })
  }
}
