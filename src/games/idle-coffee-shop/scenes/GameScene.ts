import Phaser from 'phaser'
import { RECIPES } from '../data/recipes'
import { EQUIPMENT } from '../data/equipment'
import { EMPLOYEES } from '../data/employees'
import {
  type GameState,
  xpForLevel,
  formatMoney,
  formatNumber,
  getEarningsPerClick,
  getEarningsPerSecond,
  getUpgradeCost,
  getEmployeeCost,
  makeCoffee,
  upgradeEquipment,
  hireEmployee,
  doPrestige,
  resetGame,
  autoBrew,
  calculateOfflineEarnings,
  selectRecipe,
  loadGameState,
  saveGameState,
} from '../composables/useGameLogic'
import { AdManager } from '../../../services/AdManager'
import { checkCafeAchievements, type CafeStats } from '../composables/useMeta'
import { fadeIn, addHapticFeedback } from '../../../shared/utils/poki-polish'


const GAME_W = 480
const GAME_H = 854

const COLORS = {
  BG_TOP: 0x8b4513,
  BG_MID: 0xd2691e,
  BG_BOT: 0xdeb887,
  COFFEE: 0x3e2723,
  COFFEE_LIGHT: 0x5d4037,
  FOAM: 0xfff8e1,
  GOLD: 0xffd700,
  GOLD_DARK: 0xdaa520,
  GREEN: 0x4caf50,
  GREEN_DARK: 0x388e3c,
  RED: 0xe53935,
  RED_DARK: 0xb71c1c,
  BLUE: 0x42a5f5,
  BLUE_DARK: 0x1565c0,
  UI_BG: 0xffecb3,
  UI_BG_DARK: 0xffd54f,
  WHITE: 0xffffff,
  CREAM: 0xfff8e1,
  SHADOW: 0x3e2723,
  TEXT_DARK: '#3e2723',
  TEXT_LIGHT: '#fff8e1',
  TEXT_GOLD: '#ffd700',
}

export class GameScene extends Phaser.Scene {
  state!: GameState
  moneyText!: Phaser.GameObjects.Text
  levelText!: Phaser.GameObjects.Text
  xpBar!: Phaser.GameObjects.Graphics
  xpText!: Phaser.GameObjects.Text
  recipeText!: Phaser.GameObjects.Text
  autoText!: Phaser.GameObjects.Text
  prestigeText!: Phaser.GameObjects.Text
  tapText!: Phaser.GameObjects.Text
  cupContainer!: Phaser.GameObjects.Container
  cupGfx!: Phaser.GameObjects.Graphics
  steamParts: Phaser.GameObjects.Graphics[] = []
  isBrewing = false
  currentTab = 'brew'
  tabButtons: { name: string; btn: Phaser.GameObjects.Text }[] = []
  tabContentGroup: Phaser.GameObjects.GameObject[] = []

  // Meta state
  private META_KEY = 'idle-coffee-shop-meta'
  private metaCoins = 0
  private metaUnlockedThemes: string[] = ['classic']
  private metaAchievements: string[] = []
  private metaStats: CafeStats = {
    totalCups: 0, totalClicks: 0, totalEarned: 0, highestLevel: 0,
    prestigeCount: 0, employeesHired: 0, recipesUnlocked: 0,
    themesUnlocked: 1, dailyCompleted: 0, gamesPlayed: 0,
  }
  private metaLastDaily = ''

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.state = loadGameState()
    calculateOfflineEarnings(this.state)
    this.loadMeta()
    this.metaStats.gamesPlayed++
    this.drawBackground()
    this.createMainUI()
    this.createCoffeeCup()
    this.createTabSystem()

    this.time.addEvent({ delay: 1000, callback: () => { autoBrew(this.state); this.metaStats.totalCups += Math.max(1, Math.floor(this.state.totalCups / 100)); this.checkAchievements(); this.updateUI(); this.switchTab(this.currentTab) }, callbackScope: this, loop: true })
    this.time.addEvent({ delay: 10000, callback: () => saveGameState(this.state), callbackScope: this, loop: true })
    this.events.on('shutdown', () => saveGameState(this.state))

