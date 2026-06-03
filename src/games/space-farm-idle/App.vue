<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { AdManager } from '../../services/AdManager'
import { audioEngine } from '@shared/phaser/audio'
import { loadState, saveState, calculateOfflineEarnings, calcBaseIncome, getUpgradeMultiplier, getWeatherMultiplier, tickWeather, trackPlayTime, type GameState } from './logic/game-state'
import { CONSTANTS } from './data/constants'
import { CROPS, getCropsForPlanet, getCropById, type Crop } from './data/crops'
import { PLANETS } from './data/planets'
import { WEATHERS, type WeatherType } from './data/weather'
import { UPGRADES, getUpgradeCost, type Upgrade } from './data/upgrades'
import { plantCrop, harvestCrop, getGrowthProgress, isFullyGrown, autoHarvestTick, autoPlantTick, MAX_SLOTS } from './logic/farming'
import { canPrestige, calcCosmicSeedsEarned, performPrestige, getPrestigeRequirement, checkPlanetUnlocks } from './logic/prestige'
import { translations, getLocale, type Locale } from './i18n/translations'

const adManager = AdManager.getInstance()

// i18n
const locale = ref<Locale>(getLocale())
const t = (key: string) => translations[locale.value][key] || translations['en'][key] || key

// Game state
const state = reactive<GameState>(loadState())

// UI state
type Screen = 'menu' | 'game' | 'upgrades' | 'planets' | 'prestige'
const screen = ref<Screen>('menu')
const showOfflineReward = ref(false)
const offlineRewardAmount = ref(0)
const showTutorial = ref(state.totalHarvests === 0)
const weatherToast = ref('')
const harvestToast = ref('')
let harvestToastTimer: ReturnType<typeof setTimeout> | null = null

// Growth progress tracking (updated every 100ms for smooth bars)
const growthProgress = ref<number[]>([])

// Timers
let tickTimer: ReturnType<typeof setInterval> | null = null
let growthTimer: ReturnType<typeof setInterval> | null = null
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

// Midgame ad tracking
let harvestCount = 0

// Computed
const availableCrops = computed(() => getCropsForPlanet(state.currentPlanet))
const currentPlanetData = computed(() => PLANETS.find(p => p.id === state.currentPlanet)!)
const canPrestigeNow = computed(() => canPrestige(state))
const prestigeReq = computed(() => getPrestigeRequirement())
const earnableSeeds = computed(() => calcCosmicSeedsEarned(state))
const incomePerSec = computed(() => calcBaseIncome(state))
const weatherData = computed(() => WEATHERS.find(w => w.type === state.currentWeather)!)
const slotCount = computed(() => state.cropSlots.length)

function formatCoins(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}

function updateGrowthProgress() {
  growthProgress.value = state.cropSlots.map(slot => getGrowthProgress(slot))
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
  }

  startGameLoop()
}

function startGameLoop() {
  if (tickTimer) return

  // Main game tick (1 second)
  tickTimer = setInterval(() => {
    trackPlayTime(state, CONSTANTS.TICK_INTERVAL)

    // Weather tick
    const weatherChanged = tickWeather(state, 1)
    if (weatherChanged) {
      weatherToast.value = t('weather_' + state.currentWeather)
      audioEngine.play('unlock')
      setTimeout(() => { weatherToast.value = '' }, 3000)
    }

    // Auto harvest
    const autoEarned = autoHarvestTick(state)
    if (autoEarned > 0) {
      state.coins += autoEarned
      state.totalCoins += autoEarned
    }

    // Auto plant (use best available crop for current planet)
    const crops = availableCrops.value
    if (crops.length > 0) {
      const bestCrop = crops[crops.length - 1]
      if (state.unlockedCrops.includes(bestCrop.id)) {
        autoPlantTick(state, bestCrop.id)
      }
    }

    // Planet unlocks from cosmic seeds
    checkPlanetUnlocks(state)

    saveState(state)
  }, 1000)

  // Smooth growth bar update (100ms)
  growthTimer = setInterval(() => {
    updateGrowthProgress()
  }, 100)
}

