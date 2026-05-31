import Phaser from 'phaser'
import {
  type TycoonState, createInitialState,
  tap, calculateTapIncome, calculateIdleIncome, tickIdle,
  canUnlockRecipe, unlockRecipe, selectRecipe,
  canBuyEquipment, buyEquipment,
  canHireStaff, hireStaff,
  canUnlockLocation, unlockLocation, switchLocation,
  canPrestige, doPrestige, getPrestigePoints,
  applyOffline, activateBoost,
  getDailyState, startDaily, checkDailyComplete,
  fmt, xpForLevel,
} from '../../logic/game-state'
import { saveGame, loadGame } from '../../logic/save'
import { RECIPES } from '../../data/recipes'
import { EQUIPMENT, getEquipmentCost, getEquipmentMultiplier } from '../../data/equipment'
import { STAFF, getStaffCost, getStaffCps } from '../../data/staff'
import { LOCATIONS } from '../../data/locations'
import { OFFLINE_EFFICIENCY, BOOST_DURATION } from '../../logic/constants'
import { TYCOON_THEMES, getTycoonThemeById } from '../../data/themes'
import { TYCOON_ACHIEVEMENTS, getTycoonAchievementById } from '../../data/achievements'
import { canBuyTycoonTheme, equipTycoonTheme, getAvailableTycoonThemes, checkTycoonAchievements, buildTycoonStats, isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS } from '../../logic/meta'

const COLORS = {
  BG_TOP: 0x1a0a2e, BG_BOT: 0x2d1b4e,
  GOLD: 0xffd700, GREEN: 0x4caf50, PURPLE: 0xce93d8, PINK: 0xf48fb1,
  WHITE: '#f5f0ff', GOLD_T: '#ffd700', GREEN_T: '#66bb6a', PINK_T: '#f48fb1',
}

export class GameScene extends Phaser.Scene {
  state!: TycoonState
  moneyText!: Phaser.GameObjects.Text
  ipsText!: Phaser.GameObjects.Text
  levelText!: Phaser.GameObjects.Text
  xpBar!: Phaser.GameObjects.Graphics
  comboText!: Phaser.GameObjects.Text
  boostText!: Phaser.GameObjects.Text
  dailyText!: Phaser.GameObjects.Text
  tapArea!: Phaser.GameObjects.Container
  currentTab = 'brew'
  tabButtons: { name: string; btn: Phaser.GameObjects.Text }[] = []
  tabContent: Phaser.GameObjects.GameObject[] = []

  constructor() { super({ key: 'GameScene' }) }

