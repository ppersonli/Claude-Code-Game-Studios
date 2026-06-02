<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import { SaveSystem } from './systems/SaveSystem'
import { GAME_CONFIG, type UpgradeKey } from './config'
import { STAR_SYSTEMS } from './data/planets'
import { ACHIEVEMENTS } from './data/achievements'
import { getTodayChallenge, getTodayDate, type DailyChallenge } from './data/daily-challenges'
import { AdManager } from '../../services/AdManager'

const adManager = AdManager.getInstance()

const saveSystem = new SaveSystem()
const state = saveSystem.getState()

// UI State
const gamePhase = ref<'menu' | 'playing' | 'upgrades' | 'ships' | 'systems' | 'prestige' | 'achievements' | 'daily'>('menu')
const flightState = ref<'idle' | 'flying'>('idle')
const flightDistance = ref(0)
const flightStardust = ref(0)
const showOfflineReward = ref(false)
const offlineRewardAmount = ref(0)
const prestigeMessage = ref('')
const launchCount = ref(0) // Track launches for midgame ad frequency
const todayChallenge = ref<DailyChallenge>(getTodayChallenge())
const achievementUnlocked = ref('') // show toast on unlock

// Phaser instance
let game: Phaser.Game | null = null
const gameContainer = ref<HTMLDivElement>()

// Reactive save state
const stardust = ref(state.stardust)
const prestigeCores = ref(state.prestigeCores)
const prestigeCount = ref(state.prestigeCount)
const totalLaunches = ref(state.totalLaunches)
const bestDistance = ref(state.bestDistance)

function syncState() {
  const s = saveSystem.getState()
  stardust.value = s.stardust
  prestigeCores.value = s.prestigeCores
  prestigeCount.value = s.prestigeCount
  totalLaunches.value = s.totalLaunches
  bestDistance.value = s.bestDistance

  // Check achievements
  const achievementState = {
    totalLaunches: s.totalLaunches,
    bestDistance: s.bestDistance,
    stardustTotal: s.stardustTotal,
    prestigeCount: s.prestigeCount,
    prestigeCores: s.prestigeCores,
    unlockedShips: s.unlockedShips,
    unlockedSystems: s.unlockedSystems,
  }
  for (const achievement of ACHIEVEMENTS) {
    if (!saveSystem.hasAchievement(achievement.id) && achievement.check(achievementState)) {
      saveSystem.unlockAchievement(achievement.id)
      achievementUnlocked.value = achievement.name
      setTimeout(() => { achievementUnlocked.value = '' }, 3000)
    }
  }
}

// Computed
const multiplier = computed(() => {
  return (1 + prestigeCores.value * GAME_CONFIG.PRESTIGE_CORE_BONUS).toFixed(1)
})

const prestigeRequirement = computed(() => {
  return saveSystem.getPrestigeRequirement().toLocaleString()
})

const canPrestige = computed(() => saveSystem.canPrestige())

function getUpgradeInfo(key: UpgradeKey) {
  const config = GAME_CONFIG.UPGRADES[key]
  const level = saveSystem.getUpgradeLevel(key)
  const cost = saveSystem.getUpgradeCost(key)
  return {
    ...config,
    level,
    cost,
    maxed: level >= config.maxLevel,
    canAfford: stardust.value >= cost,
  }
}

// Actions
async function startGame() {
  gamePhase.value = 'playing'

  // Signal gameplay start to platform SDK
  adManager.gameplayStart()

  await nextTick()

  // Check offline earnings
  const offline = saveSystem.getOfflineEarnings()
  if (offline > 0) {
    offlineRewardAmount.value = offline
    showOfflineReward.value = true
  }

  if (!game) {
    initPhaser()
  }
}

