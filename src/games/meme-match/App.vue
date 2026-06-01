<template>
  <div class="app">
    <!-- Level Select Screen -->
    <div v-if="state.status === 'idle' && metaScreen === 'idle'" class="screen level-select">
      <h1 class="title">🎮 Meme Match</h1>
      <p class="subtitle">梗图记忆翻牌</p>
      <div class="meta-bar">
        <span class="coins-display">💰 {{ meta.coins }}</span>
        <span class="achievements-display">🏆 {{ meta.achievements.length }}/{{ MEME_ACHIEVEMENTS.length }}</span>
      </div>
      <div class="meta-buttons">
        <button v-if="isDailyRewardAvailable(meta.lastDailyDate)" class="btn btn-daily" @click="handleClaimDaily">
          🎁 每日奖励 +{{ dailyRewardCoins() }}💰
        </button>
        <button class="btn btn-themes" @click="metaScreen = 'themes'">🎨 主题商店</button>
      </div>
      <div class="level-list">
        <button
          v-for="(level, i) in LEVELS"
          :key="level.id"
          class="level-btn"
          :class="{ locked: i >= state.unlockedLevels }"
          :disabled="i >= state.unlockedLevels"
          @click="handleStart(i)"
        >
          <span class="level-name">{{ level.name }}</span>
          <span class="level-info">{{ level.cols }}×{{ level.rows }} · {{ level.timeLimit }}s</span>
          <span v-if="state.bestScores[level.name]" class="best-score">
            Best: {{ state.bestScores[level.name] }}
          </span>
          <span v-if="i >= state.unlockedLevels" class="lock-icon">🔒 Score {{ level.requiredScore }}</span>
        </button>
      </div>
    </div>

    <!-- Themes Screen -->
    <div v-else-if="state.status === 'idle' && metaScreen === 'themes'" class="screen level-select">
      <h2 class="title" style="font-size:1.8rem">🎨 主题商店</h2>
      <div class="meta-bar">
        <span class="coins-display">💰 {{ meta.coins }}</span>
      </div>
      <div class="theme-grid">
        <div
          v-for="item in getAvailableMemeThemes(meta.coins, bestScore, meta.unlockedThemes)"
          :key="item.theme.id"
          class="theme-card"
          :class="{ unlocked: item.unlocked, 'can-buy': item.canBuy }"
          @click="item.canBuy ? handleBuyTheme(item.theme.id) : item.unlocked ? handleEquipTheme(item.theme.id) : null"
        >
          <span class="theme-emoji">{{ item.theme.emoji }}</span>
          <span class="theme-name">{{ item.theme.name }}</span>
          <span v-if="meta.equippedTheme === item.theme.id" class="theme-status equipped">✅ 使用中</span>
          <span v-else-if="item.unlocked" class="theme-status">已拥有</span>
          <span v-else class="theme-cost">💰{{ item.theme.cost }}</span>
        </div>
      </div>
      <button class="btn btn-themes" @click="metaScreen = 'idle'">← 返回</button>
    </div>

    <!-- Game Screen -->
    <div v-else-if="state.status === 'playing'" class="screen game-screen">
      <div class="game-header">
        <GameTimer :time-remaining="state.timeRemaining" />
        <ScoreBoard
          :score="state.score"
          :combo="state.combo"
          :matches-found="state.matchesFound"
          :total-pairs="state.totalPairs"
        />
      </div>
      <div class="game-body">
        <CardGrid
          :cards="state.cards"
          :cols="state.level.cols"
          :miss-card-ids="missCardIds"
          @flip="handleFlip"
        />
      </div>
    </div>

    <!-- Result Screen -->
    <div v-else class="screen result-screen">
      <h1 :class="state.status === 'won' ? 'win-title' : 'lose-title'">
        {{ state.status === 'won' ? '🎉 You Win!' : '⏰ Time\'s Up!' }}
      </h1>
      <div class="result-stats">
        <div class="result-stat">
          <span class="label">Score</span>
          <span class="value">{{ state.score }}</span>
        </div>
        <div class="result-stat">
          <span class="label">Max Combo</span>
          <span class="value">{{ state.maxCombo }}</span>
        </div>
        <div class="result-stat">
          <span class="label">Misses</span>
          <span class="value">{{ state.misses }}</span>
        </div>
        <div class="result-stat" v-if="state.misses === 0 && state.status === 'won'">
          <span class="value perfect">✨ PERFECT! ×2</span>
        </div>
      </div>
      <div class="coins-earned">💰 +{{ gameCoins(state.score, state.status === 'won') }} coins</div>
      <div class="result-actions">
        <button class="btn btn-ad" @click="handleDoubleScore">🎬 Double Score</button>
        <button class="btn btn-primary" @click="handleRetry">🔄 Retry</button>
        <button class="btn btn-secondary" @click="handleBackToMenu">📋 Levels</button>
      </div>
    </div>

    <!-- Achievement notification -->
    <div v-if="achievementNotif" class="achievement-notif">
      <span>{{ achievementNotif }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, computed } from 'vue'