    this.updateUI()
    this.updateTabContent()
  }

  drawBackground() {
    const gfx = this.add.graphics()
    for (let y = 0; y < GAME_H; y++) {
      const t = y / GAME_H
      let r: number, g: number, b: number
      if (t < 0.5) {
        const t2 = t * 2
        r = Math.floor(0x8b + t2 * (0xd2 - 0x8b))
        g = Math.floor(0x45 + t2 * (0x69 - 0x45))
        b = Math.floor(0x13 + t2 * (0x1e - 0x13))
      } else {
        const t2 = (t - 0.5) * 2
        r = Math.floor(0xd2 + t2 * (0xde - 0xd2))
        g = Math.floor(0x69 + t2 * (0xb8 - 0x69))
        b = Math.floor(0x1e + t2 * (0x87 - 0x1e))
      }
      gfx.fillStyle((r << 16) | (g << 8) | b, 1)
      gfx.fillRect(0, y, GAME_W, 1)
    }
  }

  createMainUI() {
    this.add.text(GAME_W / 2, 20, '☕ Idle Coffee Shop', {
      fontSize: '22px', fontFamily: 'Arial', color: '#FFF8E1',
      stroke: '#3E2723', strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5)

    this.moneyText = this.add.text(GAME_W / 2, 55, '$0', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#FFD700', stroke: '#3E2723', strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5)

    this.levelText = this.add.text(20, 85, 'Lv.1', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFF8E1',
      stroke: '#3E2723', strokeThickness: 2
    })

    this.add.graphics().fillStyle(0x3e2723, 0.5).fillRoundedRect(80, 82, 200, 16, 8)

    this.xpBar = this.add.graphics()

    this.xpText = this.add.text(180, 90, '0/50 XP', {
      fontSize: '11px', fontFamily: 'Arial', color: '#FFF8E1'
    }).setOrigin(0.5)

    this.prestigeText = this.add.text(GAME_W - 20, 85, '', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FFD700',
      stroke: '#3E2723', strokeThickness: 2
    }).setOrigin(1, 0)

    this.autoText = this.add.text(GAME_W / 2, 110, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#A5D6A7',
      stroke: '#1B5E20', strokeThickness: 1
    }).setOrigin(0.5)

    this.recipeText = this.add.text(GAME_W / 2, 128, 'Americano — $1', {
      fontSize: '13px', fontFamily: 'Arial', color: '#FFF8E1',
      stroke: '#3E2723', strokeThickness: 1
    }).setOrigin(0.5)
  }

  createCoffeeCup() {
    this.cupContainer = this.add.container(GAME_W / 2, 330)

    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.2)
    shadow.fillEllipse(0, 80, 120, 20)
    this.cupContainer.add(shadow)

    const cupGfx = this.add.graphics()
    cupGfx.fillStyle(0xffffff, 1)
    cupGfx.fillRoundedRect(-45, -40, 90, 85, 12)
    cupGfx.fillStyle(0xf5f5f5, 1)
    cupGfx.fillRoundedRect(-50, -45, 100, 15, 8)
    cupGfx.fillStyle(COLORS.COFFEE, 1)
    cupGfx.fillRoundedRect(-40, -25, 80, 55, 8)
    cupGfx.fillStyle(COLORS.FOAM, 1)
    cupGfx.fillRoundedRect(-38, -25, 76, 12, 6)
    cupGfx.lineStyle(6, 0xffffff, 1)
    cupGfx.strokeCircle(55, 10, 18)
    cupGfx.fillStyle(0x3e2723, 1)
    cupGfx.fillCircle(-15, 5, 5)
    cupGfx.fillCircle(15, 5, 5)
    cupGfx.fillStyle(0xffffff, 1)
    cupGfx.fillCircle(-13, 3, 2)
    cupGfx.fillCircle(17, 3, 2)
    cupGfx.lineStyle(3, 0x3e2723, 1)
    cupGfx.beginPath()
    cupGfx.arc(0, 15, 10, 0.1, Math.PI - 0.1, false)
    cupGfx.strokePath()
    cupGfx.fillStyle(0xffab91, 0.5)
    cupGfx.fillCircle(-28, 12, 6)
    cupGfx.fillCircle(28, 12, 6)

    this.cupContainer.add(cupGfx)
    this.cupGfx = cupGfx

    this.steamParts = []
    for (let i = 0; i < 3; i++) {
      const steam = this.add.graphics()
      steam.fillStyle(0xffffff, 0.3)
      steam.fillCircle(0, 0, 4 + i * 2)
      steam.setPosition(-15 + i * 15, -55)
      steam.setAlpha(0)
      this.cupContainer.add(steam)
      this.steamParts.push(steam)
    }

    this.tapText = this.add.text(GAME_W / 2, 410, '✨ Tap to Brew! ✨', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFF8E1',
      stroke: '#3E2723', strokeThickness: 2
    }).setOrigin(0.5)

    this.tweens.add({ targets: this.tapText, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    this.cupContainer.setSize(120, 100)
    this.cupContainer.setInteractive()
    this.cupContainer.on('pointerdown', () => this.handleMakeCoffee())

    this.time.addEvent({ delay: 600, callback: this.animateSteam, callbackScope: this, loop: true })
    this.tweens.add({ targets: this.cupContainer, y: 335, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }

  animateSteam() {
    this.steamParts.forEach((steam, i) => {
      steam.setAlpha(0)
      this.tweens.add({
        targets: steam,
        y: steam.y - 30 - i * 10,
        alpha: { from: 0.4, to: 0 },
        duration: 1200 + i * 200,
        delay: i * 200,
        onComplete: () => { steam.y = -55 }
      })
    })
  }

  createTabSystem() {
    const tabY = 445
    const tabNames = ['brew', 'upgrade', 'staff', 'recipes', 'prestige']
    const tabLabels = ['☕ Brew', '🔧 Upgrades', '👥 Staff', '📖 Recipes', '⭐ Prestige']
    const tabWidth = GAME_W / tabNames.length

    const tabBg = this.add.graphics()
    tabBg.fillStyle(0x3e2723, 0.8)
    tabBg.fillRoundedRect(5, tabY - 2, GAME_W - 10, 28, 8)

    tabNames.forEach((name, i) => {
      const btn = this.add.text(5 + tabWidth * i + tabWidth / 2, tabY + 12, tabLabels[i], {
        fontSize: '11px', fontFamily: 'Arial', color: '#D7CCC8',
      }).setOrigin(0.5).setInteractive()
      btn.on('pointerdown', () => this.switchTab(name))
      this.tabButtons.push({ name, btn })
    })

    const contentBg = this.add.graphics()
    contentBg.fillStyle(0x3e2723, 0.4)
    contentBg.fillRoundedRect(10, 478, GAME_W - 20, 360, 10)

    this.switchTab('brew')
  }

  switchTab(tabName: string) {
    this.currentTab = tabName
    this.tabButtons.forEach(t => {
      t.btn.setColor(t.name === tabName ? '#FFD700' : '#D7CCC8')
      t.btn.setFontSize(t.name === tabName ? 12 : 11)
    })
    if (this.tabContentGroup) {
      this.tabContentGroup.forEach(obj => obj.destroy())
    }
    this.tabContentGroup = []
    switch (tabName) {
      case 'brew': this.buildBrewTab(); break
      case 'upgrade': this.buildUpgradeTab(); break
      case 'staff': this.buildStaffTab(); break
      case 'recipes': this.buildRecipesTab(); break
      case 'prestige': this.buildPrestigeTab(); break
    }
  }

  addToTab<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.tabContentGroup.push(obj)
    return obj
  }

  buildBrewTab() {
    let y = 490
    const style = { fontSize: '14px', fontFamily: 'Arial', color: '#FFF8E1', wordWrap: { width: GAME_W - 40 } }
    const smallStyle = { fontSize: '12px', fontFamily: 'Arial', color: '#BCAAA4' }

    this.addToTab(this.add.text(GAME_W / 2, y, '☕ Your Coffee Shop', style).setOrigin(0.5)); y += 28
    const eps = getEarningsPerSecond(this.state)
    const epc = getEarningsPerClick(this.state)
    this.addToTab(this.add.text(GAME_W / 2, y, 'Per click: ' + formatMoney(epc) + '  |  Auto: ' + formatMoney(eps) + '/s', { fontSize: '12px', fontFamily: 'Arial', color: '#A5D6A7' }).setOrigin(0.5)); y += 25
    this.addToTab(this.add.text(GAME_W / 2, y, 'Total earned: ' + formatMoney(this.state.totalEarned) + '  |  Cups: ' + formatNumber(this.state.totalCups), smallStyle).setOrigin(0.5)); y += 30
    this.addToTab(this.add.text(20, y, 'Equipment:', style)); y += 22
    for (const [, data] of Object.entries(EQUIPMENT)) {
      const lvl = this.state.equipment[data.id] || 0
      this.addToTab(this.add.text(30, y, data.name + ': Lv.' + lvl + '/' + data.maxLevel, smallStyle)); y += 18
    }
    y += 10
    this.addToTab(this.add.text(20, y, 'Employees:', style)); y += 22
    let hasEmployees = false
    for (const [, data] of Object.entries(EMPLOYEES)) {
      const count = this.state.employees[data.id] || 0
      if (count > 0) {
        hasEmployees = true
        this.addToTab(this.add.text(30, y, data.name + ': ' + count + ' (' + (data.cupsPerSec * count) + ' cups/s)', smallStyle)); y += 18
      }
    }
    if (!hasEmployees) this.addToTab(this.add.text(30, y, 'None yet — hire from Staff tab!', smallStyle))

    // Rewarded ad: free cash
    y = 760
    const rewardBtn = this.add.graphics()
    rewardBtn.fillStyle(0xe056fd, 1)
    rewardBtn.fillRoundedRect(GAME_W / 2 - 70, y, 140, 32, 8)
    this.addToTab(rewardBtn)
    const rewardLabel = this.add.text(GAME_W / 2, y + 16, '🎬 Free Cash', { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setInteractive()
    rewardLabel.on('pointerdown', async () => {
      const adManager = AdManager.getInstance()
      const success = await adManager.requestRewardedAd()
      if (success) {
        const bonus = Math.max(50, Math.floor(this.state.money * 0.1))
        this.state.money += bonus
        this.state.totalEarned += bonus
        saveGameState(this.state)
        this.updateUI()
        this.switchTab(this.currentTab)
        this.spawnMoneyPopup(GAME_W / 2, y, '+' + formatMoney(bonus))
      }
    })
    this.addToTab(rewardLabel)

    y = 800
    const brewBtn = this.add.graphics()
    brewBtn.fillStyle(COLORS.GREEN, 1)
    brewBtn.fillRoundedRect(GAME_W / 2 - 70, y, 140, 36, 18)
    brewBtn.fillStyle(COLORS.GREEN_DARK, 0.3)
    brewBtn.fillRoundedRect(GAME_W / 2 - 70, y + 18, 140, 18, { tl: 0, tr: 0, bl: 18, br: 18 })
    this.addToTab(brewBtn)
    const brewLabel = this.add.text(GAME_W / 2, y + 18, '☕ BREW!', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setInteractive()
    brewLabel.on('pointerdown', () => this.handleMakeCoffee())
    this.addToTab(brewLabel)
  }

  buildUpgradeTab() {
    let y = 490
    const titleStyle = { fontSize: '14px', fontFamily: 'Arial', color: '#FFD700' }
    const itemStyle = { fontSize: '12px', fontFamily: 'Arial', color: '#FFF8E1' }

    this.addToTab(this.add.text(GAME_W / 2, y, '🔧 Equipment Upgrades', titleStyle).setOrigin(0.5)); y += 25
    for (const [key, data] of Object.entries(EQUIPMENT)) {
      const lvl = this.state.equipment[key] || 0
      const maxed = lvl >= data.maxLevel
      const cost = maxed ? 0 : getUpgradeCost(key, this.state)
      const canAfford = this.state.money >= cost
      const bar = this.add.graphics()
      bar.fillStyle(maxed ? 0x2e7d32 : (canAfford ? 0x4e342e : 0x3e2723), 0.7)
      bar.fillRoundedRect(15, y, GAME_W - 30, 48, 8)
      this.addToTab(bar)
      this.addToTab(this.add.text(25, y + 5, data.name + '  Lv.' + lvl + '/' + data.maxLevel, itemStyle))
      this.addToTab(this.add.text(25, y + 22, maxed ? '✅ MAX LEVEL' : ('Effect: +' + Math.round(data.effectPerLevel * 100) + '% per level'), { fontSize: '10px', fontFamily: 'Arial', color: maxed ? '#A5D6A7' : '#BCAAA4' }))
      if (!maxed) {
        const btnGfx = this.add.graphics()
        btnGfx.fillStyle(canAfford ? COLORS.GREEN : 0x757575, 1)
        btnGfx.fillRoundedRect(GAME_W - 105, y + 8, 80, 32, 8)
        this.addToTab(btnGfx)
        const btnText = this.add.text(GAME_W - 65, y + 24, formatMoney(cost), { fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setInteractive()
        if (canAfford) btnText.on('pointerdown', () => { upgradeEquipment(key, this.state); saveGameState(this.state); this.updateUI(); this.switchTab(this.currentTab) })
        this.addToTab(btnText)
      }
      y += 55
    }
  }

  buildStaffTab() {
    let y = 490
    const titleStyle = { fontSize: '14px', fontFamily: 'Arial', color: '#FFD700' }
    const itemStyle = { fontSize: '12px', fontFamily: 'Arial', color: '#FFF8E1' }

    this.addToTab(this.add.text(GAME_W / 2, y, '👥 Hire Employees', titleStyle).setOrigin(0.5)); y += 25
    for (const [key, data] of Object.entries(EMPLOYEES)) {
      const count = this.state.employees[key] || 0
      const unlocked = this.state.level >= data.unlockLevel
      const maxed = count >= data.maxCount
      const cost = maxed ? 0 : getEmployeeCost(key, this.state)
      const canAfford = this.state.money >= cost
      const bar = this.add.graphics()
      bar.fillStyle(!unlocked ? 0x333333 : (maxed ? 0x2e7d32 : 0x4e342e), 0.7)
      bar.fillRoundedRect(15, y, GAME_W - 30, 48, 8)
      this.addToTab(bar)
      this.addToTab(this.add.text(25, y + 5, data.name + '  (' + count + '/' + data.maxCount + ')', itemStyle))
      if (!unlocked) {
        this.addToTab(this.add.text(25, y + 22, '🔒 Unlocks at Lv.' + data.unlockLevel, { fontSize: '10px', fontFamily: 'Arial', color: '#9E9E9E' }))
      } else if (maxed) {
        this.addToTab(this.add.text(25, y + 22, '✅ MAX HIRED  |  +' + data.cupsPerSec + ' cups/s each', { fontSize: '10px', fontFamily: 'Arial', color: '#A5D6A7' }))
      } else {
        this.addToTab(this.add.text(25, y + 22, '+' + data.cupsPerSec + ' cups/sec each', { fontSize: '10px', fontFamily: 'Arial', color: '#BCAAA4' }))
        const btnGfx = this.add.graphics()
        btnGfx.fillStyle(canAfford ? COLORS.GREEN : 0x757575, 1)
        btnGfx.fillRoundedRect(GAME_W - 105, y + 8, 80, 32, 8)
        this.addToTab(btnGfx)
        const btnText = this.add.text(GAME_W - 65, y + 24, formatMoney(cost), { fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setInteractive()
        if (canAfford) btnText.on('pointerdown', () => { hireEmployee(key, this.state); saveGameState(this.state); this.updateUI(); this.switchTab(this.currentTab) })
        this.addToTab(btnText)
      }
      y += 55
    }
  }

  buildRecipesTab() {
    let y = 490
    const titleStyle = { fontSize: '14px', fontFamily: 'Arial', color: '#FFD700' }
    const itemStyle = { fontSize: '12px', fontFamily: 'Arial', color: '#FFF8E1' }

    this.addToTab(this.add.text(GAME_W / 2, y, '📖 Coffee Recipes', titleStyle).setOrigin(0.5)); y += 25
    for (const [key, data] of Object.entries(RECIPES)) {
      const unlocked = this.state.recipes.includes(key)
      const isSelected = this.state.selectedRecipe === key
      const bar = this.add.graphics()
      bar.fillStyle(isSelected ? 0x4e342e : (unlocked ? 0x3e2723 : 0x222222), 0.7)
      bar.fillRoundedRect(15, y, GAME_W - 30, 36, 6)
      if (isSelected) { bar.lineStyle(2, COLORS.GOLD, 1); bar.strokeRoundedRect(15, y, GAME_W - 30, 36, 6) }
      this.addToTab(bar)
      if (unlocked) {
        const label = (isSelected ? '▸ ' : '') + data.name + ' — ' + formatMoney(data.price) + ' (' + (data.time / 1000) + 's)' + (data.type === 'cold' ? ' 🧊' : '')
        const txt = this.add.text(25, y + 18, label, itemStyle).setOrigin(0, 0.5)
        if (!isSelected) { txt.setInteractive(); txt.on('pointerdown', () => { selectRecipe(key, this.state); this.switchTab('recipes'); this.updateUI() }) }
        this.addToTab(txt)
      } else {
        const isSpecial = data.unlockLevel === 99
        this.addToTab(this.add.text(25, y + 18, isSpecial ? '🔒 Special — Prestige to unlock' : '🔒 Unlocks at Lv.' + data.unlockLevel, { fontSize: '11px', fontFamily: 'Arial', color: '#757575' }).setOrigin(0, 0.5))
      }
      y += 40
    }
  }

  buildPrestigeTab() {
    let y = 490
    const titleStyle = { fontSize: '14px', fontFamily: 'Arial', color: '#FFD700' }
    const style = { fontSize: '13px', fontFamily: 'Arial', color: '#FFF8E1' }
    const smallStyle = { fontSize: '11px', fontFamily: 'Arial', color: '#BCAAA4' }

    this.addToTab(this.add.text(GAME_W / 2, y, '⭐ Prestige System', titleStyle).setOrigin(0.5)); y += 30
    this.addToTab(this.add.text(GAME_W / 2, y, 'Total earned: ' + formatMoney(this.state.totalEarned), style).setOrigin(0.5)); y += 22
    this.addToTab(this.add.text(GAME_W / 2, y, 'Prestige count: ' + this.state.prestigeCount, style).setOrigin(0.5)); y += 22
    this.addToTab(this.add.text(GAME_W / 2, y, 'Current bonus: x' + this.state.prestigeBonus.toFixed(1), style).setOrigin(0.5)); y += 22
    this.addToTab(this.add.text(GAME_W / 2, y, 'Next bonus: x' + (this.state.prestigeBonus + 0.1).toFixed(1), smallStyle).setOrigin(0.5)); y += 30

    const canPrestige = this.state.totalEarned >= 1_000_000
    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(canPrestige ? COLORS.GOLD : 0x555555, 1)
    btnGfx.fillRoundedRect(GAME_W / 2 - 90, y, 180, 40, 12)
    this.addToTab(btnGfx)
    const btnText = this.add.text(GAME_W / 2, y + 20, canPrestige ? '⭐ PRESTIGE NOW!' : 'Need $1M to Prestige', { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: canPrestige ? COLORS.TEXT_DARK : '#999999' }).setOrigin(0.5)
    if (canPrestige) { btnText.setInteractive(); btnText.on('pointerdown', () => { doPrestige(this.state); this.metaStats.prestigeCount = this.state.prestigeCount; this.checkAchievements(); saveGameState(this.state); this.updateUI(); this.switchTab('brew') }) }
    this.addToTab(btnText); y += 60

    const resetGfx = this.add.graphics()
    resetGfx.fillStyle(COLORS.RED, 1)
    resetGfx.fillRoundedRect(GAME_W / 2 - 70, y, 140, 32, 8)
    this.addToTab(resetGfx)
    const resetText = this.add.text(GAME_W / 2, y + 16, '🗑 Reset Game', { fontSize: '12px', fontFamily: 'Arial', color: '#FFFFFF' }).setOrigin(0.5).setInteractive()
    resetText.on('pointerdown', () => { resetGame(this.state); saveGameState(this.state); this.updateUI(); this.switchTab('brew') })
    this.addToTab(resetText)

    y += 50
    this.addToTab(this.add.text(GAME_W / 2, y, 'How Prestige Works:', { fontSize: '13px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5)); y += 22
    const lines = ['• Reach $1M total earned', '• Reset level, money, equipment', '• Keep +10% income multiplier', '• Unlock special recipes', '• Employees reset too']
    lines.forEach(line => { this.addToTab(this.add.text(GAME_W / 2, y, line, smallStyle).setOrigin(0.5)); y += 18 })
  }

  handleMakeCoffee() {
    const earnings = makeCoffee(this.state)
    addHapticFeedback('light')
    this.metaStats.totalClicks++
    this.metaStats.totalCups++
    this.metaStats.totalEarned = Math.max(this.metaStats.totalEarned, this.state.totalEarned)
    this.metaStats.highestLevel = Math.max(this.metaStats.highestLevel, this.state.level)
    this.checkAchievements()
    this.isBrewing = true
    this.tweens.add({ targets: this.cupContainer, scaleX: 1.15, scaleY: 0.9, duration: 100, yoyo: true, ease: 'Bounce.easeOut', onComplete: () => { this.isBrewing = false } })
    this.spawnCoinParticles(GAME_W / 2, 280, earnings)
    this.spawnMoneyPopup(GAME_W / 2, 260, '+' + formatMoney(earnings))
    this.updateUI()
    this.switchTab(this.currentTab)
  }

  spawnCoinParticles(x: number, y: number, amount: number) {
    const numCoins = Math.min(8, Math.max(2, Math.floor(Math.log10(amount + 1)) + 1))
    for (let i = 0; i < numCoins; i++) {
      const coin = this.add.graphics()
      coin.fillStyle(COLORS.GOLD, 1)
      coin.fillCircle(0, 0, 5 + Math.random() * 3)
      coin.fillStyle(0xffffff, 0.5)
      coin.fillCircle(-1, -1, 2)
      coin.setPosition(x + (Math.random() - 0.5) * 60, y)
      this.tweens.add({ targets: coin, x: x + (Math.random() - 0.5) * 150, y: y - 60 - Math.random() * 80, alpha: 0, duration: 600 + Math.random() * 400, ease: 'Cubic.easeOut', onComplete: () => coin.destroy() })
    }
  }

  spawnMoneyPopup(x: number, y: number, text: string) {
    const popup = this.add.text(x, y, text, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700', stroke: '#3E2723', strokeThickness: 2 }).setOrigin(0.5)
    this.tweens.add({ targets: popup, y: y - 50, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onComplete: () => popup.destroy() })
  }

  updateUI() {
    if (this.moneyText) this.moneyText.setText(formatMoney(this.state.money))
    if (this.levelText) this.levelText.setText('Lv.' + this.state.level)
    if (this.xpBar) {
      this.xpBar.clear()
      const required = xpForLevel(this.state.level)
      const pct = Math.min(1, this.state.xp / required)
      this.xpBar.fillStyle(COLORS.GREEN, 1)
      this.xpBar.fillRoundedRect(82, 84, Math.max(1, 196 * pct), 12, 6)
    }
    if (this.xpText) {
      const required = xpForLevel(this.state.level)
      this.xpText.setText(this.state.xp + '/' + required + ' XP')
    }
    if (this.prestigeText) this.prestigeText.setText(this.state.prestigeCount > 0 ? '⭐x' + this.state.prestigeCount : '')
    if (this.autoText) {
      const eps = getEarningsPerSecond(this.state)
      this.autoText.setText(eps > 0 ? 'Auto: ' + formatMoney(eps) + '/s' : '')
    }
    if (this.recipeText) {
      const recipe = RECIPES[this.state.selectedRecipe] || RECIPES.americano
      this.recipeText.setText(recipe.name + ' — ' + formatMoney(recipe.price * this.state.prestigeBonus))
    }
  }

  updateTabContent() {
    this.switchTab(this.currentTab)
  }

  // ─── Meta persistence ──────────────────────────────────────────────────

  private loadMeta(): void {
    try {
      const raw = localStorage.getItem(this.META_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        this.metaCoins = data.coins ?? 0
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
        unlockedThemes: this.metaUnlockedThemes,
        achievements: this.metaAchievements,
        stats: this.metaStats,
        lastDailyDate: this.metaLastDaily,
      }))
    } catch { /* */ }
  }

  private checkAchievements(): void {
    const newAchievements = checkCafeAchievements(this.metaStats, this.metaAchievements)
    for (const a of newAchievements) {
      this.metaAchievements.push(a.id)
      this.metaCoins += a.reward
    }
    if (newAchievements.length > 0) this.saveMeta()
  }
}