function initPhaser() {
  if (!gameContainer.value) return

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: gameContainer.value.clientWidth,
    height: gameContainer.value.clientHeight,
    backgroundColor: '#0a0a2e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
  })

  game.scene.add('GameScene', GameScene, true, {
    saveSystem,
    onStateChange: (s: string) => { flightState.value = s as 'idle' | 'flying' },
    onFlightUpdate: (dist: number, sd: number) => {
      flightDistance.value = dist
      flightStardust.value = sd
    },
    onFlightEnd: (data: { distance: number; stardust: number; angle: number; speed: number; launchCount: number; usedAutoLaunch: boolean }) => {
      flightDistance.value = data.distance
      flightStardust.value = data.stardust
      launchCount.value++
      syncState()

      // Daily challenge validation
      if (!saveSystem.isDailyCompletedToday()) {
        const challenge = todayChallenge.value
        if (challenge.validate({
          angle: data.angle,
          speed: data.speed,
          distance: data.distance,
          stardustCollected: data.stardust,
          launchCount: data.launchCount,
          usedAutoLaunch: data.usedAutoLaunch,
        })) {
          saveSystem.completeDailyChallenge()
          // Apply bonus multiplier to stardust earned this flight
          const bonus = Math.floor(data.stardust * (challenge.bonusMultiplier - 1))
          if (bonus > 0) {
            saveSystem.addStardust(bonus)
          }
          syncState()
        }
      }

      // Midgame ad every 5 launches (natural break point)
      if (launchCount.value % 5 === 0) {
        adManager.requestMidgameAd()
      }
    },
  })
}

function goToUpgrades() { gamePhase.value = 'upgrades' }
function goToShips() { gamePhase.value = 'ships' }
function goToSystems() { gamePhase.value = 'systems' }
function goToPrestige() { gamePhase.value = 'prestige' }
function goToAchievements() { gamePhase.value = 'achievements' }
function goToDaily() { gamePhase.value = 'daily' }
function goBack() { gamePhase.value = 'playing' }
function goToMenu() {
  gamePhase.value = 'menu'
  adManager.gameplayStop()
  if (game) {
    game.destroy(true)
    game = null
  }
}

function purchaseUpgrade(key: UpgradeKey) {
  if (saveSystem.purchaseUpgrade(key)) {
    syncState()
  }
}

function unlockShip(shipId: string) {
  if (saveSystem.unlockShip(shipId as any)) {
    syncState()
  }
}

function selectShip(shipId: string) {
  saveSystem.selectShip(shipId as any)
}

function unlockSystem(systemId: string, cost: number) {
  if (saveSystem.unlockSystem(systemId, cost)) {
    syncState()
  }
}

function travelToSystem(systemIndex: number) {
  if (game) {
    const scene = game.scene.getScene('GameScene') as any
    if (scene && scene.switchStarSystem) {
      scene.switchStarSystem(systemIndex)
    }
  }
  goBack()
}

function performPrestige() {
  const earned = saveSystem.performPrestige()
  if (earned > 0) {
    prestigeMessage.value = `Prestige Complete! Earned ${earned} Star Cores!`
    syncState()
    // Reset game
    if (game) {
      game.destroy(true)
      game = null
    }
    setTimeout(() => {
      prestigeMessage.value = ''
    }, 3000)
  }
}

function collectOfflineReward() {
  showOfflineReward.value = false
  syncState()
}

async function collectDoubleOffline() {
  const rewarded = await adManager.requestRewardedAd()
  if (rewarded) {
    offlineRewardAmount.value *= 2
    saveSystem.addStardust(offlineRewardAmount.value)
    syncState()
  }
  showOfflineReward.value = false
}

