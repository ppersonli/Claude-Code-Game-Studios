/**
 * App.vue — Root component for Block Blast Kawaii.
 * Manages game lifecycle, block placement, and meta state.
 */
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AdManager } from '../../services/AdManager'
import {
  createNewGame, restoreGame, saveGame, clearSave,
  placeBlockFromQueue, loadBestScore, saveBestScore,
  type GameState,
} from './logic/game-state'
import { canPlace } from './logic/grid'
import { getBlockDimensions } from './logic/blocks'
import {
  checkBlastAchievements, gameCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
  getAvailableBlastThemes, canBuyBlastTheme,
  type BlastStats,
} from './logic/meta'
import { getBlastThemeById } from './data/themes'
import GameBoard from './components/GameBoard.vue'
import BlockQueue from './components/BlockQueue.vue'
import ScoreDisplay from './components/ScoreDisplay.vue'
import GameOver from './components/GameOver.vue'
import DailyReward from './components/DailyReward.vue'
import ThemeShop from './components/ThemeShop.vue'

// === AdManager ===
const adManager = AdManager.getInstance()
adManager.init()
adManager.initAsync()

// === State ===
type Scene = 'menu' | 'game'

const scene = ref<Scene>('menu')
const gameState = ref<GameState | null>(null)
const showDaily = ref(false)
const showThemes = ref(false)
const showGameOver = ref(false)

// === Placement preview ===
const previewRow = ref(-1)
const previewCol = ref(-1)

// === Meta persistence ===
const COINS_KEY = 'block-blast-kawaii-coins'
const THEMES_KEY = 'block-blast-kawaii-themes'
const EQUIPPED_KEY = 'block-blast-kawaii-equipped'
const STATS_KEY = 'block-blast-kawaii-stats'
const DAILY_KEY = 'block-blast-kawaii-daily'
const ACHIEVEMENTS_KEY = 'block-blast-kawaii-achievements'

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
const unlockedThemes = ref<string[]>(loadJson(THEMES_KEY, ['pastel']))
const equippedTheme = ref(loadStr(EQUIPPED_KEY, 'pastel'))
const stats = ref<BlastStats>(loadJson(STATS_KEY, {
  highScore: 0, totalGames: 0, totalBlocksPlaced: 0, totalLinesCleared: 0,
  maxCombo: 0, maxLinesSingleMove: 0, dailyCompleted: 0, themesUnlocked: 1,
}))
const lastDaily = ref(loadStr(DAILY_KEY))
const unlockedAchievements = ref<string[]>(loadJson(ACHIEVEMENTS_KEY, []))

const currentTheme = computed(() => getBlastThemeById(equippedTheme.value))
const themeList = computed(() =>
  getAvailableBlastThemes(coins.value, stats.value.highScore, unlockedThemes.value),
)
const hasSave = computed(() => !!restoreGame())

const selectedBlockMatrix = computed(() => {
  if (!gameState.value || gameState.value.selectedBlockIndex < 0) return null
  return gameState.value.queue[gameState.value.selectedBlockIndex]?.shape.matrix ?? null
})

// === iOS AudioContext resume ===
let audioCtx: AudioContext | null = null
function resumeAudio() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
}

// === Game flow ===
function startNewGame() {
  resumeAudio()
  clearSave()
  gameState.value = createNewGame()
  scene.value = 'game'
  showGameOver.value = false
  previewRow.value = -1
  previewCol.value = -1
  adManager.gameplayStart()
}

function continueGame() {
  resumeAudio()
  const saved = restoreGame()
  if (saved) {
    gameState.value = saved
    scene.value = 'game'
    adManager.gameplayStart()
    if (saved.gameOver) showGameOver.value = true
  }
}

function selectBlock(index: number) {
  if (!gameState.value) return
  gameState.value.selectedBlockIndex = index
  previewRow.value = -1
  previewCol.value = -1
}

function handleCellClick(row: number, col: number) {
  if (!gameState.value || gameState.value.gameOver) return
  if (gameState.value.selectedBlockIndex < 0) return

  const block = gameState.value.queue[gameState.value.selectedBlockIndex]
  if (!block) return

  const result = placeBlockFromQueue(gameState.value, gameState.value.selectedBlockIndex, row, col)
  if (!result) return

  gameState.value = result.state
  previewRow.value = -1
  previewCol.value = -1

  // Update stats
  stats.value.totalBlocksPlaced++
  stats.value.totalLinesCleared += result.linesCleared
  if (result.linesCleared > stats.value.maxLinesSingleMove) {
    stats.value.maxLinesSingleMove = result.linesCleared
  }
  if (result.state.combo > stats.value.maxCombo) {
    stats.value.maxCombo = result.state.combo
  }

  if (result.state.gameOver) {
    handleGameOver()
  }
}

