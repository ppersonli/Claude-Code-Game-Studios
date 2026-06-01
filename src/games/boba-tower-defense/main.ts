import { createApp } from 'vue'
import { AdManager } from '../../services/AdManager'
import App from './App.vue'
const adManager = AdManager.getInstance()
adManager.init()
adManager.initAsync()
createApp(App).mount('#app')
