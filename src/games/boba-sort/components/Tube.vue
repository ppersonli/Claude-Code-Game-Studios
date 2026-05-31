<template>
  <div
    class="tube-wrapper"
    :class="{
      'tube-selected': selected,
      'tube-highlight': highlight,
      'tube-sorted': sorted,
      'tube-empty': tube.contents.length === 0,
    }"
    @click="$emit('select', tube.id)"
  >
    <!-- Tube name/number -->
    <div class="tube-label">{{ tube.id + 1 }}</div>

    <!-- Glass tube -->
    <div class="tube-glass">
      <!-- Ingredient slots (bottom to top) -->
      <div
        v-for="(slot, idx) in displaySlots"
        :key="idx"
        class="tube-slot"
        :class="{
          'slot-filled': slot !== null,
          'slot-empty': slot === null,
          'slot-top': idx === tube.capacity - 1 && slot !== null && selected,
          'slot-pouring-out': isPouringOut && idx === tube.capacity - 1 && slot !== null,
          'slot-pouring-in': isPouringIn && slot !== null,
        }"
      >
        <img
          v-if="slot !== null"
          :src="getIngredientImg(slot)"
          :alt="slot"
          class="ingredient-img"
          draggable="false"
        />
      </div>
    </div>

    <!-- Selection indicator -->
    <div v-if="selected" class="select-arrow">▲</div>

    <!-- Sorted indicator -->
    <div v-if="sorted" class="sorted-badge">✓</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Tube } from '../composables/useGameLogic'
import { SORT_INGREDIENTS } from '../data/ingredients'

const props = defineProps<{
  tube: Tube
  selected: boolean
  highlight: boolean
  sorted: boolean
  isPouringOut: boolean
  isPouringIn: boolean
}>()

defineEmits<{
  select: [id: number]
}>()

// Display slots: bottom-to-top (index 0 = bottom)
const displaySlots = computed<(string | null)[]>(() => {
  const slots: (string | null)[] = []
  for (let i = 0; i < props.tube.capacity; i++) {
    slots.push(props.tube.contents[i] ?? null)
  }
  return slots
})

const imgMap: Record<string, string> = {}
for (const ing of SORT_INGREDIENTS) {
  imgMap[ing.id] = new URL(ing.img, import.meta.url).href
}

function getIngredientImg(id: string): string {
  return imgMap[id] ?? ''
}
</script>

<style scoped>
.tube-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
  position: relative;
}

.tube-wrapper:active {
  transform: scale(0.95);
}

.tube-selected {
  transform: translateY(-8px);
}

.tube-selected:active {
  transform: translateY(-8px) scale(0.95);
}

.tube-highlight {
  animation: pulse-glow 1s ease-in-out infinite;
}

.tube-sorted .tube-glass {
  border-color: #27ae60;
  box-shadow: 0 0 12px rgba(39, 174, 96, 0.4);
}

.tube-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
  font-weight: 600;
}

.tube-glass {
  width: 64px;
  height: 160px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-top: none;
  border-radius: 0 0 12px 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
  box-shadow:
    inset 0 0 20px rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.15);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.tube-slot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.tube-slot:last-child {
  border-bottom: none;
}

.slot-filled {
  background: rgba(255, 255, 255, 0.08);
}

.slot-top {
  animation: bounce-up 0.2s ease;
}

.slot-pouring-out {
  animation: pour-out 0.3s ease forwards;
}

.slot-pouring-in {
  animation: pour-in 0.3s ease;
}

.ingredient-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.slot-filled:hover .ingredient-img {
  transform: scale(1.1);
}

.select-arrow {
  color: #fff;
  font-size: 14px;
  margin-top: 4px;
  animation: bounce-arrow 0.8s ease-in-out infinite;
}

.sorted-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #27ae60;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  animation: pop-in 0.3s ease;
}

/* Animations */
@keyframes bounce-up {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}

@keyframes pour-out {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-20px) scale(0.8); opacity: 0.7; }
  100% { transform: translateY(-40px) scale(0.5); opacity: 0; }
}

@keyframes pour-in {
  0% { transform: translateY(-20px) scale(0.5); opacity: 0; }
  60% { transform: translateY(4px) scale(1.05); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 16px 4px rgba(255, 255, 255, 0.3); }
}

@keyframes pop-in {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Responsive */
@media (max-width: 380px) {
  .tube-glass {
    width: 52px;
    height: 130px;
  }
  .ingredient-img {
    width: 32px;
    height: 32px;
  }
}

@media (min-width: 500px) {
  .tube-glass {
    width: 72px;
    height: 180px;
  }
  .ingredient-img {
    width: 48px;
    height: 48px;
  }
}
</style>
