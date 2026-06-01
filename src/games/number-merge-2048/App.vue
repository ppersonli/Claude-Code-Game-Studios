/**
 * App.vue — Root component for Number Merge 2048.
 * Manages game lifecycle, meta state, and CG SDK.
 */
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { AdManager } from '../../services/AdManager'
import { createNewGame, restoreGame, saveGame, clearSave, processMove, continuePlaying, loadBestScore, saveBestScore } from './logic/game-state'
import { checkMergeAchievements, gameCoins, dailyRewardCoins, isDailyRewardAvailable, claimDailyReward, getAvailableMergeThemes, canBuyMergeTheme } from './logic/meta'
import { MERGE_THEMES, getMergeThemeById } from './data/themes'
import type { GameState } from './logic/game-state'
import type { Direction } from './logic/grid'
import type { Merge2048Stats } from './data/achievements'

import GameBoard from './components/GameBoard.vue'
import MenuScene from './components/MenuScene.vue'
import GameOverScene from './components/GameOverScene.vue'
import WinOverlay from './components/WinOverlay.vue'
import DailyReward from './components/DailyReward.vue'
import ThemeShop from './components/ThemeShop.vue'

// === AdManager ===
const adManager = AdManager.getInstance()
adManager.init()
adManager.initAsync()

// === State ===
type Scene = 'menu' | 'game' | 'gameover'

const scene = ref<Scene>('menu')
const gameState = ref<GameState | null>(null)
const showWin = ref(false)
const showDaily = ref(false)
const showThemes = ref(false)

// === Meta persistence ===
const COINS_KEY = 'number-merge-2048-coins'
const THEMES_KEY = 'number-merge-2048-themes'
const EQUIPPED_KEY = 'number-merge-2048-equipped'
const STATS_KEY = 'number-merge-2048-stats'
const DAILY_KEY = 'number-merge-2048-daily'
const ACHIEVEMENTS_KEY = 'number-merge-2048-achievements'

function loadNum(key: string): number {
  try { return parseInt(localStorage.getItem(key) ?? '0', 10) || 0 } catch { return 0 }
}
function loadStr(key: string, fallback = ''): string {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
function loadJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function saveNum(key: string, val: number): void {
  try { localStorage.setItem(key, String(val)) } catch { /* noop */ }
}
function saveStr(key: string, val: string): void {
  try { localStorage.setItem(key, val) } catch { /* noop */ }
}
function saveJson<T>(key: string, val: T): void {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* noop */ }
}

const coins = ref(loadNum(COINS_KEY))
const unlockedThemes = ref<string[]>(loadJson(THEMES_KEY, ['classic']))
const equippedTheme = ref(loadStr(EQUIPPED_KEY, 'classic'))
const stats = ref<Merge2048Stats>(loadJson(STATS_KEY, {
  highScore: 0, highestTile: 0, totalGames: 0, totalMoves: 0,
  totalMerges: 0, bestMoveCount: 0, dailyCompleted: 0, themesUnlocked: 1,
}))
const lastDaily = ref(loadStr(DAILY_KEY))
const unlockedAchievements = ref<string[]>(loadJson(ACHIEVEMENTS_KEY, []))

const hasSave = computed(() => !!restoreGame())

const currentTheme = computed(() => getMergeThemeById(equippedTheme.value))

const themeList = computed(() =>
  getAvailableMergeThemes(coins.value, stats.value.highScore, unlockedThemes.value),
)

// === iOS AudioContext resume ===
let audioCtx: AudioContext | null = null
function resumeAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

// === Game flow ===
function startNewGame() {
  resumeAudio()
  clearSave()
  gameState.value = createNewGame()
  scene.value = 'game'
  showWin.value = false
  adManager.gameplayStart()
}

function continueGame() {
  resumeAudio()
  const saved = restoreGame()
  if (saved) {
    gameState.value = saved
    scene.value = 'game'
    adManager.gameplayStart()
  }
}

function handleMove(direction: Direction) {
  if (!gameState.value) return
  const { state: newState, moved } = processMove(gameState.value, direction)
  if (moved) {
    gameState.value = newState
    // Check for win popup
    if (newState.won && !newState.keepPlaying) {
      showWin.value = true
    }
    // Check for game over
    if (newState.gameOver) {
      handleGameOver()
    }
  }
}

function handleGameOver() {
  adManager.gameplayStop()
  if (!gameState.value) return
  // Update stats
  stats.value.totalGames++
  stats.value.totalMoves += gameState.value.moveCount
  if (gameState.value.score > stats.value.highScore) {
    stats.value.highScore = gameState.value.score
  }
  if (gameState.value.highestTile > stats.value.highestTile) {
    stats.value.highestTile = gameState.value.highestTile
  }
  // Award coins
  const earned = gameCoins(gameState.value.score, false)
  coins.value += earned
  saveNum(COINS_KEY, coins.value)
  saveJson(STATS_KEY, stats.value)
  // Check achievements
  checkAndSaveAchievements()
  scene.value = 'gameover'
}

