<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Phaser from 'phaser'
import { loadState, saveState, resetState, calculateOfflineEarnings, trackPlayTime, updateGrowthStates } from './systems/GameState'
import { addCoins, spendCoins, canAfford, calcIncomePerSecond } from './systems/CurrencySystem'
import { plantFlower, harvestPot, waterPot, createDefaultPots, addPots, autoWaterPots } from './systems/GardenSystem'
import { canPrestige, performPrestige, buySunPointUpgrade, getPrestigeRequirement, calcEarnableSunPoints, getGrowthBonusPercent, getPriceBonusPercent } from './systems/PrestigeSystem'
import { getFlowerById, getAvailableFlowers } from './data/flowers'
import { getUpgradeById, getUpgradeCost, canUpgrade, UPGRADES } from './data/upgrades'
import { CONSTANTS, calcXpRequired, calcPotsForLevel } from './data/constants'
import { translations, getLocale, t as translate, type Locale } from './i18n/translations'
import { GameScene } from './phaser/scenes/GameScene'
import type { GameSceneData } from './phaser/scenes/GameScene'
import type { GameState } from './data/types'
import { AdManager } from '../../services/AdManager'

// i18n
const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('idle-garden-locale') : null
const locale = ref<Locale>(getLocale(savedLocale || navigator.language))
const t = (key: string) => translate(key, locale.value)

// Game state
const state = reactive<GameState>(loadState())

// UI state
type Screen = 'menu' | 'game' | 'shop' | 'prestige' | 'settings'
const screen = ref<Screen>('menu')
const showOfflineReward = ref(false)
const offlineRewardAmount = ref(0)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
const adManager = AdManager.getInstance()
const HARVEST_INTERSTITIAL_INTERVAL = 5
let harvestSinceLastAd = 0

// Phaser
let phaserGame: Phaser.Game | null = null
const phaserContainer = ref<HTMLDivElement>()

// Timers
let tickTimer: ReturnType<typeof setInterval> | null = null
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

// Ad callbacks — pause/resume game during ads
adManager.setAdCallbacks(
  () => { stopGameLoop() },
  () => { if (screen.value === 'game') startGameLoop() },
)

// Computed
const availableFlowers = computed(() => getAvailableFlowers(state.level, state.prestigeLevel))
const canPrestigeNow = computed(() => canPrestige(state))
const prestigeReq = computed(() => getPrestigeRequirement(state.prestigeLevel))
const earnableSP = computed(() => calcEarnableSunPoints(state.totalCoins))
const growthBonus = computed(() => getGrowthBonusPercent(state.spGrowthUpgrades))
const priceBonus = computed(() => getPriceBonusPercent(state.spPriceUpgrades))
const xpRequired = computed(() => calcXpRequired(state.level))
const xpPercent = computed(() => Math.min(1, state.experience / xpRequired.value))
const incomePerSec = computed(() => calcIncomePerSecond(state))

