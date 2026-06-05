<script setup lang="ts">
import { ref, computed, onUnmounted, watch, onMounted } from 'vue'
import {
  type ExpeditionState,
  type DropItem,
  type HitType,
  startExpedition,
  tapMonster,
  chargeAttack,
  dodgeAttack,
  endExpedition,
} from '../composables/useExpedition'
import type { MonsterZone } from '../data/monsters'
import { ZONES, getZoneById, getMonsterById } from '../data/monsters'
import { t } from '../i18n'

const props = defineProps<{ exp: ExpeditionState }>()
const emit = defineEmits<{ (e: 'end', drops: DropItem[]): void; (e: 'back'): void }>()

// === UI State ===
const selectedZone = ref<MonsterZone | null>(null)
const battleStarted = ref(false)
const showResults = ref(false)
const finalDrops = ref<DropItem[]>([])

// Visual effects
const tapEffects = ref<Array<{ id: number; x: number; y: number; damage: number; type: HitType }>>([])
const particles = ref<Array<{ id: number; x: number; y: number; color: string; dx: number; dy: number }>>([])
let effectId = 0
const screenShake = ref(false)
const monsterFlinch = ref(false)
const defeatAnim = ref(false)
const redFlash = ref(false)

// Timing ring
const ringPhase = ref(0) // 0-1, sweet spot at 0.8-1.0
let ringAnimId: number | null = null
const RING_SPEED = 1.8 // seconds per cycle

// Charge attack
const isCharging = ref(false)
const chargeStart = ref(0)
const chargeLevel = ref(0) // 0-1
let chargeAnimId: number | null = null

// Dodge feedback
const dodgeSuccess = ref(false)

const monster = computed(() => props.exp.currentMonster)
const hpPercent = computed(() => {
  if (props.exp.monsterMaxHp === 0) return 0
  return (props.exp.monsterHp / props.exp.monsterMaxHp) * 100
})

const hpColor = computed(() => {
  const p = hpPercent.value
  if (p > 60) return 'linear-gradient(90deg, #4CAF50, #8BC34A)'
  if (p > 30) return 'linear-gradient(90deg, #FF9800, #FFC107)'
  return 'linear-gradient(90deg, #F44336, #FF5722)'
})

const comboScale = computed(() => {
  const c = props.exp.combo
  if (c >= 30) return 'scale(2.0)'
  if (c >= 20) return 'scale(1.7)'
  if (c >= 10) return 'scale(1.4)'
  if (c >= 5) return 'scale(1.2)'
  return 'scale(1)'
})

const comboGlow = computed(() => {
  const c = props.exp.combo
  if (c >= 20) return '0 0 30px #FF4500, 0 0 60px #FF4500'
  if (c >= 10) return '0 0 20px #FFD700, 0 0 40px #FFD700'
  if (c >= 5) return '0 0 10px #FFD700'
  return 'none'
})

const zoneBg = computed(() => {
  if (!selectedZone.value) return ''
  const zone = getZoneById(selectedZone.value)
  return zone ? `linear-gradient(135deg, ${zone.bgGradient[0]}, ${zone.bgGradient[1]})` : ''
})

const canStart = computed(() => props.exp.stamina > 0)

// Timing ring: is it in the sweet spot?
const isSweetSpot = computed(() => ringPhase.value > 0.75 && ringPhase.value < 0.95)

// Ring visual scale (contracts inward)
const ringScale = computed(() => {
  // Ring goes from large (2.0) to small (0.6) and back
  return 2.0 - ringPhase.value * 1.4
})

const ringOpacity = computed(() => {
  if (isSweetSpot.value) return 1
  return 0.4 + ringPhase.value * 0.3
})

const ringColor = computed(() => {
  if (isSweetSpot.value) return '#FFD700'
  return 'rgba(255,255,255,0.5)'
})

// === Zone selection ===
function selectZone(zoneId: MonsterZone) {
  if (!props.exp.unlockedZones.includes(zoneId)) return
  selectedZone.value = zoneId
}

function handleStartBattle() {
  if (!selectedZone.value || !canStart.value) return
  const ok = startExpedition(props.exp, selectedZone.value)
  if (ok) {
    battleStarted.value = true
    showResults.value = false
    startRingAnimation()
  }
}

