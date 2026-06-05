import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../data/constants'
import { loadState, saveState, calculateOfflineEarnings, trackPlayTime, type GameState } from '../../logic/game-state'
import { processProductionTick, clickProduce, sellStock, upgradeLine, addProductionLine, automateLine, getLineUpgradeCost } from '../../logic/production'
import { purchaseUpgrade, getUpgradeCost, hireEmployee, getEmployeeCost, unlockPlanet, getPlanetUnlockCost } from '../../logic/upgrades'
import { performPrestige, canPrestige, calcEarnableStardust, getPrestigeRequirement } from '../../logic/prestige'
import { RECIPES, getRecipesForPlanet } from '../../data/recipes'
import { PLANETS } from '../../data/planets'
import { CONSTANTS, calcInflation } from '../../logic/constants'

export class GameScene extends Phaser.Scene {
  private state!: GameState
  private coinText!: Phaser.GameObjects.Text
  private stardustText!: Phaser.GameObjects.Text
  private incomeText!: Phaser.GameObjects.Text
  private inflationText!: Phaser.GameObjects.Text
  private productionTimer = 0
  private autoSaveTimer = 0
  private currentTab = 'factory' as 'factory' | 'recipes' | 'upgrades' | 'planets' | 'prestige'
  private currentPlanet = 'earth'
  private tabButtons: Phaser.GameObjects.Text[] = []
  private tabContents: Phaser.GameObjects.Container[] = []

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.state = loadState()

    // Check offline earnings
    const offlineEarnings = calculateOfflineEarnings(this.state)
    if (offlineEarnings > 0) {
      this.showOfflinePopup(offlineEarnings)
    }

    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-game')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    // HUD
    this.createHUD()

    // Tab bar
    this.createTabBar()

    // Create tab content containers
    this.createFactoryTab()
    this.createRecipesTab()
    this.createUpgradesTab()
    this.createPlanetsTab()
    this.createPrestigeTab()

    // Show default tab
    this.showTab('factory')

