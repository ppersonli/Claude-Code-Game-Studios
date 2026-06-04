<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../i18n'
import { getComboMultiplier } from '../composables/useGameState'

const props = defineProps<{
  score: number
  level: number
  combo: number
  timeLeft?: number
}>()

const comboActive = computed(() => props.combo > 1)
const comboMultiplier = computed(() => getComboMultiplier(props.combo))
</script>

<template>
  <div class="game-hud" :class="{ 'combo-fire': comboActive }">
    <div class="hud-card">
      <span class="hud-icon">⭐</span>
      <div class="hud-info">
        <span class="hud-label">{{ t('hud.score') }}</span>
        <span class="hud-value score-value">{{ score }}</span>
      </div>
    </div>
    <div class="hud-card">
      <span class="hud-icon">📊</span>
      <div class="hud-info">
        <span class="hud-label">{{ t('hud.level') }}</span>
        <span class="hud-value">Lv.{{ level }}</span>
      </div>
    </div>
    <div class="hud-card combo-card" v-if="comboActive">
      <span class="hud-icon combo-icon">🔥</span>
      <div class="hud-info">
        <span class="hud-label">{{ t('hud.combo') }}</span>
        <span class="hud-value combo-value">x{{ combo }} ({{ comboMultiplier }}x)</span>
      </div>
    </div>
    <div
      v-if="timeLeft !== undefined"
      class="hud-card timer-card"
      :class="{ urgent: timeLeft <= 10 }"
    >
      <span class="hud-icon">⏰</span>
      <div class="hud-info">
        <span class="hud-label">{{ t('hud.timeLeft') }}</span>
        <span class="hud-value timer-value">{{ timeLeft }}s</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-hud {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 6px 10px 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.game-hud.combo-fire {
  border-color: rgba(255,165,0,0.4);
  box-shadow: 0 0 16px rgba(255,165,0,0.15), inset 0 0 20px rgba(255,165,0,0.05);
}
.hud-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  flex: 1;
  min-width: 0;
  justify-content: center;
}
.hud-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.hud-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.hud-label {
  font-size: 9px;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}
.hud-value {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  transition: all 0.3s ease;
}
.score-value {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255,215,0,0.4);
}
.combo-card {
  background: rgba(255,100,50,0.15);
  animation: combo-pulse 0.6s ease;
}
.combo-icon {
  animation: flame-dance 0.5s ease infinite;
}
@keyframes flame-dance {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.15) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
}
@keyframes combo-pulse {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.combo-value {
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255,107,107,0.5);
}
.timer-card {
  background: rgba(78,205,196,0.12);
}
.timer-value {
  color: #4ECDC4;
}
.timer-card.urgent {
  background: rgba(255,107,107,0.2);
  animation: timer-flash 1s infinite;
}
.timer-card.urgent .timer-value {
  color: #FF6B6B;
}
@keyframes timer-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
