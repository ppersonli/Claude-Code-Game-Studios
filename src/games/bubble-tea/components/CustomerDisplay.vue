<script setup lang="ts">
import type { Customer, Ingredient } from '@types'

defineProps<{
  customer: Customer | null
  order: readonly Ingredient[]
  mood: 'neutral' | 'happy' | 'sad'
  fulfilledIndices?: Set<number>
}>()
</script>

<template>
  <div class="customer-display" v-if="customer">
    <img
      :src="customer.img"
      :alt="customer.name"
      class="customer-avatar"
      :class="mood"
    >
    <div class="order-bubble">
      <img
        v-for="(ing, i) in order"
        :key="i"
        :src="ing.img"
        :alt="ing.name"
        class="order-item"
        :class="{ fulfilled: fulfilledIndices?.has(i) }"
      >
    </div>
  </div>
</template>

<style scoped>
.customer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.customer-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  transition: transform 0.3s;
}
.customer-avatar.happy { animation: bounce 0.5s ease; }
.customer-avatar.sad { animation: shake 0.4s ease; }

.order-bubble {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.order-item {
  width: 36px;
  height: 36px;
  object-fit: contain;
  transition: transform 0.2s;
}
.order-item.fulfilled {
  transform: scale(1.2);
  filter: brightness(1.2);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
</style>