    // Auto-save timer
    this.autoSaveTimer = 0
  }

  private createHUD(): void {
    const hudBg = this.add.graphics()
    hudBg.fillStyle(0x0a0e27, 0.85)
    hudBg.fillRect(0, 0, GAME_WIDTH, 70)

    this.coinText = this.add.text(16, 12, `💰 ${this.state.coins}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: COLORS.accent,
      fontStyle: 'bold',
    })

    this.stardustText = this.add.text(16, 40, `⭐ ${this.state.starDust}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#A855F7',
    })

    this.incomeText = this.add.text(GAME_WIDTH - 16, 12, '📥 0/s', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: COLORS.success,
    }).setOrigin(1, 0)

    this.inflationText = this.add.text(GAME_WIDTH - 16, 36, '📊 100%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: COLORS.warning,
    }).setOrigin(1, 0)
  }

  private createTabBar(): void {
    const tabs = ['factory', 'recipes', 'upgrades', 'planets', 'prestige']
    const labels = ['🏭 Factory', '📋 Recipes', '⬆️ Upgrades', '🪐 Planets', '⭐ Prestige']
    const barY = 74
    const tabW = GAME_WIDTH / tabs.length

    const barBg = this.add.graphics()
    barBg.fillStyle(0x1a1e3f, 0.9)
    barBg.fillRect(0, barY, GAME_WIDTH, 36)

    tabs.forEach((tab, i) => {
      const btn = this.add.text(tabW * i + tabW / 2, barY + 18, labels[i], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#888888',
      }).setOrigin(0.5).setInteractive()

      btn.on('pointerdown', () => this.showTab(tab as typeof this.currentTab))
      this.tabButtons.push(btn)
    })
  }

  private showTab(tab: typeof this.currentTab): void {
    this.currentTab = tab
    const tabs = ['factory', 'recipes', 'upgrades', 'planets', 'prestige']

    this.tabButtons.forEach((btn, i) => {
      btn.setColor(tabs[i] === tab ? COLORS.primary : '#888888')
    })

    this.tabContents.forEach((container, i) => {
      container.setVisible(tabs[i] === tab)
    })
  }

  private createFactoryTab(): void {
    const container = this.add.container(0, 0)
    this.tabContents.push(container)

    const contentY = 130
    const lines = this.state.productionLines[this.currentPlanet] || []

    // Factory visual area
    const factoryBg = this.add.graphics()
    factoryBg.fillStyle(0x1a1e3f, 0.6)
    factoryBg.fillRoundedRect(20, contentY, GAME_WIDTH - 40, 300, 12)
    container.add(factoryBg)

    // Planet label
    const planet = PLANETS.find(p => p.id === this.currentPlanet)
    const factoryLabel = this.add.text(GAME_WIDTH / 2, contentY + 20, `${planet?.name ?? this.currentPlanet} — ${lines.length} Lines`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: COLORS.primary,
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add(factoryLabel)

    // Production lines
    lines.forEach((line, i) => {
      const recipe = RECIPES.find(r => r.id === line.recipeId)
      const y = contentY + 50 + i * 60

      const lineCard = this.add.graphics()
      lineCard.fillStyle(0x0a2a4c, 0.8)
      lineCard.fillRoundedRect(30, y, GAME_WIDTH - 60, 50, 8)
      container.add(lineCard)

      const lineText = this.add.text(40, y + 8, `${recipe?.name ?? line.recipeId} Lv.${line.level}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: COLORS.primary,
        fontStyle: 'bold',
      })
      container.add(lineText)

      const stockText = this.add.text(40, y + 28, `Stock: ${line.stock}/${line.maxStock} ${line.automated ? '🤖' : ''}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#CCCCCC',
      })
      container.add(stockText)

      // Click to produce
      const tapBtn = this.add.text(GAME_WIDTH - 40, y + 25, '⚡ TAP', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: COLORS.success,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5).setInteractive()

      tapBtn.on('pointerdown', () => {
        clickProduce(this.state, this.currentPlanet, i)
        this.scene.restart()
      })
      container.add(tapBtn)
    })

    // Upgrade / Add Line / Automate buttons
    const btnY = contentY + 50 + lines.length * 60 + 10

    // Add line button
    const planetRecipes = getRecipesForPlanet(this.currentPlanet)
    const canAddLine = lines.length < (planet?.productionLines ?? 3)
    if (canAddLine && planetRecipes.length > lines.length) {
      const nextRecipe = planetRecipes[lines.length]
      const addBtn = this.add.graphics()
      addBtn.fillStyle(0x2ecc71, 1)
      addBtn.fillRoundedRect(30, btnY, GAME_WIDTH - 60, 40, 8)
      container.add(addBtn)

      container.add(this.add.text(GAME_WIDTH / 2, btnY + 20, `+ Add ${nextRecipe.name} (💰${nextRecipe.baseCost})`, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#FFFFFF',
      }).setOrigin(0.5))

      const addHit = this.add.zone(GAME_WIDTH / 2, btnY + 20, GAME_WIDTH - 60, 40).setInteractive()
      addHit.on('pointerdown', () => {
        addProductionLine(this.state, this.currentPlanet, nextRecipe.id)
        saveState(this.state)
        this.scene.restart()
      })
      container.add(addHit)
    }
  }

  private createRecipesTab(): void {
    const container = this.add.container(0, 0)
    this.tabContents.push(container)

    const contentY = 130
    const recipes = getRecipesForPlanet(this.currentPlanet)

    recipes.forEach((recipe, i) => {
      const isUnlocked = this.state.unlockedRecipes.includes(recipe.id)
      const y = contentY + 20 + i * 70

      const card = this.add.graphics()
      card.fillStyle(isUnlocked ? 0x1a3a5c : 0x1a1e3f, 0.8)
      card.fillRoundedRect(20, y, GAME_WIDTH - 40, 58, 8)
      container.add(card)

      const name = this.add.text(36, y + 10, recipe.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: isUnlocked ? COLORS.primary : '#666666',
        fontStyle: 'bold',
      })
      container.add(name)

      const value = this.add.text(36, y + 32, `💰 ${recipe.basePrice}/unit`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: isUnlocked ? COLORS.accent : '#555555',
      })
      container.add(value)
    })
  }

  private createUpgradesTab(): void {
    const container = this.add.container(0, 0)
    this.tabContents.push(container)

    const contentY = 130
    const upgradeIds = ['line-speed', 'quality-boost', 'coin-mult', 'auto-sell', 'offline-earn']
    const employeeIds = ['intern', 'engineer', 'director']

    // Upgrades section
    container.add(this.add.text(GAME_WIDTH / 2, contentY, '⬆️ Upgrades', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.primary, fontStyle: 'bold',
    }).setOrigin(0.5))

    upgradeIds.forEach((id, i) => {
      const y = contentY + 30 + i * 50
      const cost = getUpgradeCost(this.state, id)
      const level = this.state.upgrades[id] || 0

      const card = this.add.graphics()
      card.fillStyle(0x1a1e3f, 0.8)
      card.fillRoundedRect(20, y, GAME_WIDTH - 40, 42, 8)
      container.add(card)

      container.add(this.add.text(36, y + 8, `${id} Lv.${level}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', color: COLORS.primary,
      }))

      if (cost < Infinity) {
        const buyBtn = this.add.text(GAME_WIDTH - 40, y + 21, `💰${cost}`, {
          fontFamily: 'Arial, sans-serif', fontSize: '13px',
          color: this.state.coins >= cost ? COLORS.success : '#666666',
        }).setOrigin(1, 0.5).setInteractive()

        buyBtn.on('pointerdown', () => {
          purchaseUpgrade(this.state, id)
          saveState(this.state)
          this.scene.restart()
        })
        container.add(buyBtn)
      } else {
        container.add(this.add.text(GAME_WIDTH - 40, y + 21, 'MAX', {
          fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#666666',
        }).setOrigin(1, 0.5))
      }
    })

    // Employees section
    const empY = contentY + 30 + upgradeIds.length * 50 + 20
    container.add(this.add.text(GAME_WIDTH / 2, empY, '👷 Employees', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: COLORS.accent, fontStyle: 'bold',
    }).setOrigin(0.5))

    employeeIds.forEach((id, i) => {
      const y = empY + 30 + i * 50
      const cost = getEmployeeCost(this.state, id)
      const count = this.state.employees[id] || 0

      const card = this.add.graphics()
      card.fillStyle(0x1a1e3f, 0.8)
      card.fillRoundedRect(20, y, GAME_WIDTH - 40, 42, 8)
      container.add(card)

      container.add(this.add.text(36, y + 8, `${id} x${count}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', color: COLORS.accent,
      }))

      const hireBtn = this.add.text(GAME_WIDTH - 40, y + 21, `💰${cost}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '13px',
        color: this.state.coins >= cost ? COLORS.success : '#666666',
      }).setOrigin(1, 0.5).setInteractive()

      hireBtn.on('pointerdown', () => {
        hireEmployee(this.state, id)
        saveState(this.state)
        this.scene.restart()
      })
      container.add(hireBtn)
    })
  }

  private createPlanetsTab(): void {
    const container = this.add.container(0, 0)
    this.tabContents.push(container)

    const contentY = 130

    PLANETS.forEach((planet, i) => {
      const isUnlocked = this.state.unlockedPlanets.includes(planet.id)
      const isCurrent = this.currentPlanet === planet.id
      const y = contentY + 10 + i * 80

      const card = this.add.graphics()
      card.fillStyle(isCurrent ? 0x0a3a5c : 0x1a1e3f, 0.8)
      card.fillRoundedRect(20, y, GAME_WIDTH - 40, 68, 8)
      if (isCurrent) {
        card.lineStyle(2, 0x00d4ff, 1)
        card.strokeRoundedRect(20, y, GAME_WIDTH - 40, 68, 8)
      }
      container.add(card)

      container.add(this.add.text(36, y + 10, planet.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '16px',
        color: isUnlocked ? COLORS.primary : '#666666', fontStyle: 'bold',
      }))

      if (isUnlocked && !isCurrent) {
        const travelBtn = this.add.text(GAME_WIDTH - 40, y + 34, '🚀 Travel', {
          fontFamily: 'Arial, sans-serif', fontSize: '14px', color: COLORS.accent,
        }).setOrigin(1, 0.5).setInteractive()
        travelBtn.on('pointerdown', () => {
          this.currentPlanet = planet.id
          saveState(this.state)
          this.scene.restart()
        })
        container.add(travelBtn)
      } else if (!isUnlocked) {
        const cost = getPlanetUnlockCost({ id: planet.id })
        container.add(this.add.text(36, y + 34, `💰 ${cost} to unlock`, {
          fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#666666',
        }))

        const unlockBtn = this.add.text(GAME_WIDTH - 40, y + 34, '🔓 Unlock', {
          fontFamily: 'Arial, sans-serif', fontSize: '14px',
          color: this.state.coins >= cost ? COLORS.success : '#666666',
        }).setOrigin(1, 0.5).setInteractive()

        unlockBtn.on('pointerdown', () => {
          unlockPlanet(this.state, planet.id)
          saveState(this.state)
          this.scene.restart()
        })
        container.add(unlockBtn)
      } else {
        container.add(this.add.text(GAME_WIDTH - 40, y + 34, '📍 Current', {
          fontFamily: 'Arial, sans-serif', fontSize: '12px', color: COLORS.success,
        }).setOrigin(1, 0.5))
      }
    })
  }

  private createPrestigeTab(): void {
    const container = this.add.container(0, 0)
    this.tabContents.push(container)

    const contentY = 130
    const card = this.add.graphics()
    card.fillStyle(0x1a1e3f, 0.8)
    card.fillRoundedRect(20, contentY, GAME_WIDTH - 40, 260, 12)
    container.add(card)

    container.add(this.add.text(GAME_WIDTH / 2, contentY + 20, '⭐ PRESTIGE', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#A855F7', fontStyle: 'bold',
    }).setOrigin(0.5))

    container.add(this.add.text(GAME_WIDTH / 2, contentY + 60, `Prestige Count: ${this.state.prestigeCount}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#CCCCCC',
    }).setOrigin(0.5))

    const earnable = calcEarnableStardust(this.state)
    container.add(this.add.text(GAME_WIDTH / 2, contentY + 90, `Earnable: ⭐ ${earnable}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px',
      color: earnable > 0 ? COLORS.accent : '#666666',
    }).setOrigin(0.5))

    container.add(this.add.text(GAME_WIDTH / 2, contentY + 120, `Total Coins: ${this.formatNum(this.state.totalCoins)}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#AAAAAA',
    }).setOrigin(0.5))

    const threshold = getPrestigeRequirement(this.state)
    container.add(this.add.text(GAME_WIDTH / 2, contentY + 150, `Need: 💰 ${this.formatNum(threshold)}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#888888',
    }).setOrigin(0.5))

    if (canPrestige(this.state)) {
      const btn = this.add.graphics()
      const btnY = contentY + 180
      btn.fillStyle(0xa855f7, 1)
      btn.fillRoundedRect(80, btnY, GAME_WIDTH - 160, 50, 12)
      container.add(btn)

      container.add(this.add.text(GAME_WIDTH / 2, btnY + 25, `⭐ PRESTIGE (+${earnable} Stardust)`, {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#FFFFFF', fontStyle: 'bold',
      }).setOrigin(0.5))

      const hit = this.add.zone(GAME_WIDTH / 2, btnY + 25, GAME_WIDTH - 160, 50).setInteractive()
      hit.on('pointerdown', () => {
        performPrestige(this.state)
        saveState(this.state)
        this.scene.restart()
      })
      container.add(hit)
    } else {
      container.add(this.add.text(GAME_WIDTH / 2, contentY + 205, 'Earn more coins to prestige!', {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#666666',
      }).setOrigin(0.5))
    }
  }

  private showOfflinePopup(earnings: number): void {
    const popup = this.add.graphics()
    popup.fillStyle(0x0a0e27, 0.95)
    popup.fillRoundedRect(40, 300, GAME_WIDTH - 80, 200, 16)
    popup.lineStyle(2, 0xa855f7, 1)
    popup.strokeRoundedRect(40, 300, GAME_WIDTH - 80, 200, 16)

    this.add.text(GAME_WIDTH / 2, 330, '🌙 Welcome Back!', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#A855F7', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 370, 'You earned while away:', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#CCCCCC',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 410, `💰 +${this.formatNum(earnings)}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '24px', color: COLORS.accent, fontStyle: 'bold',
    }).setOrigin(0.5)

    // Claim earnings
    this.state.coins += earnings
    this.state.totalCoins += earnings

    const okBtn = this.add.text(GAME_WIDTH / 2, 460, '[ OK ]', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: COLORS.primary,
    }).setOrigin(0.5).setInteractive()

    okBtn.on('pointerdown', () => {
      popup.destroy()
      okBtn.destroy()
      saveState(this.state)
    })
  }

  private formatNum(n: number): string {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return Math.floor(n).toString()
  }

  update(_time: number, delta: number): void {
    // Production tick (every 1 second)
    this.productionTimer += delta
    if (this.productionTimer >= CONSTANTS.TICK_INTERVAL) {
      this.productionTimer = 0
      trackPlayTime(this.state, CONSTANTS.TICK_INTERVAL)
      processProductionTick(this.state)
      this.updateHUD()
    }

    // Auto-save
    this.autoSaveTimer += delta
    if (this.autoSaveTimer >= CONSTANTS.AUTO_SAVE_INTERVAL) {
      this.autoSaveTimer = 0
      saveState(this.state)
    }
  }

  private updateHUD(): void {
    this.coinText.setText(`💰 ${this.formatNum(this.state.coins)}`)
    this.stardustText.setText(`⭐ ${this.state.starDust}`)

    // Calculate total output per second for display
    let totalOutput = 0
    for (const lines of Object.values(this.state.productionLines)) {
      for (const line of lines) {
        if (line.automated) {
          const recipe = RECIPES.find(r => r.id === line.recipeId)
          if (recipe) {
            totalOutput += recipe.basePrice * line.level
          }
        }
      }
    }
    this.incomeText.setText(`📥 ${this.formatNum(totalOutput)}/s`)

    const inflation = calcInflation(this.state.totalPlayTime)
    this.inflationText.setText(`📊 ${Math.round(inflation * 100)}%`)
  }

  /**
   * Called by Vue to refresh the scene after state changes.
   */
  refresh(): void {
    this.state = loadState()
    this.updateHUD()
  }

  /**
   * Spawn a floating coin particle at a position.
   */
  spawnCoinParticle(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y, `+${amount}`, {
      fontFamily: 'Fredoka One, cursive',
      fontSize: '18px',
      color: COLORS.accent || '#FFD740',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }
}
