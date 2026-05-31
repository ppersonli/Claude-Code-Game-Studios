import Phaser from 'phaser'
import {
  type IdleGameState,
  createInitialState,
  tap,
  calculateTapIncome,
  calculateIdleIncomePerSecond,
  tickIdleIncome,
  canUnlockRecipe,
  unlockRecipe,
  selectRecipe,
  canBuyEquipment,
  buyEquipment,
  canHireStaff,
  hireStaff,
  canUnlockLocation,
  unlockLocation,
  switchLocation,
  canPrestige,
  prestige,
  getPrestigePointsForReset,
  applyOfflineEarnings,
  formatMoney,
  formatNumber,
  xpForLevel,
} from '../../logic/game-state'
import { saveGame, loadGame } from '../../logic/save'
import { RECIPES } from '../../data/recipes'
import { EQUIPMENT, getEquipmentCost } from '../../data/equipment'
import { STAFF, getStaffCost } from '../../data/staff'
import { LOCATIONS } from '../../data/locations'
import { SAVE_KEY, OFFLINE_EFFICIENCY } from '../../logic/constants'

const GAME_W = 480
const GAME_H = 854

const COLORS = {
  BG: 0x2d1b4e,
  BG_LIGHT: 0x3d2b5e,
  GOLD: 0xffd700,
  GOLD_DARK: 0xdaa520,
  GREEN: 0x4caf50,
  GREEN_DARK: 0x388e3c,
  PURPLE: 0xce93d8,
  PURPLE_DARK: 0x9c27b0,
  PINK: 0xf48fb1,
  WHITE: 0xffffff,
  RED: 0xe53935,
  TEXT_DARK: '#2d1b4e',
  TEXT_LIGHT: '#f5f0ff',
  TEXT_GOLD: '#ffd700',
  TEXT_GREEN: '#66bb6a',
  TEXT_PINK: '#f48fb1',
}

export class GameScene extends Phaser.Scene {
  state!: IdleGameState
  moneyText!: Phaser.GameObjects.Text
  ipsText!: Phaser.GameObjects.Text
  levelText!: Phaser.GameObjects.Text
  xpBar!: Phaser.GameObjects.Graphics
  tapArea!: Phaser.GameObjects.Container
  currentTab = 'brew'
  tabButtons: { name: string; btn: Phaser.GameObjects.Text }[] = []
  tabContentGroup: Phaser.GameObjects.GameObject[] = []
  floatingTexts: Phaser.GameObjects.Text[] = []
  isBrewing = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    const saved = loadGame()
    this.state = saved ?? createInitialState()

    // Apply offline earnings
    if (saved) {
      const offlineMs = Date.now() - this.state.lastSaveTime
      if (offlineMs > 5000) {
        const earned = applyOfflineEarnings(this.state, offlineMs, OFFLINE_EFFICIENCY)
        if (earned > 0) {
          this.time.delayedCall(500, () => this.showOfflinePopup(earned))
        }
      }
    }

    this.drawBackground()
    this.createStatsUI()
    this.createTapArea()
    this.createTabSystem()

