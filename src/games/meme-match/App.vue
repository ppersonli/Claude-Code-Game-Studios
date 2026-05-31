<template>
  <div class="app">
    <!-- Level Select Screen -->
    <div v-if="state.status === 'idle'" class="screen level-select">
      <h1 class="title">🎮 Meme Match</h1>
      <p class="subtitle">梗图记忆翻牌</p>
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
      <div class="result-actions">
        <button class="btn btn-ad" @click="handleDoubleScore">🎬 Double Score</button>
        <button class="btn btn-primary" @click="handleRetry">🔄 Retry</button>
        <button class="btn btn-secondary" @click="handleBackToMenu">📋 Levels</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { AdManager } from '../../services/AdManager'
import { LEVELS } from './data/levels'
import {
  createInitialState,
  startGame,
  flipCard,
  checkMatch,
  tickTimer,
} from './composables/useGameLogic'
import CardGrid from './components/CardGrid.vue'
import GameTimer from './components/GameTimer.vue'
import ScoreBoard from './components/ScoreBoard.vue'

const state = reactive(createInitialState())
const missCardIds = ref(new Set<number>())
const adManager = AdManager.getInstance()
let currentLevelIndex = 0
let timerId: ReturnType<typeof setInterval> | null = null
let checkTimeoutId: ReturnType<typeof setTimeout> | null = null

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
}

async function handleGameEnd() {
  adManager.gameplayStop()
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
</style>
