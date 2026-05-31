<template>
  <div class="game-timer" :class="{ urgent: timeRemaining <= 10 }">
    <span class="timer-icon">⏱️</span>
    <span class="timer-value">{{ formattedTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  timeRemaining: number
}>()

const formattedTime = computed(() => {
  const m = Math.floor(props.timeRemaining / 60)
  const s = props.timeRemaining % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})
</script>

<style scoped>
.game-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  transition: color 0.3s;
}

.game-timer.urgent {
  color: #ef4444;
  animation: pulse 0.5s ease infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}
</style>
