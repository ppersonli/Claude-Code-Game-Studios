<template>
  <div
    class="card-wrapper"
    :class="{ flipped: card.flipped || card.matched, matched: card.matched, miss: missFlash }"
    @click="$emit('flip', card.id)"
  >
    <div class="card-inner">
      <div class="card-face card-back">❓</div>
      <div class="card-face card-front">{{ memeEmoji }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardState } from '@types'
import { MEMES } from '../data/memes'

const props = defineProps<{
  card: CardState
  missFlash?: boolean
}>()

defineEmits<{
  flip: [id: number]
}>()

const memeEmoji = computed(() => {
  const meme = MEMES.find(m => m.id === props.card.memeId)
  return meme?.emoji ?? '?'
})
</script>

<style scoped>
.card-wrapper {
  perspective: 800px;
  cursor: pointer;
  aspect-ratio: 1;
  min-width: 44px;
  min-height: 44px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.card-wrapper.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  border-radius: 12px;
  font-size: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-back {
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: white;
  font-size: 1.5rem;
}

.card-front {
  background: white;
  transform: rotateY(180deg);
}

/* Match animation */
.card-wrapper.matched .card-front {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: matchBounce 0.5s ease;
}

@keyframes matchBounce {
  0%, 100% { transform: rotateY(180deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.15); }
}

/* Miss shake animation */
.card-wrapper.miss .card-inner {
  animation: missShake 0.4s ease;
}

.card-wrapper.miss .card-front {
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
}

@keyframes missShake {
  0%, 100% { transform: rotateY(180deg) translateX(0); }
  25% { transform: rotateY(180deg) translateX(-8px); }
  75% { transform: rotateY(180deg) translateX(8px); }
}
</style>
