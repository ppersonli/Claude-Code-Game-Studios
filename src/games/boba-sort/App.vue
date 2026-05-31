<template>
  <div class="app" :class="[currentTheme, { 'game-shake': gameShake }]">
    <!-- ==================== START SCREEN ==================== -->
    <div v-if="screen === 'start'" class="screen start-screen">
      <div class="start-content">
        <div class="logo-area">
          <div class="logo-icon">🧋</div>
          <h1 class="game-title">珍珠奶茶排序</h1>
          <p class="game-subtitle">Boba Sort</p>
        </div>
        <div class="meta-bar">
          <span class="coins-display">💰 {{ progress.coins }}</span>
          <span class="stars-display">⭐ {{ totalStars }}</span>
        </div>
        <div class="start-buttons">
          <button class="btn btn-primary" @click="startGame(0)">
            🎮 開始遊戲
          </button>
          <button class="btn btn-daily" @click="startDailyChallenge()">
            📅 每日挑戰
          </button>
          <div class="meta-buttons">
            <button class="btn btn-shop" @click="screen = 'shop'">🎨 主題商店</button>
            <button class="btn btn-achievements" @click="screen = 'achievements'">🏆 成就</button>
          </div>
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
        <div v-if="state.won" class="coins-earned">
          💰 +{{ resultCoins.level }} 關卡金幣
          <span v-if="resultCoins.daily > 0"> + {{ resultCoins.daily }} 每日獎勵</span>
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

    <!-- ==================== SHOP SCREEN ==================== -->
    <div v-if="screen === 'shop'" class="screen shop-screen">
      <div class="shop-content">
        <h2>🎨 主題商店</h2>
        <div class="shop-coins">💰 {{ progress.coins }}</div>
        <div class="theme-grid">
          <div
            v-for="item in getAvailableThemes(progress)"
            :key="item.theme.id"
            class="theme-card"
            :class="{ unlocked: item.unlocked, equipped: progress.equippedTheme === item.theme.id, 'can-buy': item.canBuy }"
            @click="item.canBuy ? handleBuyTheme(item.theme.id) : item.unlocked ? handleEquipTheme(item.theme.id) : null"
          >
            <div class="theme-preview" :style="{ background: item.theme.bgColor || 'rgba(255,255,255,0.1)', borderColor: item.theme.tubeBorder }">
              <span class="theme-emoji">{{ item.theme.emoji }}</span>
            </div>
            <div class="theme-name">{{ item.theme.name }}</div>
            <div v-if="progress.equippedTheme === item.theme.id" class="theme-status">✅ 使用中</div>
            <div v-else-if="item.unlocked" class="theme-status">已擁有</div>
            <div v-else class="theme-cost">💰 {{ item.theme.cost }} · ⭐ {{ item.theme.requiredStars }}</div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="screen = 'start'">← 返回</button>
      </div>
    </div>

    <!-- ==================== ACHIEVEMENTS SCREEN ==================== -->
    <div v-if="screen === 'achievements'" class="screen achievements-screen">
      <div class="achievements-content">
        <h2>🏆 成就</h2>
        <div class="achievement-list">
          <div
            v-for="a in ACHIEVEMENTS"
            :key="a.id"
            class="achievement-row"
            :class="{ unlocked: progress.achievements.includes(a.id) }"
          >
            <span class="achievement-icon">{{ a.emoji }}</span>
            <div class="achievement-info">
              <div class="achievement-name">{{ a.name }}</div>
              <div class="achievement-desc">{{ a.description }}</div>
            </div>
            <div class="achievement-reward">
              <span v-if="progress.achievements.includes(a.id)">✅</span>
              <span v-else>💰 {{ a.reward }}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="screen = 'start'">← 返回</button>
      </div>
    </div>

    <!-- Achievement notification overlay -->
    <div v-if="achievementNotif" class="achievement-notif">
      <div class="notif-content">
        <span class="notif-emoji">{{ achievementNotif.emoji }}</span>
        <span class="notif-text">{{ achievementNotif.name }} +💰{{ achievementNotif.reward }}</span>
      </div>
    </div>
    <!-- Combo particles -->
    <div
      v-for="p in comboParticles"
      :key="p.id"
      class="combo-particle"
      :style="{
        left: p.x + 'px', top: p.y + 'px',
        '--dx': p.dx + 'px', '--dy': p.dy + 'px',
        background: p.color,
      }"
    />

    <!-- Score popups -->
    <div
      v-for="sp in scorePopups"
      :key="sp.id"
      class="score-popup-float"
      :style="{ left: sp.x + 'px', top: sp.y + 'px', color: sp.color }"
    >
      {{ sp.text }}
    </div>

    <!-- Tutorial overlay -->
    <div v-if="showTutorial" class="tutorial-overlay" @click="nextTutorial">
      <div v-if="tutorialStep === 1" class="tutorial-card">
        <p>👆 <strong>點擊試管</strong>選擇要倒出的試管</p>
      </div>
      <div v-else-if="tutorialStep === 2" class="tutorial-card">
        <p>👉 <strong>再點另一個試管</strong>倒入相同顏色</p>
      </div>
      <div v-else-if="tutorialStep === 3" class="tutorial-card">
        <p>🎯 <strong>將所有顏色分類</strong>即可過關！</p>
      </div>
    </div>

    <SocialPanel game-name="珍珠奶茶排序" game-slug="boba-sort" share-text="来挑战珍珠奶茶排序吧！颜色分类烧脑又好玩！" />
    <LeaderboardPanel game-slug="boba-sort" game-name="珍珠奶茶排序" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, computed } from 'vue'