// === Timing Ring Animation ===
function startRingAnimation() {
  stopRingAnimation()
  let last = performance.now()
  const animate = (now: number) => {
    const dt = (now - last) / 1000
    last = now
    ringPhase.value = (ringPhase.value + dt / RING_SPEED) % 1
    ringAnimId = requestAnimationFrame(animate)
  }
  ringAnimId = requestAnimationFrame(animate)
}

function stopRingAnimation() {
  if (ringAnimId !== null) {
    cancelAnimationFrame(ringAnimId)
    ringAnimId = null
  }
}

// === Main Tap Attack ===
function handleTap(event: MouseEvent | TouchEvent) {
  if (!battleStarted.value || !props.exp.active) return
  // Don't process tap if charging
  if (isCharging.value) return

  const isCrit = isSweetSpot.value
  const result = tapMonster(props.exp, isCrit)

  // Position
  let clientX: number, clientY: number
  if ('touches' in event) {
    clientX = event.touches[0]?.clientX ?? window.innerWidth / 2
    clientY = event.touches[0]?.clientY ?? window.innerHeight / 2
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }

  // Floating damage number
  const id = ++effectId
  tapEffects.value.push({ id, x: clientX, y: clientY, damage: result.damage, type: result.hitType })
  setTimeout(() => { tapEffects.value = tapEffects.value.filter(e => e.id !== id) }, 800)

  // Screen shake on crit
  if (result.hitType === 'crit') {
    screenShake.value = true
    setTimeout(() => { screenShake.value = false }, 200)
    spawnParticles(clientX, clientY, '#FFD700', 8)
  }

  // Monster flinch
  monsterFlinch.value = true
  setTimeout(() => { monsterFlinch.value = false }, 120)

  if (navigator.vibrate) navigator.vibrate(result.hitType === 'crit' ? 40 : 15)

  if (result.defeated) {
    defeatAnim.value = true
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '#FF6B6B', 15)
    setTimeout(() => { defeatAnim.value = false }, 400)
  }
}

// === Charge Attack ===
function startCharge(event: MouseEvent | TouchEvent) {
  if (!battleStarted.value || !props.exp.active) return
  event.preventDefault()
  isCharging.value = true
  chargeStart.value = Date.now()
  chargeLevel.value = 0

  const updateCharge = () => {
    if (!isCharging.value) return
    const elapsed = (Date.now() - chargeStart.value) / 1000
    chargeLevel.value = Math.min(elapsed / 2.5, 1)
    chargeAnimId = requestAnimationFrame(updateCharge)
  }
  chargeAnimId = requestAnimationFrame(updateCharge)
}

function releaseCharge(event: MouseEvent | TouchEvent) {
  if (!isCharging.value) return
  event.preventDefault()

  const elapsed = (Date.now() - chargeStart.value) / 1000
  isCharging.value = false
  if (chargeAnimId) { cancelAnimationFrame(chargeAnimId); chargeAnimId = null }
  chargeLevel.value = 0

  if (elapsed < 0.3) return // too short, ignore

  const result = chargeAttack(props.exp, elapsed)

  const clientX = window.innerWidth / 2
  const clientY = window.innerHeight / 2 - 50

  const id = ++effectId
  tapEffects.value.push({ id, x: clientX, y: clientY, damage: result.damage, type: 'charge' })
  setTimeout(() => { tapEffects.value = tapEffects.value.filter(e => e.id !== id) }, 1000)

  // Big screen shake for charge
  screenShake.value = true
  setTimeout(() => { screenShake.value = false }, 300)
  spawnParticles(clientX, clientY, '#FF4500', 12)

  monsterFlinch.value = true
  setTimeout(() => { monsterFlinch.value = false }, 200)

  if (navigator.vibrate) navigator.vibrate([30, 20, 50])

  if (result.defeated) {
    defeatAnim.value = true
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '#FF4500', 20)
    setTimeout(() => { defeatAnim.value = false }, 400)
  }
}

// === Dodge ===
function handleDodge() {
  if (!props.exp.monsterAttackWindow || !props.exp.active) return
  const success = dodgeAttack(props.exp)
  if (success) {
    dodgeSuccess.value = true
    setTimeout(() => { dodgeSuccess.value = false }, 500)
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '#4ECDC4', 6)
    if (navigator.vibrate) navigator.vibrate(20)
  }
}

