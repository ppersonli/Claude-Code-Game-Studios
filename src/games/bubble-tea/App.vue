<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import type { Ingredient } from '@types'
import { audioEngine } from '@shared/phaser/audio'
import { AdManager } from '../../services/AdManager'
import {
  createInitialState,
  startStandardGame,
  startDailyGame,
  nextCustomer,
  addToCup,
  serveDrink,
  resetCup,
  endGame,
  unlockItem,
  clearTimer,
  addFloatText,
  addScorePopup,
  getDailyModifier,
  getDailySeed,
  getComboMultiplier,
  isIngredientUnlocked,
  INGREDIENTS,
  CUSTOMERS,
} from './composables/useGameState'
import { ACHIEVEMENTS } from './data/customers'
import IngredientShelf from './components/IngredientShelf.vue'
import CustomerDisplay from './components/CustomerDisplay.vue'
import GameHud from './components/GameHud.vue'
import CupVisual from './components/CupVisual.vue'

type Screen = 'start' | 'game' | 'result' | 'daily' | 'shop'

const screen = ref<Screen>('start')
const state = reactive(createInitialState())
const adManager = AdManager.getInstance()
const shopFreeCoinsClaimed = ref(false)

// Wire ad callbacks — mute audio and set adPlaying flag during ads
adManager.setAdCallbacks(
  () => { state.adPlaying = true; audioEngine.mute() },
  () => { state.adPlaying = false; audioEngine.unmute() },
)

// === Screen transitions ===

function goStart() {
  screen.value = 'start'
}

function goPlay() {
  audioEngine.init()
  startStandardGame(state)
  screen.value = 'game'
  nextCustomer(state)
  adManager.gameplayStart()
}

function goDaily() {
  audioEngine.init()
  state.dailySeed = getDailySeed()
  const modifier = getDailyModifier(state.dailySeed)
  state.dailyModifier = modifier
  screen.value = 'daily'
}

function goDailyPlay() {
  if (!state.dailyModifier) return
  startDailyGame(state, state.dailyModifier)
  screen.value = 'game'
  nextCustomer(state)

  // Start timer
  state.dailyTimerId = setInterval(() => {
    state.dailyTimer--
    if (state.dailyTimer <= 10) audioEngine.play('tick')
    if (state.dailyTimer <= 0) {
      handleEndGame()
    }
  }, 1000)
}

function goShop() {
  audioEngine.init()
  screen.value = 'shop'
}

// === Game actions ===

function handleAddToCup(ingredient: Ingredient) {
  if (state.cupContents.length >= 6) {
    audioEngine.play('full')
    addFloatText(state, '杯子满了！', '#ff6b6b')
    return
  }
  addToCup(state, ingredient)
  audioEngine.play('add')
  if (navigator.vibrate) navigator.vibrate(30)
}

function handleServe() {
  const result = serveDrink(state)
  if (!result) {
    if (state.cupContents.length === 0) {
      audioEngine.play('full')
      addFloatText(state, '先加点料吧！', '#ff6b6b')
    }
    return
  }

  if (result.isPerfect) {
    audioEngine.play('perfect')
    const comboMult = getComboMultiplier(state.combo)
    addScorePopup(state, `+${result.points} 完美! 🔥 x${state.combo}`, '#ffd700')
    addFloatText(state, `🔥 x${state.combo} 连击!`, '#ff6b6b')
  } else {
    audioEngine.play('fail')
    if (result.points > 0) {
      addFloatText(state, `+${result.points}`, '#4CAF50')
    } else {
      addFloatText(state, '不太对... 😅', '#ff6b6b')
    }
  }

  // Check achievements
  checkNewAchievements()

  // Level up
  const shouldShowMidgameAd = state.levelUpLevel !== null && state.level % 3 === 0
  if (state.levelUpLevel !== null) {
    audioEngine.play('levelup')
    setTimeout(() => { state.levelUpLevel = null }, 1500)
  }

  // Next customer after delay — midgame ad every 3 levels
  setTimeout(() => {
    state.screenShake = false
    if (state.gameOver) {
      handleEndGame()
    } else if (shouldShowMidgameAd) {
      handleMidgameAd().then(() => {
        nextCustomer(state)
        if (state.gameOver) handleEndGame()
        state.serving = false
      })
    } else {
      nextCustomer(state)
      if (state.gameOver) handleEndGame()
      state.serving = false
    }
  }, 1500)
}

function handleResetCup() {
  resetCup(state)
}

