import Phaser from 'phaser'
import {
  type ClickerState, createInitialState,
  tap, calculateTapValue, getComboMultiplier, getCritChance, getAutoClickRate,
  tickAutoClick, updateCombo, updateBoost,
  canBuyUpgrade, buyUpgrade, checkMilestones,
  canPrestige, doPrestige, getPrestigePoints,
  activateBoost, fmt,
} from '../../logic/game-state'
import { UPGRADES, MILESTONES, getUpgradeCost } from '../../data/upgrades'
import { saveGame, loadGame } from '../../logic/save'
import { BOOST_DURATION } from '../../logic/constants'
import { AdManager } from '../../../../services/AdManager'
import { fadeIn, addHapticFeedback } from '../../../../shared/utils/poki-polish'


const C = {
  BG: 0x1a0a2e, GOLD: 0xffd700, PINK: 0xFF69B4, PURPLE: 0xce93d8,
  WHITE: '#f5f0ff', GOLD_T: '#ffd700', PINK_T: '#f48fb1', GREEN_T: '#66bb6a',
}

export class GameScene extends Phaser.Scene {
  state!: ClickerState
  private pointsText!: Phaser.GameObjects.Text
  private tapValueText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private statsText!: Phaser.GameObjects.Text
  private boostText!: Phaser.GameObjects.Text
  private pearlContainer!: Phaser.GameObjects.Container
  private floatingTexts: Phaser.GameObjects.Text[] = []
  private currentTab = 'tap'
  private tabBtns: { name: string; btn: Phaser.GameObjects.Text }[] = []
  private tabContent: Phaser.GameObjects.GameObject[] = []

  constructor() { super({ key: 'GameScene' }) }

  create(): void {
    fadeIn(this)
    this.state = loadGame() ?? createInitialState()
    this.drawBg()
    this.createPearl()
    this.createHUD()
    this.createTabs()

    this.time.addEvent({ delay: 100, loop: true, callback: () => {
      tickAutoClick(this.state, 0.1)
      updateCombo(this.state, Date.now())
      updateBoost(this.state, Date.now())
      this.updateUI()
      this.refreshTab()
    }})
    this.time.addEvent({ delay: 10000, loop: true, callback: () => saveGame(this.state) })
    this.events.on('shutdown', () => saveGame(this.state))
    this.updateUI()
  }

