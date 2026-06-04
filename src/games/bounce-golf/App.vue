<template>
  <div class="bounce-golf">
    <!-- Start Screen -->
    <div v-if="screen === 'start'" class="screen start-screen">
      <h1 class="game-title">{{ t('title') }}</h1>
      <p class="tagline">{{ t('tagline') }}</p>
      <div class="menu-buttons">
        <button class="btn btn-primary" @click="startGame">{{ t('play') }}</button>
        <button class="btn btn-secondary" @click="screen = 'upgrades'">{{ t('upgrades') }}</button>
        <button class="btn btn-secondary" @click="screen = 'characters'">{{ t('characters') }}</button>
        <button class="btn btn-secondary" @click="screen = 'settings'">{{ t('settings') }}</button>
      </div>
      <div class="star-count">{{ t('stars') }}: {{ state.totalStars }}</div>
    </div>

    <!-- Game Screen -->
    <div v-else-if="screen === 'game'" class="screen game-screen">
      <div ref="phaserContainer" class="game-container"></div>
      <!-- HUD overlay -->
      <div class="hud">
        <div class="hud-left">
          <span class="hud-label">{{ t('level') }} {{ state.currentLevel + 1 }}</span>
        </div>
        <div class="hud-center">
          <span class="hud-strokes">{{ t('strokes') }}: {{ currentStrokes }}</span>
          <span class="hud-par">{{ t('par') }}: {{ currentPar }}</span>
        </div>
        <div class="hud-right">
          <button class="btn-icon" @click="pauseGame">⏸</button>
        </div>
      </div>
    </div>

    <!-- Upgrades Screen -->
    <div v-else-if="screen === 'upgrades'" class="screen upgrades-screen">
      <div class="screen-header">
        <button class="btn-back" @click="screen = 'start'">←</button>
        <h2>{{ t('upgrades') }}</h2>
        <span class="star-badge">⭐ {{ state.totalStars }}</span>
      </div>
      <div class="upgrade-list">
        <div v-for="(upgrade, key) in GAME_CONFIG.UPGRADES" :key="key" class="upgrade-card">
          <div class="upgrade-info">
            <div class="upgrade-name">{{ t(key) }}</div>
            <div class="upgrade-desc">{{ upgrade.description }}</div>
            <div class="upgrade-level">Lv.{{ state.upgrades[key as UpgradeKey] }}/{{ upgrade.maxLevel }}</div>
          </div>
          <button
            class="btn btn-buy"
            :disabled="!canAfford(key as UpgradeKey)"
            @click="buyUpgrade(key as UpgradeKey)"
          >
            {{ state.upgrades[key as UpgradeKey] >= upgrade.maxLevel ? t('maxLevel') : `⭐ ${showUpgradeCost(key as UpgradeKey)}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Characters Screen -->
    <div v-else-if="screen === 'characters'" class="screen characters-screen">
      <div class="screen-header">
        <button class="btn-back" @click="screen = 'start'">←</button>
        <h2>{{ t('characters') }}</h2>
      </div>
      <div class="character-grid">
        <div
          v-for="char in GAME_CONFIG.CHARACTERS"
          :key="char.id"
          class="character-card"
          :class="{ selected: state.selectedCharacter === char.id, locked: !isUnlocked(char.id) }"
          @click="selectCharacter(char.id)"
        >
          <div class="char-avatar" :style="{ backgroundColor: '#' + char.color.toString(16).padStart(6, '0') }"></div>
          <div class="char-name">{{ char.name }}</div>
          <div class="char-passive">{{ char.passive }}</div>
          <div v-if="!isUnlocked(char.id)" class="char-lock">{{ t('locked') }}</div>
        </div>
      </div>
    </div>

    <!-- Settings Screen -->
    <div v-else-if="screen === 'settings'" class="screen settings-screen">
      <div class="screen-header">
        <button class="btn-back" @click="screen = 'start'">←</button>
        <h2>{{ t('settings') }}</h2>
      </div>
      <div class="settings-list">
        <div class="setting-row">
          <span>{{ t('language') }}</span>
          <select v-model="currentLocale" @change="changeLocale($event)">
            <option v-for="loc in SUPPORTED_LOCALES" :key="loc" :value="loc">{{ loc.toUpperCase() }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Pause Overlay -->
    <div v-if="paused" class="overlay">
      <div class="overlay-panel">
        <h2>PAUSED</h2>
        <button class="btn btn-primary" @click="resumeGame">{{ t('resume') }}</button>
        <button class="btn btn-secondary" @click="quitToMenu">{{ t('backToMenu') }}</button>
      </div>
    </div>

    <!-- Level Complete Overlay -->
    <div v-if="showResult" class="overlay">
      <div class="overlay-panel result-panel">
        <h2 :class="{ 'hole-in-one': resultStrokes === 1 }">
          {{ resultStrokes === 1 ? t('holeInOne') : t('levelComplete') }}
        </h2>
        <div class="result-strokes">{{ t('strokes') }}: {{ resultStrokes }}</div>
        <div class="result-stars">
          <span v-for="(earned, i) in resultStars" :key="i" class="star" :class="{ earned }">★</span>
        </div>
        <button
          v-if="!bonusStarClaimed && resultStars.some(s => !s)"
          class="btn btn-reward"
          @click="watchAdForBonusStar"
        >
          🎬 Watch Ad for Bonus Star
        </button>
        <div class="result-buttons">
          <button class="btn btn-secondary" @click="retryLevel">{{ t('retry') }}</button>
          <button class="btn btn-primary" @click="nextLevel">{{ t('nextLevel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import Phaser from 'phaser'
import { useI18n } from './i18n'
import { GAME_CONFIG, type UpgradeKey, type CharacterId } from './config'
import {
  createInitialState,
  getUpgradeCost,
  canAffordUpgrade,
  purchaseUpgrade,
  completeLevel,
  saveGame,
  loadGame,
  type GameState,
} from './logic/game-state'
import { createPhaserConfig } from './phaser/config'
import { LEVELS } from './data/levels'
import { AdManager } from '../../services/AdManager'

const { t, locale: currentLocale, setLocale, SUPPORTED_LOCALES } = useI18n()
const adManager = AdManager.getInstance()

type Screen = 'start' | 'game' | 'upgrades' | 'characters' | 'settings'

const screen = ref<Screen>('start')
const state = reactive<GameState>(loadGame() ?? createInitialState())
const phaserContainer = ref<HTMLElement>()
let game: Phaser.Game | null = null

// Game session state
const currentStrokes = ref(0)
const currentPar = ref(3)
const paused = ref(false)
const showResult = ref(false)
const resultStrokes = ref(0)
const resultStars = ref<boolean[]>([false, false, false])
// Pending result (stored until player clicks NEXT or RETRY)
const pendingResult = ref<{ levelId: number; strokes: number; stars: boolean[] } | null>(null)
const bonusStarClaimed = ref(false)

function save() {
  saveGame(state as GameState)
}

function startGame() {
  screen.value = 'game'
  currentStrokes.value = 0
  showResult.value = false
  paused.value = false
  bonusStarClaimed.value = false
  save() // Persist state on game start
  adManager.gameplayStart()
  nextTick(() => {
    if (phaserContainer.value) {
      game?.destroy(true)
      game = new Phaser.Game(createPhaserConfig(phaserContainer.value))

      // Boot the game with callbacks
      const levelIdx = state.currentLevel % LEVELS.length
      const level = LEVELS[levelIdx]
      currentPar.value = level.par

      game.scene.start('BootScene', {
        getState: () => state as GameState,
        onStroke: (_levelId: number, strokes: number) => {
          currentStrokes.value = strokes
        },
        onBallStopped: () => {
          // Ready for next shot
        },
        onLevelComplete: (levelId: number, strokes: number, stars: boolean[]) => {
          // Store result — don't advance level yet (wait for NEXT/RETRY)
          pendingResult.value = { levelId, strokes, stars }
          resultStrokes.value = strokes
          resultStars.value = stars
          showResult.value = true
        },
      })
    }
  })
}

function pauseGame() {
  paused.value = true
  game?.scene.pause('GameScene')
  adManager.gameplayStop()
}

function resumeGame() {
  paused.value = false
  game?.scene.resume('GameScene')
  adManager.gameplayStart()
}

function quitToMenu() {
  paused.value = false
  game?.destroy(true)
  game = null
  screen.value = 'start'
  adManager.gameplayStop()
}

function retryLevel() {
  // Don't advance — replay same level
  pendingResult.value = null
  showResult.value = false
  currentStrokes.value = 0
  game?.destroy(true)
  game = null
  nextTick(() => startGame())
}

async function nextLevel() {
  // Advance level
  if (pendingResult.value) {
    const { levelId, strokes, stars } = pendingResult.value
    Object.assign(state, completeLevel(state as GameState, levelId, strokes, stars))
    save()
    pendingResult.value = null
  }
  showResult.value = false
  currentStrokes.value = 0
  game?.destroy(true)
  game = null

  // Show midgame ad between levels (non-blocking — game starts regardless)
  adManager.requestMidgameAd().catch(() => {})

  nextTick(() => startGame())
}

async function watchAdForBonusStar() {
  const rewarded = await adManager.requestRewardedAd()
  if (rewarded && pendingResult.value) {
    // Grant one missing star
    const stars = pendingResult.value.stars
    const firstMissing = stars.findIndex(s => !s)
    if (firstMissing !== -1) {
      stars[firstMissing] = true
      resultStars.value = [...stars]
      pendingResult.value.stars = [...stars]
    }
    bonusStarClaimed.value = true
  }
}

// Upgrades
function showUpgradeCost(key: UpgradeKey): number {
  return getUpgradeCost(key, state.upgrades[key])
}

function canAfford(key: UpgradeKey): boolean {
  return canAffordUpgrade(state as GameState, key)
}

function buyUpgrade(key: UpgradeKey) {
  Object.assign(state, purchaseUpgrade(state as GameState, key))
  save()
}

// Characters
function isUnlocked(id: CharacterId): boolean {
  return state.unlockedCharacters.includes(id)
}

function selectCharacter(id: CharacterId) {
  if (!isUnlocked(id)) return
  state.selectedCharacter = id
  save()
}

// Settings
function changeLocale(e: Event) {
  const val = (e.target as HTMLSelectElement).value as any
  setLocale(val)
}

onUnmounted(() => {
  game?.destroy(true)
  game = null
})
</script>

<style scoped>
.bounce-golf {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  color: #fff;
  font-family: 'Nunito', sans-serif;
  overflow: hidden;
  position: relative;
}

.screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Start Screen */
.start-screen {
  justify-content: center;
  gap: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.game-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 48px;
  color: #00ff88;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
}

.tagline {
  font-size: 18px;
  color: #aaa;
  margin-bottom: 20px;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 220px;
}

.star-count {
  margin-top: 10px;
  font-size: 16px;
  color: #ffd700;
}

/* Buttons */
.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn:hover { transform: scale(1.05); }
.btn:active { transform: scale(0.95); }

.btn-primary {
  background: linear-gradient(135deg, #00ff88, #00d4ff);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-buy {
  background: #ffd700;
  color: #1a1a2e;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-family: 'Fredoka', sans-serif;
}

.btn-buy:disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.btn-back {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
}

/* Game Screen */
.game-screen { position: relative; }
.game-container { width: 100%; height: 100%; }

.hud {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
  pointer-events: none;
}

.hud > * { pointer-events: all; }

.hud-label, .hud-strokes, .hud-par {
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  color: #fff;
}

.hud-center { display: flex; gap: 16px; }

/* Upgrades */
.upgrades-screen, .characters-screen, .settings-screen {
  padding: 20px;
  overflow-y: auto;
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 500px;
  margin-bottom: 20px;
}

.screen-header h2 {
  font-family: 'Fredoka', sans-serif;
  font-size: 24px;
  color: #00ff88;
  flex: 1;
}

.star-badge {
  font-size: 16px;
  color: #ffd700;
}

.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 500px;
}

.upgrade-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.upgrade-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  color: #00ff88;
}

.upgrade-desc { font-size: 13px; color: #aaa; }
.upgrade-level { font-size: 13px; color: #666; margin-top: 2px; }

/* Characters */
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 500px;
}

.character-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 2px solid transparent;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.character-card.selected { border-color: #00ff88; }
.character-card.locked { opacity: 0.4; cursor: not-allowed; }

.char-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin: 0 auto 8px;
}

.char-name { font-family: 'Fredoka', sans-serif; font-size: 14px; }
.char-passive { font-size: 11px; color: #aaa; }
.char-lock { font-size: 11px; color: #ff6b35; margin-top: 4px; }

/* Settings */
.settings-list {
  width: 100%;
  max-width: 400px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 8px;
}

.setting-row select {
  background: #2a2a4a;
  color: #fff;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 6px 10px;
  font-family: 'Nunito', sans-serif;
}

/* Overlays */
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.overlay-panel {
  background: #16213e;
  border: 2px solid #00ff88;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  min-width: 280px;
}

.overlay-panel h2 {
  font-family: 'Fredoka', sans-serif;
  font-size: 28px;
  color: #00ff88;
  margin-bottom: 20px;
}

.overlay-panel .btn { width: 100%; margin-top: 10px; }

.hole-in-one { color: #ffd700 !important; text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }

.result-strokes { font-size: 22px; margin-bottom: 12px; }

.result-stars { font-size: 32px; margin-bottom: 20px; }
.star { color: #555; margin: 0 4px; }
.star.earned { color: #ffd700; }

.result-buttons { display: flex; gap: 10px; }
.result-buttons .btn { flex: 1; }

.btn-reward {
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  color: #1a1a2e;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 12px;
  transition: transform 0.15s;
  animation: pulse-glow 2s infinite;
}

.btn-reward:hover { transform: scale(1.05); }
.btn-reward:active { transform: scale(0.95); }

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
}

/* Mobile responsive */
@media (max-width: 480px) {
  .game-title { font-size: 32px; }
  .tagline { font-size: 14px; }
  .menu-buttons { width: 180px; }
  .btn { padding: 12px 20px; font-size: 16px; }
  .upgrade-card { padding: 12px; }
  .upgrade-name { font-size: 16px; }
  .character-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .overlay-panel { padding: 24px; min-width: 240px; }
  .overlay-panel h2 { font-size: 22px; }
  .result-strokes { font-size: 18px; }
  .result-stars { font-size: 28px; }
  .hud-label, .hud-strokes, .hud-par { font-size: 14px; }
}
</style>
