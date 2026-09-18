<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t backdrop-blur-md sm:hidden"
    :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom)' }"
  >
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-transform duration-200 active:scale-90"
    >
      <span
        v-if="isActive(item)"
        class="absolute top-0 h-0.5 w-8 rounded-full transition-all duration-300"
        :style="{ backgroundColor: 'var(--color-primary)' }"
      />
      <component
        :is="item.icon"
        class="h-5 w-5 transition-all duration-200"
        :style="{ color: isActive(item) ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
      />
      <span
        class="text-[11px] font-medium transition-colors duration-200"
        :style="{ color: isActive(item) ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
      >
        {{ item.label }}
      </span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed, h } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import useAuthStore from '@/stores/auth.store'

const route = useRoute()
const { t } = useI18n()
const { isAuthenticated } = useAuthStore()

// Simple inline icon renderers so this file has zero external icon
// dependency (matches the stroke-based icon style used elsewhere).
function icon(paths) {
  return () =>
    h(
      'svg',
      { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      paths.map((d) => h('path', { stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d }))
    )
}

const IconHome = icon(['M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z'])
const IconExplore = icon(['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm15 9-2 5-5 2 2-5z'])
const IconBooking = icon(['M4 7.5h16M7 4v3m10-3v3M5.5 6.5h13a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z', 'M8 12h2m4 0h2M8 15.5h2m4 0h2'])
const IconFavorites = icon(['M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z'])
const IconProfile = icon(['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4.5 20a7.5 7.5 0 0 1 15 0'])

const navItems = computed(() => [
  { name: 'home', to: '/home', icon: IconHome, label: t('nav.home') },
  { name: 'explore', to: '/explore', icon: IconExplore, label: t('nav.explore') },
  {
    name: 'bookings',
    to: isAuthenticated() ? '/my-reservations' : { path: '/login', query: { redirect: '/my-reservations' } },
    icon: IconBooking,
    label: t('nav.bookings'),
  },
  { name: 'favorites', to: '/favorites', icon: IconFavorites, label: t('nav.favorites') },
  {
    name: 'profile',
    to: isAuthenticated() ? '/profile' : { path: '/login', query: { redirect: '/profile' } },
    icon: IconProfile,
    label: t('nav.profile'),
  },
])

function isActive(item) {
  const target = typeof item.to === 'string' ? item.to : item.to.path
  return route.path === target || route.path.startsWith(`${target}/`)
}
</script>