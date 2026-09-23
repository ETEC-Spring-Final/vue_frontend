/*
|--------------------------------------------------------------------------
| File: stores/siteSettings.store.js
|--------------------------------------------------------------------------
|
| Description:
| Lightweight reactive store for site-wide branding/contact settings
| (site name, logo, favicon, login background, contact info). Fetched once
| on app load in main.js so the logo/name are available before the
| header/login render.
|
| Notes:
| - GET /api/settings is public, so this fetch works for logged-out users too.
| - fetchSettings() is safe to call again after an admin saves changes in
|   Settings.vue, to refresh the shared state everywhere it's used.
|
*/

import { reactive } from 'vue'
import { getSiteSettings } from '@/services/siteSettings.service'

const state = reactive({
  id: null,
  siteName: 'null',
  logoUrl: '',
  faviconUrl: '',
  authBackgroundUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  facebookUrl: '',
  telegramUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  whatsappUrl: '',
  linkedinUrl: '',
  websiteUrl: '',
  loaded: false,
})

function applyFavicon() {
  if (!state.faviconUrl) return
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = state.faviconUrl
}

/**
 * Fetch settings from the backend and merge into shared reactive state.
 * Called once in main.js on app boot, and again after Settings.vue saves.
 */
async function fetchSettings() {
  try {
    const data = await getSiteSettings()
    Object.assign(state, data)
    state.loaded = true
    applyFavicon()
    return state
  } catch (err) {
    console.error('Failed to fetch site settings:', err)
    // keep defaults (siteName: 'CarRental', etc.) so UI doesn't break
    return null
  }
}

export default function useSiteSettingsStore() {
  return { state, fetchSettings }
}