function handleEndGame() {
  endGame(state)
  clearTimer(state)
  screen.value = 'result'
  adManager.gameplayStop()
}

function handleShopUnlock(type: 'ingredient' | 'customer', id: string, cost: number) {
  if (unlockItem(state, type, id, cost)) {
    audioEngine.play('unlock')
    addFloatText(state, `🔓 解锁了: ${id}!`, '#FFD700')
    checkNewAchievements()
  } else {
    addFloatText(state, `金币不足! 需要${cost}`, '#ff6b6b')
  }
}

function checkNewAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id)
      addFloatText(state, `🏆 ${a.name}!`, '#FFD700')
    }
  }
}

// === Ad helpers ===

async function handleMidgameAd() {
  adManager.gameplayStop()
  await adManager.requestMidgameAd()
  adManager.gameplayStart()
}

async function handleDoubleCoins() {
  const success = await adManager.requestRewardedAd()
  if (success) {
    state.totalCoins += state.score
    state.coins = state.totalCoins
    addFloatText(state, `🎬 双倍金币! +${state.score}`, '#ffd700')
  }
}

async function handleFreeCoins() {
  if (shopFreeCoinsClaimed.value) return
  const success = await adManager.requestRewardedAd()
  if (success) {
    shopFreeCoinsClaimed.value = true
    state.totalCoins += 50
    state.coins = state.totalCoins
    addFloatText(state, '🎬 免费50金币!', '#ffd700')
  }
}
// === Computed ===

const availableIngredients = computed(() =>
  INGREDIENTS.filter(i => isIngredientUnlocked(i, state.unlockedIngredients))
)

const fulfilledIndices = computed(() => {
  const set = new Set<number>()
  if (!state.currentOrder.length || !state.cupContents.length) return set
  const orderUsed = new Array(state.currentOrder.length).fill(false)
  for (const cup of state.cupContents) {
    for (let j = 0; j < state.currentOrder.length; j++) {
      if (!orderUsed[j] && cup.id === state.currentOrder[j].id) {
        set.add(j)
        orderUsed[j] = true
        break
      }
    }
  }
  return set
})

const resultStats = computed(() => ({
  modeText: state.isDaily ? '每日挑战' : '标准模式',
  dailyGoalText: state.isDaily && state.dailyModifier?.goal
    ? `每日目标: ${state.dailyGoalProgress}/${state.dailyModifier.goal.count} ${state.dailyCompleted ? '✅ 完成!' : '❌ 未完成'}`
    : '',
}))

onUnmounted(() => clearTimer(state))
</script>

