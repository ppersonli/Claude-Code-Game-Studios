import { createApp } from 'vue'
import { AdManager } from '../../services/AdManager'
import App from './App.vue'

// Initialise the CrazyGames SDK wrapper before the Vue app mounts
AdManager.getInstance().init()

createApp(App).mount('#app')
