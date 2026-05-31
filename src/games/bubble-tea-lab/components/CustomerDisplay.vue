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
      <span class="order-label">想要...</span>
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
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
}
.customer-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transition: transform 0.3s;
}
.customer-avatar.happy { animation: bounce 0.5s ease; }
.customer-avatar.sad { animation: shake 0.5s ease; }

.order-bubble {
  display: flex;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  position: relative;
  max-width: 260px;
  align-items: center;
}
.order-bubble::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-right-color: rgba(255,255,255,0.95);
}
.order-label {
  font-size: 0.7em;
  color: #666;
  white-space: nowrap;
}
.order-item {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid #eee;
  transition: all 0.3s;
}
.order-item.fulfilled {
  border-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76,175,80,0.5);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
</style>
