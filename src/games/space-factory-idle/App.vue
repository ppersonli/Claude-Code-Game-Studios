<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Phaser from 'phaser'
import { AdManager } from '../../services/AdManager'
import { audioEngine } from '@shared/phaser/audio'
import { loadState, saveState, calculateOfflineEarnings, trackPlayTime, type GameState } from './logic/game-state'
import { CONSTANTS } from './logic/constants'
import { processProductionTick, clickProduce, sellStock, upgradeLine, addProductionLine, automateLine, getLineUpgradeCost, recalcAllMaxStock } from './logic/production'
import { canPrestige, performPrestige, getPrestigeRequirement, calcEarnableStardust } from './logic/prestige'
import { purchaseUpgrade, getUpgradeCost, getUpgradeLevel, isUpgradeMaxed, hireEmployee, getEmployeeCost, getEmployeeCount, unlockPlanet, canUnlockPlanet, getPlanetUnlockCost } from './logic/upgrades'
import { rollForEvent, activateEvent, checkEventExpiry, EVENTS } from './logic/events'
import { PLANETS } from './data/planets'
import { RECIPES, getRecipesForPlanet } from './data/recipes'
import { UPGRADES, getUpgradesByCategory } from './data/upgrades'
import { EMPLOYEES } from './data/employees'
import { ACHIEVEMENTS, type AchievementCheckState } from './data/achievements'
import { getTodayChallenge, isDailyCompletedToday, completeDailyChallenge, type DailyChallenge, type DailyChallengeContext } from './data/daily-challenges'
import { translations, getLocale, type Locale } from './i18n/translations'
import { GameScene } from './phaser/scenes/GameScene'
import type { GameSceneData } from './phaser/scenes/GameScene'

const adManager = AdManager.getInstance()

// i18n
const locale = ref<Locale>(getLocale())
const t = (key: string) => translations[locale.value][key] || translations['en'][key] || key

// Game state — single source of truth (reactive)
const state = reactive<GameState>(loadState())
const currentPlanetId = ref(state.unlockedPlanets[state.unlockedPlanets.length - 1] || 'earth')

// UI state
type Screen = 'menu' | 'game' | 'upgrades' | 'employees' | 'planets' | 'prestige' | 'achievements' | 'daily'
const screen = ref<Screen>('menu')
const showOfflineReward = ref(false)
const offlineRewardAmount = ref(0)
const achievementToast = ref('')
const eventToast = ref('')
const showTutorial = ref(state.totalProduced === 0)

// Daily challenge
const todayChallenge = ref<DailyChallenge>(getTodayChallenge())

// Combo system
const comboCount = ref(0)
const lastClickTime = ref(0)
const COMBO_WINDOW = 3000
const comboTierName = ref('')
const showCombo = ref(false)
let comboHideTimer: ReturnType<typeof setTimeout> | null = null

// Particle effects
interface Particle { id: number; x: number; y: number; color: string; angle: number }
const particles = ref<Particle[]>([])
let particleId = 0

// Midgame ad tracking
let upgradeCount = 0
const speedBoostActive = ref(false)
let speedBoostTimer: ReturnType<typeof setTimeout> | null = null

// Production tick
let tickTimer: ReturnType<typeof setInterval> | null = null
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

// Phaser
let phaserGame: Phaser.Game | null = null
const phaserContainer = ref<HTMLDivElement>()

// Computed
const currentPlanet = computed(() => PLANETS.find(p => p.id === currentPlanetId.value)!)
const currentLines = computed(() => state.productionLines[currentPlanetId.value] || [])
const availableRecipes = computed(() => getRecipesForPlanet(currentPlanetId.value))
const canPrestigeNow = computed(() => canPrestige(state))
const prestigeReq = computed(() => getPrestigeRequirement(state))
const earnableStardust = computed(() => calcEarnableStardust(state))
const prestigeMultDisplay = computed(() => state.prestigeMult.toFixed(1))
const totalOutputPerSec = computed(() => {
  let total = 0
  for (const [planetId, lines] of Object.entries(state.productionLines)) {
    const planet = PLANETS.find(p => p.id === planetId)
    if (!planet) continue
    for (const line of lines) {
      const recipe = RECIPES.find(r => r.id === line.recipeId)
      if (!recipe) continue
      total += recipe.baseOutput * (1 + (line.level - 1) * 0.5) * planet.specialBonus * state.prestigeMult
    }
  }
  return total.toFixed(1)
})

const activeEvent = computed(() => {
  if (!state.activeEvent || Date.now() >= state.eventEndTime) return null
  return EVENTS.find(e => e.id === state.activeEvent)
})

/* ── Phaser integration ────────────────────────────────────────── */

function getGameScene(): GameScene | null {
  if (!phaserGame) return null
  return phaserGame.scene.getScene('GameScene') as GameScene | null
}

function refreshPhaser(): void {
  getGameScene()?.refresh()
}

function initPhaser(): void {
  if (!phaserContainer.value || phaserGame) return

  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: phaserContainer.value,
    width: 480,
    height: 854,
    backgroundColor: '#0b0b2a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
  })

  const sceneData: GameSceneData = {
    getState: () => state,
    getCurrentPlanetId: () => currentPlanetId.value,
    onClickProduce: (planetId: string, lineIdx: number) => {
      handleClickProduce(planetId, lineIdx)
    },
    onSell: (planetId: string, lineIdx: number) => {
      handleSellPhaser(planetId, lineIdx)
    },
    onUpgradeLine: (planetId: string, lineIdx: number) => {
      handleUpgradeLine(planetId, lineIdx)
    },
    onAutomate: (planetId: string, lineIdx: number) => {
      handleAutomateLine(planetId, lineIdx)
    },
    onAddLine: (planetId: string, recipeId: string) => {
      handleAddLine(planetId, recipeId)
    },
    onRequestSync: () => {
      refreshPhaser()
    },
  }

  phaserGame.scene.add('GameScene', GameScene, true, sceneData)
}

