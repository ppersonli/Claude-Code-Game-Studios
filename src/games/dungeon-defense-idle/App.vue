<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Phaser from 'phaser'
import { AdManager } from '../../services/AdManager'
import { audioEngine } from '@shared/phaser/audio'
import { loadState, saveState, resetState, calcOfflineEarnings, type GameState, type TowerState } from './logic/game-state'
import { canPrestige, performPrestige, getPrestigeRequirement, calcEarnableEnergy } from './logic/prestige'
import { calcCost } from './logic/constants'
import { TOWERS } from './data/towers'
import { HEROES } from './data/heroes'
import { DUNGEONS } from './data/dungeons'
import { ACHIEVEMENTS, type AchievementCheckState } from './data/achievements'
import { getTodayChallenge, isDailyCompletedToday, type DailyChallenge } from './data/daily-challenges'
import { translations, getLocale, type Locale } from './i18n/translations'
import { GameScene } from './phaser/scenes/GameScene'
import type { GameSceneData } from './phaser/scenes/GameScene'

const adManager = AdManager.getInstance()
const locale = ref<Locale>(getLocale())
const t = (key: string) => translations[locale.value][key] || translations['en'][key] || key

const state = reactive<GameState>(loadState())
type Screen = 'menu' | 'game' | 'towers' | 'heroes' | 'dungeons' | 'prestige' | 'achievements' | 'daily'
const screen = ref<Screen>('menu')
const showOfflineReward = ref(false)
const offlineRewardAmount = ref(0)
const achievementToast = ref('')
const todayChallenge = ref<DailyChallenge>(getTodayChallenge())
let tickTimer: ReturnType<typeof setInterval> | null = null

let phaserGame: Phaser.Game | null = null
const phaserContainer = ref<HTMLDivElement>()

const canPrestigeNow = computed(() => canPrestige(state))
const prestigeReq = computed(() => getPrestigeRequirement(state))
const earnableEnergy = computed(() => calcEarnableEnergy(state))
const prestigeMultDisplay = computed(() => state.prestigeMult.toFixed(1))

function getGameScene(): GameScene | null {
  if (!phaserGame) return null
  return phaserGame.scene.getScene('GameScene') as unknown as GameScene | null
}
function refreshPhaser() { getGameScene()?.refresh() }

function initPhaser(): void {
  if (!phaserContainer.value || phaserGame) return
  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: phaserContainer.value,
    width: 480, height: 854,
    backgroundColor: '#0d0d1a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [],
  })
  const sceneData: GameSceneData = {
    getState: () => state,
    onCoinsChanged: () => {},
    onWaveChanged: () => { refreshPhaser() },
    onWaveComplete: (wave, gold) => {
      audioEngine.play('levelup')
      achievementToast.value = `Wave ${wave} Complete! +${gold} gold`
      setTimeout(() => { achievementToast.value = '' }, 2500)
      checkAchievements()
      saveState(state)
      // Auto-wave
      if (state.autoWave) {
        setTimeout(() => getGameScene()?.startWave(), 1500)
      }
    },
    onMonsterLeaked: () => { audioEngine.play('fail') },
    onTowerPlaced: () => { audioEngine.play('add') },
    onTowerUpgraded: () => { audioEngine.play('levelup') },
    onRequestSync: () => { refreshPhaser() },
  }
  phaserGame.scene.add('GameScene', GameScene, true, sceneData)
}
function destroyPhaser() { if (phaserGame) { phaserGame.destroy(true); phaserGame = null } }

function startGame() {
  screen.value = 'game'
  adManager.gameplayStart()
  audioEngine.init()
  const offline = calcOfflineEarnings(state)
  if (offline > 0) {
    offlineRewardAmount.value = offline
    showOfflineReward.value = true
    state.coins += offline
    state.totalCoins += offline
    state.sessionGoldEarned += offline
  }
  nextTick(() => { if (!phaserGame) initPhaser() })
}

function handleStartWave() {
  getGameScene()?.startWave()
}