function handleGameOver() {
  adManager.gameplayStop()
  if (!gameState.value) return
  stats.value.totalGames++
  if (gameState.value.score > stats.value.highScore) {
    stats.value.highScore = gameState.value.score
  }
  const earned = gameCoins(gameState.value.score)
  coins.value += earned
  saveNum(COINS_KEY, coins.value)
  saveJson(STATS_KEY, stats.value)
  checkAndSaveAchievements()
  showGameOver.value = true
}

function backToMenu() {
  adManager.gameplayStop()
  scene.value = 'menu'
  showGameOver.value = false
}

function claimDaily() {
  const result = claimDailyReward(lastDaily.value)
  if (result.claimed) {
    lastDaily.value = result.today
    saveStr(DAILY_KEY, result.today)
    coins.value += dailyRewardCoins()
    saveNum(COINS_KEY, coins.value)
    stats.value.dailyCompleted++
    saveJson(STATS_KEY, stats.value)
    checkAndSaveAchievements()
  }
}

function buyTheme(themeId: string) {
  if (!canBuyBlastTheme(coins.value, stats.value.highScore, unlockedThemes.value, themeId)) return
  const theme = getBlastThemeById(themeId)
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
  const newOnes = checkBlastAchievements(stats.value, unlockedAchievements.value)
  if (newOnes.length > 0) {
    for (const a of newOnes) {
      unlockedAchievements.value.push(a.id)
      coins.value += a.reward
    }
    saveJson(ACHIEVEMENTS_KEY, unlockedAchievements.value)
    saveNum(COINS_KEY, coins.value)
  }
}

onMounted(() => {
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
    <div v-if="scene === 'menu'" class="menu">
      <h1 class="title">Block Blast</h1>
      <p class="subtitle">可愛動物方塊 ✨</p>
      <div v-if="stats.highScore > 0" class="best-display">最高分：{{ stats.highScore }}</div>
      <div class="buttons">
        <button class="btn btn-primary" @click="startNewGame">🎮 開始遊戲</button>
        <button v-if="hasSave" class="btn btn-continue" @click="continueGame">▶️ 繼續遊戲</button>
        <button class="btn btn-secondary" @click="showDaily = true">🎁 每日獎勵</button>
        <button class="btn btn-secondary" @click="showThemes = true">🎨 主題商店</button>
      </div>
      <p class="hint">點選下方方塊，然後點擊格子放置</p>
    </div>

    <!-- Game -->
    <template v-if="scene === 'game' && gameState">
      <ScoreDisplay
        :score="gameState.score"
        :best-score="gameState.bestScore"
        :combo="gameState.combo"
      />
      <GameBoard
        :grid="gameState.grid"
        :preview-matrix="selectedBlockMatrix"
        :preview-row="previewRow"
        :preview-col="previewCol"
        @cell-click="handleCellClick"
      />
      <BlockQueue
        :blocks="gameState.queue"
        :selected-index="gameState.selectedBlockIndex"
        @select="selectBlock"
      />
      <div class="game-footer">
        <button class="btn-small" @click="backToMenu">🏠 選單</button>
        <button class="btn-small" @click="startNewGame">🔄 新局</button>
      </div>
    </template>

    <!-- Game Over -->
    <GameOver
      v-if="showGameOver && gameState"
      :score="gameState.score"
      :best-score="gameState.bestScore"
      :is-new-best="gameState.score >= gameState.bestScore"
      :lines-cleared="gameState.linesCleared"
      @new-game="startNewGame"
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
  gap: 10px;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  transition: background 0.4s ease;
  padding: 10px 0;
}

.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.title {
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FF69B4, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
}

.subtitle {
  font-size: 1.1rem;
  color: #888;
  margin: 0;
}

.best-display {
  background: rgba(255, 105, 180, 0.15);
  padding: 5px 16px;
  border-radius: 16px;
  font-weight: 700;
  color: #FF69B4;
  font-size: 0.9rem;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 260px;
}

.btn {
  padding: 13px 20px;
  border: none;
  border-radius: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn:active { transform: scale(0.96); }
.btn-primary {
  background: linear-gradient(135deg, #FF69B4, #FF1493);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.4);
}
.btn-continue {
  background: linear-gradient(135deg, #4FC3F7, #0288D1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #555;
  backdrop-filter: blur(4px);
}

.hint {
  color: #aaa;
  font-size: 0.75rem;
  margin-top: 4px;
}

.game-footer {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.btn-small {
  padding: 7px 14px;
  border: none;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.7);
  color: #555;
  backdrop-filter: blur(4px);
  transition: transform 0.1s;
}

.btn-small:active { transform: scale(0.96); }
</style>