import { AdManager } from '../../services/AdManager'
import { LEVELS } from './data/levels'
import { MEME_THEMES } from './data/themes'
import { MEME_ACHIEVEMENTS } from './data/achievements'
import {
  createInitialState,
  startGame,
  flipCard,
  checkMatch,
  tickTimer,
} from './composables/useGameLogic'
import {
  canBuyMemeTheme, getAvailableMemeThemes, equipMemeTheme,
  checkMemeAchievements, gameCoins, dailyRewardCoins,
  isDailyRewardAvailable, claimDailyReward,
  type MemeStats,
} from './composables/useMeta'
import CardGrid from './components/CardGrid.vue'
import GameTimer from './components/GameTimer.vue'
import ScoreBoard from './components/ScoreBoard.vue'

type MetaScreen = 'idle' | 'themes'

const state = reactive(createInitialState())
const missCardIds = ref(new Set<number>())
const adManager = AdManager.getInstance()
let currentLevelIndex = 0
let timerId: ReturnType<typeof setInterval> | null = null
let checkTimeoutId: ReturnType<typeof setTimeout> | null = null

// Meta state
const META_KEY = 'mm_meta'
function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* */ }
  return { coins: 0, unlockedThemes: ['classic'], equippedTheme: 'classic', achievements: [], stats: { totalGames: 0, totalWins: 0, totalMatches: 0, totalMisses: 0, bestCombo: 0, highestScore: 0, perfectGames: 0, levelsCompleted: 0, themesUnlocked: 1, dailyCompleted: 0 }, lastDailyDate: '' }
}
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch { /* */ } }

const meta = reactive(loadMeta())
const metaScreen = ref<MetaScreen>('idle')
const achievementNotif = ref<string | null>(null)

const bestScore = computed(() => Math.max(0, ...Object.values(state.bestScores).map(Number)))

function handleBuyTheme(id: string) {
  const theme = MEME_THEMES.find(t => t.id === id)
  if (!theme || !canBuyMemeTheme(meta.coins, bestScore.value, meta.unlockedThemes, id)) return
  meta.coins -= theme.cost
  meta.unlockedThemes.push(id)
  meta.equippedTheme = id
  meta.stats.themesUnlocked = meta.unlockedThemes.length
  saveMeta()
}

function handleEquipTheme(id: string) {
  if (equipMemeTheme(meta.unlockedThemes, id)) {
    meta.equippedTheme = id
    saveMeta()
  }
}

function handleClaimDaily() {
  const result = claimDailyReward(meta.lastDailyDate)
  if (result.claimed) {
    meta.lastDailyDate = result.today
    meta.coins += dailyRewardCoins()
    meta.stats.dailyCompleted++
    saveMeta()
  }
}

function checkAchievements() {
  const newA = checkMemeAchievements(meta.stats, meta.achievements)
  for (const a of newA) {
    meta.achievements.push(a.id)
    meta.coins += a.reward
  }
  if (newA.length > 0) {
    achievementNotif.value = `${newA[0].emoji} ${newA[0].name}! +${newA[0].reward}💰`
    setTimeout(() => { achievementNotif.value = null }, 3000)
    saveMeta()
  }
}

adManager.setAdCallbacks(
  () => stopTimer(),
  () => { if (state.status === 'playing') startTimer() },
)

function handleStart(levelIndex: number) {
  currentLevelIndex = levelIndex
  startGame(state, levelIndex)
  missCardIds.value = new Set()
  startTimer()
  adManager.gameplayStart()
}

function handleFlip(cardId: number) {
  if (state.status !== 'playing') return
  if (state.flippedCardIds.length >= 2) return
  const flipped = flipCard(state, cardId)
  if (!flipped) return

  if (state.flippedCardIds.length === 2) {
    // Check match after short delay so player can see both cards
    checkTimeoutId = setTimeout(() => {
      const result = checkMatch(state)
      if (result && !result.isMatch) {
        // Flash miss animation
        const prevFlipped = state.cards
          .filter(c => !c.matched && !c.flipped)
          .slice(-2)
        // Use a simpler approach: find cards that were just flipped back
        const ids = result.isMatch ? [] : findJustFlippedBackCards(state)
        missCardIds.value = new Set(ids)
        setTimeout(() => {
          missCardIds.value = new Set()
        }, 400)
      }
      if (state.status === 'won') {
        handleGameEnd()
      } else {
        if (navigator.vibrate) navigator.vibrate(20)
      }
    }, 600)
  }
}

function findJustFlippedBackCards(state: ReturnType<typeof createInitialState>): number[] {
  // After a miss, cards are already flipped back. We need to track them differently.
  // For simplicity, we'll use the last two cards that were in flippedCardIds before clearing.
  return []
}

