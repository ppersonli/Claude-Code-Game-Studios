<script setup lang="ts">
import { ref, reactive, computed, onUnmounted, onMounted } from 'vue'
import { initI18n, useI18n } from './i18n'
import type { Ingredient } from '@types'
import { audioEngine } from '@shared/phaser/audio'
import { AdManager } from '../../services/AdManager'

const { t, locale: currentLocale, setLocale, SUPPORTED_LOCALES } = useI18n()
const BASE_URL = import.meta.env.BASE_URL
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
import { LAB_THEMES } from './data/themes'
import { canBuyLabTheme, getAvailableLabThemes, equipLabTheme, isDailyRewardAvailable, claimDailyReward, DAILY_REWARD_COINS, checkMetaAchievements, type LabServeStats } from './composables/useMeta'
import { matchRecipe, recordRecipe, loadRecipeBook } from './data/recipes'
import { getComboEffect, checkSpecialCombo, getEnhancedComboMultiplier } from './composables/useComboSystem'
import IngredientShelf from './components/IngredientShelf.vue'
import CustomerDisplay from './components/CustomerDisplayEnhanced.vue'
import GameHud from './components/GameHud.vue'
import CupVisualEnhanced from './components/CupVisualEnhanced.vue'
import ParticleEffects from './components/ParticleEffects.vue'
import RecipeBook from './components/RecipeBook.vue'
import ShopDecor from './components/ShopDecor.vue'
import SeasonalEventPanel from './components/SeasonalEventPanel.vue'

type Screen = 'start' | 'game' | 'result' | 'daily' | 'shop' | 'themes' | 'recipe-book' | 'decor' | 'event'

const screen = ref<Screen>('start')
const state = reactive(createInitialState())
const adManager = AdManager.getInstance()
const shopFreeCoinsClaimed = ref(false)
const showRecipeBook = ref(false)
const showShopDecor = ref(false)
const showSeasonalEvent = ref(false)
const perfectStreak = ref(0)
const feverTimeActive = ref(false)
const feverTimeEnd = ref(0)

// Theme & daily persistence
const STORAGE_THEMES = 'btlab_themes'
const STORAGE_EQUIPPED = 'btlab_equipped_theme'
const STORAGE_LAST_DAILY = 'btlab_last_daily'
const STORAGE_META = 'btlab_meta'

function loadThemes(): string[] {
  try { const raw = localStorage.getItem(STORAGE_THEMES); return raw ? JSON.parse(raw) : ['classic'] } catch { return ['classic'] }
}
function loadEquippedTheme(): string {
  try { return localStorage.getItem(STORAGE_EQUIPPED) ?? 'classic' } catch { return 'classic' }
}
function loadLastDaily(): string {
  try { return localStorage.getItem(STORAGE_LAST_DAILY) ?? '' } catch { return '' }
}
function loadMeta(): { dailyCount: number; achievements: string[] } {
  try { const raw = localStorage.getItem(STORAGE_META); return raw ? JSON.parse(raw) : { dailyCount: 0, achievements: [] } } catch { return { dailyCount: 0, achievements: [] } }
}

const unlockedThemes = ref<string[]>(loadThemes())
const equippedTheme = ref(loadEquippedTheme())
const lastDailyDate = ref(loadLastDaily())
const dailyRewardClaimed = ref(!isDailyRewardAvailable(lastDailyDate.value))
const metaAchievements = ref<string[]>(loadMeta().achievements)
const metaDailyCount = ref(loadMeta().dailyCount)
const achievementNotif = ref<string | null>(null)