  private drawBg(): void {
    const g = this.add.graphics()
    g.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b4e, 0x2d1b4e, 1)
    g.fillRect(0, 0, 480, 854)
    // Decorative dots
    g.fillStyle(0xffffff, 0.03)
    for (let i = 0; i < 30; i++) {
      g.fillCircle(Math.random() * 480, Math.random() * 854, 2 + Math.random() * 4)
    }
  }

  private createPearl(): void {
    this.pearlContainer = this.add.container(240, 280)

    // Pearl body
    const g = this.add.graphics()
    g.fillStyle(0x4E342E, 1)
    g.fillCircle(0, 0, 70)
    // Gloss
    g.fillStyle(0xffffff, 0.15)
    g.fillCircle(-15, -20, 25)
    g.fillStyle(0xffffff, 0.08)
    g.fillCircle(10, 15, 35)
    this.pearlContainer.add(g)

    // Emoji
    this.pearlContainer.add(this.add.text(0, 0, '🟤', { fontSize: '48px' }).setOrigin(0.5))

    // Tap zone
    const zone = this.add.zone(0, 0, 160, 160).setInteractive()
    zone.on('pointerdown', () => this.handleTap())
    this.pearlContainer.add(zone)
  }

  private handleTap(): void {
    const result = tap(this.state)

    // Bounce
    this.tweens.add({ targets: this.pearlContainer, scaleX: 1.08, scaleY: 0.92, duration: 40, yoyo: true })

    // Floating text
    const color = result.isCrit ? '#FF4444' : result.combo > 5 ? '#FFD700' : '#FFFFFF'
    const text = result.isCrit ? `💥 ${result.value}` : `+${result.value}`
    const popup = this.add.text(
      240 + (Math.random() - 0.5) * 80,
      230 - Math.random() * 30,
      text,
      { fontSize: result.isCrit ? '24px' : '18px', fontFamily: 'Arial', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }
    ).setOrigin(0.5)
    this.floatingTexts.push(popup)
    this.tweens.add({
      targets: popup, y: popup.y - 60, alpha: 0, duration: 800,
      onComplete: () => { popup.destroy(); this.floatingTexts = this.floatingTexts.filter(t => t !== popup) },
    })

    // Crit burst
    if (result.isCrit) {
      for (let i = 0; i < 8; i++) {
        const p = this.add.graphics()
        p.fillStyle(0xFF4444, 0.8).fillCircle(0, 0, 3)
        p.setPosition(240, 280)
        const angle = (i / 8) * Math.PI * 2
        this.tweens.add({ targets: p, x: 240 + Math.cos(angle) * 60, y: 280 + Math.sin(angle) * 60, alpha: 0, duration: 400, onComplete: () => p.destroy() })
      }
    }

    // Milestones
    const milestones = checkMilestones(this.state)
    for (const m of milestones) {
      const banner = this.add.text(240, 120, `${m.emoji} ${m.name}! +$${m.reward}`, {
        fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(100)
      this.tweens.add({ targets: banner, y: 80, alpha: 0, duration: 2000, onComplete: () => banner.destroy() })
    }

    this.updateUI()
    this.refreshTab()
  }

  private createHUD(): void {
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.3).fillRoundedRect(10, 10, 460, 100, 14)

    this.pointsText = this.add.text(240, 28, '$0', { fontSize: '32px', fontFamily: 'Arial', color: C.GOLD_T, fontStyle: 'bold' }).setOrigin(0.5)
    this.tapValueText = this.add.text(240, 58, '点击: $1', { fontSize: '13px', fontFamily: 'Arial', color: C.GREEN_T }).setOrigin(0.5)
    this.comboText = this.add.text(380, 20, '', { fontSize: '12px', fontFamily: 'Arial', color: '#ff6b6b' }).setOrigin(0.5)
    this.boostText = this.add.text(380, 40, '', { fontSize: '11px', fontFamily: 'Arial', color: '#e056fd' }).setOrigin(0.5)
    this.statsText = this.add.text(240, 82, '', { fontSize: '11px', fontFamily: 'Arial', color: '#9e9e9e' }).setOrigin(0.5)
  }

  private updateUI(): void {
    this.pointsText.setText('$' + fmt(this.state.points))
    this.tapValueText.setText(`点击: $${fmt(calculateTapValue(this.state))}  |  总计: $${fmt(this.state.totalPoints)}  |  点击: ${fmt(this.state.totalTaps)}`)
    this.comboText.setText(this.state.combo > 1 ? `🔥 x${this.state.combo}` : '')
    const auto = getAutoClickRate(this.state)
    const crit = getCritChance(this.state)
    const prestige = getPrestigePoints(this.state)
    this.statsText.setText(`自动: ${auto.toFixed(1)}/s  |  暴击: ${(crit * 100).toFixed(0)}%  |  转生: ${prestige}点`)
    const rem = this.state.boostActive ? Math.max(0, Math.floor((this.state.boostEndTime - Date.now()) / 1000)) : 0
    this.boostText.setText(rem > 0 ? `⚡ 2x ${rem}s` : '')
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────

  private createTabs(): void {
    const names = ['tap', 'upgrades', 'milestones', 'prestige']
    const labels = ['🟤 珍珠', '⬆️ 升级', '🏆 里程碑', '⭐ 转生']
    const y = 420
    this.add.graphics().fillStyle(0x000000, 0.3).fillRect(0, y, 480, 38)
    const bw = 480 / names.length
    names.forEach((n, i) => {
      const btn = this.add.text(bw * i + bw / 2, y + 18, labels[i], { fontSize: '11px', fontFamily: 'Arial', color: '#9e9e9e' }).setOrigin(0.5).setInteractive()
      btn.on('pointerdown', () => this.switchTab(n))
      this.tabBtns.push({ name: n, btn })
    })
    this.switchTab('tap')
  }

  private switchTab(name: string): void {
    this.currentTab = name
    this.tabContent.forEach(o => (o as any).destroy?.())
    this.tabContent = []
    this.tabBtns.forEach(({ name: n, btn }) => btn.setColor(n === name ? '#ffd700' : '#9e9e9e'))
    switch (name) {
      case 'tap': this.tabTap(); break
      case 'upgrades': this.tabUpgrades(); break
      case 'milestones': this.tabMilestones(); break
      case 'prestige': this.tabPrestige(); break
    }
  }

  private addT(o: Phaser.GameObjects.GameObject): void { this.tabContent.push(o) }
  private refreshTab(): void { this.switchTab(this.currentTab) }

  private tabTap(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: C.WHITE }
    this.addT(this.add.text(240, y, `每次点击: $${fmt(calculateTapValue(this.state))}`, { fontSize: '13px', fontFamily: 'Arial', color: C.GOLD_T } as any).setOrigin(0.5)); y += 22
    this.addT(this.add.text(240, y, `连击倍率: x${getComboMultiplier(this.state).toFixed(2)}  |  暴击率: ${(getCritChance(this.state) * 100).toFixed(0)}%`, s as any).setOrigin(0.5)); y += 22
    const auto = getAutoClickRate(this.state)
    this.addT(this.add.text(240, y, `自动点击: ${auto.toFixed(1)}/s  |  转生倍率: x${this.state.prestigeMultiplier.toFixed(2)}`, s as any).setOrigin(0.5)); y += 28
    // Boost button
    if (!this.state.boostActive) {
      const bg = this.add.graphics().fillStyle(0xe056fd, 1).fillRoundedRect(140, y, 200, 32, 10)
      this.addT(bg)
      const t = this.add.text(240, y + 16, '🎬 2x 点击 30秒', { fontSize: '12px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive()
      t.on('pointerdown', async () => {
        const ok = await AdManager.getInstance().requestRewardedAd()
        if (ok) { activateBoost(this.state); this.updateUI(); this.refreshTab() }
      })
      this.addT(t)
    }
  }

  private tabUpgrades(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: C.WHITE }
    this.addT(this.add.text(240, y, '⬆️ 升级', { fontSize: '13px', fontFamily: 'Arial', color: C.GOLD_T } as any).setOrigin(0.5)); y += 28
    for (const u of UPGRADES) {
      const level = this.state.upgradeLevels[u.id] || 0
      const maxed = level >= u.maxLevel
      const cost = maxed ? 0 : getUpgradeCost(u, level)
      const canBuy = canBuyUpgrade(this.state, u.id)
      const label = maxed ? `${u.emoji} ${u.name} Lv.${level} MAX` : `${u.emoji} ${u.name} Lv.${level} $${fmt(cost)}`
      const color = maxed ? '#ffd700' : canBuy ? '#66bb6a' : '#666'
      const t = this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)
      if (!maxed) t.setInteractive().on('pointerdown', () => { buyUpgrade(this.state, u.id); this.updateUI(); this.refreshTab() })
      this.addT(t); y += 26
    }
  }

  private tabMilestones(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: C.WHITE }
    this.addT(this.add.text(240, y, '🏆 里程碑', { fontSize: '13px', fontFamily: 'Arial', color: C.GOLD_T } as any).setOrigin(0.5)); y += 28
    for (const m of MILESTONES) {
      const claimed = this.state.claimedMilestones.includes(m.taps)
      const progress = Math.min(1, this.state.totalTaps / m.taps)
      const label = claimed
        ? `${m.emoji} ${m.name} (${m.taps}次) ✅ +$${m.reward}`
        : `${m.emoji} ${m.name} (${fmt(this.state.totalTaps)}/${fmt(m.taps)}) +$${m.reward}`
      const color = claimed ? '#ffd700' : progress > 0.8 ? '#f48fb1' : '#666'
      this.addT(this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)); y += 24
    }
  }

  private tabPrestige(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: C.WHITE }
    this.addT(this.add.text(240, y, '⭐ 转生', { fontSize: '13px', fontFamily: 'Arial', color: C.GOLD_T } as any).setOrigin(0.5)); y += 28
    this.addT(this.add.text(240, y, `次数: ${this.state.prestigeCount}  |  倍率: x${this.state.prestigeMultiplier.toFixed(2)}`, { ...s, color: C.PINK_T } as any).setOrigin(0.5)); y += 22
    const pts = getPrestigePoints(this.state)
    this.addT(this.add.text(240, y, `可获得: ${pts} 点 (需 $${fmt(10000)} 总收入)`, { ...s, color: pts > 0 ? C.GOLD_T : '#666' } as any).setOrigin(0.5)); y += 32
    if (canPrestige(this.state)) {
      const bg = this.add.graphics().fillStyle(0x9c27b0, 1).fillRoundedRect(140, y, 200, 36, 10)
      this.addT(bg)
      const t = this.add.text(240, y + 18, `⭐ 转生 (+${pts} 点)`, { fontSize: '15px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive()
      t.on('pointerdown', () => { doPrestige(this.state); this.updateUI(); this.refreshTab() })
      this.addT(t)
    }
  }
}