  create(): void {
    const saved = loadGame()
    this.state = saved ?? createInitialState()
    if (saved) {
      const offMs = Date.now() - this.state.lastSaveTime
      if (offMs > 5000) {
        const earned = applyOffline(this.state, offMs)
        if (earned > 0) this.time.delayedCall(500, () => this.showOfflinePopup(earned))
      }
    }
    this.drawBg()
    this.createHUD()
    this.createTapArea()
    this.createTabs()

    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      tickIdle(this.state)
      this.checkDaily()
      this.checkAchievements()
      this.updateUI()
      this.refreshTab()
    }})
    this.time.addEvent({ delay: 10000, loop: true, callback: () => saveGame(this.state) })
    this.events.on('shutdown', () => saveGame(this.state))
    this.updateUI()
  }

  private drawBg(): void {
    const g = this.add.graphics()
    g.fillGradientStyle(COLORS.BG_TOP, COLORS.BG_TOP, COLORS.BG_BOT, COLORS.BG_BOT, 1)
    g.fillRect(0, 0, 480, 854)
  }

  // ─── HUD ──────────────────────────────────────────────────────────────

  private createHUD(): void {
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.3)
    bg.fillRoundedRect(10, 10, 460, 130, 14)
    this.moneyText = this.add.text(240, 30, '$0', { fontSize: '30px', fontFamily: 'Arial', color: COLORS.GOLD_T, fontStyle: 'bold' }).setOrigin(0.5)
    this.ipsText = this.add.text(240, 60, '收入: $0/s', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GREEN_T }).setOrigin(0.5)
    this.levelText = this.add.text(240, 80, 'Lv.1', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.PINK_T }).setOrigin(0.5)
    this.comboText = this.add.text(380, 30, '', { fontSize: '12px', fontFamily: 'Arial', color: '#ff6b6b' }).setOrigin(0.5)
    this.boostText = this.add.text(380, 50, '', { fontSize: '11px', fontFamily: 'Arial', color: '#e056fd' }).setOrigin(0.5)
    this.dailyText = this.add.text(80, 100, '', { fontSize: '11px', fontFamily: 'Arial', color: '#ffd93d' }).setOrigin(0.5)
    this.xpBar = this.add.graphics().setPosition(50, 125)
  }

  private updateUI(): void {
    this.moneyText.setText('$' + fmt(this.state.money))
    this.ipsText.setText('收入: $' + fmt(calculateIdleIncome(this.state)) + '/s')
    this.levelText.setText('Lv.' + this.state.level)
    this.comboText.setText(this.state.tapCombo > 1 ? `🔥 x${this.state.tapCombo}` : '')
    const rem = this.state.boostActive ? Math.max(0, Math.floor((this.state.boostEndTime - Date.now()) / 1000)) : 0
    this.boostText.setText(rem > 0 ? `⚡ 2x ${rem}s` : '')
    const daily = getDailyState()
    this.dailyText.setText(this.state.dailyActive
      ? `📅 ${daily.challenge.name}: ${fmt(this.state.dailyProgress)}/${fmt(daily.challenge.target)}`
      : '')
    this.xpBar.clear()
    const req = xpForLevel(this.state.level + 1) * 10
    const pct = Math.min(1, this.state.totalEarned / req)
    this.xpBar.fillStyle(0x333333, 1).fillRoundedRect(0, 0, 380, 6, 3)
    this.xpBar.fillStyle(COLORS.PURPLE, 1).fillRoundedRect(0, 0, Math.max(1, 380 * pct), 6, 3)
  }

  // ─── Tap ──────────────────────────────────────────────────────────────

  private createTapArea(): void {
    this.tapArea = this.add.container(240, 280)
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 0.08)
    g.fillRoundedRect(-55, -70, 110, 140, 18)
    g.lineStyle(2, COLORS.PURPLE, 0.5)
    g.strokeRoundedRect(-55, -70, 110, 140, 18)
    this.tapArea.add(g)
    this.tapArea.add(this.add.text(0, -8, '🧋', { fontSize: '50px' }).setOrigin(0.5))
    this.tapArea.add(this.add.text(0, 52, '点击制作!', { fontSize: '14px', fontFamily: 'Arial', color: COLORS.WHITE }).setOrigin(0.5))
    const zone = this.add.zone(0, 0, 120, 160).setInteractive()
    zone.on('pointerdown', () => this.handleTap())
    this.tapArea.add(zone)
  }

  private handleTap(): void {
    const income = tap(this.state)
    this.tweens.add({ targets: this.tapArea, scaleX: 1.08, scaleY: 0.92, duration: 50, yoyo: true })
    const popup = this.add.text(240 + (Math.random() - 0.5) * 50, 230, '+' + fmt(income), {
      fontSize: '18px', fontFamily: 'Arial', color: COLORS.GOLD_T, fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)
    this.tweens.add({ targets: popup, y: popup.y - 60, alpha: 0, duration: 700, onComplete: () => popup.destroy() })
    this.checkDaily()
    this.checkAchievements()
    this.updateUI()
    this.refreshTab()
  }

  // ─── Daily ────────────────────────────────────────────────────────────

  private checkDaily(): void {
    if (this.state.dailyActive) {
      checkDailyComplete(this.state)
    }
  }

  // ─── Offline ──────────────────────────────────────────────────────────

  private showOfflinePopup(amount: number): void {
    const bg = this.add.graphics().setDepth(200)
    bg.fillStyle(0x000000, 0.7).fillRect(0, 0, 480, 854)
    const panel = this.add.graphics().setDepth(201)
    panel.fillStyle(0x2d1b4e, 1).fillRoundedRect(100, 350, 280, 120, 16)
    const t1 = this.add.text(240, 380, '🌙 离线收益', { fontSize: '20px', fontFamily: 'Arial', color: COLORS.GOLD_T, fontStyle: 'bold' }).setOrigin(0.5).setDepth(202)
    const t2 = this.add.text(240, 415, '+$' + fmt(amount), { fontSize: '26px', fontFamily: 'Arial', color: COLORS.GREEN_T, fontStyle: 'bold' }).setOrigin(0.5).setDepth(202)
    const t3 = this.add.text(240, 450, '点击继续', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.WHITE }).setOrigin(0.5).setDepth(202)
    bg.setInteractive().on('pointerdown', () => { bg.destroy(); panel.destroy(); t1.destroy(); t2.destroy(); t3.destroy() })
  }

  // ─── Tabs ─────────────────────────────────────────────────────────────

  private createTabs(): void {
    const names = ['brew', 'recipes', 'equipment', 'staff', 'location', 'prestige', 'daily', 'themes', 'achievements']
    const labels = ['☕制作', '📖配方', '🔧设备', '👥员工', '📍分店', '⭐转生', '📅日任', '🎨主题', '🏆成就']
    const tabY = 420
    this.add.graphics().fillStyle(0x000000, 0.3).fillRect(0, tabY, 480, 38)
    const bw = 480 / names.length
    names.forEach((n, i) => {
      const btn = this.add.text(bw * i + bw / 2, tabY + 18, labels[i], {
        fontSize: '9px', fontFamily: 'Arial', color: '#9e9e9e',
      }).setOrigin(0.5).setInteractive()
      btn.on('pointerdown', () => this.switchTab(n))
      this.tabButtons.push({ name: n, btn })
    })
    this.switchTab('brew')
  }

  private switchTab(name: string): void {
    this.currentTab = name
    this.tabContent.forEach(o => (o as any).destroy?.())
    this.tabContent = []
    this.tabButtons.forEach(({ name: n, btn }) => {
      btn.setColor(n === name ? '#ffd700' : '#9e9e9e')
    })
    switch (name) {
      case 'brew': this.tabBrew(); break
      case 'recipes': this.tabRecipes(); break
      case 'equipment': this.tabEquipment(); break
      case 'staff': this.tabStaff(); break
      case 'location': this.tabLocation(); break
      case 'prestige': this.tabPrestige(); break
      case 'daily': this.tabDaily(); break
      case 'themes': this.tabThemes(); break
      case 'achievements': this.tabAchievements(); break
    }
  }

  private addT(o: Phaser.GameObjects.GameObject): void { this.tabContent.push(o) }

  private refreshTab(): void { this.switchTab(this.currentTab) }

  // ─── Tab: Brew ────────────────────────────────────────────────────────

  private tabBrew(): void {
    let y = 470
    const s = { fontSize: '13px', fontFamily: 'Arial', color: COLORS.WHITE }
    const sm = { fontSize: '11px', fontFamily: 'Arial', color: '#9e9e9e' }
    const r = RECIPES.find(rec => rec.id === this.state.selectedRecipe) ?? RECIPES[0]
    this.addT(this.add.text(240, y, `${r.emoji} ${r.name} ($${r.basePrice}/杯)`, { ...s, color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    const ipt = calculateTapIncome(this.state)
    const ips = calculateIdleIncome(this.state)
    this.addT(this.add.text(240, y, `点击: $${fmt(ipt)}  |  自动: $${fmt(ips)}/s`, sm as any).setOrigin(0.5)); y += 22
    this.addT(this.add.text(240, y, `总收入: $${fmt(this.state.totalEarned)}  |  点击: ${fmt(this.state.totalTaps)}`, sm as any).setOrigin(0.5)); y += 28
    const staffEntries = Object.entries(this.state.staffCounts).filter(([, v]) => v > 0)
    if (staffEntries.length > 0) {
      this.addT(this.add.text(20, y, '员工:', s as any)); y += 20
      for (const [id, cnt] of staffEntries) {
        const st = STAFF.find(s2 => s2.id === id)
        if (st) { this.addT(this.add.text(30, y, `${st.emoji} ${st.name} x${cnt} (${(st.cupsPerSec * cnt).toFixed(1)}/s)`, sm as any)); y += 16 }
      }
    }
    // Boost button
    if (!this.state.boostActive) {
      const bg = this.add.graphics()
      bg.fillStyle(0xe056fd, 1).fillRoundedRect(140, y + 10, 200, 32, 10)
      this.addT(bg)
      const bt = this.add.text(240, y + 26, '🎬 2x 收入 30秒', { fontSize: '12px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive()
      bt.on('pointerdown', async () => {
        const { AdManager } = await import('../../../../services/AdManager')
        const success = await AdManager.getInstance().requestRewardedAd()
        if (success) { activateBoost(this.state); this.updateUI(); this.refreshTab() }
      })
      this.addT(bt)
    }
    // Daily reward button
    if (isDailyRewardAvailable(this.state.lastDailyRewardDate)) {
      y += 45
      const dbg = this.add.graphics()
      dbg.fillStyle(0x00b894, 1).fillRoundedRect(140, y, 200, 32, 10)
      this.addT(dbg)
      const dt = this.add.text(240, y + 16, `🎁 每日奖励 +$${DAILY_REWARD_COINS}`, { fontSize: '12px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive()
      dt.on('pointerdown', () => {
        const result = claimDailyReward(this.state.lastDailyRewardDate)
        if (result.claimed) {
          this.state.lastDailyRewardDate = result.today
          this.state.dailyRewardCount++
          this.state.money += DAILY_REWARD_COINS
          this.state.totalEarned += DAILY_REWARD_COINS
          saveGame(this.state)
          this.checkAchievements()
          this.updateUI(); this.refreshTab()
        }
      })
      this.addT(dt)
    }
  }

  // ─── Tab: Recipes ─────────────────────────────────────────────────────

  private tabRecipes(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    this.addT(this.add.text(240, y, '📖 解锁新配方', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    for (const r of RECIPES) {
      const unlocked = this.state.unlockedRecipes.includes(r.id)
      const sel = this.state.selectedRecipe === r.id
      const canBuy = canUnlockRecipe(this.state, r.id)
      const label = unlocked ? `${r.emoji} ${r.name} $${r.basePrice}/杯 ${sel ? '✅' : ''}` : `${r.emoji} ${r.name} 🔒 Lv.${r.unlockLevel} $${fmt(r.unlockCost)}`
      const color = sel ? '#ffd700' : unlocked ? '#66bb6a' : canBuy ? '#f48fb1' : '#666'
      const t = this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)
      if (unlocked && !sel) t.setInteractive().on('pointerdown', () => { selectRecipe(this.state, r.id); this.updateUI(); this.refreshTab() })
      else if (canBuy) t.setInteractive().on('pointerdown', () => { unlockRecipe(this.state, r.id); this.updateUI(); this.refreshTab() })
      this.addT(t); y += 26
    }
  }

  // ─── Tab: Equipment ───────────────────────────────────────────────────

  private tabEquipment(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    const mult = getEquipmentMultiplier(this.state.equipmentLevels).toFixed(2)
    this.addT(this.add.text(240, y, `🔧 设备 (速度 x${mult})`, { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    for (const eq of EQUIPMENT) {
      const lvl = this.state.equipmentLevels[eq.id] || 0
      const maxed = lvl >= eq.maxLevel
      const cost = maxed ? 0 : getEquipmentCost(eq, lvl)
      const canBuy = canBuyEquipment(this.state, eq.id)
      const label = maxed ? `${eq.emoji} ${eq.name} Lv.${lvl} MAX` : `${eq.emoji} ${eq.name} Lv.${lvl} → $${fmt(cost)}`
      const color = maxed ? '#ffd700' : canBuy ? '#66bb6a' : '#666'
      const t = this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)
      if (!maxed) t.setInteractive().on('pointerdown', () => { buyEquipment(this.state, eq.id); this.updateUI(); this.refreshTab() })
      this.addT(t); y += 26
    }
  }

  // ─── Tab: Staff ───────────────────────────────────────────────────────

  private tabStaff(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    const totalCps = getStaffCps(this.state.staffCounts)
    this.addT(this.add.text(240, y, `👥 员工 (${totalCps.toFixed(1)} 杯/秒)`, { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    for (const st of STAFF) {
      const owned = this.state.staffCounts[st.id] || 0
      const cost = getStaffCost(st, owned)
      const canBuy = canHireStaff(this.state, st.id)
      const label = `${st.emoji} ${st.name} x${owned} $${fmt(cost)} +${st.cupsPerSec}/s`
      const color = canBuy ? '#66bb6a' : '#666'
      const t = this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)
      t.setInteractive().on('pointerdown', () => { hireStaff(this.state, st.id); this.updateUI(); this.refreshTab() })
      this.addT(t); y += 26
    }
  }

  // ─── Tab: Location ────────────────────────────────────────────────────

  private tabLocation(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    const cur = LOCATIONS.find(l => l.id === this.state.currentLocation) ?? LOCATIONS[0]
    this.addT(this.add.text(240, y, `📍 ${cur.emoji} ${cur.name} (x${cur.incomeMult})`, { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    for (const l of LOCATIONS) {
      const unlocked = this.state.unlockedLocations.includes(l.id)
      const isCur = this.state.currentLocation === l.id
      const canBuy = canUnlockLocation(this.state, l.id)
      const label = isCur ? `${l.emoji} ${l.name} x${l.incomeMult} ←` : unlocked ? `${l.emoji} ${l.name} x${l.incomeMult}` : `${l.emoji} ${l.name} x${l.incomeMult} 🔒 Lv.${l.requiredLevel} $${fmt(l.unlockCost)}`
      const color = isCur ? '#ffd700' : unlocked ? '#66bb6a' : canBuy ? '#f48fb1' : '#666'
      const t = this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)
      if (unlocked && !isCur) t.setInteractive().on('pointerdown', () => { switchLocation(this.state, l.id); this.updateUI(); this.refreshTab() })
      else if (canBuy) t.setInteractive().on('pointerdown', () => { unlockLocation(this.state, l.id); this.updateUI(); this.refreshTab() })
      this.addT(t); y += 26
    }
  }

  // ─── Tab: Prestige ────────────────────────────────────────────────────

  private tabPrestige(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    this.addT(this.add.text(240, y, '⭐ 转生系统', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    this.addT(this.add.text(240, y, `转生: ${this.state.prestigeCount} 次  |  倍率: x${this.state.prestigeMultiplier.toFixed(2)}`, { ...s, color: COLORS.PINK_T } as any).setOrigin(0.5)); y += 22
    const pts = getPrestigePoints(this.state)
    this.addT(this.add.text(240, y, `可获得: ${pts} 点  (需要 $1M 总收入)`, { ...s, color: pts > 0 ? COLORS.GOLD_T : '#666' } as any).setOrigin(0.5)); y += 32
    if (canPrestige(this.state)) {
      const bg = this.add.graphics()
      bg.fillStyle(0x9c27b0, 1).fillRoundedRect(140, y, 200, 36, 10)
      this.addT(bg)
      const t = this.add.text(240, y + 18, `⭐ 转生 (+${pts} 点)`, { fontSize: '15px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive()
      t.on('pointerdown', () => { doPrestige(this.state); this.updateUI(); this.refreshTab() })
      this.addT(t)
    }
  }

  // ─── Tab: Daily ───────────────────────────────────────────────────────

  private tabDaily(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    const daily = getDailyState()
    this.addT(this.add.text(240, y, '📅 每日挑战', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    this.addT(this.add.text(240, y, `${daily.challenge.emoji} ${daily.challenge.name}`, { ...s, color: '#ffd93d' } as any).setOrigin(0.5)); y += 20
    this.addT(this.add.text(240, y, daily.challenge.desc, { fontSize: '10px', fontFamily: 'Arial', color: '#9e9e9e' } as any).setOrigin(0.5)); y += 22
    this.addT(this.add.text(240, y, `奖励: $${daily.challenge.reward}`, { ...s, color: COLORS.GREEN_T } as any).setOrigin(0.5)); y += 28
    if (this.state.dailyActive) {
      const pct = Math.min(1, this.state.dailyProgress / daily.challenge.target)
      const bar = this.add.graphics()
      bar.fillStyle(0x333333, 1).fillRoundedRect(90, y, 300, 12, 6)
      bar.fillStyle(this.state.dailyCompleted ? 0x66bb6a : 0xffd93d, 1).fillRoundedRect(90, y, 300 * pct, 12, 6)
      this.addT(bar)
      this.addT(this.add.text(240, y + 24, `${fmt(this.state.dailyProgress)} / ${fmt(daily.challenge.target)}`, { ...s, color: '#fff' } as any).setOrigin(0.5))
      if (this.state.dailyCompleted) {
        this.addT(this.add.text(240, y + 46, '✅ 已完成!', { fontSize: '16px', fontFamily: 'Arial', color: '#66bb6a', fontStyle: 'bold' } as any).setOrigin(0.5))
      }
    } else {
      const bg = this.add.graphics()
      bg.fillStyle(0xffd93d, 1).fillRoundedRect(140, y, 200, 36, 10)
      this.addT(bg)
      const t = this.add.text(240, y + 18, '🚀 开始挑战', { fontSize: '15px', fontFamily: 'Arial', color: '#1a0a2e', fontStyle: 'bold' }).setOrigin(0.5).setInteractive()
      t.on('pointerdown', () => { startDaily(this.state); this.refreshTab() })
      this.addT(t)
    }
  }

  // ─── Tab: Themes ─────────────────────────────────────────────────────

  private tabThemes(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    this.addT(this.add.text(240, y, '🎨 主题商店', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    const available = getAvailableTycoonThemes(this.state.money, this.state.level, this.state.unlockedThemes)
    for (const item of available) {
      const { theme, unlocked, canBuy } = item
      const isEquipped = this.state.equippedTheme === theme.id
      const label = isEquipped ? `${theme.emoji} ${theme.name} ✅` : unlocked ? `${theme.emoji} ${theme.name} 已拥有` : `${theme.emoji} ${theme.name} $${fmt(theme.cost)} Lv.${theme.requiredLevel}`
      const color = isEquipped ? '#ffd700' : unlocked ? '#66bb6a' : canBuy ? '#f48fb1' : '#666'
      const t = this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)
      if (canBuy) {
        t.setInteractive().on('pointerdown', () => {
          if (this.state.money >= theme.cost && this.state.level >= theme.requiredLevel) {
            this.state.money -= theme.cost
            this.state.unlockedThemes.push(theme.id)
            this.state.equippedTheme = theme.id
            saveGame(this.state)
            this.updateUI(); this.refreshTab()
          }
        })
      } else if (unlocked && !isEquipped) {
        t.setInteractive().on('pointerdown', () => {
          if (equipTycoonTheme(this.state.unlockedThemes, theme.id)) {
            this.state.equippedTheme = theme.id
            saveGame(this.state)
            this.refreshTab()
          }
        })
      }
      this.addT(t); y += 26
    }
  }

  // ─── Tab: Achievements ───────────────────────────────────────────────

  private tabAchievements(): void {
    let y = 470
    const s = { fontSize: '11px', fontFamily: 'Arial', color: COLORS.WHITE }
    const unlocked = this.state.achievements.length
    this.addT(this.add.text(240, y, `🏆 成就 (${unlocked}/${TYCOON_ACHIEVEMENTS.length})`, { fontSize: '13px', fontFamily: 'Arial', color: COLORS.GOLD_T } as any).setOrigin(0.5)); y += 28
    for (const a of TYCOON_ACHIEVEMENTS) {
      const done = this.state.achievements.includes(a.id)
      const label = done ? `${a.emoji} ${a.name} ✅` : `${a.emoji} ${a.name} — ${a.description}`
      const color = done ? '#ffd700' : '#666'
      this.addT(this.add.text(240, y, label, { ...s, color } as any).setOrigin(0.5)); y += 24
    }
  }

  // ─── Achievement check helper ────────────────────────────────────────

  private checkAchievements(): void {
    const stats = buildTycoonStats(this.state, this.state.unlockedThemes, this.state.dailyRewardCount)
    const newAchievements = checkTycoonAchievements(stats, this.state.achievements)
    for (const a of newAchievements) {
      this.state.achievements.push(a.id)
      this.state.money += a.reward
      this.state.totalEarned += a.reward
    }
    if (newAchievements.length > 0) saveGame(this.state)
  }
}
