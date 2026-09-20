import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import useSiteSettingsStore from './stores/siteSettings.store'
import useAuthStore from './stores/auth.store'   // ➕ បន្ថែម
import './style.css'

const app = createApp(App)
app.use(router).use(i18n)

const { fetchSettings } = useSiteSettingsStore()
const { fetchProfile } = useAuthStore()          // ➕ បន្ថែម

// ទាំងពីរនេះ catch error ខាងក្នុងរួចហើយ (មិន reject) ដូច្នេះ Promise.all() មិនធ្លាក់ទេ
Promise.all([fetchSettings(), fetchProfile()]).finally(() => {
  app.mount('#app')
})