// Monster attack hit (when player fails to dodge)
watch(() => props.exp.monsterAttackWindow, (newVal, oldVal) => {
  if (newVal === false && oldVal === true && props.exp.combo === 0 && props.exp.active) {
    // Failed dodge — red flash
    redFlash.value = true
    setTimeout(() => { redFlash.value = false }, 300)
    if (navigator.vibrate) navigator.vibrate([50, 30, 50])
  }
})

// === Particles ===
function spawnParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const id = ++effectId
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const speed = 60 + Math.random() * 80
    particles.value.push({
      id, x, y, color,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
    })
    setTimeout(() => { particles.value = particles.value.filter(p => p.id !== id) }, 600)
  }
}

// === End expedition ===
function handleEnd() {
  stopRingAnimation()
  if (chargeAnimId) { cancelAnimationFrame(chargeAnimId); chargeAnimId = null }
  const drops = endExpedition(props.exp)
  finalDrops.value = drops
  showResults.value = true
  battleStarted.value = false
}

watch(() => props.exp.timer, (val) => {
  if (val <= 0 && props.exp.active) handleEnd()
})

function handleBackFromResults() {
  emit('end', finalDrops.value)
}

function getMonsterEmoji(id: string): string {
  const m = getMonsterById(id)
  return m ? m.emoji : '❓'
}

onUnmounted(() => {
  stopRingAnimation()
  if (chargeAnimId) cancelAnimationFrame(chargeAnimId)
  if (props.exp.timerId) { clearInterval(props.exp.timerId); props.exp.timerId = null }
})
</script>