onUnmounted(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<template>
  <div class="game-wrapper">
    <!-- Menu Screen -->
    <div v-if="gamePhase === 'menu'" class="menu-screen">
      <div class="stars-bg"></div>
      <div class="menu-content">
        <h1 class="game-title">
          <span class="title-orbit">ORBIT</span>
          <span class="title-odyssey">ODYSSEY</span>
        </h1>
        <p class="subtitle">Launch. Explore. Prestige.</p>

        <div class="menu-stats" v-if="totalLaunches > 0">
          <div class="stat">🚀 {{ totalLaunches }} launches</div>
          <div class="stat">📏 Best: {{ bestDistance.toLocaleString() }}</div>
          <div class="stat" v-if="prestigeCores > 0">⭐ {{ prestigeCores }} cores (x{{ multiplier }})</div>
        </div>

        <div class="menu-buttons">
          <button class="btn btn-primary btn-lg" @click="startGame">
            {{ totalLaunches > 0 ? 'CONTINUE' : 'LAUNCH' }}
          </button>
          <button class="btn btn-secondary" @click="startGame(); goToPrestige()" v-if="canPrestige">
            ⭐ PRESTIGE AVAILABLE
          </button>
        </div>
      </div>
    </div>

    <!-- Game Screen -->
    <div v-show="gamePhase === 'playing' || gamePhase === 'upgrades' || gamePhase === 'ships' || gamePhase === 'systems' || gamePhase === 'prestige'" class="game-screen">
      <div ref="gameContainer" class="phaser-container"></div>

      <!-- HUD Overlay -->
      <div class="hud">
        <div class="hud-top">
          <div class="hud-resources">
            <span class="resource stardust">✨ {{ stardust.toLocaleString() }}</span>
            <span class="resource cores" v-if="prestigeCores > 0">⭐ {{ prestigeCores }} (x{{ multiplier }})</span>
          </div>
          <div class="hud-buttons">
            <button class="btn btn-sm" @click="goToUpgrades">⬆️</button>
            <button class="btn btn-sm" @click="goToShips">🚀</button>
            <button class="btn btn-sm" @click="goToSystems">🌍</button>
            <button class="btn btn-sm" @click="goToDaily" :class="{ 'btn-ad': !saveSystem.isDailyCompletedToday() }">📅</button>
            <button class="btn btn-sm" @click="goToAchievements">🏅</button>
            <button class="btn btn-sm" @click="goToPrestige" v-if="canPrestige">⭐</button>
            <button class="btn btn-sm btn-ghost" @click="goToMenu">☰</button>
          </div>
        </div>

        <!-- Flight HUD -->
        <div v-if="flightState === 'flying'" class="hud-flight">
          <div class="flight-stat">📏 {{ flightDistance.toLocaleString() }}</div>
          <div class="flight-stat">✨ +{{ flightStardust }}</div>
        </div>

        <!-- Idle hint -->
        <div v-else class="hud-hint">
          Tap & drag to aim, release to launch!
        </div>
      </div>

      <!-- Offline Reward Popup -->
      <div v-if="showOfflineReward" class="popup-overlay">
        <div class="popup">
          <h2>Welcome Back!</h2>
          <p>Your auto-collectors earned:</p>
          <div class="reward-amount">✨ {{ offlineRewardAmount.toLocaleString() }} Stardust</div>
          <div class="popup-buttons">
            <button class="btn btn-primary" @click="collectOfflineReward">Collect</button>
            <button class="btn btn-ad" @click="collectDoubleOffline">📺 Watch Ad for 2x</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrades Screen -->
    <div v-if="gamePhase === 'upgrades'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>Upgrades</h2>
          <span class="resource stardust">✨ {{ stardust.toLocaleString() }}</span>
        </div>
        <div class="upgrade-list">
          <div v-for="(config, key) in GAME_CONFIG.UPGRADES" :key="key" class="upgrade-item"
               :class="{ 'maxed': getUpgradeInfo(key as UpgradeKey).maxed }">
            <div class="upgrade-icon">{{ config.icon }}</div>
            <div class="upgrade-info">
              <div class="upgrade-name">{{ config.name }}</div>
              <div class="upgrade-level">Lv.{{ getUpgradeInfo(key as UpgradeKey).level }} / {{ config.maxLevel }}</div>
            </div>
            <button class="btn btn-sm"
                    :disabled="!getUpgradeInfo(key as UpgradeKey).canAfford || getUpgradeInfo(key as UpgradeKey).maxed"
                    @click="purchaseUpgrade(key as UpgradeKey)">
              {{ getUpgradeInfo(key as UpgradeKey).maxed ? 'MAX' : `✨ ${getUpgradeInfo(key as UpgradeKey).cost}` }}
            </button>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">Back</button>
      </div>
    </div>

    <!-- Ships Screen -->
    <div v-if="gamePhase === 'ships'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>Ships</h2>
          <span class="resource stardust">✨ {{ stardust.toLocaleString() }}</span>
        </div>
        <div class="ship-list">
          <div v-for="ship in GAME_CONFIG.SHIPS" :key="ship.id" class="ship-item"
               :class="{ 'active': state.activeShip === ship.id, 'locked': !state.unlockedShips.includes(ship.id as any) }">
            <div class="ship-icon" :style="{ color: '#' + ship.color.toString(16).padStart(6, '0') }">🚀</div>
            <div class="ship-info">
              <div class="ship-name">{{ ship.name }}</div>
              <div class="ship-stats">Speed: {{ ship.speed }}x | Fuel: {{ ship.fuel }}x</div>
            </div>
            <button v-if="state.unlockedShips.includes(ship.id as any)"
                    class="btn btn-sm"
                    :class="{ 'btn-active': state.activeShip === ship.id }"
                    @click="selectShip(ship.id)">
              {{ state.activeShip === ship.id ? 'Active' : 'Select' }}
            </button>
            <button v-else class="btn btn-sm"
                    :disabled="stardust < ship.cost"
                    @click="unlockShip(ship.id)">
              ✨ {{ ship.cost.toLocaleString() }}
            </button>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">Back</button>
      </div>
    </div>

    <!-- Star Systems Screen -->
    <div v-if="gamePhase === 'systems'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>Star Systems</h2>
          <span class="resource stardust">✨ {{ stardust.toLocaleString() }}</span>
        </div>
        <div class="system-list">
          <div v-for="(system, i) in STAR_SYSTEMS" :key="system.id" class="system-item"
               :class="{ 'locked': !state.unlockedSystems.includes(system.id) }">
            <div class="system-name">{{ system.name }}</div>
            <div class="system-planets">{{ system.planets.length }} planets</div>
            <button v-if="state.unlockedSystems.includes(system.id)"
                    class="btn btn-sm"
                    @click="travelToSystem(i)">
              Travel
            </button>
            <button v-else class="btn btn-sm"
                    :disabled="stardust < system.unlockCost"
                    @click="unlockSystem(system.id, system.unlockCost)">
              ✨ {{ system.unlockCost.toLocaleString() }}
            </button>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">Back</button>
      </div>
    </div>

    <!-- Prestige Screen -->
    <div v-if="gamePhase === 'prestige'" class="overlay-screen">
      <div class="overlay-content prestige-content">
        <h2>⭐ Prestige</h2>
        <p class="prestige-desc">
          Reset all progress to earn <strong>Star Cores</strong> — permanent multipliers that make each run faster.
        </p>
        <div class="prestige-stats">
          <div class="prestige-stat">
            <span class="label">Cores Owned</span>
            <span class="value">{{ prestigeCores }}</span>
          </div>
          <div class="prestige-stat">
            <span class="label">Current Multiplier</span>
            <span class="value">x{{ multiplier }}</span>
          </div>
          <div class="prestige-stat">
            <span class="label">Times Prestiged</span>
            <span class="value">{{ prestigeCount }}</span>
          </div>
          <div class="prestige-stat">
            <span class="label">Requirement</span>
            <span class="value">{{ prestigeRequirement }} total stardust</span>
          </div>
        </div>
        <button class="btn btn-prestige"
                :disabled="!canPrestige"
                @click="performPrestige">
          {{ canPrestige ? '⭐ PRESTIGE NOW' : `Need ${prestigeRequirement} total stardust` }}
        </button>
        <button class="btn btn-secondary" @click="goBack">Back</button>
      </div>
    </div>

    <!-- Prestige Message -->
    <div v-if="prestigeMessage" class="prestige-toast">
      {{ prestigeMessage }}
    </div>

    <!-- Achievement Unlock Toast -->
    <div v-if="achievementUnlocked" class="achievement-toast">
      🏅 Achievement Unlocked: {{ achievementUnlocked }}
    </div>

    <!-- Daily Challenge Screen -->
    <div v-if="gamePhase === 'daily'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>📅 Daily Challenge</h2>
          <span v-if="saveSystem.isDailyCompletedToday()" class="daily-completed">✅ Completed</span>
        </div>
        <div class="daily-challenge-card">
          <div class="challenge-icon">{{ todayChallenge.icon }}</div>
          <div class="challenge-name">{{ todayChallenge.name }}</div>
          <div class="challenge-desc">{{ todayChallenge.description }}</div>
          <div class="challenge-reward">Bonus: ×{{ todayChallenge.bonusMultiplier }} stardust</div>
          <div class="challenge-streak" v-if="saveSystem.getState().dailyStreak > 0">
            🔥 Streak: {{ saveSystem.getState().dailyStreak }} days
          </div>
        </div>
        <div class="challenge-hint">
          Complete the challenge in your next flight to earn bonus stardust!
        </div>
        <button class="btn btn-secondary" @click="goBack">Back</button>
      </div>
    </div>

    <!-- Achievements Screen -->
    <div v-if="gamePhase === 'achievements'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>🏅 Achievements</h2>
          <span class="achievement-count">{{ saveSystem.getAchievementCount() }}/{{ ACHIEVEMENTS.length }}</span>
        </div>
        <div class="achievement-list">
          <div v-for="achievement in ACHIEVEMENTS" :key="achievement.id" class="achievement-item"
               :class="{ 'unlocked': saveSystem.hasAchievement(achievement.id) }">
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-info">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-desc">{{ achievement.description }}</div>
            </div>
            <div class="achievement-status">
              {{ saveSystem.hasAchievement(achievement.id) ? '✅' : '🔒' }}
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">Back</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a2e;
  font-family: 'Exo 2', sans-serif;
  color: #ffffff;
}

