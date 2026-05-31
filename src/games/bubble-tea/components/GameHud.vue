<script setup lang="ts">
import { getComboMultiplier } from '../composables/useGameState'

const props = defineProps<{
  score: number
  level: number
  combo: number
  timeLeft?: number
}>()
</script>

<template>
  <div class="game-hud">
    <div class="hud-score">🏆 {{ score }}</div>
    <div class="hud-level">Lv.{{ level }}</div>
    <div
      class="hud-combo"
      :class="{ active: combo > 1 }"
    >
      <template v-if="combo > 1">
        🔥 x{{ combo }} ({{ getComboMultiplier(combo) }}x)
      </template>
    </div>
    <div
      v-if="timeLeft !== undefined"
      class="hud-timer"
      :class="{ urgent: timeLeft <= 10 }"
    >
      ⏰ {{ timeLeft }}s
    </div>
  </div>
</template>

<style scoped>
.game-hud {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0,0,0,0.05);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}
.hud-combo.active {
  color: #e74c3c;
  animation: pulse 0.5s ease;
}
.hud-timer.urgent {
  color: #e74c3c;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