<template>
  <div class="expedition-root" :style="{ background: zoneBg || 'linear-gradient(135deg, #667eea, #764ba2)' }"
       :class="{ shake: screenShake }">

    <!-- Zone Selection -->
    <div v-if="!battleStarted && !showResults" class="zone-select-screen">
      <h2 class="exp-title">🗺️ {{ t('expedition.title') }}</h2>
      <div class="stamina-bar">
        <span class="stamina-icon">⚡</span>
        <span class="stamina-count">{{ exp.stamina }} / {{ exp.staminaMax }}</span>
        <div class="stamina-pips">
          <div v-for="i in exp.staminaMax" :key="i" class="stamina-pip" :class="{ filled: i <= exp.stamina }" />
        </div>
      </div>
      <div v-if="exp.isDailyFirst" class="daily-bonus-badge">
        🎁 {{ t('expedition.dailyFirstBonus') }}
      </div>

      <!-- Battle tutorial -->
      <div class="tutorial-box">
        <div class="tutorial-title">⚔️ {{ t('expedition.howToPlay') }}</div>
        <div class="tutorial-row"><span class="tutorial-icon">🎯</span><span>{{ t('expedition.tipCrit') }}</span></div>
        <div class="tutorial-row"><span class="tutorial-icon">⚡</span><span>{{ t('expedition.tipCharge') }}</span></div>
        <div class="tutorial-row"><span class="tutorial-icon">🛡️</span><span>{{ t('expedition.tipDodge') }}</span></div>
      </div>

      <div class="zone-grid">
        <div v-for="zone in ZONES" :key="zone.id" class="zone-card"
          :class="{ selected: selectedZone === zone.id, locked: !exp.unlockedZones.includes(zone.id) }"
          :style="{ background: `linear-gradient(135deg, ${zone.bgGradient[0]}88, ${zone.bgGradient[1]}88)` }"
          @click="selectZone(zone.id)">
          <span class="zone-emoji">{{ zone.emoji }}</span>
          <span class="zone-name">{{ t('zones.' + zone.id) }}</span>
          <div class="zone-monsters">
            <span v-for="m in zone.monsters" :key="m.id" class="zone-monster-emoji">{{ m.emoji }}</span>
          </div>
          <div v-if="!exp.unlockedZones.includes(zone.id)" class="zone-lock">🔒 Lv.{{ zone.minLevel }}</div>
          <div v-else class="zone-kills">{{ exp.zoneKillCount[zone.id] ?? 0 }} / {{ zone.monstersRequired }}</div>
        </div>
      </div>
      <div class="zone-actions">
        <button class="btn-exp start-btn" :disabled="!selectedZone || !canStart" @click="handleStartBattle">
          {{ canStart ? t('expedition.startBattle') : t('expedition.noStamina') }} ⚔️
        </button>
        <button class="btn-exp back-btn" @click="emit('back')">← {{ t('buttons.back') }}</button>
      </div>
      <div v-if="exp.monsterBestiary.length > 0" class="bestiary-section">
        <div class="bestiary-title">📖 {{ t('expedition.bestiary') }} ({{ exp.monsterBestiary.length }}/17)</div>
        <div class="bestiary-grid">
          <span v-for="mid in exp.monsterBestiary" :key="mid" class="bestiary-entry">{{ getMonsterEmoji(mid) }}</span>
        </div>
      </div>
    </div>

    <!-- Battle Screen -->
    <div v-else-if="battleStarted && !showResults" class="battle-screen"
      @mousedown="handleTap" @touchstart.prevent="handleTap">

      <!-- Red flash overlay on failed dodge -->
      <div v-if="redFlash" class="red-flash-overlay" />

      <!-- Top HUD -->
      <div class="battle-hud">
        <div class="battle-timer" :class="{ urgent: exp.timer <= 10 }">⏱️ {{ exp.timer }}s</div>
        <div class="battle-combo" :style="{ transform: comboScale, textShadow: comboGlow }">
          <span v-if="exp.combo >= 2">🔥 x{{ exp.combo }}</span>
        </div>
        <div class="battle-defeated">💀 {{ exp.monstersDefeated }}</div>
      </div>

      <!-- Monster Attack Warning -->
      <div v-if="exp.monsterAttackWindow" class="attack-warning" @mousedown.stop="handleDodge" @touchstart.stop.prevent="handleDodge">
        <div class="warning-text">⚠️ {{ t('expedition.dodge') }}!</div>
        <div class="warning-bar">
          <div class="warning-fill" />
        </div>
        <div class="dodge-btn">🛡️ TAP!</div>
      </div>

      <!-- Dodge success feedback -->
      <div v-if="dodgeSuccess" class="dodge-success">✅ {{ t('expedition.dodgeSuccess') }}!</div>

      <!-- Monster Display -->
      <div class="monster-area" v-if="monster" @mousedown.stop @touchstart.stop.prevent>
        <div class="monster-container" :class="{
          boss: monster.isBoss,
          flinch: monsterFlinch,
          defeated: defeatAnim,
        }">
          <!-- Timing Ring -->
          <div class="timing-ring" :style="{
            transform: `scale(${ringScale})`,
            borderColor: ringColor,
            opacity: ringOpacity,
          }" />
          <div v-if="isSweetSpot" class="sweet-spot-label">CRIT!</div>

          <div class="monster-emoji-big">{{ monster.emoji }}</div>
          <div class="monster-name" :class="{ 'boss-name': monster.isBoss }">
            {{ monster.isBoss ? '👑 ' : '' }}{{ t('monsters.' + monster.id) || monster.name }}
          </div>
          <div class="hp-bar">
            <div class="hp-fill" :style="{ width: hpPercent + '%', background: hpColor }" />
          </div>
          <div class="hp-text">{{ exp.monsterHp }} / {{ exp.monsterMaxHp }}</div>
        </div>
      </div>

      <!-- Bottom action bar -->
      <div class="action-bar" @mousedown.stop @touchstart.stop.prevent>
        <!-- Charge Attack Button -->
        <div class="charge-zone">
          <div class="charge-btn"
            :class="{ charging: isCharging }"
            @mousedown.stop="startCharge" @touchstart.stop.prevent="startCharge"
            @mouseup.stop="releaseCharge" @touchend.stop.prevent="releaseCharge">
            <div class="charge-label">⚡ {{ t('expedition.charge') }}</div>
            <div v-if="isCharging" class="charge-bar">
              <div class="charge-fill" :style="{ width: (chargeLevel * 100) + '%' }"
                :class="{ max: chargeLevel >= 0.9 }" />
            </div>
          </div>
        </div>
      </div>

      <!-- Drops preview -->
      <div class="drops-preview" v-if="exp.drops.length > 0">
        <span v-for="d in exp.drops" :key="d.ingredientId" class="drop-item">
          {{ d.ingredientId === 'green_tea' ? '🍵' : d.ingredientId === 'black_tea' ? '☕' : d.ingredientId === 'milk' ? '🥛' : d.ingredientId === 'boba' ? '⚫' : d.ingredientId === 'strawberry' ? '🍓' : d.ingredientId === 'mango' ? '🥭' : d.ingredientId === 'ice' ? '🧊' : d.ingredientId === 'coconut' ? '🥥' : d.ingredientId === 'jelly' ? '🪼' : d.ingredientId === 'pudding' ? '🍮' : '✨' }}
          x{{ d.count }}
        </span>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-else-if="showResults" class="results-screen">
      <h2 class="results-title">⚔️ {{ t('expedition.expeditionComplete') }}</h2>
      <div class="results-stats">
        <div class="stat-row"><span>💀 {{ t('expedition.monstersDefeated') }}</span><span class="stat-value">{{ exp.monstersDefeated }}</span></div>
        <div class="stat-row"><span>🔥 {{ t('expedition.maxCombo') }}</span><span class="stat-value">x{{ exp.maxCombo }}</span></div>
        <div class="stat-row"><span>💪 {{ t('expedition.totalDamage') }}</span><span class="stat-value">{{ exp.totalDamageDealt }}</span></div>
        <div v-if="exp.isDailyFirst" class="daily-bonus-result">🎁 {{ t('expedition.dailyDropsDoubled') }}</div>
      </div>
      <div class="results-drops" v-if="finalDrops.length > 0">
        <h3>{{ t('expedition.itemsObtained') }}</h3>
        <div class="drops-grid">
          <div v-for="d in finalDrops" :key="d.ingredientId" class="drop-card">
            <span class="drop-emoji">{{ d.ingredientId === 'green_tea' ? '🍵' : d.ingredientId === 'black_tea' ? '☕' : d.ingredientId === 'milk' ? '🥛' : d.ingredientId === 'boba' ? '⚫' : d.ingredientId === 'strawberry' ? '🍓' : d.ingredientId === 'mango' ? '🥭' : d.ingredientId === 'ice' ? '🧊' : d.ingredientId === 'coconut' ? '🥥' : d.ingredientId === 'jelly' ? '🪼' : d.ingredientId === 'pudding' ? '🍮' : d.ingredientId === 'cream' ? '🧁' : d.ingredientId === 'mochi' ? '🍡' : d.ingredientId === 'popping_boba' ? '💎' : d.ingredientId === 'grass_jelly' ? '🌿' : d.ingredientId === 'taro' ? '🟣' : d.ingredientId === 'red_bean' ? '🫘' : '✨' }}</span>
            <span class="drop-count">x{{ d.count }}</span>
            <span class="drop-name">{{ t('ingredients.' + d.ingredientId) || d.ingredientId }}</span>
          </div>
        </div>
      </div>
      <div v-else class="no-drops">{{ t('expedition.noDrops') }}</div>
      <button class="btn-exp collect-btn" @click="handleBackFromResults">{{ t('expedition.collect') }} 🎒</button>
    </div>

    <!-- Tap damage effects -->
    <div v-for="te in tapEffects" :key="te.id" class="tap-effect"
      :class="te.type"
      :style="{ left: te.x + 'px', top: te.y + 'px' }">
      <span v-if="te.type === 'crit'" class="tap-crit">CRIT! -{{ te.damage }}</span>
      <span v-else-if="te.type === 'charge'" class="tap-charge">💥 -{{ te.damage }}</span>
      <span v-else>-{{ te.damage }}</span>
    </div>

    <!-- Particle effects -->
    <div v-for="p in particles" :key="p.id" class="particle"
      :style="{
        left: p.x + 'px', top: p.y + 'px',
        background: p.color,
        '--dx': p.dx + 'px', '--dy': p.dy + 'px',
      }" />
  </div>
