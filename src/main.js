import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import useSiteSettingsStore from './stores/siteSettings.store'
import './style.css'

const app = createApp(App)
app.use(router).use(i18n)

const { fetchSettings } = useSiteSettingsStore()

// fetchSettings() catches its own errors internally and never rejects,
// so .finally() always runs and the app always mounts.
fetchSettings().finally(() => {
  app.mount('#app')
})