function handleUpgradeTower() {
  getGameScene()?.upgradeSelectedTower()
}

function handleSellTower() {
  getGameScene()?.sellSelectedTower()
}

function handlePurchaseUpgrade(upgradeId: string) {
  // For now, tower upgrades happen in the game scene directly
}

function handleUnlockDungeon(dungeonId: string) {
  if (!state.unlockedDungeons.includes(dungeonId)) {
    state.unlockedDungeons.push(dungeonId)
    audioEngine.play('unlock')
    saveState(state)
  }
}

function handlePrestige() {
  const earned = performPrestige(state)
  if (earned > 0) {
    audioEngine.play('levelup')
    achievementToast.value = `Prestige! +${earned} Dark Energy`
    setTimeout(() => { achievementToast.value = '' }, 3000)
    saveState(state)
    destroyPhaser()
    nextTick(() => initPhaser())
  }
}

function checkAchievements() {
  const checkState: AchievementCheckState = {
    bestWave: state.bestWave,
    totalKills: state.totalKills,
    totalCoins: state.totalCoins,
    prestigeCount: state.prestigeCount,
    unlockedDungeons: state.unlockedDungeons,
    consecutiveNoLeak: state.consecutiveNoLeak,
    bossKillTime: state.bestBossKillTime,
  }
  for (const ach of ACHIEVEMENTS) {
    if (!state.achievements.includes(ach.id) && ach.check(checkState)) {
      state.achievements.push(ach.id)
      achievementToast.value = ach.name
      audioEngine.play('unlock')
      setTimeout(() => { achievementToast.value = '' }, 3000)
    }
  }
}

function goTo(s: Screen) { screen.value = s }
function goBack() { screen.value = 'game'; nextTick(() => refreshPhaser()) }
function goToMenu() {
  screen.value = 'menu'
  adManager.gameplayStop()
  destroyPhaser()
  saveState(state)
}

function collectOfflineReward() { showOfflineReward.value = false }
async function collectDoubleOffline() {
  const rewarded = await adManager.requestRewardedAd()
  if (rewarded) { state.coins += offlineRewardAmount.value; state.totalCoins += offlineRewardAmount.value }
  showOfflineReward.value = false
}