function handleKeepPlaying() {
  if (!gameState.value) return
  gameState.value = continuePlaying(gameState.value)
  showWin.value = false
  saveGame(gameState.value)
}

function handleNewGameFromOver() {
  scene.value = 'menu'
  startNewGame()
}

function claimDaily() {
  const result = claimDailyReward(lastDaily.value)
  if (result.claimed) {
    lastDaily.value = result.today
    saveStr(DAILY_KEY, result.today)
    const reward = dailyRewardCoins()
    coins.value += reward
    saveNum(COINS_KEY, coins.value)
    stats.value.dailyCompleted++
    saveJson(STATS_KEY, stats.value)
    checkAndSaveAchievements()
  }
}

function buyTheme(themeId: string) {
  if (!canBuyMergeTheme(coins.value, stats.value.highScore, unlockedThemes.value, themeId)) return
  const theme = getMergeThemeById(themeId)
  coins.value -= theme.cost
  unlockedThemes.value.push(themeId)
  stats.value.themesUnlocked = unlockedThemes.value.length
  saveNum(COINS_KEY, coins.value)
  saveJson(THEMES_KEY, unlockedThemes.value)
  saveJson(STATS_KEY, stats.value)
  checkAndSaveAchievements()
}

function equipTheme(themeId: string) {
  if (!unlockedThemes.value.includes(themeId)) return
  equippedTheme.value = themeId
  saveStr(EQUIPPED_KEY, themeId)
}

function checkAndSaveAchievements() {
  const newOnes = checkMergeAchievements(stats.value, unlockedAchievements.value)
  if (newOnes.length > 0) {
    for (const a of newOnes) {
      unlockedAchievements.value.push(a.id)
      coins.value += a.reward
    }
    saveJson(ACHIEVEMENTS_KEY, unlockedAchievements.value)
    saveNum(COINS_KEY, coins.value)
  }
}

function backToMenu() {
  adManager.gameplayStop()
  scene.value = 'menu'
}

onMounted(() => {
  // Resume audio on first interaction
  document.addEventListener('touchstart', resumeAudio, { once: true })
  document.addEventListener('click', resumeAudio, { once: true })
})
</script>

<template>
  <div
    class="app-root"
    :style="{ background: `linear-gradient(180deg, ${currentTheme.bgTop}, ${currentTheme.bgBot})` }"
  >
    <!-- Menu -->
    <MenuScene
      v-if="scene === 'menu'"
      :has-save="hasSave"
      :best-score="stats.highScore"
      @new-game="startNewGame"
      @continue="continueGame"
      @daily="showDaily = true"
      @themes="showThemes = true"
    />

    <!-- Game -->
    <template v-if="scene === 'game' && gameState">
      <GameBoard
        :grid="gameState.grid"
        :score="gameState.score"
        :best-score="gameState.bestScore"
        @move="handleMove"
        @new-game="startNewGame"
      />
      <div class="game-footer">
        <button class="btn-small" @click="backToMenu">🏠 選單</button>
        <button class="btn-small" @click="startNewGame">🔄 新局</button>
      </div>
    </template>

    <!-- Game Over -->
    <GameOverScene
      v-if="scene === 'gameover' && gameState"
      :score="gameState.score"
      :best-score="gameState.bestScore"
      :is-new-best="gameState.score >= gameState.bestScore"
      :highest-tile="gameState.highestTile"
      @new-game="handleNewGameFromOver"
    />

    <!-- Win Overlay -->
    <WinOverlay
      v-if="showWin && gameState"
      :score="gameState.score"
      @keep-playing="handleKeepPlaying"
      @new-game="handleNewGameFromOver"
    />

    <!-- Daily Reward -->
    <DailyReward
      v-if="showDaily"
      :available="isDailyRewardAvailable(lastDaily)"
      :coins="dailyRewardCoins()"
      @claim="claimDaily"
      @close="showDaily = false"
    />

    <!-- Theme Shop -->
    <ThemeShop
      v-if="showThemes"
      :themes="themeList"
      :equipped-theme="equippedTheme"
      :coins="coins"
      @buy="buyTheme"
      @equip="equipTheme"
      @close="showThemes = false"
    />
  </div>
</template>

<style scoped>
.app-root {
  width: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  transition: background 0.4s ease;
}

.game-footer {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-small {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.7);
  color: #555;
  backdrop-filter: blur(4px);
  transition: transform 0.1s;
}

.btn-small:active {
  transform: scale(0.96);
}
</style>