function destroyPhaser(): void {
  if (phaserGame) {
    phaserGame.destroy(true)
    phaserGame = null
  }
}

/* ── Actions ───────────────────────────────────────────────────── */

function startGame() {
  screen.value = 'game'
  adManager.gameplayStart()
  audioEngine.init()

  // Check offline earnings
  const offline = calculateOfflineEarnings(state)
  if (offline > 0) {
    offlineRewardAmount.value = offline
    showOfflineReward.value = true
    state.coins += offline
    state.totalCoins += offline
    state.sessionCoinsEarned += offline
  }

  startProductionLoop()

  // Mount Phaser after Vue renders the container
  nextTick(() => {
    if (!phaserGame) initPhaser()
  })
}

function startProductionLoop() {
  if (tickTimer) return
  tickTimer = setInterval(() => {
    trackPlayTime(state, CONSTANTS.TICK_INTERVAL)
    let earned = processProductionTick(state)

    // Speed boost from rewarded ad: 2x production for 60s
    if (speedBoostActive.value && earned > 0) {
      state.coins += earned
      state.totalCoins += earned
      state.sessionCoinsEarned += earned
      earned *= 2
    }

    // Update bestDistance (1 km per 1000 total coins)
    state.bestDistance = Math.floor(state.totalCoins / 1000)

    checkEventExpiry(state)
    const event = rollForEvent(state, currentPlanetId.value)
    if (event) {
      activateEvent(state, event)
      eventToast.value = t(event.nameKey)
      audioEngine.play('unlock')
      setTimeout(() => { eventToast.value = '' }, 3000)
    }

    checkAchievements()
    // Auto-complete daily challenge if conditions are met
    if (!isDailyCompletedToday(state.lastDailyCompleted)) {
      const challenge = getTodayChallenge()
      const ctx: DailyChallengeContext = {
        totalCoinsEarned: state.sessionCoinsEarned,
        itemsProduced: state.sessionItemsProduced,
        upgradesMade: state.sessionUpgradesMade,
        activeTime: (Date.now() - state.sessionStart) / 1000,
        prestigeDone: false,
      }
      if (challenge.validate(ctx)) {
        completeDailyChallenge(state, challenge)
        achievementToast.value = `📅 Daily Complete! +${challenge.bonusMultiplier}x bonus!`
        setTimeout(() => { achievementToast.value = '' }, 3000)
      }
    }
    saveState(state)

    // Push fresh state to Phaser
    refreshPhaser()
  }, 1000)
}

function stopProductionLoop() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function handleClickProduce(planetId: string, lineIdx: number) {
  audioEngine.play('tick')
  vibrate(10)

  const now = Date.now()
  if (now - lastClickTime.value < COMBO_WINDOW) {
    comboCount.value++
  } else {
    comboCount.value = 1
  }
  lastClickTime.value = now

  // Update combo display
  const tier = getComboTier(comboCount.value)
  if (tier.name) {
    comboTierName.value = tier.name
    showCombo.value = true
    if (comboCount.value >= 5) {
      spawnParticles(240, 400, tier.particleColor, Math.min(comboCount.value * 2, 20))
    }
  }
  if (comboHideTimer) clearTimeout(comboHideTimer)
  comboHideTimer = setTimeout(() => { showCombo.value = false }, 2000)

  const comboMult = Math.min(1 + (comboCount.value - 1) * 0.1, 5)

  const earned = clickProduce(state, planetId, lineIdx)
  if (earned > 0) {
    const finalEarned = Math.floor(earned * comboMult)
    state.coins += finalEarned - earned
    state.totalCoins += finalEarned - earned
    state.sessionCoinsEarned += finalEarned - earned
    audioEngine.play('add')

    // Spawn floating coin in Phaser
    const scene = getGameScene()
    if (scene) {
      scene.spawnCoinParticle(240, 200, finalEarned)
    }
  }
}

function handleSellPhaser(planetId: string, lineIdx: number) {
  const earned = sellStock(state, planetId, lineIdx)
  if (earned > 0) {
    audioEngine.play('perfect')
    vibrate(20)
    spawnParticles(240, 300, '#ffd740', 10)
    const scene = getGameScene()
    if (scene) {
      scene.spawnCoinParticle(240, 200, earned)
    }
  }
}

function handleUpgradeLine(planetId: string, lineIdx: number) {
  if (upgradeLine(state, planetId, lineIdx)) {
    audioEngine.play('levelup')
  }
}

function handleAddLine(planetId: string, recipeId: string) {
  if (addProductionLine(state, planetId, recipeId)) {
    audioEngine.play('unlock')
  }
}

function handleAutomateLine(planetId: string, lineIdx: number) {
  if (automateLine(state, planetId, lineIdx)) {
    audioEngine.play('levelup')
  }
}

function handlePurchaseUpgrade(upgradeId: string) {
  if (purchaseUpgrade(state, upgradeId)) {
    audioEngine.play('add')
    vibrate(20)
    spawnParticles(240, 300, '#00e5ff', 8)
    // Recalculate maxStock for capacity-related upgrades
    if (upgradeId === 'line-capacity' || upgradeId === 'warehouse') {
      recalcAllMaxStock(state)
    }
    // Midgame ad trigger after every N upgrades
    upgradeCount++
    if (upgradeCount % CONSTANTS.AD_UPGRADE_INTERVAL === 0) {
      adManager.requestRewardedAd()
    }
    refreshPhaser()
  }
}

function handleHireEmployee(employeeId: string) {
  if (hireEmployee(state, employeeId)) {
    audioEngine.play('unlock')
    refreshPhaser()
  }
}

function handleUnlockPlanet(planetId: string) {
  if (unlockPlanet(state, planetId)) {
    audioEngine.play('unlock')
    currentPlanetId.value = planetId
    refreshPhaser()
  }
}

