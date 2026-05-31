import { createApp } from 'vue'
import { AdManager } from '../../services/AdManager'
import App from './App.vue'
AdManager.getInstance().init()
createApp(App).mount('#app')