function persistThemes() {
  localStorage.setItem(STORAGE_THEMES, JSON.stringify(unlockedThemes.value))
  localStorage.setItem(STORAGE_EQUIPPED, equippedTheme.value)
}
function persistMeta() {
  localStorage.setItem(STORAGE_META, JSON.stringify({ dailyCount: metaDailyCount.value, achievements: metaAchievements.value }))
}

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
    addFloatText(state, t('floatText.cupFull'), '#ff6b6b')
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
      addFloatText(state, t('floatText.addFirst'), '#ff6b6b')
    }
    return
  }

  // 检查配方匹配
  const cupIngredientIds = state.cupContents.map(c => c.id)
  const matchedRecipe = matchRecipe(cupIngredientIds)
  if (matchedRecipe) {
    const book = loadRecipeBook()
    recordRecipe(matchedRecipe.id, book)
    addFloatText(state, `${t('floatText.newRecipe', { name: matchedRecipe.name })}`, '#FFD700')
  }

  if (result.isPerfect) {
    perfectStreak.value++
    
    // 检查特殊连击
    const specialCombo = checkSpecialCombo(perfectStreak.value)
    if (specialCombo) {
      if (specialCombo.effect === 'fever-time') {
        feverTimeActive.value = true
        feverTimeEnd.value = Date.now() + specialCombo.duration * 1000
        addFloatText(state, t('floatText.feverTime'), '#FF6347')
        setTimeout(() => { feverTimeActive.value = false }, specialCombo.duration * 1000)
      } else if (specialCombo.effect === 'boss-rush') {
        addFloatText(state, t('floatText.bossRush'), '#FFD700')
        // TODO: 触发超级VIP顾客逻辑
      }
    }
    
    audioEngine.play('perfect')
    const comboEffect = getComboEffect(state.combo)
    addScorePopup(state, `+${result.points} ${t('floatText.perfect')} 🔥 x${state.combo} ${comboEffect.name}`, '#ffd700')
    addFloatText(state, `🔥 x${state.combo} ${t('hud.combo')}! ${comboEffect.description}`, '#ff6b6b')
  } else {
    perfectStreak.value = 0
    audioEngine.play('fail')
    if (result.points > 0) {
      addFloatText(state, `+${result.points}`, '#4CAF50')
    } else {
      addFloatText(state, t('floatText.notRight'), '#ff6b6b')
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
    addFloatText(state, `${t('floatText.unlocked', { name: id })}`, '#FFD700')
    checkNewAchievements()
  } else {
    addFloatText(state, `${t('floatText.coinsNeeded', { cost })}`, '#ff6b6b')
  }
}

function checkNewAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id)
      addFloatText(state, `🏆 ${a.name}!`, '#FFD700')
    }
  }
  // Meta achievements
  const stats: LabServeStats = {
    totalServed: state.totalDrinksServed,
    perfectServed: state.perfectCount,
    bestCombo: state.maxCombo,
    highestLevel: state.level,
    themesUnlocked: unlockedThemes.value.length,
    dailyDays: metaDailyCount.value,
    ingredientsUnlocked: state.unlockedIngredients.length,
  }
  const newMeta = checkMetaAchievements(stats, metaAchievements.value)
  for (const a of newMeta) {
    metaAchievements.value.push(a.id)
    state.totalCoins += a.reward
    state.coins = state.totalCoins
    addFloatText(state, `🏆 ${a.name}! +${a.reward}💰`, '#FFD700')
  }
  if (newMeta.length > 0) persistMeta()
}

// === Theme handlers ===

function handleBuyTheme(themeId: string) {
  const theme = LAB_THEMES.find(t => t.id === themeId)
  if (!theme) return
  if (!canBuyLabTheme(state.totalCoins, state.level, unlockedThemes.value, themeId)) {
    addFloatText(state, t('floatText.conditionNotMet'), '#ff6b6b')
    return
  }
  state.totalCoins -= theme.cost
  state.coins = state.totalCoins
  unlockedThemes.value.push(themeId)
  equippedTheme.value = themeId
  persistThemes()
  audioEngine.play('unlock')
  addFloatText(state, `${t('floatText.themeUnlocked', { name: theme.name })}`, '#FFD700')
}

function handleEquipTheme(themeId: string) {
  if (equipLabTheme(unlockedThemes.value, themeId)) {
    equippedTheme.value = themeId
    persistThemes()
  }
}

// === Daily reward ===

function handleClaimDaily() {
  const result = claimDailyReward(lastDailyDate.value)
  if (result.claimed) {
    lastDailyDate.value = result.today
    localStorage.setItem(STORAGE_LAST_DAILY, result.today)
    state.totalCoins += DAILY_REWARD_COINS
    state.coins = state.totalCoins
    dailyRewardClaimed.value = true
    metaDailyCount.value++
    persistMeta()
    audioEngine.play('unlock')
    addFloatText(state, `${t('floatText.dailyReward', { amount: DAILY_REWARD_COINS })}`, '#FFD700')
  }
}