function formatCoins(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

onMounted(() => { /* periodic save via game loop */ })
onUnmounted(() => { destroyPhaser(); saveState(state) })
</script>

<template>
  <div class="game-wrapper">
    <!-- MENU -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-content">
        <h1 class="game-title">
          <span class="title-main">DUNGEON DEFENSE</span>
          <span class="title-sub">IDLE</span>
        </h1>
        <p class="tagline">{{ t('tagline') }}</p>
        <div class="menu-stats" v-if="state.bestWave > 0">
          <div class="stat-item"><span class="stat-val">{{ state.bestWave }}</span><span class="stat-lbl">Best Wave</span></div>
          <div class="stat-item" v-if="state.darkEnergy > 0"><span class="stat-val">{{ state.darkEnergy }}</span><span class="stat-lbl">Dark Energy</span></div>
        </div>
        <div class="menu-buttons">
          <button class="btn btn-primary btn-lg" data-testid="start-btn" @click="startGame">
            {{ state.bestWave > 0 ? t('continue') : t('start') }}
          </button>
          <button v-if="canPrestigeNow" class="btn btn-prestige-sm" @click="startGame(); goTo('prestige')">
            {{ t('prestigeAvailable') }}
          </button>
        </div>
      </div>
    </div>

    <!-- GAME VIEW -->
    <div v-show="screen === 'game'" class="game-screen">
      <div ref="phaserContainer" class="phaser-container"></div>

      <!-- HUD Overlay -->
      <div class="hud-overlay">
        <div class="hud-bar">
          <div class="hud-left">
            <div class="hud-res coins" data-testid="coin-display"><span>💰</span><span>{{ formatCoins(state.coins) }}</span></div>
            <div class="hud-res wave"><span>⚔️</span><span>Wave {{ state.currentWave }}</span></div>
            <div class="hud-res energy" v-if="state.darkEnergy > 0"><span>🔮</span><span>{{ state.darkEnergy }} (×{{ prestigeMultDisplay }})</span></div>
          </div>
          <div class="hud-right">
            <button class="btn-icon" @click="goToMenu">☰</button>
          </div>
        </div>
        <div class="hud-actions">
          <button class="btn btn-wave" data-testid="start-wave-btn" @click="handleStartWave">
            {{ t('startWave') }}
          </button>
          <button class="btn btn-sm btn-up" @click="handleUpgradeTower">⬆ {{ t('upgrade') }}</button>
          <button class="btn btn-sm btn-sell" @click="handleSellTower">💰 {{ t('sell') }}</button>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar-wrap">
        <div class="tab-bar">
          <button class="tab-btn active">⚔️</button>
          <button class="tab-btn" @click="goTo('towers')">🗼</button>
          <button class="tab-btn" @click="goTo('heroes')">🦸</button>
          <button class="tab-btn" @click="goTo('dungeons')">🏰</button>
          <button class="tab-btn" @click="goTo('daily')">📅</button>
          <button class="tab-btn" @click="goTo('achievements')">🏅</button>
          <button class="tab-btn" :class="{ glow: canPrestigeNow }" @click="goTo('prestige')">⭐</button>
        </div>
      </div>
    </div>

    <!-- TOWERS OVERLAY -->
    <div v-if="screen === 'towers'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('towers') }}</h2>
          <span class="coins-display">💰 {{ formatCoins(state.coins) }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="card-list">
          <div v-for="tower in TOWERS" :key="tower.id" class="info-card"
               :class="{ locked: tower.unlockWave > state.currentWave && tower.id !== 'arrow' }">
            <div class="card-icon" :style="{ color: '#' + tower.color.toString(16).padStart(6, '0') }">■</div>
            <div class="card-info">
              <div class="card-name">{{ tower.name }}</div>
              <div class="card-desc">{{ tower.description }}</div>
              <div class="card-stat">DMG: {{ tower.baseDamage }} | SPD: {{ tower.attackSpeed }} | RNG: {{ tower.range }}</div>
            </div>
            <div class="card-status">
              <span v-if="tower.unlockWave > state.currentWave && tower.id !== 'arrow'">🔒 Wave {{ tower.unlockWave }}</span>
              <span v-else class="unlocked-text">Unlocked</span>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- HEROES OVERLAY -->
    <div v-if="screen === 'heroes'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('heroes') }}</h2>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="card-list">
          <div v-for="hero in HEROES" :key="hero.id" class="info-card"
               :class="{ locked: !state.unlockedHeroes.includes(hero.id) }">
            <div class="card-icon" :style="{ color: '#' + hero.color.toString(16).padStart(6, '0') }">●</div>
            <div class="card-info">
              <div class="card-name">{{ hero.name }}</div>
              <div class="card-desc">{{ hero.effect }}</div>
            </div>
            <div class="card-status">
              <span v-if="state.unlockedHeroes.includes(hero.id)">✅</span>
              <span v-else>🔒 {{ hero.unlockCondition }}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- DUNGEONS OVERLAY -->
    <div v-if="screen === 'dungeons'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('dungeons') }}</h2>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="card-list">
          <div v-for="dungeon in DUNGEONS" :key="dungeon.id" class="info-card"
               :class="{ current: state.currentDungeon === dungeon.id, locked: !state.unlockedDungeons.includes(dungeon.id) }">
            <div class="card-info">
              <div class="card-name">{{ dungeon.name }}</div>
              <div class="card-desc">{{ dungeon.terrainEffect }}</div>
            </div>
            <div class="card-status">
              <span v-if="state.currentDungeon === dungeon.id" class="current-text">Current</span>
              <span v-else-if="state.unlockedDungeons.includes(dungeon.id)">
                <button class="btn btn-sm" @click="state.currentDungeon = dungeon.id; goBack()">Select</button>
              </span>
              <span v-else>🔒 {{ dungeon.unlockCondition }}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- PRESTIGE OVERLAY -->
    <div v-if="screen === 'prestige'" class="overlay-screen">
      <div class="overlay-content center-content">
        <div class="overlay-header">
          <h2>⭐ {{ t('prestige') }}</h2>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <p class="desc-text">Reset progress for Dark Energy — permanent multipliers.</p>
        <div class="prestige-grid">
          <div class="pstat"><span class="plabel">Dark Energy</span><span class="pval">{{ state.darkEnergy }}</span></div>
          <div class="pstat"><span class="plabel">Multiplier</span><span class="pval">×{{ prestigeMultDisplay }}</span></div>
          <div class="pstat"><span class="plabel">Times Prestiged</span><span class="pval">{{ state.prestigeCount }}</span></div>
          <div class="pstat"><span class="plabel">Requirement</span><span class="pval">{{ formatCoins(prestigeReq) }}</span></div>
        </div>
        <div v-if="canPrestigeNow" class="prestige-preview">+{{ earnableEnergy }} 🔮 Dark Energy</div>
        <button class="btn btn-prestige" data-testid="prestige-btn" :disabled="!canPrestigeNow" @click="handlePrestige">
          {{ canPrestigeNow ? '⭐ PRESTIGE NOW' : `Need ${formatCoins(prestigeReq)} total coins` }}
        </button>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- ACHIEVEMENTS OVERLAY -->
    <div v-if="screen === 'achievements'" class="overlay-screen">
      <div class="overlay-content">
        <div class="overlay-header">
          <h2>{{ t('achievements') }}</h2>
          <span class="ach-count">{{ state.achievements.length }}/{{ ACHIEVEMENTS.length }}</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="card-list">
          <div v-for="ach in ACHIEVEMENTS" :key="ach.id" class="info-card"
               :class="{ unlocked: state.achievements.includes(ach.id) }">
            <div class="card-info">
              <div class="card-name">{{ ach.name }}</div>
              <div class="card-desc">{{ ach.description }}</div>
            </div>
            <div class="card-status">{{ state.achievements.includes(ach.id) ? '✅' : '🔒' }}</div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- DAILY OVERLAY -->
    <div v-if="screen === 'daily'" class="overlay-screen">
      <div class="overlay-content center-content">
        <div class="overlay-header">
          <h2>📅 {{ t('dailyChallenge') }}</h2>
          <span v-if="isDailyCompletedToday(state.lastDailyCompleted)" class="daily-done">✅</span>
          <button class="btn-icon" @click="goBack">✕</button>
        </div>
        <div class="daily-card">
          <div class="dc-name">{{ todayChallenge.name }}</div>
          <div class="dc-desc">{{ todayChallenge.description }}</div>
          <div class="dc-bonus">{{ t('bonus') }}: ×{{ todayChallenge.bonusMultiplier }}</div>
        </div>
        <button class="btn btn-secondary" @click="goBack">{{ t('back') }}</button>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="achievementToast" class="toast">{{ achievementToast }}</div>

    <!-- OFFLINE POPUP -->
    <div v-if="showOfflineReward" class="popup-overlay">
      <div class="popup">
        <h2>{{ t('welcomeBack') }}</h2>
        <p>{{ t('offlineEarned') }}</p>
        <div class="reward-amt">💰 {{ formatCoins(offlineRewardAmount) }}</div>
        <div class="popup-btns">
          <button class="btn btn-primary" @click="collectOfflineReward">{{ t('collect') }}</button>
          <button class="btn btn-ad" @click="collectDoubleOffline">📺 {{ t('watchAdFor2x') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper { width: 100vw; height: 100vh; overflow: hidden; background: #0d0d1a; font-family: 'Exo 2', sans-serif; color: #fff; position: relative; }
.menu-screen { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 30%, #1a1a3e, #0d0d1a); }
.menu-content { text-align: center; z-index: 1; }
.game-title { font-family: 'Orbitron', sans-serif; margin-bottom: 8px; }
.title-main { display: block; font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #ff5722, #e91e63); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 6px; }
.title-sub { display: block; font-size: 28px; font-weight: 400; color: #00e5ff; letter-spacing: 14px; }
.tagline { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 24px; letter-spacing: 3px; }
.menu-stats { display: flex; gap: 20px; justify-content: center; margin-bottom: 24px; }
.stat-item { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 20px; border: 1px solid rgba(255,255,255,0.1); }
.stat-val { display: block; font-family: 'Orbitron', sans-serif; font-size: 22px; color: #ffd740; }
.stat-lbl { font-size: 11px; color: rgba(255,255,255,0.5); }
.menu-buttons { display: flex; flex-direction: column; gap: 12px; align-items: center; }

.btn { border: none; border-radius: 8px; padding: 12px 32px; font-family: 'Exo 2', sans-serif; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn:hover { transform: scale(1.05); } .btn:active { transform: scale(0.95); } .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.btn-primary { background: linear-gradient(135deg, #ff5722, #e91e63); color: white; }
.btn-lg { padding: 16px 64px; font-size: 20px; }
.btn-secondary { background: rgba(255,255,255,0.1); color: #00e5ff; border: 1px solid rgba(0,229,255,0.3); margin-top: 12px; width: 100%; }
.btn-sm { padding: 6px 14px; font-size: 13px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }
.btn-prestige { background: linear-gradient(135deg, #ffd740, #ff6d00); color: #1a0a00; font-size: 18px; padding: 16px 48px; width: 100%; }
.btn-prestige-sm { background: linear-gradient(135deg, #ffd740, #ff6d00); color: #1a0a00; font-size: 14px; padding: 10px 24px; }
.btn-icon { background: transparent; border: none; color: rgba(255,255,255,0.6); font-size: 22px; cursor: pointer; padding: 4px 8px; }
.btn-ad { background: linear-gradient(135deg, #ff4081, #ff6d00); color: white; padding: 12px 24px; font-size: 14px; border: none; border-radius: 8px; font-family: 'Exo 2', sans-serif; font-weight: 600; cursor: pointer; }
.btn-wave { background: linear-gradient(135deg, #f44336, #e91e63); color: white; font-size: 14px; font-weight: 700; flex: 1; }
.btn-up { background: rgba(0,229,255,0.15); color: #00e5ff; border: 1px solid rgba(0,229,255,0.3); }
.btn-sell { background: rgba(255,171,0,0.15); color: #ffab00; border: 1px solid rgba(255,171,0,0.3); }
.glow { animation: glow-pulse 1.5s ease-in-out infinite; }
@keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 5px rgba(255,215,64,0.3); } 50% { box-shadow: 0 0 15px rgba(255,215,64,0.6); } }

.game-screen { width: 100%; height: 100%; position: relative; }
.phaser-container { width: 100%; height: 100%; position: absolute; inset: 0; }

.hud-overlay { position: absolute; top: 0; left: 0; right: 0; z-index: 10; pointer-events: none; }
.hud-overlay > * { pointer-events: auto; }
.hud-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: linear-gradient(180deg, rgba(13,13,26,0.95), rgba(13,13,26,0.5)); }
.hud-left { display: flex; gap: 12px; align-items: center; }
.hud-right { display: flex; gap: 8px; }
.hud-res { display: flex; align-items: center; gap: 4px; font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 600; }
.hud-res.coins span:last-child { color: #ffd740; }
.hud-res.wave span:last-child { color: #f44336; }
.hud-res.energy span:last-child { color: #e040fb; }
.hud-actions { display: flex; gap: 6px; padding: 4px 12px 6px; background: rgba(13,13,26,0.7); }

.tab-bar-wrap { position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; pointer-events: none; }
.tab-bar-wrap > * { pointer-events: auto; }
.tab-bar { display: flex; justify-content: space-around; padding: 6px 4px; background: rgba(13,13,26,0.95); border-top: 1px solid rgba(255,255,255,0.1); }
.tab-btn { background: transparent; border: none; font-size: 20px; padding: 8px 12px; cursor: pointer; opacity: 0.6; transition: all 0.2s; border-radius: 8px; }
.tab-btn:hover { opacity: 1; background: rgba(255,255,255,0.05); }
.tab-btn.active { opacity: 1; background: rgba(255,87,34,0.15); }

.overlay-screen { position: absolute; inset: 0; background: rgba(13,13,26,0.97); z-index: 20; display: flex; align-items: center; justify-content: center; }
.overlay-content { width: 92%; max-width: 480px; max-height: 85vh; overflow-y: auto; padding: 20px; }
.center-content { text-align: center; }
.overlay-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.overlay-header h2 { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #ff5722; }
.coins-display { font-family: 'Orbitron', sans-serif; font-size: 14px; color: #ffd740; }

.card-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.info-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
.info-card.locked { opacity: 0.5; }
.info-card.unlocked { border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.05); }
.info-card.current { border-color: #ff5722; background: rgba(255,87,34,0.08); }
.card-icon { font-size: 24px; width: 32px; text-align: center; }
.card-info { flex: 1; }
.card-name { font-weight: 600; font-size: 14px; }
.card-desc { font-size: 11px; color: rgba(255,255,255,0.5); }
.card-stat { font-size: 10px; color: rgba(255,255,255,0.4); }
.card-status { font-size: 12px; color: rgba(255,255,255,0.5); }
.unlocked-text { color: #00e676; } .current-text { color: #ff5722; font-weight: 600; }
.ach-count { font-size: 13px; color: rgba(255,255,255,0.6); }

.desc-text { color: rgba(255,255,255,0.7); margin-bottom: 20px; line-height: 1.6; }
.prestige-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.pstat { background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; }
.plabel { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
.pval { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #ffd740; }
.prestige-preview { font-family: 'Orbitron', sans-serif; font-size: 22px; color: #ffd740; margin-bottom: 16px; }

.daily-done { color: #00e676; font-size: 14px; }
.daily-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,87,34,0.3); border-radius: 12px; padding: 24px; margin-bottom: 16px; }
.dc-name { font-family: 'Orbitron', sans-serif; font-size: 18px; color: #ff5722; margin-bottom: 8px; }
.dc-desc { color: rgba(255,255,255,0.8); margin-bottom: 8px; }
.dc-bonus { color: #ffd740; font-weight: 600; }

.toast { position: fixed; top: 15%; left: 50%; transform: translateX(-50%); padding: 14px 28px; border-radius: 12px; font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 700; z-index: 100; background: linear-gradient(135deg, #ff5722, #e91e63); color: white; animation: toast-pop 0.4s ease-out; white-space: nowrap; }
@keyframes toast-pop { 0% { transform: translateX(-50%) scale(0); opacity: 0; } 60% { transform: translateX(-50%) scale(1.15); } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }

.popup-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 30; display: flex; align-items: center; justify-content: center; }
.popup { background: #1a1a3e; border: 1px solid rgba(255,87,34,0.3); border-radius: 16px; padding: 32px; text-align: center; max-width: 320px; }
.popup h2 { font-family: 'Orbitron', sans-serif; color: #ff5722; margin-bottom: 8px; }
.reward-amt { font-family: 'Orbitron', sans-serif; font-size: 28px; color: #ffd740; margin: 16px 0 24px; }
.popup-btns { display: flex; flex-direction: column; gap: 10px; align-items: center; }

.overlay-content::-webkit-scrollbar { width: 4px; }
.overlay-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

@media (max-width: 600px) {
  .title-main { font-size: 32px; letter-spacing: 3px; }
  .title-sub { font-size: 20px; letter-spacing: 8px; }
  .menu-stats { flex-direction: column; gap: 8px; }
  .hud-bar { padding: 4px 8px; }
  .hud-res { font-size: 11px; }
  .tab-btn { font-size: 18px; padding: 6px 8px; }
}
</style>
