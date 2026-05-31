<template>
  <div class="tube-grid" :style="gridStyle">
    <Tube
      v-for="tube in tubes"
      :key="tube.id"
      :tube="tube"
      :selected="selectedTube === tube.id"
      :highlight="hintFrom === tube.id || hintTo === tube.id"
      :sorted="isSorted(tube)"
      :is-pouring-out="pouringFrom === tube.id"
      :is-pouring-in="pouringTo === tube.id"
      @select="$emit('selectTube', tube.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Tube as TubeType } from '../composables/useGameLogic'
import Tube from './Tube.vue'

const props = defineProps<{
  tubes: TubeType[]
  selectedTube: number | null
  hintFrom: number | null
  hintTo: number | null
  pouringFrom: number | null
  pouringTo: number | null
}>()

defineEmits<{
  selectTube: [id: number]
}>()

const gridStyle = computed(() => {
  const count = props.tubes.length
  let cols: number
  if (count <= 4) cols = count
  else if (count <= 6) cols = 3
  else cols = 4
  return {
    'grid-template-columns': `repeat(${cols}, 1fr)`,
  }
})

function isSorted(tube: TubeType): boolean {
  if (tube.contents.length === 0) return true
  return tube.contents.every((id: string) => id === tube.contents[0]) && tube.contents.length === tube.capacity
}
</script>

<style scoped>
.tube-grid {
  display: grid;
  gap: 16px;
  justify-items: center;
  align-items: end;
  padding: 16px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

@media (max-width: 380px) {
  .tube-grid {
    gap: 10px;
    padding: 8px;
  }
}
</style>