function handleBuyDecor(itemId: string, cost: number) {
  if (state.totalCoins >= cost) {
    state.totalCoins -= cost
    state.coins = state.totalCoins
    audioEngine.play('unlock')
    addFloatText(state, t('floatText.decorBought'), '#FFD700')
  } else {
    addFloatText(state, t('floatText.coinsNotEnough'), '#ff6b6b')
  }
}

function handleClaimEventReward(coins: number) {
  state.totalCoins += coins
  state.coins = state.totalCoins
  audioEngine.play('unlock')
  addFloatText(state, `${t('floatText.eventReward', { amount: coins })}`, '#FFD700')
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
    addFloatText(state, `${t('floatText.doubleCoins', { amount: state.score })}`, '#ffd700')
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

const isOrderReady = computed(() => {
  if (!state.currentOrder.length || !state.cupContents.length) return false
  return fulfilledIndices.value.size === state.currentOrder.length
})

const resultStats = computed(() => ({
  modeText: state.isDaily ? t('result.dailyMode') : t('result.standardMode'),
  dailyGoalText: state.isDaily && state.dailyModifier?.goal
    ? `${t('result.dailyGoal', { progress: state.dailyGoalProgress, target: state.dailyModifier.goal.count, status: state.dailyCompleted ? t('result.completed') : t('result.notCompleted') })}`
    : '',
}))

onMounted(async () => { await initI18n() })
onUnmounted(() => clearTimer(state))
</script>

<template>
  <div class="game-root" :class="{ 'screen-shake': state.screenShake }">
    <!-- Start Screen -->
    <div v-if="screen === 'start'" class="screen start-screen">
      <img :src="`${BASE_URL}assets/bubble-tea-lab/cover.webp`" alt="Bubble Tea Lab" class="cover-img">
      <h1>🧋 {{ t('title') }}</h1>
      <p class="subtitle">{{ t('subtitle') }}</p>
      <div class="coins-bar">💰 {{ state.totalCoins }}</div>
      <div class="btn-group">
        <button class="btn btn-primary btn-hero" @click="goPlay">{{ t('buttons.start') }}</button>
        <div class="btn-grid">
          <button class="btn btn-grid-item btn-daily" @click="goDaily">{{ t('buttons.daily') }}</button>
          <button class="btn btn-grid-item btn-event" @click="screen = 'event'">{{ t('buttons.event') }}</button>
          <button class="btn btn-grid-item btn-shop" @click="goShop">{{ t('buttons.shop') }}</button>
          <button class="btn btn-grid-item btn-themes" @click="screen = 'themes'">{{ t('buttons.themes') }}</button>
          <button class="btn btn-grid-item btn-recipe" @click="screen = 'recipe-book'">{{ t('buttons.recipe') }}</button>
          <button class="btn btn-grid-item btn-decor" @click="screen = 'decor'">{{ t('buttons.decor') }}</button>
        </div>
      </div>
      <button v-if="!dailyRewardClaimed" class="btn btn-daily-reward" @click="handleClaimDaily">
        {{ t('buttons.claimDaily', { amount: DAILY_REWARD_COINS }) }}
      </button>
      <!-- Language Selector -->
      <div class="lang-selector">
        <select :value="currentLocale" @change="setLocale(($event.target as HTMLSelectElement).value as any)" class="lang-select">
          <option v-for="l in SUPPORTED_LOCALES" :key="l.code" :value="l.code">{{ l.flag }} {{ l.name }}</option>
        </select>
      </div>
      <!-- Legal Links (CG requirement) -->
      <div class="legal-links">
        <a href="https://tools.pixiaoli.cn/terms" target="_blank">Terms & Conditions</a>
        <span> · </span>
        <a href="https://tools.pixiaoli.cn/privacy" target="_blank">Privacy Policy</a>
      </div>
    </div>

    <!-- Daily Preview Screen -->
    <div v-else-if="screen === 'daily'" class="screen daily-screen">
      <img src="/assets/badge_daily.webp" class="daily-badge" alt="Daily">
      <h2>{{ t('daily.title') }}</h2>
      <div class="daily-info" v-if="state.dailyModifier">
        <p class="daily-desc">{{ state.dailyModifier.icon }} {{ state.dailyModifier.desc }}</p>
        <p class="daily-reward">{{ t('daily.reward', { multiplier: state.dailyModifier.scoreMultiplier }) }}</p>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" @click="goDailyPlay">{{ t('daily.startChallenge') }}</button>
        <button class="btn btn-back" @click="goStart">{{ t('buttons.back') }}</button>
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
        <div class="customer-zone">
          <CustomerDisplay
            :customer="state.currentCustomer"
            :order="state.currentOrder"
            :mood="state.customerMood"
            :fulfilled-indices="fulfilledIndices"
            :personality="state.currentCustomer?.personalityId"
          />
        </div>
        <CupVisualEnhanced :contents="state.cupContents" />
        <div class="game-actions">
          <button class="btn btn-serve" :class="{ 'order-ready': isOrderReady }" :disabled="state.cupContents.length === 0" @click="handleServe">{{ t('buttons.serve') }}</button>
          <button class="btn btn-reset" @click="handleResetCup">{{ t('buttons.reset') }}</button>
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
      <h2>{{ t('result.title') }}</h2>
      <div class="final-score">{{ state.score }}</div>
      <div class="final-stats">
        {{ t('result.mode', { mode: resultStats.modeText }) }}<br>
        {{ t('result.customersServed', { count: state.drinksServed }) }}<br>
        {{ t('result.perfectServes', { count: state.perfectCount }) }}<br>
        {{ t('result.maxCombo', { count: state.maxCombo }) }}<br>
        {{ t('result.levelReached', { level: state.level }) }}<br>
        {{ t('result.totalCoins', { coins: state.totalCoins }) }}
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
          <span>{{ state.achievements.includes(a.id) ? (t('achievements.' + a.id) || a.name) : '???' }}</span>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-ad" @click="handleDoubleCoins">{{ t('buttons.doubleCoins') }}</button>
        <button class="btn btn-primary" @click="goPlay">{{ t('buttons.playAgain') }}</button>
        <button class="btn btn-back" @click="goStart">{{ t('buttons.backHome') }}</button>
      </div>
    </div>

    <!-- Shop Screen -->
    <div v-else-if="screen === 'shop'" class="screen shop-screen">
      <h2>{{ t('shop.title') }}</h2>
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
          <img :src="ing.img" :alt="t('ingredients.' + ing.id) || ing.name">
          <div class="name">{{ t('ingredients.' + ing.id) || ing.name }}</div>
          <div v-if="state.unlockedIngredients.includes(ing.id)" class="owned">{{ t('shop.unlocked') }}</div>
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
          <img :src="cust.img" :alt="t('customers.' + cust.personalityId) || cust.name">
          <div class="name">{{ t('customers.' + cust.personalityId) || cust.name }}</div>
          <div v-if="state.unlockedCustomers.includes(cust.name)" class="owned">{{ t('shop.unlocked') }}</div>
          <div v-else class="cost">💰 {{ cust.unlockCost }}</div>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-back" @click="goStart">{{ t('buttons.backHome') }}</button>
      </div>
    </div>

    <!-- Themes Screen -->
    <div v-else-if="screen === 'themes'" class="screen shop-screen">
      <h2>{{ t('themes.title') }}</h2>
      <div class="shop-coins">💰 {{ state.totalCoins }}</div>
      <div class="unlock-grid">
        <div
          v-for="item in getAvailableLabThemes(state.totalCoins, state.level, unlockedThemes)"
          :key="item.theme.id"
          class="unlock-card"
          :class="{ unlocked: item.unlocked, locked: !item.unlocked && !item.canBuy }"
          @click="item.canBuy ? handleBuyTheme(item.theme.id) : item.unlocked ? handleEquipTheme(item.theme.id) : null"
        >
          <div class="theme-preview" :style="{ background: `linear-gradient(135deg, ${item.theme.bgGradient[0]}, ${item.theme.bgGradient[1]})` }">
            <span style="font-size:28px">{{ item.theme.emoji }}</span>
          </div>
          <div class="name">{{ item.theme.name }}</div>
          <div v-if="equippedTheme === item.theme.id" class="owned">{{ t('buttons.inUse') }}</div>
          <div v-else-if="item.unlocked" class="owned">{{ t('buttons.owned') }}</div>
          <div v-else class="cost">💰 {{ item.theme.cost }} · Lv.{{ item.theme.requiredLevel }}</div>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-back" @click="goStart">← {{ t('buttons.back') }}</button>
      </div>
    </div>

    <!-- Recipe Book Screen -->
    <RecipeBook :visible="screen === 'recipe-book'" @close="screen = 'start'" />

    <!-- Shop Decor Screen -->
    <ShopDecor 
      :visible="screen === 'decor'" 
      :coins="state.totalCoins"
      :level="state.level"
      @close="screen = 'start'"
      @buyDecor="handleBuyDecor"
    />

    <!-- Seasonal Event Panel -->
    <SeasonalEventPanel
      :visible="screen === 'event'"
      :coins="state.totalCoins"
      @close="screen = 'start'"
      @claimReward="handleClaimEventReward"
    />

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
        <h2>{{ t('hud.levelUp', { level: state.levelUpLevel }) }}</h2>
        <p>{{ t('hud.newIngredients') }}</p>
      </div>
    </div>

    <!-- Particle Effects -->
    <ParticleEffects :active="state.combo > 1" :combo="state.combo" />
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
.start-screen { justify-content: center; gap: 12px; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px 20px; }
.cover-img {
  width: min(72vw, 320px); border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  animation: cover-float 4s ease-in-out infinite;
}
@keyframes cover-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.start-screen h1 { color: #fff; font-size: 1.8em; text-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
.subtitle { color: rgba(255,255,255,0.9); font-size: 0.95em; }

/* Start screen background bubbles */
.start-screen::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(circle at 15% 20%, rgba(255,255,255,0.08) 0%, transparent 30%),
    radial-gradient(circle at 85% 30%, rgba(255,255,255,0.06) 0%, transparent 25%),
    radial-gradient(circle at 50% 80%, rgba(255,255,255,0.05) 0%, transparent 35%);
  animation: bg-drift 8s ease-in-out infinite alternate;
}
@keyframes bg-drift {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* Buttons */
.btn-group { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 320px; }
.btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
.btn-grid-item { padding: 10px 8px !important; font-size: 0.82em !important; white-space: nowrap; }
.btn-hero { width: 100%; font-size: 1.15em; padding: 14px 32px; }
.btn {
  padding: 14px 44px; border: none; border-radius: 50px;
  font-size: 1.2em; font-weight: bold; cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
  position: relative; overflow: hidden;
}
.btn:active { transform: scale(0.95); }
.btn:hover { transform: scale(1.03); box-shadow: 0 8px 25px rgba(0,0,0,0.25); }
.btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.btn-daily { background: linear-gradient(135deg, #FFD700, #FF8C00); color: #fff; }
.btn-shop { background: linear-gradient(135deg, #00C9FF, #92FE9D); color: #333; }
.btn-serve {
  background: linear-gradient(135deg, #f093fb, #f5576c); color: #fff; flex: 1; font-size: 1.1em; padding: 14px 32px;
  box-shadow: 0 0 20px rgba(240,147,251,0.3), 0 4px 15px rgba(0,0,0,0.2);
  position: relative; overflow: hidden;
}
.btn-serve:disabled {
  background: linear-gradient(135deg, #999, #777);
  box-shadow: none;
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-serve:disabled::after { display: none; }
.btn-serve.order-ready {
  background: linear-gradient(135deg, #00b894, #00cec9);
  animation: pulse-ready 1s infinite;
  box-shadow: 0 0 24px rgba(0,206,201,0.4), 0 4px 15px rgba(0,0,0,0.2);
}
@keyframes pulse-ready {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
.btn-serve::after {
  content: '';
  position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
  animation: btn-shimmer 3s ease-in-out infinite;
}
@keyframes btn-shimmer {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}
.btn-reset { background: rgba(255,255,255,0.3); color: #fff; font-size: 0.95em; padding: 12px 24px; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(4px); }
.btn-back { background: rgba(255,255,255,0.2); color: #fff; }
.btn-ad { background: linear-gradient(135deg, #e056fd, #be2edd); color: #fff; }

/* Game screen */
.game-screen { padding: 0; position: relative; }
.game-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0.18; z-index: 0;
  filter: blur(4px);
}
.game-screen::after {
  content: '';
  position: absolute; inset: 0; z-index: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%);
  pointer-events: none;
}
.game-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; height: 100%; width: 100%;
  padding: 0;
}
.game-actions { display: flex; gap: 10px; padding: 6px 14px 8px; justify-content: center; flex-shrink: 0; }

/* Customer zone */
.customer-zone {
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin: 4px 10px;
  padding: 2px 0;
  animation: customer-enter 0.5s ease;
  border: 1px solid rgba(255,255,255,0.12);
  flex-shrink: 0;
}
@keyframes customer-enter {
  0% { opacity: 0; transform: translateX(40px); }
  100% { opacity: 1; transform: translateX(0); }
}

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
.final-score {
  font-size: 3.2em; font-weight: bold; text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  animation: score-reveal 1s ease-out;
}
@keyframes score-reveal {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
.final-stats { text-align: center; font-size: 0.95em; line-height: 1.8; background: rgba(0,0,0,0.25); border-radius: 14px; padding: 16px; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); }
.achievements-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.achievement-badge {
  display: flex; flex-direction: column; align-items: center; width: 62px;
  padding: 6px; border-radius: 12px; transition: all 0.3s;
}
.achievement-badge img {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid transparent; transition: all 0.3s;
}
.achievement-badge:has(img[style*="opacity: 1"]) {
  background: rgba(255,215,0,0.1);
}
.achievement-badge:has(img[style*="opacity: 1"]) img {
  border-color: rgba(255,215,0,0.5);
  box-shadow: 0 0 10px rgba(255,215,0,0.3);
}
.achievement-badge span { font-size: 10px; text-align: center; color: rgba(255,255,255,0.8); margin-top: 4px; }

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
  text-shadow: 0 1px 6px rgba(0,0,0,0.4); z-index: 100;
  animation: float-up 1.2s ease-out forwards;
}
.score-popup {
  position: fixed; pointer-events: none; font-size: 22px; font-weight: 700;
  text-shadow: 0 2px 10px rgba(0,0,0,0.4); z-index: 100;
  animation: score-pop 1.4s ease-out forwards;
}
@keyframes float-up {
  0% { opacity: 1; transform: translateY(0) scale(0.8); }
  20% { transform: translateY(-10px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-70px) scale(1) rotate(-5deg); }
}
@keyframes score-pop {
  0% { opacity: 1; transform: scale(0.3) translateY(0); }
  15% { transform: scale(1.6) translateY(-15px); }
  30% { transform: scale(1) translateY(-35px); }
  100% { opacity: 0; transform: scale(0.6) translateY(-110px); }
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
  box-shadow: 0 0 60px rgba(255,215,0,0.4), 0 20px 40px rgba(0,0,0,0.3);
}
@keyframes pop-in { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.level-up-box h2 { font-size: 1.8em; margin-bottom: 8px; }
.level-up-box p { color: rgba(255,255,255,0.9); }

/* Meta UI */
.coins-bar {
  font-size: 18px; font-weight: 700; color: #FFD700;
  background: rgba(0,0,0,0.2); padding: 8px 24px; border-radius: 20px;
  margin-bottom: 8px;
  border: 1px solid rgba(255,215,0,0.2);
  text-shadow: 0 0 8px rgba(255,215,0,0.3);
}
.btn-themes {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff;
}
.btn-recipe {
  background: linear-gradient(135deg, #f093fb, #f5576c); color: #fff;
}
.btn-decor {
  background: linear-gradient(135deg, #00C9FF, #92FE9D); color: #333;
  font-weight: 700;
}
.btn-event {
  background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: #fff;
  font-weight: 700;
}

.btn-daily-reward {
  background: linear-gradient(135deg, #00b894, #00cec9); color: #fff;
  font-size: 0.9em; padding: 10px 24px; margin-top: 8px;
  border: none; border-radius: 50px; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,184,148,0.3);
}
.btn-daily-reward:active { transform: scale(0.95); }
.lang-selector {
  margin-top: 12px;
}
.lang-select {
  padding: 8px 16px; border: none; border-radius: 20px;
  background: rgba(255,255,255,0.2); color: #fff;
  font-size: 0.9em; cursor: pointer; outline: none;
  backdrop-filter: blur(4px);
}
.lang-select option { color: #333; background: #fff; }
.legal-links {
  margin-top: 10px; font-size: 0.75em;
  color: rgba(255,255,255,0.5);
}
.legal-links a {
  color: rgba(255,255,255,0.6); text-decoration: none;
}
.legal-links a:hover { color: #fff; text-decoration: underline; }
.theme-preview {
  height: 60px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px; border: 2px solid rgba(255,255,255,0.2);
}
</style>
