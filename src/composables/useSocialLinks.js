import { computed, h } from 'vue'
import useSiteSettingsStore from '@/stores/siteSettings.store'

const fillIcon = (path) => ({ render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [h('path', { d: path })]) })
const strokeIcon = (path) => ({ render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none' }, [h('path', { stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: path })]) })

// Confirmed against SiteSettings.java / SiteSettingsResponseDTO.java —
// the backend has 7 link fields. Keep this list in sync if a column is
// ever added/removed on SiteSettings.
const PLATFORMS = [
  { key: 'facebookUrl', label: 'Facebook', icon: fillIcon('M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z') },
  { key: 'telegramUrl', label: 'Telegram', icon: fillIcon('M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.9.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.3-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 12.2l-5-1.6c-1.1-.3-1.1-1.1.2-1.6L20.6 3c.9-.3 1.7.2 1.3 1.3Z') },
  { key: 'instagramUrl', label: 'Instagram', icon: fillIcon('M12 2c2.7 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.55.55.89 1.11 1.15 1.77.25.64.42 1.37.47 2.43C21.99 8.94 22 9.3 22 12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.37.42-2.43.47C15.06 21.99 14.7 22 12 22s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.7 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45.53C6.09.28 6.82.11 7.88.06 8.94.01 9.3 0 12 0Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.4 4.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z') },
  { key: 'tiktokUrl', label: 'TikTok', icon: fillIcon('M16.5 2h-3v13.5a3 3 0 1 1-2.6-3v-3a6 6 0 1 0 5.6 6V8.5a7 7 0 0 0 4 1.3v-3a4 4 0 0 1-4-4Z') },
  { key: 'whatsappUrl', label: 'WhatsApp', icon: fillIcon('M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.3-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.2 1-2.5c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.2-.3.3-.1.6.2.3.9 1.5 2 2.4 1.3 1.2 2.4 1.5 2.8 1.7.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.9.3.1.4.2.5.3.1.2.1.9-.1 1.6Z') },
  { key: 'linkedinUrl', label: 'LinkedIn', icon: fillIcon('M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 8.5h4V21H3V8.5Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-6.1c0-1.46-.03-3.34-2.04-3.34-2.04 0-2.36 1.6-2.36 3.24V21h-4V8.5Z') },
  { key: 'websiteUrl', label: 'Website', icon: strokeIcon('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18') },
]

/**
 * Returns a reactive list of only the social/link platforms that have a
 * URL configured in siteSettings — an unset field simply doesn't render
 * an icon, rather than showing a dead "#" link.
 */
export function useSocialLinks() {
  const { state: siteSettings } = useSiteSettingsStore()
  return computed(() =>
    PLATFORMS
      .map((p) => ({ label: p.label, icon: p.icon, href: siteSettings[p.key] }))
      .filter((p) => p.href)
  )
}