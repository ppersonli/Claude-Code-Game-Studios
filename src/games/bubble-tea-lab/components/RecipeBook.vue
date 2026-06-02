<script setup lang="ts">
import { computed } from 'vue'
import { ALL_RECIPES, loadRecipeBook, type RecipeEntry } from '../data/recipes'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const recipeBook = loadRecipeBook()

const unlockedCount = computed(() => {
  return Object.keys(recipeBook).length
})

const totalCount = ALL_RECIPES.length

const progressPercent = computed(() => {
  return Math.round((unlockedCount.value / totalCount) * 100)
})

function isUnlocked(recipe: RecipeEntry): boolean {
  return !!recipeBook[recipe.id]
}

function getCategoryIcon(category: RecipeEntry['category']): string {
  switch (category) {
    case 'basic': return '🧋'
    case 'creative': return '🍹'
    case 'secret': return '⭐'
    case 'seasonal': return '🎄'
    default: return '📖'
  }
}

function getCategoryName(category: RecipeEntry['category']): string {
  switch (category) {
    case 'basic': return '基础奶茶'
    case 'creative': return '创意特调'
    case 'secret': return '隐藏配方'
    case 'seasonal': return '季节限定'
    default: return '未知'
  }
}

const groupedRecipes = computed(() => {
  const groups: Record<string, RecipeEntry[]> = {
    basic: [],
    creative: [],
    secret: [],
    seasonal: [],
  }
  
  for (const recipe of ALL_RECIPES) {
    groups[recipe.category].push(recipe)
  }
  
  return groups
})
</script>

<template>
  <div v-if="visible" class="recipe-book-overlay" @click="emit('close')">
    <div class="recipe-book" @click.stop>
      <div class="book-header">
        <h2>📖 配方图鉴</h2>
        <button class="btn-close" @click="emit('close')">✕</button>
      </div>
      
      <div class="progress-bar">
        <div class="progress-text">
          收集进度: {{ unlockedCount }}/{{ totalCount }} ({{ progressPercent }}%)
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
      </div>
      
      <div class="recipe-categories">
        <div v-for="(recipes, category) in groupedRecipes" :key="category" class="category-section">
          <h3>{{ getCategoryIcon(category as RecipeEntry['category']) }} {{ getCategoryName(category as RecipeEntry['category']) }}</h3>
          <div class="recipe-grid">
            <div
              v-for="recipe in recipes"
              :key="recipe.id"
              class="recipe-card"
              :class="{ unlocked: isUnlocked(recipe), secret: recipe.isSecret && !isUnlocked(recipe) }"
            >
              <div v-if="isUnlocked(recipe)" class="recipe-content">
                <div class="recipe-icon">{{ getCategoryIcon(recipe.category) }}</div>
                <div class="recipe-name">{{ recipe.name }}</div>
                <div class="recipe-ingredients">
                  {{ recipe.ingredients.join(' + ') }}
                </div>
                <div v-if="recipeBook[recipe.id]" class="recipe-stats">
                  制作次数: {{ recipeBook[recipe.id].timesMade }}
                </div>
              </div>
              <div v-else class="recipe-locked">
                <div class="locked-icon">?</div>
                <div class="locked-text">{{ recipe.isSecret ? '隐藏配方' : '未解锁' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recipe-book-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.recipe-book {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  color: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.book-header h2 {
  font-size: 1.8em;
  margin: 0;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  font-size: 1.5em;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.progress-bar {
  margin-bottom: 24px;
}

.progress-text {
  font-size: 0.9em;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
}

.progress-track {
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.recipe-categories {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.category-section h3 {
  font-size: 1.3em;
  margin-bottom: 12px;
  color: #FFD700;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.recipe-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.recipe-card.unlocked {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
}

.recipe-card.secret {
  background: rgba(100, 100, 255, 0.2);
  border-color: rgba(100, 100, 255, 0.5);
}

.recipe-content {
  text-align: center;
  width: 100%;
}

.recipe-icon {
  font-size: 2em;
  margin-bottom: 8px;
}

.recipe-name {
  font-size: 0.9em;
  font-weight: bold;
  margin-bottom: 6px;
  color: #FFD700;
}

.recipe-ingredients {
  font-size: 0.7em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
}

.recipe-stats {
  font-size: 0.65em;
  color: rgba(255, 255, 255, 0.6);
}

.recipe-locked {
  text-align: center;
  opacity: 0.5;
}

.locked-icon {
  font-size: 2.5em;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.3);
}

.locked-text {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.5);
}
</style>