<template>
  <div class="game-root" :class="{ 'screen-shake': state.screenShake }">
    <!-- Start Screen -->
    <div v-if="screen === 'start'" class="screen start-screen">
      <img src="/assets/cover.webp" alt="Bubble Tea Creator" class="cover-img">
      <h1>🧋 奶茶大师</h1>
      <div class="btn-group">
        <button class="btn btn-primary" @click="goPlay">🎮 开始游戏</button>
        <button class="btn btn-daily" @click="goDaily">📅 每日挑战</button>
        <button class="btn btn-shop" @click="goShop">🛒 解锁商店</button>
      </div>
    </div>

    <!-- Daily Preview Screen -->
    <div v-else-if="screen === 'daily'" class="screen daily-screen">
      <div class="daily-info" v-if="state.dailyModifier">
        <h2>{{ state.dailyModifier.icon }} {{ state.dailyModifier.name }}</h2>
        <p>{{ state.dailyModifier.desc }}</p>
        <p class="daily-reward">奖励: 完成可获得200金币 (x{{ state.dailyModifier.scoreMultiplier }}分数倍率)</p>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" @click="goDailyPlay">🚀 开始挑战</button>
        <button class="btn btn-back" @click="goStart">← 返回</button>
      </div>
    </div>

    <!-- Game Screen -->
    <div v-else-if="screen === 'game'" class="screen game-screen">
      <GameHud
        :score="state.score"
        :level="state.level"
        :combo="state.combo"
        :time-left="state.isDaily ? state.dailyTimer : undefined"
      />
      <CustomerDisplay
        :customer="state.currentCustomer"
        :order="state.currentOrder"
        :mood="state.customerMood"
        :fulfilled-indices="fulfilledIndices"
      />
      <CupVisual :contents="state.cupContents" />
      <div class="game-actions">
        <button class="btn btn-serve" @click="handleServe">🥤 出杯</button>
        <button class="btn btn-reset" @click="handleResetCup">🔄 重做</button>
      </div>
      <IngredientShelf
        :ingredients="INGREDIENTS"
        :unlocked-ids="state.unlockedIngredients"
        @select="handleAddToCup"
        @unlock="(ing) => handleShopUnlock('ingredient', ing.id, ing.unlockCost ?? 0)"
      />
    </div>

    <!-- Result Screen -->
    <div v-else-if="screen === 'result'" class="screen result-screen">
      <h2>🏆 结算</h2>
      <div class="final-score">{{ state.score }}</div>
      <div class="final-stats">
        模式: {{ resultStats.modeText }}<br>
        服务顾客: {{ state.drinksServed }} 位<br>
        完美调配: {{ state.perfectCount }} 杯<br>
        最高连击: {{ state.maxCombo }} 🔥<br>
        达到等级: Lv.{{ state.level }}<br>
        累计金币: 💰 {{ state.totalCoins }}
        <template v-if="resultStats.dailyGoalText"><br>{{ resultStats.dailyGoalText }}</template>
      </div>
      <div class="achievements-grid">
        <div
          v-for="a in ACHIEVEMENTS"
          :key="a.id"
          class="achievement-badge"
          :class="{ unlocked: state.achievements.includes(a.id) }"
        >
          <img :src="a.img" :alt="a.name" :style="{ opacity: state.achievements.includes(a.id) ? 1 : 0.3 }">
          <span>{{ state.achievements.includes(a.id) ? a.name : '???' }}</span>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-ad" @click="handleDoubleCoins">🎬 双倍金币</button>
        <button class="btn btn-primary" @click="goPlay">🔄 再来一局</button>
        <button class="btn btn-back" @click="goStart">🏠 主页</button>
      </div>
    </div>

    <!-- Shop Screen -->
    <div v-else-if="screen === 'shop'" class="screen shop-screen">
      <h2>🛒 解锁商店</h2>
      <div class="shop-coins">💰 {{ state.totalCoins }}</div>
      <div class="unlock-grid">
        <div
          v-for="ing in INGREDIENTS.filter(i => i.locked)"
          :key="'i-' + ing.id"
          class="unlock-card"
          :class="{
            unlocked: state.unlockedIngredients.includes(ing.id),
            locked: !state.unlockedIngredients.includes(ing.id) && state.totalCoins < (ing.unlockCost ?? 0),
          }"
          @click="!state.unlockedIngredients.includes(ing.id) && handleShopUnlock('ingredient', ing.id, ing.unlockCost ?? 0)"
        >
          <img :src="ing.img" :alt="ing.name">
          <div class="name">{{ ing.name }}</div>
          <div v-if="state.unlockedIngredients.includes(ing.id)" class="owned">✅ 已解锁</div>
          <div v-else class="cost">💰 {{ ing.unlockCost }}</div>
        </div>
        <div
          v-for="cust in CUSTOMERS.filter(c => c.locked)"
          :key="'c-' + cust.name"
          class="unlock-card"
          :class="{
            unlocked: state.unlockedCustomers.includes(cust.name),
            locked: !state.unlockedCustomers.includes(cust.name) && state.totalCoins < (cust.unlockCost ?? 0),
          }"
          @click="!state.unlockedCustomers.includes(cust.name) && handleShopUnlock('customer', cust.name, cust.unlockCost ?? 0)"
        >
          <img :src="cust.img" :alt="cust.name">
          <div class="name">{{ cust.name }}</div>
          <div v-if="state.unlockedCustomers.includes(cust.name)" class="owned">✅ 已解锁</div>
          <div v-else class="cost">💰 {{ cust.unlockCost }}</div>
        </div>
      </div>
      <div class="btn-group">
        <button
          class="btn btn-ad"
          :disabled="shopFreeCoinsClaimed"
          @click="handleFreeCoins"
        >🎬 {{ shopFreeCoinsClaimed ? '已领取' : '免费50金币' }}</button>
        <button class="btn btn-back" @click="goStart">← 返回</button>
      </div>
    </div>

    <!-- Float effects -->
    <div
      v-for="ft in state.floatTexts"
      :key="ft.id"
      class="float-text"
      :style="{ left: ft.x + 'px', top: ft.y + 'px', color: ft.color }"
    >
      {{ ft.text }}
    </div>
    <div
      v-for="sp in state.scorePopups"
      :key="sp.id"
      class="score-popup"
      :style="{ left: sp.x + 'px', top: sp.y + 'px', color: sp.color }"
    >
      {{ sp.text }}
    </div>

    <!-- Level up overlay -->
    <div v-if="state.levelUpLevel !== null" class="level-up-overlay">
      <div class="level-up-box">
        <h2>⬆️ Level {{ state.levelUpLevel }}!</h2>
        <p>食材种类增加了！</p>
      </div>
    </div>
  </div>