/* Menu Screen */
.menu-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.stars-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(2px 2px at 20% 30%, #fff 0%, transparent 100%),
    radial-gradient(2px 2px at 40% 70%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 20%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 60%, #fff 0%, transparent 100%),
    radial-gradient(2px 2px at 10% 80%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 90% 40%, #fff 0%, transparent 100%),
    radial-gradient(2px 2px at 50% 50%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 10%, #fff 0%, transparent 100%),
    radial-gradient(2px 2px at 70% 90%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 55%, #fff 0%, transparent 100%);
  background-color: #0a0a2e;
  animation: twinkle 4s ease-in-out infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}

.menu-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.game-title {
  font-family: 'Orbitron', sans-serif;
  margin-bottom: 8px;
}

.title-orbit {
  display: block;
  font-size: 72px;
  font-weight: 900;
  background: linear-gradient(135deg, #00d4ff, #7b2ff7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  letter-spacing: 12px;
}

.title-odyssey {
  display: block;
  font-size: 36px;
  font-weight: 400;
  color: #ff2d95;
  letter-spacing: 20px;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 32px;
  letter-spacing: 4px;
}

.menu-stats {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 32px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

/* Buttons */
.btn {
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-family: 'Exo 2', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.btn:hover { transform: scale(1.05); }
.btn:active { transform: scale(0.95); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.btn-primary {
  background: linear-gradient(135deg, #00d4ff, #7b2ff7);
  color: white;
  padding: 16px 64px;
  font-size: 20px;
}

.btn-lg { padding: 16px 64px; font-size: 20px; }

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-ghost {
  background: transparent;
  border: none;
  font-size: 20px;
}

.btn-prestige {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a0a00;
  font-size: 18px;
  padding: 16px 48px;
}

.btn-active {
  background: rgba(0, 212, 255, 0.3) !important;
  border-color: #00d4ff !important;
}

.btn-ad {
  background: linear-gradient(135deg, #ff2d95, #ff6b35);
  color: white;
  padding: 12px 32px;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ad:hover { transform: scale(1.05); }
.btn-ad:active { transform: scale(0.95); }

.popup-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

/* Game Screen */
.game-screen {
  width: 100%;
  height: 100%;
  position: relative;
}

.phaser-container {
  width: 100%;
  height: 100%;
}

/* HUD */
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.hud > * { pointer-events: auto; }

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(10, 10, 46, 0.8), transparent);
}

.hud-resources {
  display: flex;
  gap: 16px;
  font-size: 16px;
  font-weight: 600;
}

.resource.stardust { color: #ffd700; }
.resource.cores { color: #ff8c00; }

.hud-buttons {
  display: flex;
  gap: 8px;
}

.hud-flight {
  position: absolute;
  top: 60px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Orbitron', sans-serif;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.hud-hint {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Overlay Screens */
.overlay-screen {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 46, 0.95);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-content {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.overlay-header h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  color: #00d4ff;
}

/* Upgrade List */
.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.upgrade-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.upgrade-item.maxed {
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.05);
}

.upgrade-icon { font-size: 24px; }
.upgrade-info { flex: 1; }
.upgrade-name { font-weight: 600; }
.upgrade-level { font-size: 12px; color: rgba(255, 255, 255, 0.5); }

/* Ship List */
.ship-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.ship-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ship-item.active {
  border-color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
}

.ship-item.locked { opacity: 0.6; }
.ship-icon { font-size: 24px; }
.ship-info { flex: 1; }
.ship-name { font-weight: 600; }
.ship-stats { font-size: 12px; color: rgba(255, 255, 255, 0.5); }

/* System List */
.system-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.system-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.system-item.locked { opacity: 0.6; }
.system-name { font-weight: 600; flex: 1; }
.system-planets { font-size: 12px; color: rgba(255, 255, 255, 0.5); }

/* Prestige */
.prestige-content { text-align: center; }

.prestige-desc {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
  line-height: 1.6;
}

.prestige-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.prestige-stat {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
}

.prestige-stat .label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.prestige-stat .value {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  color: #ffd700;
}

/* Popup */
.popup-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  background: #1a1a4e;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 320px;
}

.popup h2 {
  font-family: 'Orbitron', sans-serif;
  color: #00d4ff;
  margin-bottom: 8px;
}

.reward-amount {
  font-family: 'Orbitron', sans-serif;
  font-size: 28px;
  color: #ffd700;
  margin: 16px 0 24px;
}

/* Prestige Toast */
.prestige-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a0a00;
  padding: 24px 48px;
  border-radius: 16px;
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 700;
  z-index: 100;
  animation: prestigePop 0.5s ease-out;
}

@keyframes prestigePop {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.2); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

/* Achievement Toast */
.achievement-toast {
  position: fixed;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #00d4ff, #7b2ff7);
  color: white;
  padding: 16px 32px;
  border-radius: 12px;
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 700;
  z-index: 100;
  animation: prestigePop 0.5s ease-out;
  white-space: nowrap;
}

/* Daily Challenge */
.daily-completed {
  color: #32cd32;
  font-size: 14px;
  font-weight: 600;
}

.daily-challenge-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 16px;
}

.challenge-icon { font-size: 48px; margin-bottom: 8px; }
.challenge-name { font-family: 'Orbitron', sans-serif; font-size: 20px; color: #00d4ff; margin-bottom: 8px; }
.challenge-desc { color: rgba(255, 255, 255, 0.8); margin-bottom: 8px; }
.challenge-reward { color: #ffd700; font-weight: 600; margin-bottom: 8px; }
.challenge-streak { color: #ff6b35; font-weight: 600; }
.challenge-hint { color: rgba(255, 255, 255, 0.5); font-size: 14px; margin-bottom: 24px; }

/* Achievements */
.achievement-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.5;
}

.achievement-item.unlocked {
  opacity: 1;
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(0, 212, 255, 0.05);
}

.achievement-icon { font-size: 24px; }
.achievement-info { flex: 1; }
.achievement-name { font-weight: 600; }
.achievement-desc { font-size: 12px; color: rgba(255, 255, 255, 0.5); }
.achievement-status { font-size: 18px; }

/* Responsive */
@media (max-width: 600px) {
  .title-orbit { font-size: 48px; letter-spacing: 8px; }
  .title-odyssey { font-size: 24px; letter-spacing: 12px; }
  .menu-stats { flex-direction: column; gap: 8px; }
  .hud-top { padding: 8px 12px; }
  .hud-resources { font-size: 14px; }
}
</style>
