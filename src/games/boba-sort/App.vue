<template>
  <div class="app" :class="currentTheme">
    <!-- ==================== START SCREEN ==================== -->
    <div v-if="screen === 'start'" class="screen start-screen">
      <div class="start-content">
        <div class="logo-area">
          <div class="logo-icon">🧋</div>
          <h1 class="game-title">珍珠奶茶排序</h1>
          <p class="game-subtitle">Boba Sort</p>
        </div>
        <div class="start-buttons">
          <button class="btn btn-primary" @click="startGame(0)">
            🎮 開始遊戲
          </button>
          <button class="btn btn-daily" @click="startDailyChallenge()">
            📅 每日挑戰
          </button>
          <div class="level-select">
            <h3>選擇關卡</h3>
            <div class="level-grid">
              <button
                v-for="(level, idx) in SORT_LEVELS"
                :key="level.id"
                class="btn btn-level"
                :class="{ locked: totalStars < level.requiredStars }"
                :disabled="totalStars < level.requiredStars"
                @click="startGame(idx)"
              >
                {{ idx + 1 }}
                <span v-if="totalStars < level.requiredStars" class="lock-icon">🔒</span>
                <span v-else class="level-stars">{{ getLevelBestStars(idx) }}⭐</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== GAME SCREEN ==================== -->
    <div v-if="screen === 'game'" class="screen game-screen">
      <!-- Header -->
      <div class="game-header">
        <button class="btn btn-icon" @click="goStart()">←</button>
        <div class="header-info">
          <span class="level-name">{{ state.level.name }}</span>
          <span v-if="isDaily" class="daily-badge">📅 每日</span>
        </div>
        <button class="btn btn-icon" @click="toggleMute()">
          {{ muted ? '🔇' : '🔊' }}
        </button>
      </div>

      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">步數</span>
          <span class="stat-value">{{ state.moves }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">目標</span>
          <span class="stat-value">{{ state.level.targetMoves }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">時間</span>
          <span class="stat-value">{{ formatTime(state.timeElapsed) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">連擊</span>
          <span class="stat-value combo-value" :class="{ 'combo-active': state.combo > 1 }">
            ×{{ getComboMultiplier(state.combo) }}
          </span>
        </div>
      </div>

      <!-- Tube Grid -->
      <div class="game-area">
        <TubeGrid
          :tubes="state.tubes"
          :selected-tube="state.selectedTube"
          :hint-from="hintFrom"
          :hint-to="hintTo"
          :pouring-from="pouringFrom"
          :pouring-to="pouringTo"
          @select-tube="handleTubeSelect"
        />
      </div>

      <!-- Action buttons -->
      <div class="action-bar">
        <button
          class="btn btn-action"
          :disabled="state.undoStack.length === 0"
          @click="handleUndo()"
        >
          ↩ 撤銷
        </button>
        <button class="btn btn-action" @click="handleHint()">
          💡 提示
        </button>
        <button class="btn btn-action btn-reward" @click="handleExtraTube()">
          🎬 加管
        </button>
      </div>
    </div>

    <!-- ==================== RESULT SCREEN ==================== -->
    <div v-if="screen === 'result'" class="screen result-screen">
      <div class="result-content" :class="{ 'result-win': state.won }">
        <div class="result-stars">
          <span
            v-for="s in 3"
            :key="s"
            class="star"
            :class="{ 'star-earned': s <= state.stars }"
            :style="{ animationDelay: `${s * 0.15}s` }"
          >
            {{ s <= state.stars ? '⭐' : '☆' }}
          </span>
        </div>
        <h2 class="result-title">
          {{ state.won ? '🎉 恭喜過關！' : '😤 再試一次！' }}
        </h2>
        <div class="result-stats">
          <div class="result-stat">
            <span>步數</span>
            <span>{{ state.moves }}</span>
          </div>
          <div class="result-stat">
            <span>時間</span>
            <span>{{ formatTime(state.timeElapsed) }}</span>
          </div>
          <div class="result-stat">
            <span>得分</span>
            <span>{{ state.score }}</span>
          </div>
          <div class="result-stat">
            <span>最高連擊</span>
            <span>×{{ getComboMultiplier(state.maxCombo) }}</span>
          </div>
        </div>
        <div class="result-buttons">
          <button class="btn btn-primary" @click="handleNext()">
            ➡ 下一關
          </button>
          <button class="btn btn-secondary" @click="handleRetry()">
            🔄 再玩一次
          </button>
          <button class="btn btn-secondary" @click="goStart()">
            🏠 主頁
          </button>
        </div>
      </div>
      <!-- Celebration particles -->
      <div v-if="state.won" class="particles">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, computed } from 'vue'
import { audioEngine } from '@shared/phaser/audio'
import { AdManager } from '../../services/AdManager'
import {
  createLevel,
  pour,
  undo,
  getHint,
  calculateScore,
  calculateStars,
  createDailyLevel,
  getDailyChallengeSeed,
  type SortState,
} from './composables/useGameLogic'
import { SORT_LEVELS } from './data/levels'
import TubeGrid from './components/TubeGrid.vue'

type Screen = 'start' | 'game' | 'result'

const screen = ref<Screen>('start')
const state = reactive<SortState>(createLevel(0))
const adManager = AdManager.getInstance()
const muted = ref(false)
const isDaily = ref(false)
const currentLevelIndex = ref(0)
const pouringFrom = ref<number | null>(null)
const pouringTo = ref<number | null>(null)
const hintFrom = ref<number | null>(null)
const currentTheme = ref('')
const hintTo = ref<number | null>(null)
let timerInterval: ReturnType<typeof setInterval> | null = null
let pourTimeout: ReturnType<typeof setTimeout> | null = null

// Persistence
const STORAGE_KEY = 'boba_sort_progress'
interface Progress {
  totalStars: number
  levelStars: number[]
  dailyCompleted: string[]
}
const progress = reactive<Progress>(loadProgress())

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { totalStars: 0, levelStars: [], dailyCompleted: [] }
}

function saveProgress(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch { /* ignore */ }
}

const totalStars = computed(() => progress.totalStars)

function getLevelBestStars(idx: number): number {
  return progress.levelStars[idx] ?? 0
}

// Ad callbacks
adManager.setAdCallbacks(
  () => { audioEngine.mute() },
  () => { audioEngine.unmute() },
)

function toggleMute(): void {
  muted.value = !muted.value
  if (muted.value) audioEngine.mute()
  else audioEngine.unmute()
}

function goStart(): void {
  stopTimer()
  screen.value = 'start'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getComboMultiplier(combo: number): number {
  if (combo <= 1) return 1
  if (combo <= 3) return 1.5
  if (combo <= 5) return 2
  if (combo <= 8) return 3
  return 5
}

// === Game Flow ===

function startGame(levelIndex: number): void {
  const s = createLevel(levelIndex)
  Object.assign(state, s)
  currentLevelIndex.value = levelIndex
  isDaily.value = false
  hintFrom.value = null
  hintTo.value = null
  pouringFrom.value = null
  pouringTo.value = null
  screen.value = 'game'
  adManager.gameplayStart()
  startTimer()

  // Midgame ad every 5 levels
  if (levelIndex > 0 && levelIndex % 5 === 0) {
    adManager.requestMidgameAd()
  }
}

function startDailyChallenge(): void {
  const seed = getDailyChallengeSeed()
  const s = createDailyLevel()
  Object.assign(state, s)
  currentLevelIndex.value = 1
  isDaily.value = true
  hintFrom.value = null
  hintTo.value = null
  pouringFrom.value = null
  pouringTo.value = null
  screen.value = 'game'
  adManager.gameplayStart()
  startTimer()
}

function startTimer(): void {
  stopTimer()
  timerInterval = setInterval(() => {
    state.timeElapsed++
  }, 1000)
}

function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function endGame(): void {
  stopTimer()
  adManager.gameplayStop()
  screen.value = 'result'

  // Update progress
  if (state.won) {
    const prev = progress.levelStars[currentLevelIndex.value] ?? 0
    if (state.stars > prev) {
      progress.levelStars[currentLevelIndex.value] = state.stars
    }
    // Recalculate total stars
    progress.totalStars = progress.levelStars.reduce((sum, s) => sum + (s ?? 0), 0)

    if (isDaily.value) {
      const today = new Date().toISOString().slice(0, 10)
      if (!progress.dailyCompleted.includes(today)) {
        progress.dailyCompleted.push(today)
      }
    }
    saveProgress()
  }
}

// === Tube Interaction ===

function handleTubeSelect(tubeId: number): void {
  if (state.gameOver) return

  // Clear hints
  hintFrom.value = null
  hintTo.value = null

  if (state.selectedTube === null) {
    // Select a tube
    if (state.tubes[tubeId].contents.length > 0) {
      state.selectedTube = tubeId
      audioEngine.play('tick')
    }
  } else if (state.selectedTube === tubeId) {
    // Deselect
    state.selectedTube = null
  } else {
    // Attempt pour
    const from = state.selectedTube
    const to = tubeId
    state.selectedTube = null

    // Start pour animation
    pouringFrom.value = from
    pouringTo.value = to

    // Delay actual pour to allow animation
    pourTimeout = setTimeout(() => {
      const success = pour(state, from, to)
      pouringFrom.value = null
      pouringTo.value = null

      if (success) {
        audioEngine.play('add')
        if (state.won) {
          audioEngine.play('levelup')
          setTimeout(() => endGame(), 800)
        }
      } else {
        audioEngine.play('fail')
      }
    }, 300)
  }
}

// === Actions ===

function handleUndo(): void {
  if (undo(state)) {
    audioEngine.play('tick')
  }
}

function handleHint(): void {
  const hint = getHint(state)
  if (hint) {
    hintFrom.value = hint.from
    hintTo.value = hint.to
    audioEngine.play('tick')
    // Clear hint after 2 seconds
    setTimeout(() => {
      hintFrom.value = null
      hintTo.value = null
    }, 2000)
  } else {
    audioEngine.play('fail')
  }
}

async function handleExtraTube(): Promise<void> {
  const rewarded = await adManager.requestRewardedAd()
  if (rewarded) {
    // Add an empty tube
    state.tubes.push({
      id: state.tubes.length,
      contents: [],
      capacity: state.level.itemsPerType,
    })
    audioEngine.play('unlock')
  }
}

function handleNext(): void {
  const next = currentLevelIndex.value + 1
  if (next < SORT_LEVELS.length) {
    startGame(next)
  } else {
    goStart()
  }
}

function handleRetry(): void {
  startGame(currentLevelIndex.value)
}

// === Particles ===

function particleStyle(i: number): Record<string, string> {
  const x = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 2 + Math.random() * 2
  const size = 6 + Math.random() * 8
  const colors = ['#ff6b9d', '#c44dff', '#ffd93d', '#6bcb77', '#4d96ff']
  const color = colors[i % colors.length]
  return {
    left: `${x}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`,
    background: color,
  }
}

// Cleanup
onUnmounted(() => {
  stopTimer()
  if (pourTimeout) clearTimeout(pourTimeout)
})
</script>

<style>
/* Global reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.app {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 30%, #a18cd1 70%, #fbc2eb 100%);
  color: #333;
}

/* Screens */
.screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Start Screen */
.start-screen {
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.start-content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.logo-area {
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.game-title {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 4px;
}

.game-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.start-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-select {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 16px;
}

.level-select h3 {
  color: #fff;
  margin-bottom: 12px;
  font-size: 16px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.btn-level {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px;
  font-size: 20px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 56px;
}

.btn-level:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}

.btn-level.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-stars {
  font-size: 10px;
}

.lock-icon {
  font-size: 14px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
  min-width: 48px;
  -webkit-tap-highlight-color: transparent;
}

.btn:active {
  transform: scale(0.95);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: #fff;
  box-shadow: 0 4px 12px rgba(196, 77, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(196, 77, 255, 0.4);
  transform: translateY(-2px);
}

.btn-daily {
  background: linear-gradient(135deg, #ffd93d, #ff6b6b);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-icon {
  width: 44px;
  height: 44px;
  padding: 0;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 50%;
}

.btn-action {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 14px;
  padding: 10px 16px;
}

.btn-reward {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
}

/* Game Screen */
.game-screen {
  display: flex;
  flex-direction: column;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.1);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-name {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.daily-badge {
  background: #ffd93d;
  color: #333;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.combo-active {
  color: #ffd93d;
  animation: combo-bounce 0.3s ease;
}

@keyframes combo-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.game-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: hidden;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px 16px;
  background: rgba(0, 0, 0, 0.1);
}

/* Result Screen */
.result-screen {
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.result-content {
  text-align: center;
  max-width: 360px;
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 32px 24px;
  animation: pop-in 0.4s ease;
}

@keyframes pop-in {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.star {
  font-size: 40px;
  opacity: 0.3;
  animation: star-appear 0.5s ease both;
}

.star-earned {
  opacity: 1;
  animation: star-earn 0.5s ease both;
}

@keyframes star-appear {
  from { transform: scale(0) rotate(-30deg); }
  to { transform: scale(1) rotate(0); }
}

@keyframes star-earn {
  0% { transform: scale(0) rotate(-30deg); }
  60% { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0); }
}

.result-title {
  font-size: 24px;
  color: #fff;
  margin-bottom: 20px;
}

.result-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 12px;
}

.result-stat span:first-child {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.result-stat span:last-child {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.result-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Particles */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  top: -20px;
  border-radius: 50%;
  animation: particle-fall linear infinite;
}

@keyframes particle-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