function handleTravelToPlanet(planetId: string) {
  currentPlanetId.value = planetId
  screen.value = 'game'
  // Rebuild Phaser lines for new planet
  nextTick(() => {
    const scene = getGameScene()
    if (scene) {
      scene.refresh()
    }
  })
}

function handlePrestige() {
  const earned = performPrestige(state)
  if (earned > 0) {
    audioEngine.play('levelup')
    vibrate(50)
    spawnParticles(240, 400, '#e040fb', 24)
    achievementToast.value = `⭐ Prestige Complete! +${earned} Star Dust!`
    setTimeout(() => { achievementToast.value = '' }, 3000)
    saveState(state)
    refreshPhaser()
  }
}

function checkAchievements() {
  const checkState: AchievementCheckState = {
    totalProduced: state.totalProduced,
    activeLines: Object.values(state.productionLines).flat().length,
    unlockedPlanets: state.unlockedPlanets,
    totalCoins: state.totalCoins,
    prestigeCount: state.prestigeCount,
    allLinesAutomated: Object.values(state.productionLines).flat().every(l => l.automated),
    employeeCounts: state.employees,
  }
  for (const ach of ACHIEVEMENTS) {
    if (!state.achievements.includes(ach.id) && ach.check(checkState)) {
      state.achievements.push(ach.id)
      achievementToast.value = ach.name
      audioEngine.play('unlock')
      setTimeout(() => { achievementToast.value = '' }, 3000)
    }
  }
}

function goTo(s: Screen) { screen.value = s }
function goBack() {
  screen.value = 'game'
  nextTick(() => refreshPhaser())
}
function goToMenu() {
  screen.value = 'menu'
  adManager.gameplayStop()
  stopProductionLoop()
  destroyPhaser()
  saveState(state)
}

function collectOfflineReward() { showOfflineReward.value = false }

function handleCompleteDaily() {
  const challenge = todayChallenge.value
  if (isDailyCompletedToday(state.lastDailyCompleted)) return
  const success = completeDailyChallenge(state, challenge)
  if (success) {
    audioEngine.play('levelup')
    vibrate(20)
    spawnParticles(240, 300, '#ffd740', 12)
    achievementToast.value = `📅 Daily Complete! +${challenge.bonusMultiplier}x bonus!`
    setTimeout(() => { achievementToast.value = '' }, 3000)
    saveState(state)
  }
}

async function collectDoubleOffline() {
  const rewarded = await adManager.requestRewardedAd()
  if (rewarded) {
    const bonus = offlineRewardAmount.value
    state.coins += bonus
    state.totalCoins += bonus
    offlineRewardAmount.value *= 2
  }
  showOfflineReward.value = false
}

async function watchAdForSpeedBoost() {
  const rewarded = await adManager.requestRewardedAd()
  if (rewarded) {
    speedBoostActive.value = true
    if (speedBoostTimer) clearTimeout(speedBoostTimer)
    speedBoostTimer = setTimeout(() => { speedBoostActive.value = false }, 60_000)
    audioEngine.play('levelup')
  }
}

function formatCoins(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function getComboTier(count: number): { name: string; color: string; particleColor: string } {
  if (count >= 10) return { name: 'LEGENDARY!', color: '#ffd740', particleColor: '#ffd740' }
  if (count >= 7) return { name: 'ON FIRE!', color: '#ff6d00', particleColor: '#ff6d00' }
  if (count >= 5) return { name: 'AMAZING!', color: '#ff4081', particleColor: '#ff4081' }
  if (count >= 3) return { name: 'GREAT!', color: '#00e5ff', particleColor: '#00e5ff' }
  return { name: '', color: '#00e5ff', particleColor: '#00e5ff' }
}

function spawnParticles(x: number, y: number, color: string, count: number = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count
    particles.value.push({ id: particleId++, x, y, color, angle })
  }
  // Clean up after animation
  setTimeout(() => {
    particles.value = particles.value.filter(p => p.id > particleId - count - 20)
  }, 800)
}

function vibrate(ms: number = 15) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

onMounted(() => {
  autoSaveTimer = setInterval(() => saveState(state), 30_000)

  // Save on page unload (reload, close tab)
  window.addEventListener('beforeunload', () => saveState(state))
})

onUnmounted(() => {
  stopProductionLoop()
  destroyPhaser()
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  saveState(state)
})
</script>

