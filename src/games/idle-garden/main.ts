import { createApp } from 'vue'
import App from './App.vue'
import { AdManager } from '../../services/AdManager'

// Initialize CG/Poki SDK before mounting Vue
const adManager = AdManager.getInstance()
adManager.init()
adManager.initAsync()

createApp(App).mount('#app')