function stopGameLoop() {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null }
  if (growthTimer) { clearInterval(growthTimer); growthTimer = null }
}

function handlePlant(cropId: string) {
  const slot = plantCrop(state, cropId)
  if (slot) {
    audioEngine.play('tick')
    vibrate(10)
  }
}

function handleHarvest(index: number) {
  const earned = harvestCrop(state, index)
  if (earned > 0) {
    audioEngine.play('perfect')
    vibrate(20)

    harvestToast.value = `+${formatCoins(earned)} 💰`
    if (harvestToastTimer) clearTimeout(harvestToastTimer)
    harvestToastTimer = setTimeout(() => { harvestToast.value = '' }, 1500)

    harvestCount++
    if (harvestCount % 10 === 0) {
      adManager.requestRewardedAd()
    }
  }
}

function handlePurchaseUpgrade(upgradeId: string) {
  const upgrade = UPGRADES.find(u => u.id === upgradeId)
  if (!upgrade) return

  const level = state.upgrades[upgradeId] || 0
  if (level >= upgrade.maxLevel) return

  const cost = getUpgradeCost(upgrade.baseCost, level)
  if (state.coins < cost) return

  state.coins -= cost
  state.upgrades[upgradeId] = level + 1

  audioEngine.play('add')
  vibrate(20)
  saveState(state)
}

function handlePrestige() {
  const earned = performPrestige(state)
  if (earned > 0) {
    audioEngine.play('levelup')
    vibrate(50)
    saveState(state)
  }
}

function handleUnlockPlanet(planetId: string) {
  const planet = PLANETS.find(p => p.id === planetId)
  if (!planet) return
  if (state.unlockedPlanets.includes(planetId)) return
  if (state.cosmicSeeds < planet.unlockCosmicSeeds) return

  state.unlockedPlanets.push(planetId)
  state.currentPlanet = planetId
  state.cropSlots = []
  audioEngine.play('unlock')
  saveState(state)
}

function handleTravelToPlanet(planetId: string) {
  if (!state.unlockedPlanets.includes(planetId)) return
  state.currentPlanet = planetId
  state.cropSlots = []
  screen.value = 'game'
  saveState(state)
}

function unlockCropForPlanet(planetId: string) {
  const crops = getCropsForPlanet(planetId)
  for (const crop of crops) {
    if (!state.unlockedCrops.includes(crop.id)) {
      state.unlockedCrops.push(crop.id)
    }
  }
}

function goTo(s: Screen) { screen.value = s }
function goBack() { screen.value = 'game' }
function goToMenu() {
  screen.value = 'menu'
  adManager.gameplayStop()
  stopGameLoop()
  saveState(state)
}

function collectOfflineReward() { showOfflineReward.value = false }

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

function vibrate(ms: number = 15) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

function getGrowthPercent(index: number): number {
  return Math.floor((growthProgress.value[index] || 0) * 100)
}

function getSlotCrop(index: number): Crop | undefined {
  const slot = state.cropSlots[index]
  if (!slot) return undefined
  return getCropById(slot.cropId)
}

onMounted(() => {
  autoSaveTimer = setInterval(() => saveState(state), CONSTANTS.AUTO_SAVE_INTERVAL)
  window.addEventListener('beforeunload', () => saveState(state))

  // Unlock crops for already-unlocked planets
  for (const pid of state.unlockedPlanets) {
    unlockCropForPlanet(pid)
  }
})

onUnmounted(() => {
  stopGameLoop()
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  saveState(state)
})
</script>