<template>
  <div class="game-wrapper">
    <!-- ============ MENU SCREEN ============ -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="stars-bg"></div>
      <div class="menu-content">
        <h1 class="game-title">
          <span class="title-main">SPACE FACTORY</span>
          <span class="title-sub">IDLE</span>
        </h1>
        <p class="tagline">{{ t('tagline') }}</p>

        <div class="menu-stats" v-if="state.totalProduced > 0">
          <div class="stat-item">
            <span class="stat-icon">💰</span>
            <span class="stat-value">{{ formatCoins(state.totalCoins) }}</span>
            <span class="stat-label">{{ t('totalCoins') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🏭</span>
            <span class="stat-value">{{ state.totalProduced.toLocaleString() }}</span>
            <span class="stat-label">{{ t('totalProduced') }}</span>
          </div>
          <div class="stat-item" v-if="state.starDust > 0">
            <span class="stat-icon">✨</span>
            <span class="stat-value">{{ state.starDust }}</span>
            <span class="stat-label">{{ t('starDust') }}</span>
          </div>
        </div>

        <div class="menu-buttons">
          <button class="btn btn-primary btn-lg" data-testid="start-btn" @click="startGame">
            {{ state.totalProduced > 0 ? t('continue') : t('start') }}
          </button>
          <button v-if="canPrestigeNow" class="btn btn-prestige-sm" @click="startGame(); goTo('prestige')">
            {{ t('prestigeAvailable') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ GAME VIEW (Phaser canvas + Vue overlays) ============ -->
    <div v-show="screen === 'game'" class="game-screen">
      <!-- Phaser canvas fills the whole screen -->
      <div ref="phaserContainer" class="phaser-container"></div>

      <!-- Vue HUD overlay on top of Phaser -->
      <div class="hud-overlay">
        <div class="hud-bar">
          <div class="hud-left">
            <div class="hud-resource coins" data-testid="coin-display">
              <span class="res-icon">💰</span>
              <span class="res-value">{{ formatCoins(state.coins) }}</span>
            </div>
            <div class="hud-resource output">
              <span class="res-icon">⚡</span>
              <span class="res-value">{{ totalOutputPerSec }}/s</span>
            </div>
            <div class="hud-resource stardust" v-if="state.starDust > 0">
              <span class="res-icon">✨</span>
              <span class="res-value">{{ state.starDust }} (×{{ prestigeMultDisplay }})</span>
            </div>
          </div>
          <div class="hud-right">
            <button class="btn-boost" :class="{ active: speedBoostActive }" @click="watchAdForSpeedBoost"
                    :title="speedBoostActive ? '2x Speed Active!' : 'Watch Ad for 2x Speed'">
              {{ speedBoostActive ? '⚡2x' : '⚡' }}
            </button>
            <span v-if="activeEvent" class="event-badge">{{ activeEvent ? t(activeEvent.nameKey) : '' }}</span>
            <button class="btn-icon" @click="goToMenu">☰</button>
          </div>
        </div>
      </div>

      <!-- Bottom Tab Bar overlay -->
      <div class="tab-bar-overlay">
        <div v-if="showTutorial" class="tutorial-hint" @click="showTutorial = false">
          {{ t('tutorial') || 'Tap PRODUCE to make items, then SELL for coins!' }}
        </div>
        <div class="tab-bar">
          <button class="tab-btn active" @click="goTo('game')">🏭</button>
          <button class="tab-btn" @click="goTo('upgrades')">⬆️</button>
          <button class="tab-btn" @click="goTo('employees')">👷</button>
          <button class="tab-btn" @click="goTo('planets')">🌍</button>
          <button class="tab-btn" @click="goTo('daily')">📅</button>
          <button class="tab-btn" @click="goTo('achievements')">🏅</button>
          <button class="tab-btn" :class="{ 'btn-glow': canPrestigeNow }" @click="goTo('prestige')">⭐</button>
        </div>
      </div>
    </div>

    <!-- ============ OVERLAY SCREENS (on top of everything) ============ -->

    <!-- Upgrades -->
    <div v-if="screen === 'upgrades'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('upgrades') }}</h2>
          <span class="hud-resource coins"><span class="res-icon">💰</span> {{ formatCoins(state.coins) }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>

        <div class="upgrade-tabs"><button class="tab-pill">🏭 {{ t('productionUpgrades') }}</button></div>
        <div class="upgrade-list">
          <div v-for="upgrade in getUpgradesByCategory('production')" :key="upgrade.id"
               class="upgrade-card" :class="{ maxed: isUpgradeMaxed(state, upgrade.id) }">
            <img v-if="upgrade.icon.includes('.')" :src="upgrade.icon" class="uc-icon" />
            <span v-else class="uc-icon-emoji">{{ upgrade.icon }}</span>
            <div class="uc-info">
              <div class="uc-name">{{ upgrade.name }}</div>
              <div class="uc-desc">{{ upgrade.effect }}</div>
              <div class="uc-level">{{ t('level') }} {{ getUpgradeLevel(state, upgrade.id) }}/{{ upgrade.maxLevel }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="isUpgradeMaxed(state, upgrade.id) || state.coins < getUpgradeCost(state, upgrade.id)"
                    @click="handlePurchaseUpgrade(upgrade.id)">
              {{ isUpgradeMaxed(state, upgrade.id) ? t('maxLevel') : '💰 ' + formatCoins(getUpgradeCost(state, upgrade.id)) }}
            </button>
          </div>
        </div>

        <div class="upgrade-tabs"><button class="tab-pill">🏗️ {{ t('facilityUpgrades') }}</button></div>
        <div class="upgrade-list">
          <div v-for="upgrade in getUpgradesByCategory('facility')" :key="upgrade.id"
               class="upgrade-card" :class="{ maxed: isUpgradeMaxed(state, upgrade.id) }">
            <img v-if="upgrade.icon.includes('.')" :src="upgrade.icon" class="uc-icon" />
            <span v-else class="uc-icon-emoji">{{ upgrade.icon }}</span>
            <div class="uc-info">
              <div class="uc-name">{{ upgrade.name }}</div>
              <div class="uc-desc">{{ upgrade.effect }}</div>
              <div class="uc-level">{{ t('level') }} {{ getUpgradeLevel(state, upgrade.id) }}/{{ upgrade.maxLevel }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="isUpgradeMaxed(state, upgrade.id) || state.coins < getUpgradeCost(state, upgrade.id)"
                    @click="handlePurchaseUpgrade(upgrade.id)">
              {{ isUpgradeMaxed(state, upgrade.id) ? t('maxLevel') : '💰 ' + formatCoins(getUpgradeCost(state, upgrade.id)) }}
            </button>
          </div>
        </div>

        <div class="upgrade-tabs"><button class="tab-pill">💰 {{ t('economyUpgrades') }}</button></div>
        <div class="upgrade-list">
          <div v-for="upgrade in getUpgradesByCategory('economy')" :key="upgrade.id"
               class="upgrade-card" :class="{ maxed: isUpgradeMaxed(state, upgrade.id) }">
            <img v-if="upgrade.icon.includes('.')" :src="upgrade.icon" class="uc-icon" />
            <span v-else class="uc-icon-emoji">{{ upgrade.icon }}</span>
            <div class="uc-info">
              <div class="uc-name">{{ upgrade.name }}</div>
              <div class="uc-desc">{{ upgrade.effect }}</div>
              <div class="uc-level">{{ t('level') }} {{ getUpgradeLevel(state, upgrade.id) }}/{{ upgrade.maxLevel }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="isUpgradeMaxed(state, upgrade.id) || state.coins < getUpgradeCost(state, upgrade.id)"
                    @click="handlePurchaseUpgrade(upgrade.id)">
              {{ isUpgradeMaxed(state, upgrade.id) ? t('maxLevel') : '💰 ' + formatCoins(getUpgradeCost(state, upgrade.id)) }}
            </button>
          </div>
        </div>

        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- Employees -->
    <div v-if="screen === 'employees'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('employees') }}</h2>
          <span class="hud-resource coins"><span class="res-icon">💰</span> {{ formatCoins(state.coins) }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="employee-list">
          <div v-for="emp in EMPLOYEES" :key="emp.id" class="upgrade-card">
            <img :src="emp.icon" class="uc-icon" />
            <div class="uc-info">
              <div class="uc-name">{{ emp.name }}</div>
              <div class="uc-desc">{{ emp.effect }}</div>
              <div class="uc-level">{{ t('hired') }}: {{ getEmployeeCount(state, emp.id) }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="state.coins < getEmployeeCost(state, emp.id)"
                    @click="handleHireEmployee(emp.id)">
              💰 {{ formatCoins(getEmployeeCost(state, emp.id)) }}
            </button>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- Planets -->
    <div v-if="screen === 'planets'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('planets') }}</h2>
          <span class="hud-resource coins"><span class="res-icon">💰</span> {{ formatCoins(state.coins) }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="planet-list">
          <div v-for="planet in PLANETS" :key="planet.id"
               class="planet-card"
               :class="{ current: currentPlanetId === planet.id, locked: !state.unlockedPlanets.includes(planet.id) }">
            <img :src="planet.icon" class="pc-icon" :style="{ borderColor: planet.color }" />
            <div class="pc-info">
              <div class="pc-name">{{ planet.name }}</div>
              <div class="pc-bonus">{{ planet.specialMechanic }}</div>
              <div class="pc-lines">{{ planet.productionLines }} {{ t('production') }} lines</div>
            </div>
            <div v-if="state.unlockedPlanets.includes(planet.id)">
              <button v-if="currentPlanetId === planet.id" class="btn btn-sm btn-active" disabled>Current</button>
              <button v-else class="btn btn-sm" @click="handleTravelToPlanet(planet.id)">{{ t('travelTo') }}</button>
            </div>
            <div v-else>
              <button class="btn btn-sm btn-locked"
                      :disabled="!canUnlockPlanet(state, planet.id).can"
                      @click="handleUnlockPlanet(planet.id)">
                🔒 {{ formatCoins(getPlanetUnlockCost(planet)) }}
              </button>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- Prestige -->
    <div v-if="screen === 'prestige'" class="overlay-screen">
      <div class="overlay-content prestige-content">
        <div class="overlay-header">
          <h2>⭐ {{ t('prestige') }}</h2>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <p class="prestige-desc">{{ t('prestigeDesc') }}</p>
        <div class="prestige-grid">
          <div class="prestige-stat">
            <span class="ps-label">{{ t('coresEarned') }}</span>
            <span class="ps-value">{{ state.starDust }}</span>
          </div>
          <div class="prestige-stat">
            <span class="ps-label">{{ t('currentMult') }}</span>
            <span class="ps-value">×{{ prestigeMultDisplay }}</span>
          </div>
          <div class="prestige-stat">
            <span class="ps-label">{{ t('timesPrestiged') }}</span>
            <span class="ps-value">{{ state.prestigeCount }}</span>
          </div>
          <div class="prestige-stat">
            <span class="ps-label">{{ t('requirement') }}</span>
            <span class="ps-value">{{ formatCoins(prestigeReq) }}</span>
          </div>
        </div>
        <div v-if="canPrestigeNow" class="prestige-preview">
          +{{ earnableStardust }} ✨ Star Dust
        </div>
        <button class="btn btn-prestige" data-testid="prestige-btn"
                :disabled="!canPrestigeNow"
                @click="handlePrestige">
          {{ canPrestigeNow ? t('prestigeNow') : t('needMore').replace('{amount}', formatCoins(prestigeReq)) }}
        </button>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- Achievements -->
    <div v-if="screen === 'achievements'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('achievements') }}</h2>
          <span class="ach-count">{{ state.achievements.length }}/{{ ACHIEVEMENTS.length }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="achievement-list">
          <div v-for="ach in ACHIEVEMENTS" :key="ach.id"
               class="achievement-card" :class="{ unlocked: state.achievements.includes(ach.id) }">
            <img :src="ach.icon" class="ac-icon" />
            <div class="ac-info">
              <div class="ac-name">{{ ach.name }}</div>
              <div class="ac-desc">{{ ach.description }}</div>
            </div>
            <div class="ac-status">{{ state.achievements.includes(ach.id) ? '✅' : '🔒' }}</div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- Daily Challenge -->
    <div v-if="screen === 'daily'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>📅 {{ t('dailyChallenge') }}</h2>
          <span v-if="isDailyCompletedToday(state.lastDailyCompleted)" class="daily-done">{{ t('completedToday') }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="daily-card">
          <img :src="todayChallenge.icon" class="dc-icon" />
          <div class="dc-name">{{ todayChallenge.name }}</div>
          <div class="dc-desc">{{ todayChallenge.description }}</div>
          <div class="dc-bonus">{{ t('bonus') }}: ×{{ todayChallenge.bonusMultiplier }}</div>
          <div class="dc-streak" v-if="state.dailyStreak > 0">🔥 {{ t('streak') }}: {{ state.dailyStreak }} days</div>
        </div>
        <button v-if="!isDailyCompletedToday(state.lastDailyCompleted)" class="btn btn-primary"
                data-testid="daily-complete-btn"
                @click="handleCompleteDaily">
          {{ t('collect') }} 📅
        </button>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- Event Toast -->
    <div v-if="eventToast" class="toast event-toast">{{ eventToast }}</div>

    <!-- Achievement Toast -->
    <div v-if="achievementToast" class="toast achievement-toast">🏅 {{ achievementToast }}</div>

    <!-- Combo Display -->
    <div v-if="showCombo && comboCount >= 3" class="combo-display" :key="comboCount">
      <span class="combo-count">{{ comboCount }}x</span>
      <span class="combo-name" :style="{ color: getComboTier(comboCount).color }">{{ comboTierName }}</span>
    </div>

    <!-- Particle Effects -->
    <div class="particle-container">
      <div v-for="p in particles" :key="p.id"
           class="particle"
           :style="{
             left: p.x + 'px', top: p.y + 'px',
             backgroundColor: p.color,
             '--dx': Math.cos(p.angle) * 80 + 'px',
             '--dy': Math.sin(p.angle) * 80 + 'px',
           }">
      </div>
    </div>

    <!-- Offline Reward Popup -->
    <div v-if="showOfflineReward" class="popup-overlay">
      <div class="popup">
        <h2>{{ t('welcomeBack') }}</h2>
        <p>{{ t('offlineEarned') }}</p>
        <div class="reward-amount">💰 {{ formatCoins(offlineRewardAmount) }}</div>
        <div class="popup-buttons">
          <button class="btn btn-primary" @click="collectOfflineReward">{{ t('collect') }}</button>
          <button class="btn btn-ad" @click="collectDoubleOffline">{{ t('watchAdFor2x') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============ DESIGN TOKENS ============ */
.game-wrapper {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.35);
  --shadow-glow-cyan: 0 0 12px rgba(0, 229, 255, 0.3);
  --shadow-glow-gold: 0 0 12px rgba(255, 215, 64, 0.3);
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-bg-hover: rgba(255, 255, 255, 0.07);
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  width: 100vw; height: 100vh; overflow: hidden;
  background: linear-gradient(135deg, #0b0b2a 0%, #0d1137 50%, #0a0a2e 100%);
  font-family: 'Exo 2', sans-serif;
  color: #ffffff; position: relative;
}

/* ============ MENU ============ */
.menu-screen {
  width: 100%; height: 100%; display: flex;
  align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  animation: menu-fade-in 0.6s ease-out;
}
@keyframes menu-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.stars-bg {
  position: absolute; inset: 0;
  background-image: url('./public/assets/bg-menu.webp');
  background-size: cover; background-position: center;
  background-color: #0b0b2a;
}
.stars-bg::after {
  content: ''; position: absolute; inset: 0;
  background: rgba(11, 11, 42, 0.55);
}
.menu-content { position: relative; z-index: 1; text-align: center; }
.game-title {
  font-family: 'Orbitron', sans-serif; margin-bottom: 8px;
  animation: title-enter 0.8s ease-out;
}
@keyframes title-enter {
  from { transform: translateY(-20px) scale(0.9); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
.title-main {
  display: block; font-size: 56px; font-weight: 900;
  background: linear-gradient(135deg, #00e5ff, #aa00ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: 8px;
}
.title-sub {
  display: block; font-size: 32px; font-weight: 400;
  color: #ff4081; letter-spacing: 16px;
}
.tagline { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 24px; letter-spacing: 4px; }
.menu-stats { display: flex; gap: 20px; justify-content: center; margin-bottom: 28px; }
.stat-item {
  background: rgba(255,255,255,0.05); border-radius: 10px;
  padding: 12px 16px; display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: 1px solid rgba(255,255,255,0.1);
}
.stat-icon { font-size: 20px; }
.stat-value { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #ffd740; }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.5); }
.menu-buttons { display: flex; flex-direction: column; gap: 12px; align-items: center; }

/* ============ BUTTONS ============ */
.btn {
  border: none; border-radius: var(--radius-md); padding: 12px 32px;
  font-family: 'Exo 2', sans-serif; font-size: 16px; font-weight: 600;
  cursor: pointer; transition: all var(--transition-normal); letter-spacing: 1px;
  box-shadow: var(--shadow-sm); min-height: 44px;
}
.btn:hover { transform: translateY(-2px) scale(1.03); box-shadow: var(--shadow-md); }
.btn:active { transform: translateY(1px) scale(0.97); box-shadow: var(--shadow-sm); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-primary {
  background: linear-gradient(135deg, #00e5ff, #7b2ff7);
  color: white; padding: 16px 64px; font-size: 20px;
  box-shadow: 0 4px 20px rgba(0, 229, 255, 0.35);
}
.btn-primary:hover { box-shadow: 0 6px 28px rgba(0, 229, 255, 0.5); }
.btn-lg { padding: 16px 64px; font-size: 20px; }
.btn-secondary {
  background: var(--glass-bg); color: #00e5ff;
  border: 1px solid rgba(0,229,255,0.2); margin-top: var(--space-md); width: 100%;
  backdrop-filter: blur(8px);
}
.btn-secondary:hover { background: rgba(0, 229, 255, 0.1); }
.btn-sm { padding: 8px 16px; font-size: 13px; background: var(--glass-bg); color: white;
  border: 1px solid var(--glass-border); min-height: 36px; min-width: 36px; }
.btn-sm:hover { background: var(--glass-bg-hover); }
.btn-prestige {
  background: linear-gradient(135deg, #ffd740, #ff6d00); color: #1a0a00;
  font-size: 18px; padding: 16px 48px; width: 100%;
  box-shadow: 0 4px 20px rgba(255, 215, 64, 0.35);
}
.btn-prestige:hover { box-shadow: 0 6px 28px rgba(255, 215, 64, 0.5); }
.btn-prestige-sm {
  background: linear-gradient(135deg, #ffd740, #ff6d00); color: #1a0a00;
  font-size: 14px; padding: 10px 24px;
  box-shadow: 0 2px 12px rgba(255, 215, 64, 0.25);
}
.btn-icon {
  background: transparent; border: none; color: rgba(255,255,255,0.6);
  font-size: 22px; cursor: pointer; padding: var(--space-sm) var(--space-md);
  min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); transition: all var(--transition-fast);
}
.btn-icon:hover { background: rgba(255,255,255,0.1); color: white; }
.btn-glow { animation: glow-pulse 1.5s ease-in-out infinite; }
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(255,215,64,0.3); }
  50% { box-shadow: 0 0 20px rgba(255,215,64,0.6), 0 0 40px rgba(255,215,64,0.2); }
}
.btn-active { background: rgba(0,229,255,0.3) !important; border-color: #00e5ff !important; }
.btn-ad {
  background: linear-gradient(135deg, #ff4081, #ff6d00); color: white;
  padding: 12px 24px; font-size: 14px; border: none;
  border-radius: var(--radius-md); font-family: 'Exo 2', sans-serif;
  font-weight: 600; cursor: pointer; transition: all var(--transition-normal);
  box-shadow: 0 2px 12px rgba(255, 64, 129, 0.3);
}
.btn-ad:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 4px 20px rgba(255, 64, 129, 0.5); }
.btn-ad:active { transform: translateY(1px) scale(0.97); }
.btn-boost {
  background: rgba(255,215,64,0.15); border: 1px solid rgba(255,215,64,0.3);
  color: #ffd740; font-size: 16px; padding: 6px 10px; cursor: pointer;
  border-radius: var(--radius-sm); transition: all var(--transition-normal);
  min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
  font-family: 'Exo 2', sans-serif; font-weight: 600;
}
.btn-boost:hover { background: rgba(255,215,64,0.25); transform: scale(1.05); }
.btn-boost.active {
  background: rgba(255,215,64,0.35); border-color: #ffd740;
  animation: boost-pulse 1s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(255,215,64,0.4);
}
@keyframes boost-pulse { 0%, 100% { box-shadow: 0 0 8px rgba(255,215,64,0.3); } 50% { box-shadow: 0 0 20px rgba(255,215,64,0.6); } }

/* ============ TUTORIAL HINT ============ */
.tutorial-hint {
  background: linear-gradient(135deg, rgba(0,229,255,0.2), rgba(170,0,255,0.2));
  border: 1px solid rgba(0,229,255,0.4); border-radius: 8px;
  padding: 10px 16px; margin: 0 12px 6px;
  font-size: 13px; color: #00e5ff; text-align: center;
  cursor: pointer; animation: tutorial-pulse 2s ease-in-out infinite;
  backdrop-filter: blur(8px);
}
@keyframes tutorial-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(0,229,255,0.2); }
  50% { box-shadow: 0 0 16px rgba(0,229,255,0.4); }
}

/* ============ GAME SCREEN ============ */
.game-screen { width: 100%; height: 100%; position: relative; }

.phaser-container {
  width: 100%; height: 100%;
  position: absolute; inset: 0;
}

/* Vue HUD overlay — sits on top of Phaser canvas */
.hud-overlay {
  position: absolute; top: 0; left: 0; right: 0;
  z-index: 10; pointer-events: none;
}
.hud-overlay > * { pointer-events: auto; }
.hud-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(180deg, rgba(11,11,42,0.95), rgba(11,11,42,0.7));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.hud-left { display: flex; gap: var(--space-md); align-items: center; }
.hud-right { display: flex; gap: var(--space-sm); align-items: center; }
.hud-resource {
  display: flex; align-items: center; gap: var(--space-xs);
  font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 600;
  background: rgba(0,0,0,0.25); padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);
}
.hud-resource.coins .res-value { color: #ffd740; }
.hud-resource.output .res-value { color: #00e676; }
.hud-resource.stardust .res-value { color: #e040fb; }
.event-badge {
  background: rgba(255,64,129,0.15); border: 1px solid rgba(255,64,129,0.4);
  color: #ff80ab; padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full); font-size: 12px;
  animation: event-flash 1.5s ease-in-out infinite;
  backdrop-filter: blur(6px);
}
@keyframes event-flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

/* Vue Tab bar overlay — sits at the bottom */
.tab-bar-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  z-index: 10; pointer-events: none;
}
.tab-bar-overlay > * { pointer-events: auto; }
.tab-bar {
  display: flex; justify-content: space-around;
  padding: var(--space-sm) var(--space-xs);
  background: rgba(11,11,42,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.08);
}
.tab-btn {
  background: transparent; border: none; font-size: 22px;
  padding: var(--space-sm) var(--space-md); cursor: pointer; opacity: 0.5;
  transition: all var(--transition-normal); border-radius: var(--radius-sm);
  min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
}
.tab-btn:hover { opacity: 1; background: rgba(255,255,255,0.08); transform: translateY(-1px); }
.tab-btn.active { opacity: 1; background: rgba(0,229,255,0.12); box-shadow: inset 0 -2px 0 #00e5ff; }

/* ============ OVERLAY SCREENS ============ */
.overlay-screen {
  position: absolute; inset: 0; background: rgba(11,11,42,0.97); z-index: 20;
  display: flex; align-items: center; justify-content: center;
  animation: overlay-slide-in 0.3s ease-out;
}
@keyframes overlay-slide-in {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.overlay-content { width: 92%; max-width: 480px; max-height: 85vh; overflow-y: auto; padding: 20px; }
.overlay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.overlay-header h2 { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #00e5ff; }

.upgrade-tabs { margin-bottom: 8px; }
.tab-pill { background: rgba(0,229,255,0.1); color: #00e5ff; border: 1px solid rgba(0,229,255,0.2); border-radius: 20px; padding: 6px 16px; font-size: 13px; font-weight: 600; font-family: 'Exo 2', sans-serif; }
.upgrade-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.upgrade-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
.upgrade-card.maxed { border-color: rgba(255,215,64,0.3); background: rgba(255,215,64,0.05); }
.uc-icon { width: 36px; height: 36px; object-fit: contain; border-radius: 6px; }
.uc-icon-emoji { font-size: 24px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.uc-info { flex: 1; }
.uc-name { font-weight: 600; font-size: 14px; }
.uc-desc { font-size: 11px; color: rgba(255,255,255,0.5); }
.uc-level { font-size: 11px; color: rgba(255,255,255,0.4); }
.employee-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }

.planet-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.planet-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; }
.planet-card.current { border-color: #00e5ff; background: rgba(0,229,255,0.08); }
.planet-card.locked { opacity: 0.5; }
.pc-icon { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; border: 2px solid rgba(255,255,255,0.2); }
.pc-info { flex: 1; }
.pc-name { font-weight: 600; font-size: 15px; }
.pc-bonus { font-size: 12px; color: rgba(255,255,255,0.5); }
.pc-lines { font-size: 11px; color: rgba(255,255,255,0.4); }
.btn-locked { opacity: 0.7; }

.prestige-content { text-align: center; }
.prestige-desc { color: rgba(255,255,255,0.7); margin-bottom: 20px; line-height: 1.6; }
.prestige-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.prestige-stat { background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; }
.ps-label { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
.ps-value { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #ffd740; }
.prestige-preview { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #ffd740; margin-bottom: 16px; }

.ach-count { font-size: 13px; color: rgba(255,255,255,0.6); }
.achievement-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.achievement-card { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; opacity: 0.5; }
.achievement-card.unlocked { opacity: 1; border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.05); }
.ac-icon { width: 36px; height: 36px; object-fit: contain; border-radius: 6px; }
.ac-info { flex: 1; }
.ac-name { font-weight: 600; font-size: 14px; }
.ac-desc { font-size: 11px; color: rgba(255,255,255,0.5); }
.ac-status { font-size: 18px; }

.daily-done { color: #00e676; font-size: 13px; font-weight: 600; }
.daily-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(0,229,255,0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 16px; }
.dc-icon { width: 72px; height: 72px; object-fit: contain; margin-bottom: 8px; border-radius: 12px; }
.dc-name { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #00e5ff; margin-bottom: 8px; }
.dc-desc { color: rgba(255,255,255,0.8); margin-bottom: 8px; }
.dc-bonus { color: #ffd740; font-weight: 600; margin-bottom: 8px; }
.dc-streak { color: #ff6d00; font-weight: 600; }

/* ============ TOASTS ============ */
.toast { position: fixed; top: 15%; left: 50%; transform: translateX(-50%); padding: 14px 28px; border-radius: 12px; font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 700; z-index: 100; animation: toast-pop 0.4s ease-out; white-space: nowrap; }
.event-toast { background: linear-gradient(135deg, #ff4081, #ff6d00); color: white; }
.achievement-toast { background: linear-gradient(135deg, #00e5ff, #aa00ff); color: white; }
@keyframes toast-pop { 0% { transform: translateX(-50%) scale(0); opacity: 0; } 60% { transform: translateX(-50%) scale(1.15); } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }

/* ============ POPUP ============ */
.popup-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 30; display: flex; align-items: center; justify-content: center; }
.popup { background: #1a1a4e; border: 1px solid rgba(0,229,255,0.3); border-radius: 16px; padding: 32px; text-align: center; max-width: 320px; }
.popup h2 { font-family: 'Orbitron', sans-serif; color: #00e5ff; margin-bottom: 8px; }
.reward-amount { font-family: 'Orbitron', sans-serif; font-size: 28px; color: #ffd740; margin: 16px 0 24px; }
.popup-buttons { display: flex; flex-direction: column; gap: 10px; align-items: center; }

.overlay-content::-webkit-scrollbar { width: 4px; }
.overlay-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

/* ============ COMBO DISPLAY ============ */
.combo-display {
  position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
  text-align: center; z-index: 50; pointer-events: none;
  animation: combo-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.combo-count {
  display: block; font-family: 'Orbitron', sans-serif; font-size: 48px;
  font-weight: 900; color: #ffd740;
  text-shadow: 0 0 20px rgba(255,215,64,0.6), 0 0 40px rgba(255,215,64,0.3);
}
.combo-name {
  display: block; font-family: 'Orbitron', sans-serif; font-size: 18px;
  font-weight: 700; letter-spacing: 4px;
  text-shadow: 0 0 12px currentColor;
}
@keyframes combo-pop {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.2); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

/* ============ PARTICLE EFFECTS ============ */
.particle-container {
  position: fixed; inset: 0; z-index: 45; pointer-events: none; overflow: hidden;
}
.particle {
  position: absolute; width: 8px; height: 8px; border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
  animation: particle-burst 0.7s ease-out forwards;
}
@keyframes particle-burst {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}

/* ============ SCREEN SHAKE (for big moments) ============ */
@keyframes screen-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}
.shake { animation: screen-shake 0.3s ease-in-out; }

/* ============ BUTTON PRESS FEEDBACK ============ */
.btn:active, .tab-btn:active, .upgrade-card:active, .planet-card:active, .achievement-card:active {
  transform: scale(0.96) !important;
  transition: transform 0.1s ease;
}
.tab-btn:active { background: rgba(0,229,255,0.2) !important; }

@media (max-width: 600px) {
  .title-main { font-size: 36px; letter-spacing: 4px; }
  .title-sub { font-size: 22px; letter-spacing: 10px; }
  .menu-stats { flex-direction: column; gap: 8px; }
  .hud-bar { padding: 6px 10px; }
  .hud-resource { font-size: 11px; }
  .tab-btn { font-size: 18px; padding: 6px 8px; }
}
</style>
