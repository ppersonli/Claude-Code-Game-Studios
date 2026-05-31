import { createApp } from 'vue'
import { AdManager } from '../../services/AdManager'
import App from './App.vue'

const adManager = AdManager.getInstance()
adManager.init()
// Async platform detection (Poki/CrazyGames) — non-blocking
adManager.initAsync()

createApp(App).mount('#app')
