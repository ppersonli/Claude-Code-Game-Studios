/**
 * BlockQueue.vue — Shows the 3 available blocks to place.
 */
<script setup lang="ts">
import type { Block } from '../logic/blocks'
import { getKawaiiColor } from '../data/colors'

defineProps<{
  blocks: Block[]
  selectedIndex: number
}>()

const emit = defineEmits<{
  (e: 'select', index: number): void
}>()
</script>

<template>
  <div class="queue">
    <div
      v-for="(block, i) in blocks"
      :key="i"
      class="block-preview"
      :class="{ selected: selectedIndex === i }"
      @click="emit('select', i)"
    >
      <div class="block-grid" :style="{
        gridTemplateColumns: `repeat(${block.shape.matrix[0]?.length ?? 1}, 1fr)`,
      }">
        <template v-for="(row, r) in block.shape.matrix" :key="r">
          <div
            v-for="(cell, c) in row"
            :key="`${r}-${c}`"
            class="block-cell"
            :class="{ filled: cell === 1 }"
            :style="cell === 1 ? {
              background: getKawaiiColor(block.colorIndex).hex,
              boxShadow: `0 0 4px ${getKawaiiColor(block.colorIndex).glow}`,
            } : {}"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.queue {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 8px;
}

.block-preview {
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  min-width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.block-preview:active {
  transform: scale(0.95);
}

.block-preview.selected {
  box-shadow: 0 0 0 3px #FF69B4;
  background: rgba(255, 105, 180, 0.15);
  transform: scale(1.05);
}

.block-grid {
  display: grid;
  gap: 2px;
}

.block-cell {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.block-cell.filled {
  transform: scale(0.9);
}

.block-cell:not(.filled) {
  background: transparent;
}
</style>