</template>

<style scoped>
.expedition-root {
  width: 100%; height: 100%; position: relative;
  display: flex; flex-direction: column; overflow: hidden;
}
.expedition-root.shake { animation: shake 0.2s ease; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-6px) rotate(-0.5deg); }
  75% { transform: translateX(6px) rotate(0.5deg); }
}

/* Zone Selection */
.zone-select-screen {
  display: flex; flex-direction: column; align-items: center;
  padding: 16px; gap: 10px; overflow-y: auto; flex: 1;
}
.exp-title { color: #fff; font-size: 1.5em; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.stamina-bar {
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.2); padding: 8px 20px; border-radius: 20px;
  color: #FFD700; font-weight: 700;
}
.stamina-icon { font-size: 1.3em; }
.stamina-pips { display: flex; gap: 4px; }
.stamina-pip { width: 14px; height: 14px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,215,0,0.3); transition: all 0.3s; }
.stamina-pip.filled { background: #FFD700; border-color: #FFD700; box-shadow: 0 0 8px rgba(255,215,0,0.5); }
.daily-bonus-badge {
  background: linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,140,0,0.9));
  color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 0.85em; font-weight: 700;
  animation: pulse 1.5s infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }

/* Tutorial */
.tutorial-box {
  background: rgba(0,0,0,0.25); border-radius: 12px; padding: 10px 16px;
  width: 100%; max-width: 340px; backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.1);
}
.tutorial-title { color: #FFD700; font-weight: 700; font-size: 0.9em; margin-bottom: 6px; }
.tutorial-row { color: rgba(255,255,255,0.85); font-size: 0.8em; padding: 3px 0; display: flex; align-items: center; gap: 8px; }
.tutorial-icon { font-size: 1.2em; width: 24px; text-align: center; }

.zone-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 340px; }
.zone-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 8px; border-radius: 14px; cursor: pointer; transition: all 0.2s;
  border: 2px solid transparent; backdrop-filter: blur(4px);
}
.zone-card.selected { border-color: #FFD700; box-shadow: 0 0 20px rgba(255,215,0,0.4); transform: scale(1.03); }
.zone-card.locked { opacity: 0.4; cursor: not-allowed; }
.zone-emoji { font-size: 1.8em; }
.zone-name { color: #fff; font-weight: 700; font-size: 0.8em; text-align: center; }
.zone-monsters { display: flex; gap: 4px; font-size: 0.85em; }
.zone-lock { font-size: 0.7em; color: rgba(255,255,255,0.8); }
.zone-kills { font-size: 0.7em; color: rgba(255,255,255,0.7); }

.zone-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 300px; margin-top: 6px; }
.btn-exp {
  padding: 14px 32px; border: none; border-radius: 50px;
  font-size: 1.1em; font-weight: 700; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.btn-exp:active { transform: scale(0.95); }
.start-btn { background: linear-gradient(135deg, #FF6B6B, #4ECDC4); color: #fff; }
.start-btn:disabled { background: #666; opacity: 0.5; cursor: not-allowed; }
.back-btn { background: rgba(255,255,255,0.2); color: #fff; }
.collect-btn { background: linear-gradient(135deg, #FFD700, #FF8C00); color: #fff; }

/* Bestiary */
.bestiary-section { width: 100%; max-width: 340px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 10px 14px; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.08); }
.bestiary-title { color: rgba(255,255,255,0.8); font-size: 0.85em; font-weight: 600; margin-bottom: 6px; }
.bestiary-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.bestiary-entry { font-size: 1.4em; background: rgba(255,255,255,0.1); border-radius: 8px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; }

/* === BATTLE SCREEN === */
.battle-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  cursor: crosshair; user-select: none; -webkit-user-select: none;
  position: relative; gap: 8px;
}

/* HUD */
.battle-hud {
  position: absolute; top: 10px; left: 0; right: 0;
  display: flex; justify-content: space-between; padding: 0 14px; z-index: 5;
}
.battle-timer { background: rgba(0,0,0,0.5); color: #fff; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 1.1em; backdrop-filter: blur(4px); }
.battle-timer.urgent { color: #FF6B6B; animation: pulse 0.5s infinite; }
.battle-combo {
  color: #FFD700; font-size: 1.6em; font-weight: 900;
  text-shadow: 0 2px 10px rgba(255,215,0,0.5);
  transition: transform 0.15s, text-shadow 0.3s;
}
.battle-defeated { background: rgba(0,0,0,0.5); color: #fff; padding: 6px 14px; border-radius: 20px; font-weight: 600; backdrop-filter: blur(4px); }

/* Red flash */
.red-flash-overlay {
  position: absolute; inset: 0; z-index: 20;
  background: rgba(255,0,0,0.3);
  animation: flash-out 0.3s ease forwards;
  pointer-events: none;
}
@keyframes flash-out { 0% { opacity: 1; } 100% { opacity: 0; } }

/* Attack Warning */
.attack-warning {
  position: absolute; top: 50px; left: 50%; transform: translateX(-50%);
  z-index: 15; text-align: center; cursor: pointer;
  animation: warning-bounce 0.3s ease;
}
@keyframes warning-bounce {
  0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}
.warning-text { color: #FF4444; font-size: 1.5em; font-weight: 900; text-shadow: 0 0 20px rgba(255,0,0,0.5); }
.warning-bar { width: 120px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin: 6px auto; overflow: hidden; }
.warning-fill {
  width: 100%; height: 100%; background: linear-gradient(90deg, #FF4444, #FF8800);
  animation: warning-shrink 1.5s linear forwards;
}
@keyframes warning-shrink { 0% { width: 100%; } 100% { width: 0%; } }
.dodge-btn {
  margin-top: 4px; padding: 8px 24px;
  background: linear-gradient(135deg, #4ECDC4, #44BD9E);
  color: #fff; border-radius: 30px; font-weight: 900; font-size: 1.2em;
  box-shadow: 0 0 20px rgba(78,205,196,0.6);
  animation: dodge-pulse 0.4s infinite alternate;
}
@keyframes dodge-pulse { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }

.dodge-success {
  position: absolute; top: 50px; left: 50%; transform: translateX(-50%);
  color: #4ECDC4; font-size: 1.3em; font-weight: 900; z-index: 15;
  text-shadow: 0 0 15px rgba(78,205,196,0.6);
  animation: dodge-ok 0.5s ease forwards;
}
@keyframes dodge-ok {
  0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.3); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(1); }
}

/* Monster */
.monster-area { display: flex; align-items: center; justify-content: center; position: relative; }
.monster-container {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  animation: monster-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
@keyframes monster-enter {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
.monster-container.flinch { animation: flinch 0.12s ease !important; }
@keyframes flinch {
  0% { transform: translateX(0); }
  25% { transform: translateX(-8px) rotate(-2deg); }
  75% { transform: translateX(8px) rotate(2deg); }
  100% { transform: translateX(0); }
}
.monster-container.defeated { animation: defeat 0.4s ease forwards !important; }
@keyframes defeat {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3) rotate(10deg); opacity: 0.7; }
  100% { transform: scale(0) rotate(45deg); opacity: 0; }
}

/* Timing Ring */
.timing-ring {
  position: absolute; top: 50%; left: 50%;
  width: 140px; height: 140px;
  margin: -70px 0 0 -70px;
  border: 3px solid rgba(255,255,255,0.5);
  border-radius: 50%;
  transition: border-color 0.1s;
  pointer-events: none;
}
.sweet-spot-label {
  position: absolute; top: -25px; left: 50%; transform: translateX(-50%);
  color: #FFD700; font-weight: 900; font-size: 1.2em;
  text-shadow: 0 0 15px rgba(255,215,0,0.8);
  animation: crit-label 0.3s ease;
}
@keyframes crit-label { 0% { transform: translateX(-50%) scale(0.5); } 100% { transform: translateX(-50%) scale(1); } }

.monster-emoji-big {
  font-size: 5em;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.4));
  animation: idle-bob 2s ease-in-out infinite;
}
@keyframes idle-bob {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.monster-container.boss .monster-emoji-big { font-size: 6em; animation: boss-idle 1.5s ease-in-out infinite; }
@keyframes boss-idle {
  0%,100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.05); }
}
.monster-name { color: #fff; font-weight: 700; font-size: 1em; text-shadow: 0 1px 6px rgba(0,0,0,0.4); }
.boss-name { color: #FFD700; font-size: 1.2em; }
.hp-bar { width: 180px; height: 14px; background: rgba(0,0,0,0.4); border-radius: 7px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); }
.hp-fill { height: 100%; border-radius: 7px; transition: width 0.15s ease; }
.hp-text { color: rgba(255,255,255,0.7); font-size: 0.75em; }

/* Action bar */
.action-bar {
  position: absolute; bottom: 60px; left: 0; right: 0;
  display: flex; justify-content: center; z-index: 10;
}
.charge-zone { display: flex; gap: 12px; }
.charge-btn {
  width: 80px; height: 80px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: 3px solid rgba(255,255,255,0.3);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; position: relative; overflow: hidden;
  transition: all 0.15s;
  box-shadow: 0 4px 20px rgba(102,126,234,0.4);
}
.charge-btn.charging {
  transform: scale(1.15);
  box-shadow: 0 0 30px rgba(255,69,0,0.6);
  border-color: #FF4500;
  background: linear-gradient(135deg, #FF4500, #FF8C00);
}
.charge-label { color: #fff; font-weight: 700; font-size: 0.75em; text-align: center; z-index: 2; }
.charge-bar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 100%;
  background: transparent; z-index: 1;
}
.charge-fill {
  position: absolute; bottom: 0; left: 0; height: 100%;
  background: linear-gradient(0deg, rgba(255,69,0,0.6), rgba(255,140,0,0.3));
  transition: width 0.05s;
}
.charge-fill.max { background: linear-gradient(0deg, rgba(255,215,0,0.7), rgba(255,69,0,0.4)); }

/* Drops */
.drops-preview {
  position: absolute; bottom: 12px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; padding: 0 16px;
}
.drop-item { background: rgba(0,0,0,0.5); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 600; backdrop-filter: blur(4px); }

/* Tap effects */
.tap-effect { position: fixed; pointer-events: none; z-index: 100; font-weight: 900; text-shadow: 0 2px 6px rgba(0,0,0,0.5); }
.tap-effect.normal { color: #fff; font-size: 1.2em; animation: tap-float 0.8s ease-out forwards; }
.tap-effect.crit { animation: tap-crit 0.8s ease-out forwards; }
.tap-effect.charge { animation: tap-float 1s ease-out forwards; }
.tap-crit { color: #FFD700; font-size: 2em; text-shadow: 0 0 20px rgba(255,215,0,0.8); }
.tap-charge { color: #FF4500; font-size: 1.8em; text-shadow: 0 0 15px rgba(255,69,0,0.8); }
@keyframes tap-float {
  0% { opacity: 1; transform: translateY(0) scale(1.2); }
  100% { opacity: 0; transform: translateY(-50px) scale(0.7); }
}
@keyframes tap-crit {
  0% { opacity: 1; transform: translateY(0) scale(0.5); }
  15% { transform: translateY(-10px) scale(1.8); }
  30% { transform: translateY(-25px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-70px) scale(0.6); }
}

/* Particles */
.particle {
  position: fixed; pointer-events: none; z-index: 99;
  width: 8px; height: 8px; border-radius: 50%;
  animation: particle-fly 0.6s ease-out forwards;
}
@keyframes particle-fly {
  0% { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.3); }
}

/* Results */
.results-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; gap: 14px; }
.results-title { color: #fff; font-size: 1.6em; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.results-stats { background: rgba(0,0,0,0.25); border-radius: 14px; padding: 16px 24px; width: 100%; max-width: 300px; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); }
.stat-row { display: flex; justify-content: space-between; padding: 6px 0; color: rgba(255,255,255,0.8); font-size: 0.95em; }
.stat-value { color: #FFD700; font-weight: 700; }
.daily-bonus-result { text-align: center; color: #FFD700; font-weight: 700; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); }
.results-drops { width: 100%; max-width: 300px; }
.results-drops h3 { color: #fff; text-align: center; margin-bottom: 10px; font-size: 1em; }
.drops-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.drop-card { display: flex; flex-direction: column; align-items: center; gap: 2px; background: rgba(255,255,255,0.15); border-radius: 12px; padding: 10px 6px; backdrop-filter: blur(4px); }
.drop-emoji { font-size: 1.8em; }
.drop-count { color: #FFD700; font-weight: 700; font-size: 0.9em; }
.drop-name { color: rgba(255,255,255,0.7); font-size: 0.7em; text-align: center; }
.no-drops { color: rgba(255,255,255,0.6); text-align: center; font-size: 0.95em; }
</style>
