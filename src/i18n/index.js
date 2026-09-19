/*
|--------------------------------------------------------------------------
| File: i18n/index.js
|--------------------------------------------------------------------------
|
| vue-i18n setup. `main.js` already does `import { i18n } from './i18n'`
| and `app.use(i18n)`, so this file's export name/shape matches that.
|
| - Persists the chosen locale in localStorage under 'locale'.
| - `legacy: false` turns on Composition API mode, i.e. `useI18n()` +
|   `const { t } = useI18n()`, which is what VehicleDetail.vue already
|   uses — so this matches that file's assumption exactly.
| - `setLocale()` is what LanguageSwitcher.vue calls; it also updates
|   `<html lang>` for accessibility/SEO and so `:lang(km)` in style.css
|   (the Noto Sans Khmer / Kantumruy Pro font-family switch) kicks in.
|
*/
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import km from './locales/km.json'

const STORAGE_KEY = 'locale'
const SUPPORTED = ['en', 'km']

function getInitialLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return SUPPORTED.includes(saved) ? saved : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, km },
})

export function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

// Make sure <html lang> matches on first load too (SSR-safe no-op if run
// before mount — document is always available in a Vite SPA).
document.documentElement.lang = i18n.global.locale.value