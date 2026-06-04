<script setup lang="ts">
import type { Ingredient } from '@types'
import { blendColors } from '@shared/utils'
import { computed } from 'vue'

const props = defineProps<{
  contents: readonly Ingredient[]
}>()

const cupMaxHeight = 150
const cupWidth = 100

interface LayerInfo {
  ingredient: Ingredient
  height: number
  y: number
  color: string
  isSolid: boolean
}

function getLayers(): LayerInfo[] {
  if (props.contents.length === 0) return []
  
  const layers: LayerInfo[] = []
  const layerHeight = cupMaxHeight / props.contents.length
  const solidTypes = ['topping', 'fruit']
  
  for (let i = 0; i < props.contents.length; i++) {
    const ing = props.contents[i]
    const isSolid = solidTypes.includes(ing.type)
    layers.push({
      ingredient: ing,
      height: layerHeight,
      y: 185 - (i + 1) * layerHeight,
      color: ing.color,
      isSolid,
    })
  }
  return layers
}

function getBlendedColor(layerIndex: number): string {
  const layers = getLayers()
  if (layerIndex === 0) return layers[0].color
  const current = layers[layerIndex].color
  const previous = layers[layerIndex - 1].color
  return blendColors(previous, current, 0.5)
}

const isEmpty = computed(() => props.contents.length === 0)
const fillPercent = computed(() => Math.min((props.contents.length / 6) * 100, 100))

const toppings = () => props.contents.filter(c => c.type === 'topping' || c.type === 'fruit')
</script>

