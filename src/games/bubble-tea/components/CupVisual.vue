<script setup lang="ts">
import type { Ingredient } from '@types'
import { blendColors } from '@shared/utils'

const props = defineProps<{
  contents: readonly Ingredient[]
}>()

const cupMaxHeight = 140

function getFillColor(): string {
  const tea = props.contents.find(c => c.type === 'tea')
  const liquid = props.contents.find(c => c.type === 'liquid')
  if (liquid && tea) return blendColors(tea.color, liquid.color, 0.5)
  return tea?.color ?? liquid?.color ?? '#D7CCC8'
}

function getFillHeight(): number {
  return Math.min(props.contents.length * 22, cupMaxHeight)
}

function getFillY(): number {
  return 175 - getFillHeight()
}

const toppings = () => props.contents.filter(c => c.type === 'topping' || c.type === 'fruit')
</script>

<template>
  <div class="cup-container">
    <svg viewBox="0 0 120 200" class="cup-svg">
      <defs>
        <clipPath id="cup-clip">
          <path d="M20,10 L100,10 L90,180 Q85,195 60,195 Q35,195 30,180 Z" />
        </clipPath>
      </defs>
      <!-- Cup body -->
      <path
        d="M20,10 L100,10 L90,180 Q85,195 60,195 Q35,195 30,180 Z"
        fill="rgba(255,255,255,0.3)"
        stroke="rgba(255,255,255,0.6)"
        stroke-width="2"
      />
      <!-- Liquid fill -->
      <rect
        v-if="contents.length > 0"
        x="0"
        :y="getFillY()"
        width="120"
        :height="getFillHeight()"
        :fill="getFillColor()"
        clip-path="url(#cup-clip)"
        class="cup-fill"
      />
      <!-- Toppings -->
      <image
        v-for="(t, i) in toppings()"
        :key="i"
        :href="t.img"
        :x="35 + (i % 3) * 20"
        :y="160 - Math.floor(i / 3) * 20"
        width="24"
        height="24"
        clip-path="url(#cup-clip)"
      />
    </svg>
    <!-- Steam -->
    <div v-if="contents.length > 0" class="steam">
      <span>~</span><span>~</span><span>~</span>
    </div>
  </div>
</template>

<style scoped>
.cup-container {
  position: relative;
  display: flex;
  justify-content: center;
}
.cup-svg {
  width: 120px;
  height: 200px;
}
.cup-fill {
  transition: height 0.3s, y 0.3s, fill 0.3s;
}
.steam {
  position: absolute;
  top: -20px;
  display: flex;
  gap: 8px;
  font-size: 18px;
  color: rgba(255,255,255,0.6);
}
.steam span {
  animation: steam-rise 1.5s ease-in-out infinite;
}
.steam span:nth-child(2) { animation-delay: 0.3s; }
.steam span:nth-child(3) { animation-delay: 0.6s; }
@keyframes steam-rise {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(-8px); opacity: 1; }
}
</style>