<template>
  <div class="game-wrapper" :style="{ '--weather-tint': weatherData?.color || 'transparent' }">

    <!-- ============ MENU SCREEN ============ -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-bg"></div>
      <div class="menu-content">
        <h1 class="game-title">
          <span class="title-main">SPACE FARM</span>
          <span class="title-sub">IDLE</span>
        </h1>
        <p class="tagline">{{ t('tagline') }}</p>

        <div class="menu-stats" v-if="state.totalHarvests > 0">
          <div class="stat-item">
            <span class="stat-value">{{ formatCoins(state.totalCoins) }}</span>
            <span class="stat-label">{{ t('totalCoins') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ state.totalHarvests }}</span>
            <span class="stat-label">{{ t('totalHarvests') }}</span>
          </div>
          <div class="stat-item" v-if="state.cosmicSeeds > 0">
            <span class="stat-value">{{ state.cosmicSeeds }}</span>
            <span class="stat-label">{{ t('cosmicSeeds') }}</span>
          </div>
        </div>

        <div class="menu-buttons">
          <button class="btn btn-primary btn-lg" data-testid="start-btn" @click="startGame">
            {{ state.totalHarvests > 0 ? t('continue') : t('start') }}
          </button>
          <button v-if="canPrestigeNow" class="btn btn-prestige-sm" @click="startGame(); goTo('prestige')">
            {{ '⭐ ' + t('prestigeNow') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ GAME SCREEN ============ -->
    <div v-show="screen === 'game'" class="game-screen">
      <!-- Weather tint overlay -->
      <div class="weather-overlay" :style="{ background: weatherData?.color || 'transparent' }"></div>

      <!-- Top HUD -->
      <div class="hud-bar">
        <div class="hud-left">
          <div class="hud-resource coins" data-testid="coin-display">
            <span class="res-icon">💰</span>
            <span class="res-value">{{ formatCoins(state.coins) }}</span>
          </div>
          <div class="hud-resource income" v-if="incomePerSec > 0">
            <span class="res-icon">⚡</span>
            <span class="res-value">{{ formatCoins(incomePerSec) }}/s</span>
          </div>
          <div class="hud-resource seeds" v-if="state.cosmicSeeds > 0">
            <span class="res-icon">✨</span>
            <span class="res-value">{{ state.cosmicSeeds }} (×{{ state.prestigeBonus.toFixed(1) }})</span>
          </div>
        </div>
        <div class="hud-right">
          <div class="weather-badge" :class="'weather-' + state.currentWeather">
            {{ t('weather_' + state.currentWeather) }}
          </div>
          <button class="btn-icon" @click="goToMenu">☰</button>
        </div>
      </div>

      <!-- Planet name -->
      <div class="planet-label">
        <img :src="currentPlanetData?.icon" class="planet-icon-sm" />
        <span>{{ currentPlanetData?.name }}</span>
        <span class="slot-count">{{ t('slots') }}: {{ slotCount }}/{{ MAX_SLOTS }}</span>
      </div>

      <!-- Crop Slots Grid -->
      <div class="farm-grid">
        <div v-for="(slot, index) in state.cropSlots" :key="index"
             class="crop-slot" :class="{ grown: getGrowthPercent(index) >= 100 }"
             @click="getGrowthPercent(index) >= 100 ? handleHarvest(index) : null">
          <img v-if="getSlotCrop(index)" :src="getSlotCrop(index)!.icon" class="crop-img" />
          <div class="progress-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
              <circle cx="18" cy="18" r="16" fill="none" stroke-width="3"
                      :stroke="getGrowthPercent(index) >= 100 ? '#00e676' : '#00e5ff'"
                      :stroke-dasharray="(getGrowthPercent(index) / 100 * 100.53) + ' 100.53'"
                      stroke-linecap="round" transform="rotate(-90 18 18)"/>
            </svg>
          </div>
          <div class="slot-label" v-if="getGrowthPercent(index) >= 100">{{ t('harvest') }}</div>
          <div class="slot-label" v-else>{{ getGrowthPercent(index) }}%</div>
        </div>

        <!-- Empty plant slots -->
        <div v-for="i in (MAX_SLOTS - state.cropSlots.length)" :key="'empty-' + i"
             class="crop-slot empty" @click="goTo('game')">
          <span class="empty-plus">+</span>
        </div>
      </div>

      <!-- Plant crop buttons -->
      <div class="crop-palette">
        <button v-for="crop in availableCrops" :key="crop.id"
                class="crop-btn" :class="{ locked: !state.unlockedCrops.includes(crop.id) }"
                :disabled="!state.unlockedCrops.includes(crop.id) || state.cropSlots.length >= MAX_SLOTS"
                @click="handlePlant(crop.id)"
                :data-testid="'plant-' + crop.id">
          <img :src="crop.icon" class="crop-btn-img" />
          <span class="crop-btn-name">{{ crop.name }}</span>
          <span class="crop-btn-value">💰{{ crop.baseValue }}</span>
        </button>
      </div>

      <!-- Harvest toast -->
      <div v-if="harvestToast" class="toast harvest-toast">{{ harvestToast }}</div>

      <!-- Weather toast -->
      <div v-if="weatherToast" class="toast weather-toast">{{ weatherToast }}</div>

      <!-- Tutorial -->
      <div v-if="showTutorial" class="tutorial-hint" @click="showTutorial = false">
        {{ t('tutorial') }}
      </div>

      <!-- Bottom Tab Bar -->
      <div class="tab-bar">
        <button class="tab-btn active" @click="goTo('game')">🌱</button>
        <button class="tab-btn" @click="goTo('upgrades')">⬆️</button>
        <button class="tab-btn" @click="goTo('planets')">🌍</button>
        <button class="tab-btn" :class="{ 'btn-glow': canPrestigeNow }" @click="goTo('prestige')">⭐</button>
      </div>
    </div>

    <!-- ============ UPGRADES SCREEN ============ -->
    <div v-if="screen === 'upgrades'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('upgrades') }}</h2>
          <span class="hud-resource coins"><span class="res-icon">💰</span> {{ formatCoins(state.coins) }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>

        <div class="upgrade-list">
          <div v-for="upgrade in UPGRADES" :key="upgrade.id"
               class="upgrade-card" :class="{ maxed: (state.upgrades[upgrade.id] || 0) >= upgrade.maxLevel }">
            <div class="uc-info">
              <div class="uc-name">{{ t(upgrade.nameKey) }}</div>
              <div class="uc-desc">{{ upgrade.effect }}</div>
              <div class="uc-level">{{ t('level') }} {{ state.upgrades[upgrade.id] || 0 }}/{{ upgrade.maxLevel }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="(state.upgrades[upgrade.id] || 0) >= upgrade.maxLevel || state.coins < getUpgradeCost(upgrade.baseCost, state.upgrades[upgrade.id] || 0)"
                    :data-testid="'upgrade-' + upgrade.id"
                    @click="handlePurchaseUpgrade(upgrade.id)">
              {{ (state.upgrades[upgrade.id] || 0) >= upgrade.maxLevel ? t('maxLevel') : '💰 ' + formatCoins(getUpgradeCost(upgrade.baseCost, state.upgrades[upgrade.id] || 0)) }}
            </button>
          </div>
        </div>

        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- ============ PLANETS SCREEN ============ -->
    <div v-if="screen === 'planets'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('planets') }}</h2>
          <span class="hud-resource seeds" v-if="state.cosmicSeeds > 0"><span class="res-icon">✨</span> {{ state.cosmicSeeds }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>

        <div class="planet-list">
          <div v-for="planet in PLANETS" :key="planet.id"
               class="planet-card"
               :class="{ current: state.currentPlanet === planet.id, locked: !state.unlockedPlanets.includes(planet.id) }">
            <img :src="planet.icon" class="pc-icon" :style="{ borderColor: planet.color }" />
            <div class="pc-info">
              <div class="pc-name">{{ planet.name }}</div>
              <div class="pc-crops">{{ getCropsForPlanet(planet.id).map(c => c.name).join(', ') }}</div>
              <div class="pc-req" v-if="!state.unlockedPlanets.includes(planet.id)">
                🔒 {{ planet.unlockCosmicSeeds }} {{ t('cosmicSeeds') }}
              </div>
            </div>
            <div v-if="state.unlockedPlanets.includes(planet.id)">
              <button v-if="state.currentPlanet === planet.id" class="btn btn-sm btn-active" disabled>Current</button>
              <button v-else class="btn btn-sm" @click="handleTravelToPlanet(planet.id)">{{ t('back') }}</button>
            </div>
            <div v-else>
              <button class="btn btn-sm btn-locked"
                      :disabled="state.cosmicSeeds < planet.unlockCosmicSeeds"
                      @click="handleUnlockPlanet(planet.id)">
                🔒 {{ t('locked') }}
              </button>
            </div>
          </div>
        </div>

        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- ============ PRESTIGE SCREEN ============ -->
    <div v-if="screen === 'prestige'" class="overlay-screen">
      <div class="overlay-content prestige-content">
        <div class="overlay-header">
          <h2>⭐ {{ t('prestige') }}</h2>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>

        <p class="prestige-desc">{{ t('prestigeDesc') }}</p>

        <div class="prestige-grid">
          <div class="prestige-stat">
            <span class="ps-label">{{ t('cosmicSeedsEarned') }}</span>
            <span class="ps-value">{{ state.cosmicSeeds }}</span>
          </div>
          <div class="prestige-stat">
            <span class="ps-label">{{ t('currentMult') }}</span>
            <span class="ps-value">×{{ state.prestigeBonus.toFixed(1) }}</span>
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
          +{{ earnableSeeds }} ✨ {{ t('cosmicSeeds') }}
        </div>

        <button class="btn btn-prestige" data-testid="prestige-btn"
                :disabled="!canPrestigeNow"
                @click="handlePrestige">
          {{ canPrestigeNow ? t('prestigeNow') : t('needMore').replace('{amount}', formatCoins(prestigeReq)) }}
        </button>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- ============ OFFLINE REWARD POPUP ============ -->
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
.game-wrapper {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;

  width: 100vw; height: 100vh; overflow: hidden;
  background: linear-gradient(135deg, #0a1a0a 0%, #0d1137 50%, #0a0a2e 100%);
  font-family: 'Exo 2', sans-serif;
  color: #ffffff; position: relative;
}

/* ============ MENU ============ */
.menu-screen {
  width: 100%; height: 100%; display: flex;
  align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  animation: fade-in 0.6s ease-out;
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.menu-bg {
  position: absolute; inset: 0;
  background-image: url('./public/assets/bg-game.webp');
  background-size: cover; background-position: center;
  background-color: #0a1a0a;
}
.menu-bg::after {
  content: ''; position: absolute; inset: 0;
  background: rgba(10, 26, 10, 0.55);
}
.menu-content { position: relative; z-index: 1; text-align: center; }
.game-title { font-family: 'Orbitron', sans-serif; margin-bottom: 8px; }
.title-main {
  display: block; font-size: 48px; font-weight: 900;
  background: linear-gradient(135deg, #00e676, #00e5ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: 6px;
}
.title-sub {
  display: block; font-size: 28px; font-weight: 400;
  color: #ffd740; letter-spacing: 12px;
}
.tagline { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 24px; letter-spacing: 3px; }
.menu-stats { display: flex; gap: 16px; justify-content: center; margin-bottom: 24px; }
.stat-item {
  background: rgba(255,255,255,0.05); border-radius: 10px;
  padding: 10px 14px; display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: 1px solid rgba(255,255,255,0.1);
}
.stat-value { font-family: 'Orbitron', sans-serif; font-size: 16px; color: #ffd740; }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.5); }
.menu-buttons { display: flex; flex-direction: column; gap: 12px; align-items: center; }

/* ============ BUTTONS ============ */
.btn {
  border: none; border-radius: var(--radius-md); padding: 12px 32px;
  font-family: 'Exo 2', sans-serif; font-size: 16px; font-weight: 600;
  cursor: pointer; transition: all var(--transition-normal); letter-spacing: 1px;
  min-height: 44px;
}
.btn:hover { transform: translateY(-2px) scale(1.03); }
.btn:active { transform: translateY(1px) scale(0.97); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.btn-primary {
  background: linear-gradient(135deg, #00e676, #00bfa5);
  color: white; padding: 16px 64px; font-size: 20px;
  box-shadow: 0 4px 20px rgba(0, 230, 118, 0.35);
}
.btn-lg { padding: 16px 64px; font-size: 20px; }
.btn-secondary {
  background: var(--glass-bg); color: #00e676;
  border: 1px solid rgba(0,230,118,0.2); margin-top: var(--space-md); width: 100%;
}
.btn-sm { padding: 8px 16px; font-size: 13px; background: var(--glass-bg); color: white;
  border: 1px solid var(--glass-border); min-height: 36px; }
.btn-prestige {
  background: linear-gradient(135deg, #ffd740, #ff6d00); color: #1a0a00;
  font-size: 18px; padding: 16px 48px; width: 100%;
  box-shadow: 0 4px 20px rgba(255, 215, 64, 0.35);
}
.btn-prestige-sm {
  background: linear-gradient(135deg, #ffd740, #ff6d00); color: #1a0a00;
  font-size: 14px; padding: 10px 24px;
}
.btn-icon {
  background: transparent; border: none; color: rgba(255,255,255,0.6);
  font-size: 22px; cursor: pointer; padding: var(--space-sm);
  min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
}
.btn-icon:hover { background: rgba(255,255,255,0.1); color: white; }
.btn-glow { animation: glow-pulse 1.5s ease-in-out infinite; }
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(255,215,64,0.3); }
  50% { box-shadow: 0 0 20px rgba(255,215,64,0.6); }
}
.btn-active { background: rgba(0,230,118,0.3) !important; border-color: #00e676 !important; }
.btn-ad {
  background: linear-gradient(135deg, #ff4081, #ff6d00); color: white;
  padding: 12px 24px; font-size: 14px; border: none;
  border-radius: var(--radius-md); font-family: 'Exo 2', sans-serif;
  font-weight: 600; cursor: pointer;
}
.btn-locked { opacity: 0.7; }

/* ============ GAME SCREEN ============ */
.game-screen { width: 100%; height: 100%; position: relative; display: flex; flex-direction: column; }
.weather-overlay {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  transition: background 1s ease;
}

/* HUD */
.hud-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(180deg, rgba(10,26,10,0.95), rgba(10,26,10,0.7));
  backdrop-filter: blur(12px); z-index: 10;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.hud-left { display: flex; gap: var(--space-sm); align-items: center; }
.hud-right { display: flex; gap: var(--space-sm); align-items: center; }
.hud-resource {
  display: flex; align-items: center; gap: var(--space-xs);
  font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 600;
  background: rgba(0,0,0,0.25); padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);
}
.hud-resource.coins .res-value { color: #ffd740; }
.hud-resource.income .res-value { color: #00e676; }
.hud-resource.seeds .res-value { color: #e040fb; }
.weather-badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: 20px; font-size: 11px; font-weight: 600;
  border: 1px solid rgba(255,255,255,0.1);
}
.weather-clear { background: rgba(0,230,118,0.1); color: #00e676; border-color: rgba(0,230,118,0.3); }
.weather-solar_flare { background: rgba(255,152,0,0.15); color: #ff9800; border-color: rgba(255,152,0,0.4); }
.weather-meteor_shower { background: rgba(158,158,158,0.15); color: #9e9e9e; border-color: rgba(158,158,158,0.4); }
.weather-aurora { background: rgba(0,230,118,0.2); color: #69f0ae; border-color: rgba(0,230,118,0.5); animation: aurora-glow 2s ease-in-out infinite; }
.weather-blackhole { background: rgba(100,0,150,0.2); color: #ce93d8; border-color: rgba(100,0,150,0.5); animation: blackhole-pulse 1s ease-in-out infinite; }
@keyframes aurora-glow { 0%, 100% { box-shadow: 0 0 8px rgba(0,230,118,0.2); } 50% { box-shadow: 0 0 16px rgba(0,230,118,0.4); } }
@keyframes blackhole-pulse { 0%, 100% { box-shadow: 0 0 8px rgba(100,0,150,0.3); } 50% { box-shadow: 0 0 20px rgba(100,0,150,0.6); } }

/* Planet label */
.planet-label {
  display: flex; align-items: center; gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-family: 'Orbitron', sans-serif; font-size: 14px; color: #00e676;
  z-index: 2;
}
.planet-icon-sm { width: 24px; height: 24px; border-radius: 50%; }
.slot-count { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.5); }

/* Farm grid */
.farm-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm); padding: var(--space-sm) var(--space-md);
  z-index: 2; flex: 1; align-content: center;
  max-height: 50vh;
}
.crop-slot {
  aspect-ratio: 1; background: rgba(255,255,255,0.04);
  border: 2px solid rgba(255,255,255,0.08); border-radius: var(--radius-md);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; cursor: default; transition: all var(--transition-normal);
}
.crop-slot.grown {
  border-color: #00e676; background: rgba(0,230,118,0.08);
  cursor: pointer; animation: grown-pulse 1.5s ease-in-out infinite;
}
.crop-slot.grown:hover { transform: scale(1.05); background: rgba(0,230,118,0.15); }
@keyframes grown-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(0,230,118,0.2); }
  50% { box-shadow: 0 0 20px rgba(0,230,118,0.4); }
}
.crop-slot.empty { border-style: dashed; border-color: rgba(255,255,255,0.1); cursor: pointer; }
.crop-slot.empty:hover { border-color: rgba(0,230,118,0.3); }
.empty-plus { font-size: 28px; color: rgba(255,255,255,0.2); }
.crop-img { width: 60%; height: 60%; object-fit: contain; z-index: 1; }
.progress-ring { position: absolute; inset: 2px; z-index: 0; }
.progress-ring svg { width: 100%; height: 100%; }
.slot-label {
  font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.7); z-index: 1;
}

/* Crop palette */
.crop-palette {
  display: flex; gap: var(--space-sm); padding: var(--space-sm) var(--space-md);
  overflow-x: auto; z-index: 2;
  -webkit-overflow-scrolling: touch;
}
.crop-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: var(--space-sm); background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-sm);
  cursor: pointer; min-width: 70px; flex-shrink: 0;
  transition: all var(--transition-fast); color: white;
  font-family: 'Exo 2', sans-serif;
}
.crop-btn:hover:not(:disabled) { background: rgba(0,230,118,0.1); border-color: rgba(0,230,118,0.3); transform: translateY(-2px); }
.crop-btn:active:not(:disabled) { transform: scale(0.95); }
.crop-btn.locked { opacity: 0.3; }
.crop-btn-img { width: 36px; height: 36px; object-fit: contain; }
.crop-btn-name { font-size: 10px; font-weight: 600; }
.crop-btn-value { font-size: 9px; color: #ffd740; }

/* Tutorial */
.tutorial-hint {
  position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(0,230,118,0.2), rgba(0,229,255,0.2));
  border: 1px solid rgba(0,230,118,0.4); border-radius: 8px;
  padding: 10px 16px; font-size: 13px; color: #00e676; text-align: center;
  cursor: pointer; z-index: 5; max-width: 300px;
  backdrop-filter: blur(8px);
}

/* Tab bar */
.tab-bar {
  display: flex; justify-content: space-around;
  padding: var(--space-sm) var(--space-xs);
  background: rgba(10,26,10,0.95); backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.08); z-index: 2;
}
.tab-btn {
  background: transparent; border: none; font-size: 22px;
  padding: var(--space-sm) var(--space-md); cursor: pointer; opacity: 0.5;
  transition: all var(--transition-normal); border-radius: var(--radius-sm);
  min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
}
.tab-btn:hover { opacity: 1; background: rgba(255,255,255,0.08); }
.tab-btn.active { opacity: 1; background: rgba(0,230,118,0.12); box-shadow: inset 0 -2px 0 #00e676; }

/* ============ OVERLAY SCREENS ============ */
.overlay-screen {
  position: absolute; inset: 0; background: rgba(10,26,10,0.97); z-index: 20;
  display: flex; align-items: center; justify-content: center;
  animation: overlay-in 0.3s ease-out;
}
@keyframes overlay-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.overlay-content { width: 92%; max-width: 480px; max-height: 85vh; overflow-y: auto; padding: 20px; }
.overlay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.overlay-header h2 { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #00e676; }

.upgrade-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.upgrade-card {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}
.upgrade-card.maxed { border-color: rgba(255,215,64,0.3); background: rgba(255,215,64,0.05); }
.uc-info { flex: 1; }
.uc-name { font-weight: 600; font-size: 14px; }
.uc-desc { font-size: 11px; color: rgba(255,255,255,0.5); }
.uc-level { font-size: 11px; color: rgba(255,255,255,0.4); }

.planet-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.planet-card {
  display: flex; align-items: center; gap: 12px; padding: 14px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
}
.planet-card.current { border-color: #00e676; background: rgba(0,230,118,0.08); }
.planet-card.locked { opacity: 0.5; }
.pc-icon { width: 44px; height: 44px; object-fit: contain; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); }
.pc-info { flex: 1; }
.pc-name { font-weight: 600; font-size: 15px; }
.pc-crops { font-size: 11px; color: rgba(255,255,255,0.5); }
.pc-req { font-size: 11px; color: #ffd740; }

/* Prestige */
.prestige-content { text-align: center; }
.prestige-desc { color: rgba(255,255,255,0.7); margin-bottom: 20px; line-height: 1.6; }
.prestige-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.prestige-stat { background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; }
.ps-label { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
.ps-value { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #ffd740; }
.prestige-preview { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #ffd740; margin-bottom: 16px; }

/* Toasts */
.toast {
  position: fixed; top: 15%; left: 50%; transform: translateX(-50%);
  padding: 12px 24px; border-radius: 12px;
  font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 700;
  z-index: 100; animation: toast-pop 0.4s ease-out; white-space: nowrap;
}
.harvest-toast { background: linear-gradient(135deg, #00e676, #00bfa5); color: white; }
.weather-toast { background: linear-gradient(135deg, #ffd740, #ff6d00); color: #1a0a00; }
@keyframes toast-pop {
  0% { transform: translateX(-50%) scale(0); opacity: 0; }
  60% { transform: translateX(-50%) scale(1.15); }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}

/* Popup */
.popup-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 30;
  display: flex; align-items: center; justify-content: center;
}
.popup {
  background: #1a2a1a; border: 1px solid rgba(0,230,118,0.3);
  border-radius: 16px; padding: 32px; text-align: center; max-width: 320px;
}
.popup h2 { font-family: 'Orbitron', sans-serif; color: #00e676; margin-bottom: 8px; }
.reward-amount { font-family: 'Orbitron', sans-serif; font-size: 28px; color: #ffd740; margin: 16px 0 24px; }
.popup-buttons { display: flex; flex-direction: column; gap: 10px; align-items: center; }

.overlay-content::-webkit-scrollbar { width: 4px; }
.overlay-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

@media (max-width: 600px) {
  .title-main { font-size: 32px; letter-spacing: 3px; }
  .title-sub { font-size: 20px; letter-spacing: 8px; }
  .menu-stats { flex-direction: column; gap: 8px; }
  .hud-bar { padding: 4px 8px; }
  .hud-resource { font-size: 10px; }
  .farm-grid { gap: 6px; padding: 6px 8px; }
  .crop-btn { min-width: 60px; }
}
</style>