// ── Phaser integration ──────────────────────────────────────────

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
    backgroundColor: '#87CEEB',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
  })

  const sceneData: GameSceneData = {
    getState: () => state,
    onPlantFlower: (potId: number, flowerId: string) => {
      handlePlant(potId, flowerId)
    },
    onHarvestPot: (potId: number) => {
      handleHarvest(potId)
    },
    onWaterPot: (potId: number) => {
      handleWater(potId)
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

// ── Actions ─────────────────────────────────────────────────────

function startGame(): void {
  screen.value = 'game'

  adManager.gameplayStart()

  // Check offline earnings
  const offline = calculateOfflineEarnings(state)
  if (offline > 0) {
    offlineRewardAmount.value = offline
    showOfflineReward.value = true
    addCoins(state, offline)
  }

  startGameLoop()
  nextTick(() => { if (!phaserGame) initPhaser() })
}

function startGameLoop(): void {
  if (tickTimer) return
  tickTimer = setInterval(() => {
    trackPlayTime(state, CONSTANTS.TICK_INTERVAL)
    updateGrowthStates(state, Date.now())

    // Auto-harvest
    const autoLevel = state.upgrades['auto-harvest'] || 0
    if (autoLevel > 0) {
      for (const pot of state.pots) {
        if (pot.isReady && pot.flowerId) {
          harvestPot(state, pot.id, Date.now())
        }
      }
    }

    // Auto-water (after harvest clears pots, water remaining)
    autoWaterPots(state)

    saveState(state)
    refreshPhaser()
  }, CONSTANTS.TICK_INTERVAL)
}

function stopGameLoop(): void {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function handlePlant(potId: number, flowerId: string): void {
  if (plantFlower(state, potId, flowerId, Date.now())) {
    showToast(`Planted ${getFlowerById(flowerId)?.name}!`)
    checkLevelUp()
    saveState(state)
    refreshPhaser()
  }
}

function handleHarvest(potId: number): void {
  const earnings = harvestPot(state, potId, Date.now())
  if (earnings > 0) {
    state.experience += CONSTANTS.XP_PER_HARVEST
    checkLevelUp()
    saveState(state)
    refreshPhaser()

    // Show interstitial ad every N harvests
    harvestSinceLastAd++
    if (harvestSinceLastAd >= HARVEST_INTERSTITIAL_INTERVAL) {
      harvestSinceLastAd = 0
      adManager.requestMidgameAd()
    }
  }
}

function handleWater(potId: number): void {
  if (waterPot(state, potId)) {
    showToast(t('watered'))
    saveState(state)
    refreshPhaser()
  }
}

function handleBuyUpgrade(upgradeId: string): void {
  const upgrade = getUpgradeById(upgradeId)
  if (!upgrade) return
  const currentLevel = state.upgrades[upgradeId] || 0
  const cost = getUpgradeCost(upgradeId, currentLevel)

  if (!canUpgrade(upgradeId, currentLevel, state.coins)) return

  if (spendCoins(state, cost)) {
    state.upgrades[upgradeId] = currentLevel + 1

    // Garden expansion: add pots
    if (upgradeId === 'garden') {
      state.gardenLevel = currentLevel + 1
      const newPots = calcPotsForLevel(state.gardenLevel)
      while (state.pots.length < newPots) {
        addPots(state, 1)
      }
    }

    saveState(state)
    refreshPhaser()
  }
}

function handlePrestige(): void {
  const earned = performPrestige(state)
  if (earned > 0) {
    showToast(`⭐ +${earned} Sun Points!`)
    saveState(state)
    refreshPhaser()
  }
}

function handleBuySP(type: 'growth' | 'price'): void {
  if (buySunPointUpgrade(state, type)) {
    saveState(state)
  }
}

function checkLevelUp(): void {
  while (state.experience >= xpRequired.value) {
    state.experience -= xpRequired.value
    state.level += 1
    showToast(`Level ${state.level}!`)

    // Unlock new flowers
    const flowers = getAvailableFlowers(state.level, state.prestigeLevel)
    for (const f of flowers) {
      if (!state.unlockedFlowers.includes(f.id)) {
        state.unlockedFlowers.push(f.id)
        showToast(`Unlocked: ${f.name}!`)
      }
    }
  }
}

function showToast(msg: string): void {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 2000)
}

function collectOfflineReward(): void {
  showOfflineReward.value = false
}

async function watchAdFor2x(): Promise<void> {
  const rewarded = await adManager.requestRewardedAd()
  if (rewarded) {
    const bonus = Math.floor(offlineRewardAmount.value)
    addCoins(state, bonus)
    showToast(`💰 +${formatCoins(bonus)} (2x Bonus!)`)
    saveState(state)
  }
  showOfflineReward.value = false
}

function goToMenu(): void {
  screen.value = 'menu'
  stopGameLoop()
  destroyPhaser()
  saveState(state)
  adManager.gameplayStop()
}

function handleResetProgress(): void {
  if (!window.confirm(t('resetConfirm'))) return
  const fresh = resetState()
  Object.assign(state, fresh)
  saveState(state)
  showToast(t('settings') + ' ✓')
}

function handleChangeLocale(newLocale: Locale): void {
  locale.value = newLocale
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('idle-garden-locale', newLocale)
  }
}

function formatCoins(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

onMounted(() => {
  autoSaveTimer = setInterval(() => saveState(state), CONSTANTS.AUTO_SAVE_INTERVAL)
  window.addEventListener('beforeunload', () => saveState(state))
})

onUnmounted(() => {
  stopGameLoop()
  destroyPhaser()
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  saveState(state)
})
</script>

<template>
  <div class="game-wrapper">
    <!-- MENU SCREEN -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-bg"></div>
      <div class="menu-content">
        <h1 class="game-title">
          <span class="title-main">IDLE GARDEN</span>
          <span class="title-sub">TYCOON</span>
        </h1>

        <div class="menu-stats" v-if="state.stats.totalFlowersGrown > 0">
          <div class="stat-item">
            <span class="stat-icon">🌻</span>
            <span class="stat-value">{{ state.stats.totalFlowersGrown }}</span>
            <span class="stat-label">{{ t('totalFlowers') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💰</span>
            <span class="stat-value">{{ formatCoins(state.stats.totalCoinsEarned) }}</span>
            <span class="stat-label">{{ t('totalEarned') }}</span>
          </div>
          <div class="stat-item" v-if="state.sunPoints > 0">
            <span class="stat-icon">☀️</span>
            <span class="stat-value">{{ state.sunPoints }}</span>
            <span class="stat-label">{{ t('sunPoints') }}</span>
          </div>
        </div>

        <div class="menu-buttons">
          <button class="btn btn-play" data-testid="start-btn" @click="startGame">
            {{ state.stats.totalFlowersGrown > 0 ? t('continue') : t('start') }}
          </button>
        </div>
      </div>
    </div>

    <!-- GAME SCREEN -->
    <div v-show="screen === 'game'" class="game-screen">
      <div ref="phaserContainer" class="phaser-container"></div>

      <!-- HUD Overlay -->
      <div class="hud-overlay">
        <div class="hud-bar">
          <div class="hud-left">
            <div class="hud-coins" data-testid="coin-display">
              <span class="hud-icon">💰</span>
              <span class="hud-value">{{ formatCoins(state.coins) }}</span>
            </div>
            <div class="hud-xp">
              <span class="hud-icon">⭐</span>
              <span class="hud-value">Lv.{{ state.level }}</span>
              <div class="xp-bar">
                <div class="xp-fill" :style="{ width: (xpPercent * 100) + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="hud-right">
            <button class="btn-icon" @click="screen = 'settings'">⚙️</button>
            <button class="btn-icon" @click="goToMenu">☰</button>
          </div>
        </div>
      </div>

      <!-- Bottom Tab Bar -->
      <div class="tab-bar-overlay">
        <div class="tab-bar">
          <button class="tab-btn active">🌻 {{ t('garden') }}</button>
          <button class="tab-btn" @click="screen = 'shop'">🏪 {{ t('shop') }}</button>
          <button class="tab-btn" :class="{ 'btn-glow': canPrestigeNow }" @click="screen = 'prestige'">☀️ {{ t('prestige') }}</button>
        </div>
      </div>
    </div>

    <!-- SHOP OVERLAY -->
    <div v-if="screen === 'shop'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>🏪 {{ t('shop') }}</h2>
          <span class="overlay-coins">💰 {{ formatCoins(state.coins) }}</span>
          <button class="btn-icon" @click="screen = 'game'; nextTick(() => refreshPhaser())">✕</button>
        </div>

        <!-- Seed Shop -->
        <h3 class="section-title">🌱 {{ t('seedShop') }}</h3>
        <div class="shop-list">
          <div v-for="flower in availableFlowers" :key="flower.id" class="shop-card">
            <div class="sc-info">
              <div class="sc-name">{{ t(flower.id) || flower.name }}</div>
              <div class="sc-detail">⏱ {{ flower.growTime }}s  →  💰 {{ flower.sellPrice }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="state.coins < flower.seedCost"
                    @click="handlePlant(state.pots.find(p => !p.flowerId)?.id ?? -1, flower.id)">
              💰 {{ flower.seedCost }}
            </button>
          </div>
        </div>

        <!-- Upgrades -->
        <h3 class="section-title">⬆️ {{ t('upgrade') }}</h3>
        <div class="shop-list">
          <div v-for="upgrade in UPGRADES" :key="upgrade.id" class="shop-card"
               :class="{ maxed: (state.upgrades[upgrade.id] || 0) >= upgrade.maxLevel }">
            <div class="sc-info">
              <div class="sc-name">{{ t(upgrade.id.replace(/-/g, '')) || upgrade.name }}</div>
              <div class="sc-desc">{{ upgrade.description }}</div>
              <div class="sc-level">Lv. {{ state.upgrades[upgrade.id] || 0 }} / {{ upgrade.maxLevel }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="(state.upgrades[upgrade.id] || 0) >= upgrade.maxLevel || state.coins < getUpgradeCost(upgrade.id, state.upgrades[upgrade.id] || 0)"
                    @click="handleBuyUpgrade(upgrade.id)">
              {{ (state.upgrades[upgrade.id] || 0) >= upgrade.maxLevel ? t('maxLevel') : '💰 ' + formatCoins(getUpgradeCost(upgrade.id, state.upgrades[upgrade.id] || 0)) }}
            </button>
          </div>
        </div>

        <button class="btn btn-back" @click="screen = 'game'; nextTick(() => refreshPhaser())">{{ t('back') }}</button>
      </div>
    </div>

    <!-- PRESTIGE OVERLAY -->
    <div v-if="screen === 'prestige'" class="overlay-screen">
      <div class="overlay-content prestige-content">
        <div class="overlay-header">
          <h2>☀️ {{ t('prestige') }}</h2>
          <button class="btn-icon" @click="screen = 'game'; nextTick(() => refreshPhaser())">✕</button>
        </div>

        <p class="prestige-desc">{{ t('prestigeDesc') }}</p>

        <div class="prestige-grid">
          <div class="prestige-stat">
            <span class="ps-label">{{ t('sunPoints') }}</span>
            <span class="ps-value">☀️ {{ state.sunPoints }}</span>
          </div>
          <div class="prestige-stat">
            <span class="ps-label">{{ t('prestigeCount') }}</span>
            <span class="ps-value">{{ state.prestigeCount }}</span>
          </div>
          <div class="prestige-stat">
            <span class="ps-label">{{ t('growthBoost') }}</span>
            <span class="ps-value">+{{ growthBonus }}%</span>
          </div>
          <div class="prestige-stat">
            <span class="ps-label">{{ t('priceBoost') }}</span>
            <span class="ps-value">+{{ priceBonus }}%</span>
          </div>
        </div>

        <!-- Sun Point Upgrades -->
        <div class="sp-upgrades">
          <button class="btn btn-sp" :disabled="state.sunPoints <= 0"
                  @click="handleBuySP('growth')">
            ☀️ +5% Growth ({{ state.spGrowthUpgrades }}/50)
          </button>
          <button class="btn btn-sp" :disabled="state.sunPoints <= 0"
                  @click="handleBuySP('price')">
            ☀️ +10% Price ({{ state.spPriceUpgrades }}/50)
          </button>
        </div>

        <div v-if="canPrestigeNow" class="prestige-preview">
          +{{ earnableSP }} ☀️ Sun Points
        </div>

        <button class="btn btn-prestige" data-testid="prestige-btn"
                :disabled="!canPrestigeNow"
                @click="handlePrestige">
          {{ canPrestigeNow ? t('prestigeNow') : t('needMore').replace('{amount}', formatCoins(prestigeReq)) }}
        </button>

        <button class="btn btn-back" @click="screen = 'game'; nextTick(() => refreshPhaser())">{{ t('back') }}</button>
      </div>
    </div>

    <!-- SETTINGS OVERLAY -->
    <div v-if="screen === 'settings'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>⚙️ {{ t('settings') }}</h2>
          <button class="btn-icon" @click="screen = 'game'; nextTick(() => refreshPhaser())">✕</button>
        </div>

        <!-- Language -->
        <h3 class="section-title">🌐 {{ t('language') }}</h3>
        <div class="lang-grid">
          <button v-for="loc in (['en','pt','es','id','tr','ru'] as Locale[])"
                  :key="loc"
                  class="btn btn-lang"
                  :class="{ active: locale === loc }"
                  @click="handleChangeLocale(loc)">
            {{ { en: 'English', pt: 'Português', es: 'Español', id: 'Bahasa', tr: 'Türkçe', ru: 'Русский' }[loc] }}
          </button>
        </div>

        <!-- Reset -->
        <h3 class="section-title" style="margin-top: 24px;">⚠️ {{ t('resetProgress') }}</h3>
        <button class="btn btn-reset" @click="handleResetProgress">{{ t('resetProgress') }}</button>

        <button class="btn btn-back" @click="screen = 'game'; nextTick(() => refreshPhaser())">{{ t('back') }}</button>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
    </Transition>

    <!-- Offline Reward Popup -->
    <div v-if="showOfflineReward" class="popup-overlay">
      <div class="popup">
        <h2>{{ t('welcomeBack') }}</h2>
        <p>{{ t('offlineEarned') }}</p>
        <div class="reward-amount">💰 {{ formatCoins(offlineRewardAmount) }}</div>
        <div class="popup-buttons">
          <button class="btn btn-play" @click="collectOfflineReward">{{ t('collect') }}</button>
          <button class="btn btn-ad" @click="watchAdFor2x">🎬 {{ t('watchAdFor2x') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper {
  --green-1: #2d5a3f;
  --green-2: #4CAF50;
  --green-3: #66BB6A;
  --gold: #FFD740;
  --gold-dark: #FFC107;
  --radius: 12px;
  --shadow: 0 4px 12px rgba(0,0,0,0.25);
  width: 100vw; height: 100vh; overflow: hidden;
  background: linear-gradient(135deg, #1a4d2e 0%, #2d5a3f 50%, #1a4d2e 100%);
  font-family: 'Nunito', sans-serif;
  color: #fff; position: relative;
}

/* MENU */
.menu-screen {
  width: 100%; height: 100%; display: flex;
  align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.menu-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #1a4d2e, #2d5a3f, #388E3C);
  background-size: cover; background-position: center;
}
.menu-bg::after {
  content: ''; position: absolute; inset: 0;
  background: rgba(26, 77, 46, 0.4);
}
.menu-content { position: relative; z-index: 1; text-align: center; }
.game-title { margin-bottom: 12px; }
.title-main {
  display: block; font-family: 'Fredoka One', cursive; font-size: 48px;
  background: linear-gradient(135deg, #66BB6A, #FFD740);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: 4px;
}
.title-sub {
  display: block; font-family: 'Fredoka One', cursive; font-size: 28px;
  color: var(--gold); letter-spacing: 12px;
}
.menu-stats { display: flex; gap: 16px; justify-content: center; margin-bottom: 24px; }
.stat-item {
  background: rgba(255,255,255,0.08); border-radius: 10px;
  padding: 10px 14px; display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: 1px solid rgba(255,255,255,0.12);
}
.stat-icon { font-size: 20px; }
.stat-value { font-family: 'Fredoka One', cursive; font-size: 18px; color: var(--gold); }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.6); }
.menu-buttons { display: flex; flex-direction: column; gap: 12px; align-items: center; }

/* BUTTONS */
.btn {
  border: none; border-radius: var(--radius); padding: 12px 32px;
  font-family: 'Fredoka One', cursive; font-size: 16px;
  cursor: pointer; transition: all 0.2s ease; min-height: 44px;
  box-shadow: var(--shadow);
}
.btn:hover { transform: translateY(-2px) scale(1.03); }
.btn:active { transform: translateY(1px) scale(0.97); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-play {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: white; padding: 16px 64px; font-size: 22px;
  box-shadow: 0 4px 20px rgba(76,175,80,0.4);
}
.btn-sm { padding: 8px 16px; font-size: 13px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.15); }
.btn-back { background: rgba(255,255,255,0.08); color: #66BB6A; border: 1px solid rgba(76,175,80,0.3); width: 100%; margin-top: 12px; }
.btn-prestige {
  background: linear-gradient(135deg, #FFD740, #FF9800); color: #1a0a00;
  font-size: 18px; padding: 16px 48px; width: 100%;
  box-shadow: 0 4px 20px rgba(255,215,64,0.35);
}
.btn-sp {
  background: rgba(255,215,64,0.12); color: var(--gold);
  border: 1px solid rgba(255,215,64,0.3); font-size: 14px;
  flex: 1;
}
.btn-glow { animation: glow-pulse 1.5s ease-in-out infinite; }
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(255,215,64,0.3); }
  50% { box-shadow: 0 0 20px rgba(255,215,64,0.6); }
}
.btn-icon {
  background: transparent; border: none; color: rgba(255,255,255,0.6);
  font-size: 22px; cursor: pointer; padding: 8px 12px;
  min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; transition: all 0.15s;
}
.btn-icon:hover { background: rgba(255,255,255,0.1); color: white; }

/* GAME SCREEN */
.game-screen { width: 100%; height: 100%; position: relative; }
.phaser-container { width: 100%; height: 100%; position: absolute; inset: 0; }

.hud-overlay { position: absolute; top: 0; left: 0; right: 0; z-index: 10; pointer-events: none; }
.hud-overlay > * { pointer-events: auto; }
.hud-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 12px;
  background: linear-gradient(180deg, rgba(26,77,46,0.95), rgba(26,77,46,0.7));
  backdrop-filter: blur(12px);
}
.hud-left { display: flex; gap: 12px; align-items: center; }
.hud-right { display: flex; gap: 8px; align-items: center; }
.hud-coins, .hud-xp {
  display: flex; align-items: center; gap: 4px;
  font-family: 'Fredoka One', cursive; font-size: 14px;
  background: rgba(0,0,0,0.25); padding: 4px 10px;
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
}
.hud-coins .hud-value { color: var(--gold); }
.hud-xp .hud-value { color: #81C784; }
.hud-icon { font-size: 14px; }
.xp-bar { width: 50px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; margin-left: 4px; }
.xp-fill { height: 100%; background: linear-gradient(90deg, #66BB6A, #FFD740); border-radius: 2px; transition: width 0.3s; }

.tab-bar-overlay { position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; pointer-events: none; }
.tab-bar-overlay > * { pointer-events: auto; }
.tab-bar {
  display: flex; justify-content: space-around;
  padding: 8px 4px;
  background: rgba(26,77,46,0.95); backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.08);
}
.tab-btn {
  background: transparent; border: none; font-size: 14px;
  font-family: 'Fredoka One', cursive;
  padding: 8px 12px; cursor: pointer; opacity: 0.5;
  color: white; border-radius: 8px; min-width: 44px; min-height: 44px;
  transition: all 0.2s;
}
.tab-btn:hover { opacity: 1; background: rgba(255,255,255,0.08); }
.tab-btn.active { opacity: 1; background: rgba(76,175,80,0.2); box-shadow: inset 0 -2px 0 #4CAF50; }

/* OVERLAY SCREENS */
.overlay-screen {
  position: absolute; inset: 0; background: rgba(26,77,46,0.97); z-index: 20;
  display: flex; align-items: center; justify-content: center;
  animation: overlay-in 0.3s ease-out;
}
@keyframes overlay-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.overlay-content { width: 92%; max-width: 480px; max-height: 85vh; overflow-y: auto; padding: 20px; }
.overlay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 8px; }
.overlay-header h2 { font-family: 'Fredoka One', cursive; font-size: 22px; color: var(--gold); }
.overlay-coins { font-family: 'Fredoka One', cursive; font-size: 16px; color: var(--gold); }

.section-title {
  font-family: 'Fredoka One', cursive; font-size: 16px; color: #81C784;
  margin: 16px 0 8px;
}
.shop-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.shop-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
}
.shop-card.maxed { border-color: rgba(255,215,64,0.3); background: rgba(255,215,64,0.05); }
.sc-info { flex: 1; }
.sc-name { font-family: 'Fredoka One', cursive; font-size: 14px; }
.sc-desc { font-size: 11px; color: rgba(255,255,255,0.5); }
.sc-detail { font-size: 12px; color: rgba(255,255,255,0.6); }
.sc-level { font-size: 11px; color: rgba(255,255,255,0.4); }

.prestige-content { text-align: center; }
.prestige-desc { color: rgba(255,255,255,0.7); margin-bottom: 16px; line-height: 1.6; }
.prestige-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.prestige-stat { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; }
.ps-label { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
.ps-value { font-family: 'Fredoka One', cursive; font-size: 18px; color: var(--gold); }
.sp-upgrades { display: flex; gap: 8px; margin-bottom: 16px; }
.prestige-preview { font-family: 'Fredoka One', cursive; font-size: 22px; color: var(--gold); margin-bottom: 12px; }

/* SETTINGS */
.lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-lang {
  background: rgba(255,255,255,0.06); color: #ccc;
  border: 1px solid rgba(255,255,255,0.1); padding: 10px 12px;
  font-family: 'Nunito', sans-serif; font-size: 14px;
}
.btn-lang.active {
  background: rgba(76,175,80,0.2); color: #81C784;
  border-color: #4CAF50; box-shadow: inset 0 0 0 1px #4CAF50;
}
.btn-reset {
  background: rgba(231,76,60,0.15); color: #E74C3C;
  border: 1px solid rgba(231,76,60,0.3); width: 100%; margin-top: 8px;
}
.btn-reset:hover { background: rgba(231,76,60,0.25); }

/* TOAST */
.toast {
  position: fixed; top: 15%; left: 50%; transform: translateX(-50%);
  padding: 12px 24px; border-radius: 12px;
  font-family: 'Fredoka One', cursive; font-size: 16px;
  background: linear-gradient(135deg, #4CAF50, #66BB6A); color: white;
  z-index: 100; animation: toast-pop 0.3s ease-out;
  box-shadow: 0 4px 20px rgba(76,175,80,0.4);
}
@keyframes toast-pop { 0% { transform: translateX(-50%) scale(0.8); opacity: 0; } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }
.toast-enter-active { animation: toast-pop 0.3s; }
.toast-leave-active { animation: toast-pop 0.3s reverse; }

/* POPUP */
.popup-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 30; display: flex; align-items: center; justify-content: center; }
.popup { background: var(--green-1); border: 1px solid rgba(76,175,80,0.4); border-radius: 16px; padding: 32px; text-align: center; max-width: 320px; }
.popup h2 { font-family: 'Fredoka One', cursive; color: var(--gold); margin-bottom: 8px; }
.popup p { color: rgba(255,255,255,0.7); margin-bottom: 8px; }
.reward-amount { font-family: 'Fredoka One', cursive; font-size: 28px; color: var(--gold); margin: 16px 0 20px; }
.popup-buttons { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.btn-ad {
  background: linear-gradient(135deg, #FF6B9D, #FF8A65); color: #fff;
  border: none; border-radius: var(--radius); padding: 10px 20px;
  font-family: 'Fredoka One', cursive; font-size: 14px;
  cursor: pointer; transition: all 0.2s ease; min-height: 44px;
  box-shadow: 0 4px 12px rgba(255,107,157,0.3);
}
.btn-ad:hover { transform: translateY(-2px) scale(1.03); }

.overlay-content::-webkit-scrollbar { width: 4px; }
.overlay-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

@media (max-width: 600px) {
  .title-main { font-size: 32px; letter-spacing: 2px; }
  .title-sub { font-size: 20px; letter-spacing: 8px; }
  .menu-stats { flex-direction: column; gap: 8px; }
  .hud-bar { padding: 4px 8px; }
  .tab-btn { font-size: 12px; padding: 6px 8px; }
}
</style>
