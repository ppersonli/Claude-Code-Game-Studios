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

// Wire ad callbacks
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

  checkNewAchievements()

  const shouldShowMidgameAd = state.levelUpLevel !== null && state.level % 3 === 0
  if (state.levelUpLevel !== null) {
    audioEngine.play('levelup')
    setTimeout(() => { state.levelUpLevel = null }, 1500)
  }

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

// === Computed ===

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
      <img src="/assets/cover.webp" alt="Bubble Tea Lab" class="cover-img">
      <h1>🧋 奶茶实验室</h1>
      <p class="subtitle">调配完美奶茶，满足每位顾客</p>
      <div class="btn-group">
        <button class="btn btn-primary" @click="goPlay">开始制作 ✨</button>
        <button class="btn btn-daily" @click="goDaily">每日挑战 🌟</button>
        <button class="btn btn-shop" @click="goShop">解锁商店 🔓</button>
      </div>
    </div>

    <!-- Daily Preview Screen -->
    <div v-else-if="screen === 'daily'" class="screen daily-screen">
      <img src="/assets/badge_daily.webp" class="daily-badge" alt="Daily">
      <h2>🌟 每日挑战</h2>
      <div class="daily-info" v-if="state.dailyModifier">
        <p class="daily-desc">{{ state.dailyModifier.icon }} {{ state.dailyModifier.desc }}</p>
        <p class="daily-reward">奖励: 完成可获得200金币 (x{{ state.dailyModifier.scoreMultiplier }}分数倍率)</p>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" @click="goDailyPlay">开始挑战 ⏰</button>
        <button class="btn btn-back" @click="goStart">返回</button>
      </div>
    </div>

    <!-- Game Screen -->
    <div v-else-if="screen === 'game'" class="screen game-screen">
      <img src="/assets/bg_shop.webp" class="game-bg" alt="">
      <div class="game-content">
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
          <button class="btn btn-serve" @click="handleServe">送出饮品 🧋</button>
          <button class="btn btn-reset" @click="handleResetCup">清空重来</button>
        </div>
        <IngredientShelf
          :ingredients="INGREDIENTS"
          :unlocked-ids="state.unlockedIngredients"
          @select="handleAddToCup"
          @unlock="(ing) => handleShopUnlock('ingredient', ing.id, ing.unlockCost ?? 0)"
        />
      </div>
    </div>

    <!-- Result Screen -->
    <div v-else-if="screen === 'result'" class="screen result-screen">
      <h2>🎉 今日营业结束!</h2>
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
        <button class="btn btn-primary" @click="goPlay">再来一轮 🔄</button>
        <button class="btn btn-back" @click="goStart">返回首页</button>
      </div>
    </div>

    <!-- Shop Screen -->
    <div v-else-if="screen === 'shop'" class="screen shop-screen">
      <h2>🔓 解锁商店</h2>
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
        <button class="btn btn-back" @click="goStart">返回首页</button>
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
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
</style>

<style scoped>
.game-root {
  width: 100%; height: 100dvh;
  display: flex; flex-direction: column;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #a18cd1 100%);
  position: relative; overflow: hidden;
}
.game-root.screen-shake { animation: shake 0.3s ease; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.screen {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px; width: 100%; height: 100%;
}

/* Start screen */
.start-screen { justify-content: center; gap: 16px; }
.cover-img { width: min(80vw, 360px); border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
.start-screen h1 { color: #fff; font-size: 2em; text-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
.subtitle { color: rgba(255,255,255,0.9); font-size: 0.95em; }

/* Buttons */
.btn-group { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px; }
.btn {
  padding: 14px 44px; border: none; border-radius: 50px;
  font-size: 1.2em; font-weight: bold; cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}
.btn:active { transform: scale(0.95); }
.btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.btn-daily { background: linear-gradient(135deg, #FFD700, #FF8C00); color: #fff; font-size: 1em; padding: 12px 32px; }
.btn-shop { background: linear-gradient(135deg, #00C9FF, #92FE9D); color: #333; font-size: 1em; padding: 12px 32px; }
.btn-serve { background: linear-gradient(135deg, #f093fb, #f5576c); color: #fff; flex: 1; font-size: 1.1em; padding: 12px 32px; }
.btn-reset { background: rgba(255,255,255,0.2); color: #fff; font-size: 0.9em; padding: 10px 24px; }
.btn-back { background: rgba(255,255,255,0.2); color: #fff; }
.btn-ad { background: linear-gradient(135deg, #e056fd, #be2edd); color: #fff; }

/* Game screen */
.game-screen { padding: 0; position: relative; }
.game-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0.4; z-index: 0;
}
.game-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; height: 100%;
  justify-content: space-between;
}
.game-actions { display: flex; gap: 10px; padding: 10px 14px 16px; justify-content: center; }

/* Daily screen */
.daily-screen { justify-content: center; gap: 16px; color: #fff;
  background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%);
}
.daily-badge { width: 80px; height: 80px; border-radius: 50%; }
.daily-info { text-align: center; }
.daily-desc { color: rgba(255,255,255,0.9); font-size: 0.9em; }
.daily-reward { color: #FFD700; font-size: 1.2em; font-weight: bold; margin-top: 8px; }

/* Result screen */
.result-screen { justify-content: center; gap: 16px; color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.result-screen h2 { font-size: 1.8em; color: #ffd700; }
.final-score { font-size: 2.8em; font-weight: bold; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.final-stats { text-align: center; font-size: 0.95em; line-height: 1.8; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; }
.achievements-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.achievement-badge { display: flex; flex-direction: column; align-items: center; width: 60px; }
.achievement-badge img { width: 36px; height: 36px; border-radius: 50%; }
.achievement-badge span { font-size: 10px; text-align: center; color: rgba(255,255,255,0.8); }

/* Shop screen */
.shop-screen { gap: 16px; color: #fff; overflow-y: auto; padding-top: 24px;
  background: linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%);
}
.shop-screen h2 { color: #333; }
.shop-coins { font-size: 20px; font-weight: 600; color: #FFD700; }
.unlock-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 360px; }
.unlock-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.9);
  cursor: pointer; transition: transform 0.15s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.unlock-card:active { transform: scale(0.95); }
.unlock-card.unlocked { border: 2px solid #4CAF50; }
.unlock-card.locked { opacity: 0.4; cursor: not-allowed; }
.unlock-card img { width: 48px; height: 48px; object-fit: contain; }
.unlock-card .name { font-size: 12px; font-weight: 600; color: #333; }
.unlock-card .cost { font-size: 11px; color: #FF8C00; }
.unlock-card .owned { font-size: 11px; color: #4CAF50; }

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
@keyframes float-up {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
}
@keyframes score-pop {
  0% { opacity: 1; transform: scale(0.3) translateY(0); }
  20% { transform: scale(1.5) translateY(-20px); }
  40% { transform: scale(1) translateY(-40px); }
  100% { opacity: 0; transform: scale(0.8) translateY(-100px); }
}

/* Level up overlay */
.level-up-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 200;
  animation: fade-in 0.3s ease;
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.level-up-box {
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  padding: 30px 40px; border-radius: 20px; text-align: center; color: #fff;
  animation: pop-in 0.4s ease;
}
@keyframes pop-in { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.level-up-box h2 { font-size: 1.8em; margin-bottom: 8px; }
.level-up-box p { color: rgba(255,255,255,0.9); }
</style>
