<template>
  <div class="score-board">
    <div class="stat">
      <span class="stat-label">Score</span>
      <span class="stat-value">{{ score }}</span>
    </div>
    <div class="stat" v-if="combo > 0">
      <span class="stat-label">Combo</span>
      <span class="stat-value combo" :class="comboClass">{{ combo }}× ({{ comboMult }})</span>
    </div>
    <div class="stat">
      <span class="stat-label">Pairs</span>
      <span class="stat-value">{{ matchesFound }}/{{ totalPairs }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getComboMultiplier } from '@shared/utils'

const props = defineProps<{
  score: number
  combo: number
  matchesFound: number
  totalPairs: number
}>()

const comboMult = computed(() => {
  if (props.combo <= 1) return '1×'
  return `${getComboMultiplier(props.combo)}×`
})

const comboClass = computed(() => {
  if (props.combo >= 5) return 'combo-fire'
  if (props.combo >= 3) return 'combo-hot'
  return ''
})
</script>

<style scoped>
.score-board {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: white;
}

.combo {
  color: #fbbf24;
}

.combo-hot {
  color: #f97316;
  text-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
}

.combo-fire {
  color: #ef4444;
  text-shadow: 0 0 12px rgba(239, 68, 68, 0.7);
  animation: firePulse 0.3s ease infinite alternate;
}

@keyframes firePulse {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}
</style>