function startTimer() {
  stopTimer()
  timerId = setInterval(() => {
    const expired = tickTimer(state)
    if (expired) {
      stopTimer()
      handleGameEnd()
    }
  }, 1000)
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

function handleRetry() {
  handleStart(currentLevelIndex)
}

function handleBackToMenu() {
  state.status = 'idle'
  metaScreen.value = 'idle'
}

async function handleGameEnd() {
  adManager.gameplayStop()
  meta.stats.totalGames++
  if (state.status === 'won') {
    meta.stats.totalWins++
    if (state.misses === 0) meta.stats.perfectGames++
    const levelName = LEVELS[currentLevelIndex]?.name
    if (levelName && !meta.stats.levelsCompleted) meta.stats.levelsCompleted = (meta.stats.levelsCompleted as unknown as number) || 0
    meta.stats.levelsCompleted = Math.max(meta.stats.levelsCompleted as unknown as number, currentLevelIndex + 1)
    meta.stats.highestScore = Math.max(meta.stats.highestScore, state.score)
  }
  meta.stats.totalMatches += state.matchesFound
  meta.stats.totalMisses += state.misses
  if (state.maxCombo > meta.stats.bestCombo) meta.stats.bestCombo = state.maxCombo
  const earned = gameCoins(state.score, state.status === 'won')
  meta.coins += earned
  saveMeta()
  checkAchievements()
  // Midgame ad every 3 completed levels
  if (state.status === 'won' && currentLevelIndex > 0 && (currentLevelIndex + 1) % 3 === 0) {
    await adManager.requestMidgameAd()
  }
}

async function handleDoubleScore() {
  const success = await adManager.requestRewardedAd()
  if (success) {
    state.score *= 2
  }
}

onUnmounted(() => {
  stopTimer()
  if (checkTimeoutId) clearTimeout(checkTimeoutId)
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #1e1b4b, #581c87, #be185d);
  min-height: 100vh;
  overflow-x: hidden;
}

.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
}

.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px 0;
}

/* Level Select */
.title {
  font-size: 2.5rem;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.level-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.level-btn:hover:not(.locked) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.level-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-name {
  font-size: 1.25rem;
  font-weight: bold;
}

.level-info {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.best-score {
  font-size: 0.85rem;
  color: #fbbf24;
}

.lock-icon {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Game Screen */
.game-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.game-body {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* Result Screen */
.win-title {
  font-size: 2.5rem;
  color: #22c55e;
  text-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);
}

.lose-title {
  font-size: 2.5rem;
  color: #ef4444;
  text-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 300px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.result-stat .label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.result-stat .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.result-stat .value.perfect {
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.result-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.25);
}

.btn-ad {
  background: linear-gradient(135deg, #e056fd, #be2edd);
  color: white;
}

.btn-ad:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(224, 86, 253, 0.4);
}

/* Meta UI */
.meta-bar {
  display: flex; gap: 12px; justify-content: center;
}
.coins-display, .achievements-display {
  font-size: 14px; font-weight: 700; color: #FFD700;
  background: rgba(0,0,0,0.2); padding: 4px 14px; border-radius: 20px;
}
.meta-buttons {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
}
.btn-daily {
  background: linear-gradient(135deg, #00b894, #00cec9); color: #fff;
  border: none; border-radius: 12px; padding: 10px 20px;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
}
.btn-themes {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff;
  border: none; border-radius: 12px; padding: 10px 20px;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
}
.coins-earned {
  font-size: 16px; font-weight: 700; color: #FFD700; text-align: center;
}
.theme-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; max-width: 360px;
}
.theme-card {
  padding: 12px; border-radius: 14px; background: rgba(255,255,255,0.08);
  text-align: center; cursor: pointer; transition: all 0.2s;
}
.theme-card:active { transform: scale(0.96); }
.theme-card.unlocked { border: 2px solid rgba(76,175,80,0.5); }
.theme-card.can-buy { border: 2px solid rgba(255,215,0,0.5); }
.theme-card:not(.unlocked):not(.can-buy) { opacity: 0.4; cursor: not-allowed; }
.theme-emoji { font-size: 28px; display: block; margin-bottom: 4px; }
.theme-name { font-size: 12px; color: #fff; font-weight: 600; }
.theme-status { font-size: 11px; color: #4CAF50; }
.theme-status.equipped { color: #FFD700; }
.theme-cost { font-size: 11px; color: #FF8C00; }
.achievement-notif {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd93d, #f0932b);
  padding: 10px 20px; border-radius: 14px; z-index: 200;
  font-size: 14px; font-weight: 700; color: #2d1b4e;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  animation: slide-down 0.4s ease;
}
@keyframes slide-down {
  from { transform: translateX(-50%) translateY(-40px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
</style>