<template>
  <div class="cup-area">
    <div class="cup-spotlight" :class="{ active: !isEmpty }"></div>
    <div class="cup-container" :class="{ empty: isEmpty, filled: !isEmpty }">
      <!-- Cup shadow -->
      <div class="cup-shadow"></div>
      
      <svg viewBox="0 0 160 210" class="cup-svg">
        <defs>
          <!-- Glass gradient -->
          <linearGradient id="cupGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="rgba(255,255,255,0.30)"/>
            <stop offset="40%" stop-color="rgba(255,255,255,0.12)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.20)"/>
          </linearGradient>
          <!-- Glass highlight -->
          <linearGradient id="cupHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(255,255,255,0.5)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
          <!-- Drop shadow filter -->
          <filter id="cupShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.35)"/>
          </filter>
          <!-- Liquid glow -->
          <filter id="liquidGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <!-- Cup clip path -->
          <clipPath id="cupClip">
            <path d="M30,25 L130,25 L122,180 Q121,190 110,190 L50,190 Q39,190 38,180 Z"/>
          </clipPath>
        </defs>

        <!-- Liquid layers -->
        <g v-if="contents.length > 0" clip-path="url(#cupClip)" filter="url(#liquidGlow)">
          <rect
            v-for="(layer, i) in getLayers()"
            :key="'layer-' + i"
            x="30"
            :y="layer.y"
            width="100"
            :height="layer.height + 2"
            :fill="getBlendedColor(i)"
            :opacity="layer.isSolid ? 0.75 : 0.9"
            class="cup-layer"
          />
          <!-- Liquid surface highlight -->
          <rect
            x="30"
            :y="getLayers()[getLayers().length - 1]?.y ?? 185"
            width="100"
            height="3"
            fill="rgba(255,255,255,0.4)"
            class="liquid-surface"
          />
        </g>

        <!-- Empty cup fill guide -->
        <g v-if="isEmpty" clip-path="url(#cupClip)" class="fill-guide">
          <line x1="35" y1="60" x2="125" y2="60" stroke="rgba(255,255,255,0.35)" stroke-width="1" stroke-dasharray="6,4"/>
          <line x1="36" y1="95" x2="124" y2="95" stroke="rgba(255,255,255,0.35)" stroke-width="1" stroke-dasharray="6,4"/>
          <line x1="37" y1="130" x2="123" y2="130" stroke="rgba(255,255,255,0.35)" stroke-width="1" stroke-dasharray="6,4"/>
          <line x1="38" y1="165" x2="122" y2="165" stroke="rgba(255,255,255,0.35)" stroke-width="1" stroke-dasharray="6,4"/>
          <text x="80" y="110" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="13" font-weight="700">TAP BELOW</text>
          <text x="80" y="126" text-anchor="middle" fill="rgba(255,255,255,0.40)" font-size="9" font-weight="500">Select an ingredient</text>
        </g>

        <!-- Cup body (glass) -->
        <path
          d="M30,25 L130,25 L122,180 Q121,190 110,190 L50,190 Q39,190 38,180 Z"
          fill="url(#cupGlass)"
          stroke="rgba(255,255,255,0.7)"
          stroke-width="2.5"
          filter="url(#cupShadow)"
        />
        <!-- Left highlight reflection -->
        <path
          d="M36,30 L42,30 L40,170 Q39,178 42,180 L38,180 Q36,178 36,170 Z"
          fill="url(#cupHighlight)"
          opacity="0.5"
        />
        <!-- Rim -->
        <ellipse cx="80" cy="25" rx="51" ry="7" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
        <!-- Straw -->
        <rect x="70" y="-8" width="5" height="45" rx="2.5" fill="rgba(255,80,80,0.85)" transform="rotate(-8,72,15)"/>
        <rect x="70" y="-8" width="5" height="8" rx="2.5" fill="rgba(255,120,120,0.9)" transform="rotate(-8,72,15)"/>
      </svg>

      <!-- Topping icons floating in cup -->
      <div class="cup-toppings" v-if="toppings().length > 0">
        <img
          v-for="(t, i) in toppings()"
          :key="'topping-' + i"
          :src="t.img"
          :alt="t.name"
          class="cup-topping"
          :style="{ animationDelay: i * 0.25 + 's' }"
        >
      </div>

      <!-- Steam -->
      <div v-if="!isEmpty" class="steam">
        <div class="steam-puff"></div>
        <div class="steam-puff"></div>
        <div class="steam-puff"></div>
      </div>

      <!-- Fill percentage indicator -->
      <div v-if="!isEmpty" class="fill-indicator">
        <div class="fill-bar">
          <div class="fill-bar-inner" :style="{ height: fillPercent + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cup-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 160px;
  max-height: 280px;
}
.cup-spotlight {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  pointer-events: none;
  transition: all 0.5s ease;
}
.cup-spotlight.active {
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, rgba(255,255,255,0.08) 40%, transparent 70%);
}
.cup-container {
  position: relative;
  width: 155px;
  height: 200px;
  transition: transform 0.3s ease;
}
.cup-container.empty {
  animation: cup-idle 3s ease-in-out infinite;
}
.cup-container.filled {
  animation: cup-happy 0.5s ease;
}
@keyframes cup-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes cup-happy {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.cup-shadow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 16px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%);
  border-radius: 50%;
}
.cup-svg {
  width: 100%;
  height: 100%;
}
.cup-layer {
  transition: height 0.5s ease, fill 0.5s ease, y 0.5s ease;
}
.liquid-surface {
  transition: y 0.5s ease;
  animation: surface-shimmer 2s ease-in-out infinite;
}
@keyframes surface-shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.15; }
}
.fill-guide {
  animation: guide-pulse 2s ease-in-out infinite;
}
@keyframes guide-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.cup-toppings {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  max-width: 100px;
}
.cup-topping {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  animation: topping-float 2s ease-in-out infinite;
  border: 2px solid rgba(255,255,255,0.4);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
@keyframes topping-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.steam {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}
.steam-puff {
  width: 8px;
  height: 8px;
  background: rgba(255,255,255,0.5);
  border-radius: 50%;
  animation: steam-rise 2s ease-out infinite;
}
.steam-puff:nth-child(2) { animation-delay: 0.5s; }
.steam-puff:nth-child(3) { animation-delay: 1s; }
@keyframes steam-rise {
  0% { opacity: 0.6; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-35px) scale(2.5); }
}
.fill-indicator {
  position: absolute;
  right: -16px;
  top: 25px;
  bottom: 20px;
  width: 6px;
  display: flex;
  align-items: flex-end;
}
.fill-bar {
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.15);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.fill-bar-inner {
  width: 100%;
  background: linear-gradient(to top, #FFD700, #FFA500);
  border-radius: 3px;
  transition: height 0.5s ease;
  box-shadow: 0 0 6px rgba(255,215,0,0.5);
}
</style>
