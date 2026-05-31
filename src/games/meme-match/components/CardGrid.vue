<template>
  <div class="card-grid" :style="gridStyle">
    <Card
      v-for="card in cards"
      :key="card.id"
      :card="card"
      :miss-flash="missCardIds?.has(card.id)"
      @flip="$emit('flip', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CardState } from '@types'
import Card from './Card.vue'

const props = defineProps<{
  cards: CardState[]
  cols: number
  missCardIds?: Set<number>
}>()

defineEmits<{
  flip: [id: number]
}>()

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.cols}, 1fr)`,
  gap: '8px',
  maxWidth: `${props.cols * 90}px`,
  margin: '0 auto',
}))
</script>

<style scoped>
.card-grid {
  padding: 8px;
}
</style>
