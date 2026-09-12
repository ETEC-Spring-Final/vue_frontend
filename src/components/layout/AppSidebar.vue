<template>
  <!-- Mobile backdrop -->
  <transition name="fade">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-30 bg-black/40 md:hidden"
      @click="closeMobile"
    ></div>
  </transition>

  <aside
    class="fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r transition-all duration-300 ease-in-out md:static"
    :class="[
      collapsed ? 'w-20' : 'w-64',
      mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ]"
    style="background-color: var(--color-surface); border-color: var(--color-border);"
  >
    <div class="flex h-16 items-center justify-between px-4">
      <RouterLink to="/dashboard" class="flex min-w-0 items-center gap-2" @click="closeMobile">
        <img
          v-if="logoUrl && !logoError"
          :src="logoUrl"
          alt="CarRental Admin"
          class="h-8 w-8 shrink-0 rounded-lg object-cover"
          @error="logoError = true"
        />
        <span
          v-else
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style="background-color: var(--color-primary);"
        >CR</span>
        <span v-if="!collapsed" class="text-lg font-bold truncate" style="color: var(--color-text);">
          CarRental Admin
        </span>
      </RouterLink>

      <button
        type="button"
        class="ml-auto hidden h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-primary-light)] md:flex"
        @click="toggleCollapsed"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <svg class="h-4 w-4 transition-transform duration-300" :class="{ 'rotate-180': collapsed }" style="color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        class="ml-auto flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--color-primary-light)] md:hidden"
        @click="closeMobile"
        aria-label="Close menu"
      >
        <svg class="h-5 w-5" style="color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.path"
        :to="item.path"
        class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 hover:translate-x-0.5"
        :class="isActive(item.path) ? 'font-semibold' : ''"
        :style="isActive(item.path)
          ? `background-color: var(--color-primary-light); color: var(--color-primary);`
          : `color: var(--color-text-secondary);`"
        @click="closeMobile"
      >
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-110"
          v-html="item.icon"
        ></span>
        <span v-if="!collapsed" class="truncate">{{ $t(`sidebar.${item.key}`) }}</span>
        <span
          v-if="isActive(item.path)"
          class="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
          style="background-color: var(--color-primary);"
        ></span>
      </RouterLink>
    </nav>

    <div class="border-t px-3 py-3" style="border-color: var(--color-border);">
      <div class="relative" ref="menuRef">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--color-primary-light)]"
          @click="menuOpen = !menuOpen"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
            style="background-color: var(--color-primary-light); color: var(--color-primary);"
          >
            <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" class="h-full w-full object-cover" />
            <span v-else>{{ initials }}</span>
          </span>

          <div v-if="!collapsed" class="min-w-0 flex-1 text-left">
            <p class="truncate text-sm font-semibold" style="color: var(--color-text);">{{ user?.name || user?.email || 'Admin' }}</p>
            <p class="truncate text-xs" style="color: var(--color-text-secondary);">{{ user?.role }}</p>
          </div>

          <svg v-if="!collapsed" class="h-4 w-4 shrink-0" style="color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </button>

        <transition name="fade-slide">
          <div
            v-if="menuOpen && !collapsed"
            class="absolute bottom-full left-0 mb-2 w-full rounded-xl border py-2 shadow-lg z-50"
            style="background-color: var(--color-surface); border-color: var(--color-border);"
          >
            <RouterLink
              to="/dashboard/profile"
              class="flex items-center gap-2 px-4 py-2 text-sm transition hover:opacity-70"
              style="color: var(--color-text);"
              @click="menuOpen = false; closeMobile()"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ $t('userMenu.profile') }}
            </RouterLink>
            <button
              type="button"
              class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:opacity-70"
              style="color: #DC2626;"
              @click="onLogout"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
              {{ $t('userMenu.logout') }}
            </button>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth.store'
import { useSidebar } from '@/composables/useSidebar'

const route = useRoute()
const router = useRouter()
const { user, hasRole, logout } = useAuthStore()
const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar()

const menuOpen = ref(false)
const menuRef = ref(null)
const logoError = ref(false)

// Dynamic logo: put your file at public/logo.png (works immediately), or
// set VITE_APP_LOGO_URL in .env to point at a CDN/uploaded logo without
// a rebuild. Falls back to the "CR" badge automatically if the URL 404s.
const logoUrl = computed(() => import.meta.env.VITE_APP_LOGO_URL || '/logo.png')

const initials = computed(() => (user?.name || user?.email || 'A').slice(0, 2).toUpperCase())

const icon = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  vehicles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13l2-6h14l2 6"/><path d="M5 13h14v5H5z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>',
  locations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  reservations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  rentals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16V8a2 2 0 012-2h5l2 3h5a2 2 0 012 2v5"/><path d="M4 16h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"/></svg>',
  customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15 14.5c2.7.4 4.5 2.4 4.5 5.5"/></svg>',
  discounts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12l-8 8-9-9V4h7l10 8z"/><circle cx="7.5" cy="7.5" r="1"/></svg>',
  invoices: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l3 3v17H6z"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>',
  reviews: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19.6l1-5.8-4.2-4.1 5.9-.9L12 3Z"/></svg>',
  notifications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 004 0"/></svg>',
  maintenance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.8 2.8-2-2 2.8-2.8z"/></svg>',
  services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  auditLogs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2h6l4 4v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M9 11l2 2 4-4"/></svg>',
  loginHistory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
}

const navItems = [
  { path: '/dashboard', key: 'dashboard', icon: icon.dashboard },
  { path: '/dashboard/vehicles', key: 'vehicles', icon: icon.vehicles },
  { path: '/dashboard/locations', key: 'locations', icon: icon.locations },
  { path: '/dashboard/reservations', key: 'reservations', icon: icon.reservations },
  { path: '/dashboard/rentals', key: 'rentals', icon: icon.rentals },
  { path: '/dashboard/customers', key: 'customers', icon: icon.customers, roles: ['ADMIN'] },
  { path: '/dashboard/discounts', key: 'discounts', icon: icon.discounts, roles: ['ADMIN'] },
  { path: '/dashboard/invoices', key: 'invoices', icon: icon.invoices },
  { path: '/dashboard/reviews', key: 'reviews', icon: icon.reviews },
  { path: '/dashboard/notifications', key: 'notifications', icon: icon.notifications },
  { path: '/dashboard/maintenance', key: 'maintenance', icon: icon.maintenance },
  { path: '/dashboard/services', key: 'services', icon: icon.services },
  { path: '/dashboard/audit-logs', key: 'auditLogs', icon: icon.auditLogs, roles: ['ADMIN', 'MANAGER'] },
  { path: '/dashboard/login-history', key: 'loginHistory', icon: icon.loginHistory, roles: ['ADMIN', 'MANAGER'] },
]

const visibleItems = computed(() => navItems.filter((item) => !item.roles || hasRole(...item.roles)))

function isActive(path) {
  return route.path === path
}

function onLogout() {
  menuOpen.value = false
  closeMobile()
  logout()
  router.push('/login')
}

function onClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>