import { audioEngine } from '@shared/phaser/audio'
import { AdManager } from '../../services/AdManager'
import SocialPanel from '@shared/vue/SocialPanel.vue'
import LeaderboardPanel from '@shared/vue/LeaderboardPanel.vue'
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
import { THEMES } from './data/themes'
import { ACHIEVEMENTS } from './data/achievements'
import { type Progress, createDefaultProgress, onGameComplete, canBuyTheme, buyTheme, equipTheme, getEquippedTheme, getAvailableThemes, canBuyHint, buyHint, HINT_COST } from './composables/useMeta'
import TubeGrid from './components/TubeGrid.vue'

type Screen = 'start' | 'game' | 'result' | 'shop' | 'achievements'

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

const achievementNotif = ref<{ name: string; emoji: string; reward: number } | null>(null)
const resultCoins = ref({ level: 0, daily: 0 })

// Polish: shake, particles, tutorial, score popup
const gameShake = ref(false)
const comboParticles = ref<{ id: number; x: number; y: number; dx: number; dy: number; color: string }[]>([])
const scorePopups = ref<{ id: number; text: string; x: number; y: number; color: string }[]>([])
const tutorialStep = ref(0)
const showTutorial = ref(false)
let polishId = 0

function spawnComboParticles() {
  const colors = ['#ff6b9d', '#c44dff', '#ffd93d', '#6bcb77', '#4d96ff']
  for (let i = 0; i < 10; i++) {
    const id = ++polishId
    const angle = (i / 10) * Math.PI * 2
    const speed = 50 + Math.random() * 40
    comboParticles.value.push({
      id,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 60,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: colors[i % colors.length],
    })
    setTimeout(() => { comboParticles.value = comboParticles.value.filter(p => p.id !== id) }, 700)
  }
}

function spawnScorePopup(text: string, color: string) {
  const id = ++polishId
  const x = window.innerWidth / 2 + (Math.random() - 0.5) * 80
  const y = window.innerHeight / 2 - 100
  scorePopups.value.push({ id, text, x, y, color })
  setTimeout(() => { scorePopups.value = scorePopups.value.filter(p => p.id !== id) }, 1200)
}

function startTutorial() {
  tutorialStep.value = 1
  showTutorial.value = true
}
function nextTutorial() {
  tutorialStep.value++
  if (tutorialStep.value > 3) showTutorial.value = false
}

