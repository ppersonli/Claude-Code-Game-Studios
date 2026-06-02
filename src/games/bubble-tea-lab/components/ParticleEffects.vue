<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'spark' | 'star' | 'rainbow' | 'gold'
}

const props = defineProps<{
  active: boolean
  combo: number
}>()

const particles = ref<Particle[]>([])
let animationId: number | null = null
let particleId = 0

function createParticle(type: Particle['type'], x: number, y: number): Particle {
  const colors = {
    spark: ['#FFD700', '#FFA500', '#FF6347'],
    star: ['#FFFFFF', '#FFD700', '#FFE4B5'],
    rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
    gold: ['#FFD700', '#FFA500', '#FFEC8B'],
  }
  
  const color = colors[type][Math.floor(Math.random() * colors[type].length)]
  const angle = Math.random() * Math.PI * 2
  const speed = Math.random() * 3 + 1
  
  return {
    id: ++particleId,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2,
    life: 1.0,
    maxLife: 60 + Math.random() * 30,
    color,
    size: Math.random() * 8 + 4,
    type,
  }
}

function spawnParticles() {
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  
  const count = Math.min(props.combo * 10, 100)
  
  for (let i = 0; i < count; i++) {
    const type = props.combo >= 13 ? 'gold' : 
                 props.combo >= 9 ? 'gold' : 
                 props.combo >= 6 ? 'star' : 
                 props.combo >= 4 ? 'rainbow' : 'spark'
    
    particles.value.push(createParticle(type, centerX, centerY))
  }
}

function updateParticles() {
  particles.value = particles.value.filter(p => {
    p.life -= 1 / p.maxLife
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.1 // gravity
    return p.life > 0
  })
}

function animate() {
  if (!props.active) return
  
  updateParticles()
  animationId = requestAnimationFrame(animate)
}

// Watch for combo changes
import { watch } from 'vue'
watch(() => props.combo, (newCombo, oldCombo) => {
  if (newCombo > oldCombo && newCombo > 1) {
    spawnParticles()
    if (!animationId) {
      animate()
    }
  }
})

onMounted(() => {
  if (props.active) {
    animate()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div class="particle-system">
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="particle"
      :class="`particle-${particle.type}`"
      :style="{
        left: particle.x + 'px',
        top: particle.y + 'px',
        width: particle.size + 'px',
        height: particle.size + 'px',
        backgroundColor: particle.color,
        opacity: particle.life,
        transform: `scale(${particle.life})`,
      }"
    />
  </div>
</template>

<style scoped>
.particle-system {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 150;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.particle-spark {
  box-shadow: 0 0 10px currentColor;
}

.particle-star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.particle-rainbow {
  box-shadow: 0 0 15px currentColor;
}

.particle-gold {
  box-shadow: 0 0 20px currentColor;
  animation: gold-pulse 0.5s ease-in-out infinite;
}

@keyframes gold-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>