</template>

<style>
/* Global game styles */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
</style>

<style scoped>
.game-root {
  width: 100%; height: 100dvh;
  display: flex; flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative; overflow: hidden;
}
.game-root.screen-shake { animation: shake 0.3s ease; }

.screen {
  display: none; flex-direction: column; align-items: center;
  padding: 20px; width: 100%; height: 100%;
}
.screen[style], .screen { display: flex; }

/* Start screen */
.start-screen { justify-content: center; gap: 24px; }
.cover-img { width: 160px; height: 160px; border-radius: 24px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.start-screen h1 { color: #fff; font-size: 28px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }

/* Buttons */
.btn-group { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px; }
.btn {
  padding: 14px 24px; border: none; border-radius: 16px;
  font-size: 16px; font-weight: 600; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.btn:active { transform: scale(0.96); }
.btn-primary { background: linear-gradient(135deg, #FF6B6B, #ee5a24); color: #fff; }
.btn-daily { background: linear-gradient(135deg, #f9ca24, #f0932b); color: #fff; }
.btn-shop { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
.btn-serve { background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; flex: 1; }
.btn-reset { background: rgba(255,255,255,0.2); color: #fff; flex: 0.5; }
.btn-back { background: rgba(255,255,255,0.2); color: #fff; }
.btn-ad { background: linear-gradient(135deg, #e056fd, #be2edd); color: #fff; }
.btn-ad:disabled { opacity: 0.5; cursor: not-allowed; }

/* Game screen */
.game-screen { justify-content: space-between; padding: 12px; gap: 8px; }
.game-actions { display: flex; gap: 12px; width: 100%; max-width: 280px; }

/* Daily screen */
.daily-screen { justify-content: center; gap: 24px; color: #fff; }
.daily-info { text-align: center; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 24px; }
.daily-reward { margin-top: 12px; color: #f9ca24; font-weight: 600; }

/* Result screen */
.result-screen { justify-content: center; gap: 16px; color: #fff; }
.final-score { font-size: 48px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.final-stats { text-align: center; font-size: 14px; line-height: 1.8; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; }
.achievements-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.achievement-badge { display: flex; flex-direction: column; align-items: center; width: 60px; }
.achievement-badge img { width: 36px; height: 36px; }
.achievement-badge span { font-size: 10px; text-align: center; }

/* Shop screen */
.shop-screen { gap: 16px; color: #fff; overflow-y: auto; padding-top: 24px; }
.shop-coins { font-size: 20px; font-weight: 600; }
.unlock-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 360px; }
.unlock-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.15);
  cursor: pointer; transition: transform 0.15s;
}
.unlock-card:active { transform: scale(0.95); }
.unlock-card.unlocked { background: rgba(0,184,148,0.3); }
.unlock-card.locked { opacity: 0.4; cursor: not-allowed; }
.unlock-card img { width: 48px; height: 48px; object-fit: contain; }
.unlock-card .name { font-size: 12px; font-weight: 600; }
.unlock-card .cost { font-size: 11px; color: #f9ca24; }
.unlock-card .owned { font-size: 11px; color: #00b894; }

/* Effects */
.float-text {
  position: fixed; pointer-events: none; font-size: 16px; font-weight: 700;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3); z-index: 100;
  animation: float-up 1s ease-out forwards;
}
.score-popup {
  position: fixed; pointer-events: none; font-size: 22px; font-weight: 700;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 100;
  animation: score-pop 1.2s ease-out forwards;
}

/* Level up overlay */
.level-up-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 200;
  animation: fade-in 0.3s ease;
}
.level-up-box {
  background: linear-gradient(135deg, #f9ca24, #f0932b);
  padding: 32px 48px; border-radius: 20px; text-align: center; color: #fff;
  animation: bounce-in 0.4s ease;
}

@keyframes float-up {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-60px); opacity: 0; }
}
@keyframes score-pop {
  0% { transform: scale(0.5); opacity: 1; }
  50% { transform: scale(1.2); }
  100% { transform: translateY(-40px); opacity: 0; }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