// Persistence
const STORAGE_KEY = 'boba_sort_progress'
const progress = reactive<Progress>(loadProgress())

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      const defaults = createDefaultProgress()
      return {
        totalStars: data.totalStars ?? 0,
        levelStars: Array.isArray(data.levelStars) ? data.levelStars : [],
        dailyCompleted: Array.isArray(data.dailyCompleted) ? data.dailyCompleted : [],
        coins: data.coins ?? 0,
        unlockedThemes: Array.isArray(data.unlockedThemes) ? data.unlockedThemes : ['classic'],
        equippedTheme: data.equippedTheme ?? 'classic',
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        stats: { ...defaults.stats, ...(data.stats ?? {}) },
      }
    }
  } catch { /* ignore */ }
  return createDefaultProgress()
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

  // Tutorial on first play
  if (progress.totalStars === 0 && levelIndex === 0) startTutorial()

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

  if (state.won) {
    const result = onGameComplete(
      progress, state.stars, state.score, state.maxCombo,
      state.timeElapsed, currentLevelIndex.value, isDaily.value,
    )
    resultCoins.value = { level: result.levelCoins, daily: result.dailyCoins }

    // Show achievement notifications
    if (result.newAchievements.length > 0) {
      const first = result.newAchievements[0]
      achievementNotif.value = { name: first.name, emoji: first.emoji, reward: first.reward }
      setTimeout(() => { achievementNotif.value = null }, 3000)
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
        // Score popup
        if (state.combo > 1) {
          spawnScorePopup(`×${getComboMultiplier(state.combo)}`, '#ffd93d')
          spawnComboParticles()
          gameShake.value = true
          setTimeout(() => { gameShake.value = false }, 300)
          if (navigator.vibrate) navigator.vibrate(30)
        }
        if (state.won) {
          audioEngine.play('levelup')
          spawnComboParticles()
          spawnComboParticles()
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

// === Theme & Achievement handlers ===

function handleBuyTheme(themeId: string): void {
  if (buyTheme(progress, themeId)) {
    audioEngine.play('unlock')
    currentTheme.value = getEquippedTheme(progress).bgColor ? 'theme-active' : ''
    saveProgress()
  }
}

function handleEquipTheme(themeId: string): void {
  if (equipTheme(progress, themeId)) {
    currentTheme.value = getEquippedTheme(progress).bgColor ? 'theme-active' : ''
    saveProgress()
  }
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

/* Meta UI */
.meta-bar {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 8px;
}
.coins-display, .stars-display {
  font-size: 16px;
  font-weight: 700;
  color: #FFD700;
  background: rgba(0,0,0,0.2);
  padding: 4px 14px;
  border-radius: 20px;
}
.meta-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.btn-shop {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  flex: 1;
}
.btn-achievements {
  background: linear-gradient(135deg, #ffd93d, #f0932b);
  color: #fff;
  flex: 1;
}
.coins-earned {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #FFD700;
  margin-bottom: 12px;
}

/* Shop screen */
.shop-screen {
  background: linear-gradient(135deg, #1a1a2e, #2d1b4e);
}
.shop-content {
  text-align: center;
  width: 100%;
  max-width: 400px;
  padding: 24px 0;
}
.shop-content h2 { color: #fff; margin-bottom: 8px; }
.shop-coins { font-size: 20px; color: #FFD700; font-weight: 700; margin-bottom: 16px; }
.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.theme-card {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.08);
  cursor: pointer;
  transition: all 0.2s;
}
.theme-card:active { transform: scale(0.96); }
.theme-card.equipped { border: 2px solid #4CAF50; }
.theme-card.can-buy { border: 2px solid #FFD700; }
.theme-card:not(.unlocked):not(.can-buy) { opacity: 0.4; cursor: not-allowed; }
.theme-preview {
  height: 50px;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.theme-emoji { font-size: 24px; }
.theme-name { font-size: 13px; color: #fff; font-weight: 600; }
.theme-status { font-size: 11px; color: #4CAF50; }
.theme-cost { font-size: 11px; color: #FFD700; }

/* Achievements screen */
.achievements-screen {
  background: linear-gradient(135deg, #1a1a2e, #2d1b4e);
}
.achievements-content {
  width: 100%;
  max-width: 400px;
  padding: 24px 0;
}
.achievements-content h2 { color: #fff; text-align: center; margin-bottom: 16px; }
.achievement-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.achievement-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
}
.achievement-row.unlocked { background: rgba(76,175,80,0.15); }
.achievement-icon { font-size: 24px; }
.achievement-info { flex: 1; text-align: left; }
.achievement-name { font-size: 13px; color: #fff; font-weight: 600; }
.achievement-desc { font-size: 11px; color: rgba(255,255,255,0.6); }
.achievement-reward { font-size: 13px; color: #FFD700; }

/* Achievement notification */
.achievement-notif {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  animation: slide-down 0.4s ease;
}
.notif-content {
  background: linear-gradient(135deg, #ffd93d, #f0932b);
  padding: 10px 20px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.notif-emoji { font-size: 20px; }
.notif-text { font-size: 14px; font-weight: 700; color: #2d1b4e; }
@keyframes slide-down {
  from { transform: translateX(-50%) translateY(-40px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

/* Game shake */
.game-shake {
  animation: game-shake 0.3s ease !important;
}
@keyframes game-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

/* Combo particles */
.combo-particle {
  position: fixed;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 150;
  animation: particle-burst 0.7s ease-out forwards;
}
@keyframes particle-burst {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}

/* Score popup */
.score-popup-float {
  position: fixed;
  pointer-events: none;
  z-index: 160;
  font-size: 24px;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  animation: score-float 1.2s ease-out forwards;
}
@keyframes score-float {
  0% { transform: scale(0.5) translateY(0); opacity: 1; }
  20% { transform: scale(1.4) translateY(-10px); }
  100% { transform: scale(0.8) translateY(-70px); opacity: 0; }
}

/* Tutorial */
.tutorial-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  cursor: pointer;
}
.tutorial-card {
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  padding: 24px 32px;
  border-radius: 16px;
  color: #fff;
  font-size: 18px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: pop-in 0.3s ease;
}
</style>
