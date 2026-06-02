<script setup lang="ts">
import type { Ingredient } from '@types'
import { blendColors } from '@shared/utils'

const props = defineProps<{
  contents: readonly Ingredient[]
}>()

const cupMaxHeight = 140
const cupWidth = 90

/**
 * 计算每一层的显示信息
 * 按照倒入顺序从底到顶分层显示
 */
interface LayerInfo {
  ingredient: Ingredient
  height: number
  y: number
  color: string
  isSolid: boolean // 是否是固体配料(珍珠/椰果等)
}

function getLayers(): LayerInfo[] {
  if (props.contents.length === 0) return []
  
  const layers: LayerInfo[] = []
  const layerHeight = cupMaxHeight / props.contents.length
  
  // 固体配料类型
  const solidTypes = ['topping', 'fruit']
  
  for (let i = 0; i < props.contents.length; i++) {
    const ing = props.contents[i]
    const isSolid = solidTypes.includes(ing.type)
    
    layers.push({
      ingredient: ing,
      height: layerHeight,
      y: 175 - (i + 1) * layerHeight,
      color: ing.color,
      isSolid,
    })
  }
  
  return layers
}

/**
 * 获取混合后的液体颜色
 * 相邻层颜色做线性插值
 */
function getBlendedColor(layerIndex: number): string {
  const layers = getLayers()
  if (layerIndex === 0) return layers[0].color
  
  const current = layers[layerIndex].color
  const previous = layers[layerIndex - 1].color
  return blendColors(previous, current, 0.5)
}

/**
 * 获取液体填充的总高度
 */
function getTotalFillHeight(): number {
  return Math.min(props.contents.length * 22, cupMaxHeight)
}

function getFillY(): number {
  return 175 - getTotalFillHeight()
}

const toppings = () => props.contents.filter(c => c.type === 'topping' || c.type === 'fruit')
</script>

<template>
  <div class="cup-area">
    <div class="cup-container">
      <svg viewBox="0 0 140 180" class="cup-svg">
        <defs>
          <linearGradient id="cupGradLab" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.08)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.15)"/>
          </linearGradient>
          <clipPath id="cupClipLab">
            <path d="M25,20 L115,20 L108,165 Q107,175 97,175 L43,175 Q33,175 32,165 Z"/>
          </clipPath>
        </defs>
        
        <!-- 分层液体显示 -->
        <g v-if="contents.length > 0" clip-path="url(#cupClipLab)">
          <rect
            v-for="(layer, i) in getLayers()"
            :key="'layer-' + i"
            x="25"
            :y="layer.y"
            width="90"
            :height="layer.height + 1"
            :fill="getBlendedColor(i)"
            :opacity="layer.isSolid ? 0.6 : 0.8"
            class="cup-layer"
          />
        </g>
        
        <!-- 传统液体填充(兼容旧版) -->
        <rect
          v-if="contents.length === 0"
          clip-path="url(#cupClipLab)"
          x="25"
          :y="getFillY()"
          width="90"
          :height="getTotalFillHeight()"
          fill="#D7CCC8"
          opacity="0.8"
          class="cup-fill"
        />
        
        <!-- Cup body -->
        <path
          d="M25,20 L115,20 L108,165 Q107,175 97,175 L43,175 Q33,175 32,165 Z"
          fill="url(#cupGradLab)"
          stroke="rgba(255,255,255,0.3)"
          stroke-width="2"
        />
        <!-- Rim -->
        <ellipse cx="70" cy="20" rx="46" ry="6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <!-- Straw -->
        <rect x="62" y="-5" width="4" height="35" rx="2" fill="rgba(255,100,100,0.7)" transform="rotate(-10,64,15)"/>
      </svg>
      
      <!-- 固体配料叠加显示 -->
      <div class="cup-toppings">
        <img
          v-for="(t, i) in toppings()"
          :key="'topping-' + i"
          :src="t.img"
          :alt="t.name"
          class="cup-topping"
          :style="{ animationDelay: i * 0.2 + 's' }"
        >
      </div>
      
      <!-- 蒸汽 -->
      <div v-if="contents.length > 0" class="steam">
        <div class="steam-puff"></div>
        <div class="steam-puff"></div>
        <div class="steam-puff"></div>
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
}
.cup-container {
  position: relative;
  width: 130px;
  height: 170px;
}
.cup-svg {
  width: 100%;
  height: 100%;
}
.cup-layer {
  transition: height 0.5s ease, fill 0.5s ease, y 0.5s ease;
}
.cup-fill {
  transition: height 0.5s ease, fill 0.5s ease, y 0.5s ease;
}
.cup-toppings {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  max-width: 90px;
}
.cup-topping {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  animation: float 2s ease-in-out infinite;
  border: 1px solid rgba(255,255,255,0.3);
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.steam {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 7px;
}
.steam-puff {
  width: 7px;
  height: 7px;
  background: rgba(255,255,255,0.4);
  border-radius: 50%;
  animation: steam-rise 2s ease-out infinite;
}
.steam-puff:nth-child(2) { animation-delay: 0.5s; }
.steam-puff:nth-child(3) { animation-delay: 1s; }
@keyframes steam-rise {
  0% { opacity: 0.6; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-30px) scale(2); }
}
</style>