    // Idle tick
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        tickIdleIncome(this.state)
        this.updateUI()
        this.updateTabContent()
      },
      callbackScope: this,
    })

    // Auto-save
    this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => saveGame(this.state),
      callbackScope: this,
    })

    this.events.on('shutdown', () => saveGame(this.state))
    this.updateUI()
  }

  // ─── Background ──────────────────────────────────────────────────────────

  private drawBackground(): void {
    const gfx = this.add.graphics()
    gfx.fillGradientStyle(0x2d1b4e, 0x2d1b4e, 0x1a0a2e, 0x1a0a2e, 1)
    gfx.fillRect(0, 0, GAME_W, GAME_H)
  }

  // ─── Stats UI (top) ──────────────────────────────────────────────────────

  private createStatsUI(): void {
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.3)
    bg.fillRoundedRect(10, 10, GAME_W - 20, 120, 16)

    this.moneyText = this.add.text(GAME_W / 2, 35, '$0', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.ipsText = this.add.text(GAME_W / 2, 65, '每秒收入: $0', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_GREEN,
    }).setOrigin(0.5)

    this.levelText = this.add.text(GAME_W / 2, 85, 'Lv.1', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_PINK,
    }).setOrigin(0.5)

    // XP bar
    this.xpBar = this.add.graphics()
    this.xpBar.setPosition(50, 105)
  }

  private updateUI(): void {
    this.moneyText.setText('$' + formatMoney(this.state.money))
    this.ipsText.setText('每秒收入: $' + formatMoney(calculateIdleIncomePerSecond(this.state)))
    this.levelText.setText('Lv.' + this.state.level)

    // XP bar
    this.xpBar.clear()
    const required = xpForLevel(this.state.level + 1) * 10
    const progress = Math.min(1, this.state.totalEarned / required)
    this.xpBar.fillStyle(0x333333, 1)
    this.xpBar.fillRoundedRect(0, 0, 380, 8, 4)
    this.xpBar.fillStyle(COLORS.PURPLE, 1)
    this.xpBar.fillRoundedRect(0, 0, Math.max(1, 380 * progress), 8, 4)
  }

  // ─── Tap Area ────────────────────────────────────────────────────────────

  private createTapArea(): void {
    this.tapArea = this.add.container(GAME_W / 2, 300)

    // Cup body
    const cupGfx = this.add.graphics()
    cupGfx.fillStyle(0xffffff, 0.1)
    cupGfx.fillRoundedRect(-60, -80, 120, 160, 20)
    cupGfx.lineStyle(3, COLORS.PURPLE, 0.6)
    cupGfx.strokeRoundedRect(-60, -80, 120, 160, 20)
    this.tapArea.add(cupGfx)

    // Tea emoji
    const teaText = this.add.text(0, -10, '🧋', {
      fontSize: '56px',
    }).setOrigin(0.5)
    this.tapArea.add(teaText)

    // Tap instruction
    const tapLabel = this.add.text(0, 60, '点击制作!', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_LIGHT,
    }).setOrigin(0.5)
    this.tapArea.add(tapLabel)

    // Income per tap
    const incomeLabel = this.add.text(0, 80, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_GOLD,
    }).setOrigin(0.5)
    this.tapArea.add(incomeLabel)
    this.tapArea.setData('incomeLabel', incomeLabel)

    // Tap zone
    const zone = this.add.zone(0, 0, 140, 180).setInteractive()
    zone.on('pointerdown', () => this.handleTap())
    this.tapArea.add(zone)
  }

  private handleTap(): void {
    const income = tap(this.state)

    // Bounce tween
    this.tweens.add({
      targets: this.tapArea,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    })

    // Coin particle
    this.spawnCoinParticle(GAME_W / 2, 250, '+' + formatMoney(income))
    this.updateUI()
    this.updateTabContent()
  }

  private spawnCoinParticle(x: number, y: number, text: string): void {
    const popup = this.add.text(x + (Math.random() - 0.5) * 60, y, text, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_GOLD,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: popup,
      y: y - 80,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    })
  }

  private showOfflinePopup(amount: number): void {
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.fillRect(0, 0, GAME_W, GAME_H)
    bg.setDepth(200)

    const panel = this.add.graphics()
    panel.fillStyle(0x3d2b5e, 1)
    panel.fillRoundedRect(GAME_W / 2 - 140, GAME_H / 2 - 60, 280, 120, 16)
    panel.setDepth(201)

    const title = this.add.text(GAME_W / 2, GAME_H / 2 - 30, '🌙 离线收益', {
      fontSize: '20px', fontFamily: 'Arial', color: COLORS.TEXT_GOLD, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(202)

    const earned = this.add.text(GAME_W / 2, GAME_H / 2 + 10, '+$' + formatMoney(amount), {
      fontSize: '28px', fontFamily: 'Arial', color: COLORS.TEXT_GREEN, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(202)

    const tapText = this.add.text(GAME_W / 2, GAME_H / 2 + 45, '点击继续', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS.TEXT_LIGHT,
    }).setOrigin(0.5).setDepth(202)

    bg.setInteractive().on('pointerdown', () => {
      bg.destroy(); panel.destroy(); title.destroy(); earned.destroy(); tapText.destroy()
    })
  }

  // ─── Tab System ──────────────────────────────────────────────────────────

  private createTabSystem(): void {
    const tabNames = ['brew', 'recipes', 'equipment', 'staff', 'location', 'prestige']
    const tabLabels = ['☕ 制作', '📖 配方', '🔧 设备', '👥 员工', '📍 分店', '⭐ 转生']
    const tabY = 440

    const tabBg = this.add.graphics()
    tabBg.fillStyle(0x000000, 0.3)
    tabBg.fillRect(0, tabY - 5, GAME_W, 45)

    const btnWidth = GAME_W / tabNames.length
    tabNames.forEach((name, i) => {
      const x = btnWidth * i + btnWidth / 2
      const btn = this.add.text(x, tabY + 15, tabLabels[i], {
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        color: '#9e9e9e',
      }).setOrigin(0.5).setInteractive()

      btn.on('pointerdown', () => this.switchTab(name))
      this.tabButtons.push({ name, btn })
    })

    this.switchTab('brew')
  }

  private switchTab(tabName: string): void {
    this.currentTab = tabName
    // Clear old content
    this.tabContentGroup.forEach(obj => (obj as Phaser.GameObjects.GameObject).destroy?.())
    this.tabContentGroup = []

    // Highlight active tab
    this.tabButtons.forEach(({ name, btn }) => {
      btn.setColor(name === tabName ? '#ffd700' : '#9e9e9e')
      btn.setFontSize(name === tabName ? '12px' : '11px')
    })

    switch (tabName) {
      case 'brew': this.buildBrewTab(); break
      case 'recipes': this.buildRecipesTab(); break
      case 'equipment': this.buildEquipmentTab(); break
      case 'staff': this.buildStaffTab(); break
      case 'location': this.buildLocationTab(); break
      case 'prestige': this.buildPrestigeTab(); break
    }
  }

  private addToTab(obj: Phaser.GameObjects.GameObject): void {
    this.tabContentGroup.push(obj)
  }

  private updateTabContent(): void {
    this.switchTab(this.currentTab)
  }

  // ─── Brew Tab ────────────────────────────────────────────────────────────

  private buildBrewTab(): void {
    let y = 500
    const style = { fontSize: '14px', fontFamily: 'Arial', color: COLORS.TEXT_LIGHT }
    const small = { fontSize: '12px', fontFamily: 'Arial', color: '#9e9e9e' }

    const recipe = RECIPES.find(r => r.id === this.state.selectedRecipe) ?? RECIPES[0]
    this.addToTab(this.add.text(GAME_W / 2, y, `当前配方: ${recipe.emoji} ${recipe.name}`, { ...style, color: COLORS.TEXT_GOLD } as any).setOrigin(0.5))
    y += 30

    const ips = calculateIdleIncomePerSecond(this.state)
    const ipt = calculateTapIncome(this.state)
    this.addToTab(this.add.text(GAME_W / 2, y, `每次点击: $${formatMoney(ipt)}  |  每秒: $${formatMoney(ips)}`, small as any).setOrigin(0.5))
    y += 25

    this.addToTab(this.add.text(GAME_W / 2, y, `总产出: $${formatMoney(this.state.totalEarned)}  |  点击: ${formatNumber(this.state.totalTaps)}`, small as any).setOrigin(0.5))
    y += 30

    // Staff summary
    const staffCps = Object.entries(this.state.staffCounts).filter(([, v]) => v > 0)
    if (staffCps.length > 0) {
      this.addToTab(this.add.text(20, y, '员工:', style as any))
      y += 22
      for (const [id, count] of staffCps) {
        const s = STAFF.find(st => st.id === id)
        if (s) {
          this.addToTab(this.add.text(30, y, `${s.emoji} ${s.name} x${count} (${(s.cupsPerSecond * count).toFixed(1)}/s)`, small as any))
          y += 18
        }
      }
    }
  }

  // ─── Recipes Tab ─────────────────────────────────────────────────────────

  private buildRecipesTab(): void {
    let y = 500
    const title = { fontSize: '14px', fontFamily: 'Arial', color: COLORS.TEXT_GOLD }
    const item = { fontSize: '12px', fontFamily: 'Arial', color: COLORS.TEXT_LIGHT }

    this.addToTab(this.add.text(GAME_W / 2, y, '📖 解锁新配方', title as any).setOrigin(0.5))
    y += 30

    for (const recipe of RECIPES) {
      const unlocked = this.state.unlockedRecipes.includes(recipe.id)
      const selected = this.state.selectedRecipe === recipe.id
      const canBuy = canUnlockRecipe(this.state, recipe.id)

      const label = unlocked
        ? `${recipe.emoji} ${recipe.name} ($${recipe.basePrice}/杯) ${selected ? '✅' : ''}`
        : `${recipe.emoji} ${recipe.name} 🔒 Lv.${recipe.unlockLevel} $${formatMoney(recipe.unlockCost)}`

      const color = selected ? '#ffd700' : unlocked ? '#66bb6a' : canBuy ? '#f48fb1' : '#666'
      const text = this.add.text(GAME_W / 2, y, label, { ...item, color } as any).setOrigin(0.5)

      if (unlocked && !selected) {
        text.setInteractive()
        text.on('pointerdown', () => { selectRecipe(this.state, recipe.id); this.updateUI(); this.updateTabContent() })
      } else if (canBuy) {
        text.setInteractive()
        text.on('pointerdown', () => { unlockRecipe(this.state, recipe.id); this.updateUI(); this.updateTabContent() })
      }

      this.addToTab(text)
      y += 28
    }
  }

  // ─── Equipment Tab ───────────────────────────────────────────────────────

  private buildEquipmentTab(): void {
    let y = 500
    const title = { fontSize: '14px', fontFamily: 'Arial', color: COLORS.TEXT_GOLD }
    const item = { fontSize: '12px', fontFamily: 'Arial', color: COLORS.TEXT_LIGHT }

    const mult = (1 + Object.entries(this.state.equipmentLevels).reduce((s, [id, lvl]) => {
      const eq = EQUIPMENT.find(e => e.id === id)
      return s + (eq ? lvl * eq.speedBonus : 0)
    }, 0)).toFixed(2)

    this.addToTab(this.add.text(GAME_W / 2, y, `🔧 设备 (速度 x${mult})`, title as any).setOrigin(0.5))
    y += 30

    for (const eq of EQUIPMENT) {
      const lvl = this.state.equipmentLevels[eq.id] || 0
      const maxed = lvl >= eq.maxLevel
      const cost = maxed ? 0 : getEquipmentCost(eq, lvl)
      const canBuy = canBuyEquipment(this.state, eq.id)

      const label = maxed
        ? `${eq.emoji} ${eq.name} Lv.${lvl} MAX`
        : `${eq.emoji} ${eq.name} Lv.${lvl} → $${formatMoney(cost)}`

      const color = maxed ? '#ffd700' : canBuy ? '#66bb6a' : '#666'
      const text = this.add.text(GAME_W / 2, y, label, { ...item, color } as any).setOrigin(0.5)

      if (!maxed) {
        text.setInteractive()
        text.on('pointerdown', () => { buyEquipment(this.state, eq.id); this.updateUI(); this.updateTabContent() })
      }

      this.addToTab(text)
      y += 28
    }
  }

  // ─── Staff Tab ───────────────────────────────────────────────────────────

  private buildStaffTab(): void {
    let y = 500
    const title = { fontSize: '14px', fontFamily: 'Arial', color: COLORS.TEXT_GOLD }
    const item = { fontSize: '12px', fontFamily: 'Arial', color: COLORS.TEXT_LIGHT }

    const totalCps = Object.entries(this.state.staffCounts).reduce((s, [id, count]) => {
      const st = STAFF.find(st2 => st2.id === id)
      return s + (st ? count * st.cupsPerSecond : 0)
    }, 0)

    this.addToTab(this.add.text(GAME_W / 2, y, `👥 员工 (${totalCps.toFixed(1)} 杯/秒)`, title as any).setOrigin(0.5))
    y += 30

    for (const staff of STAFF) {
      const owned = this.state.staffCounts[staff.id] || 0
      const cost = getStaffCost(staff, owned)
      const canBuy = canHireStaff(this.state, staff.id)

      const label = `${staff.emoji} ${staff.name} x${owned} ($${formatMoney(cost)}) +${staff.cupsPerSecond}/s`
      const color = canBuy ? '#66bb6a' : '#666'
      const text = this.add.text(GAME_W / 2, y, label, { ...item, color } as any).setOrigin(0.5)

      text.setInteractive()
      text.on('pointerdown', () => { hireStaff(this.state, staff.id); this.updateUI(); this.updateTabContent() })

      this.addToTab(text)
      y += 28
    }
  }

  // ─── Location Tab ────────────────────────────────────────────────────────

  private buildLocationTab(): void {
    let y = 500
    const title = { fontSize: '14px', fontFamily: 'Arial', color: COLORS.TEXT_GOLD }
    const item = { fontSize: '12px', fontFamily: 'Arial', color: COLORS.TEXT_LIGHT }

    const curLoc = LOCATIONS.find(l => l.id === this.state.currentLocation) ?? LOCATIONS[0]
    this.addToTab(this.add.text(GAME_W / 2, y, `📍 当前: ${curLoc.emoji} ${curLoc.name} (x${curLoc.incomeMultiplier})`, title as any).setOrigin(0.5))
    y += 30

    for (const loc of LOCATIONS) {
      const unlocked = this.state.unlockedLocations.includes(loc.id)
      const isCurrent = this.state.currentLocation === loc.id
      const canBuy = canUnlockLocation(this.state, loc.id)

      let label: string
      let color: string

      if (isCurrent) {
        label = `${loc.emoji} ${loc.name} x${loc.incomeMultiplier} ← 当前`
        color = '#ffd700'
      } else if (unlocked) {
        label = `${loc.emoji} ${loc.name} x${loc.incomeMultiplier}`
        color = '#66bb6a'
      } else {
        label = `${loc.emoji} ${loc.name} x${loc.incomeMultiplier} 🔒 Lv.${loc.requiredLevel} $${formatMoney(loc.unlockCost)}`
        color = canBuy ? '#f48fb1' : '#666'
      }

      const text = this.add.text(GAME_W / 2, y, label, { ...item, color } as any).setOrigin(0.5)

      if (unlocked && !isCurrent) {
        text.setInteractive()
        text.on('pointerdown', () => { switchLocation(this.state, loc.id); this.updateUI(); this.updateTabContent() })
      } else if (canBuy) {
        text.setInteractive()
        text.on('pointerdown', () => { unlockLocation(this.state, loc.id); this.updateUI(); this.updateTabContent() })
      }

      this.addToTab(text)
      y += 28
    }
  }

  // ─── Prestige Tab ────────────────────────────────────────────────────────

  private buildPrestigeTab(): void {
    let y = 500
    const title = { fontSize: '14px', fontFamily: 'Arial', color: COLORS.TEXT_GOLD }
    const item = { fontSize: '12px', fontFamily: 'Arial', color: COLORS.TEXT_LIGHT }

    this.addToTab(this.add.text(GAME_W / 2, y, '⭐ 转生系统', title as any).setOrigin(0.5))
    y += 30

    this.addToTab(this.add.text(GAME_W / 2, y, `转生次数: ${this.state.prestigeCount}`, { ...item, color: COLORS.TEXT_PINK } as any).setOrigin(0.5))
    y += 22
    this.addToTab(this.add.text(GAME_W / 2, y, `当前倍率: x${this.state.prestigeMultiplier.toFixed(2)}`, { ...item, color: COLORS.TEXT_PINK } as any).setOrigin(0.5))
    y += 30

    const points = getPrestigePointsForReset(this.state)
    const can = canPrestige(this.state)

    this.addToTab(this.add.text(GAME_W / 2, y, `转生可获得: ${points} 点`, { ...item, color: can ? COLORS.TEXT_GOLD : '#666' } as any).setOrigin(0.5))
    y += 22
    this.addToTab(this.add.text(GAME_W / 2, y, `需要: $${formatMoney(1000000)} 总收入`, { ...item, color: '#666' } as any).setOrigin(0.5))
    y += 35

    if (can) {
      const btnGfx = this.add.graphics()
      btnGfx.fillStyle(COLORS.PURPLE_DARK, 1)
      btnGfx.fillRoundedRect(GAME_W / 2 - 100, y, 200, 40, 12)
      this.addToTab(btnGfx)

      const btnText = this.add.text(GAME_W / 2, y + 20, `⭐ 转生 (+${points} 点)`, {
        fontSize: '16px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive()

      btnText.on('pointerdown', () => {
        prestige(this.state)
        this.updateUI()
        this.updateTabContent()
      })
      this.addToTab(btnText)
    }
  }
}
