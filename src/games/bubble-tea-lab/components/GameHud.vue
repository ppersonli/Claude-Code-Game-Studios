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
    <div class="hud-score">⭐ {{ score }}</div>
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
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.hud-score { color: #ffd700; text-shadow: 0 0 10px rgba(255,215,0,0.5); }
.hud-combo.active {
  color: #ff6b6b;
  animation: pulse 0.5s ease;
}
.hud-timer {
  color: #4ECDC4;
}
.hud-timer.urgent {
  color: #FF6B6B;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
