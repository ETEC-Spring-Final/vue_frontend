import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import km from './locales/km.json'

const savedLocale = localStorage.getItem('app_locale') || 'en'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, km },
})

export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('app_locale', locale)
  document.documentElement.setAttribute('lang', locale)
}