<template>
  <div class="flex h-screen" style="background-color: var(--color-bg);">
    <AppSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <header
        class="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6"
        style="background-color: var(--color-surface); border-color: var(--color-border);"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--color-primary-light)] active:scale-90 md:hidden"
            style="color: var(--color-text);"
            aria-label="Open menu"
            @click="toggleMobile"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h1 class="text-lg font-semibold" style="color: var(--color-text);">{{ pageTitle }}</h1>
        </div>

        <div class="flex items-center gap-2 md:gap-3">
          <!-- Theme toggle -->
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset transition-all duration-200 hover:scale-105 hover:ring-[var(--color-primary)]/40 active:scale-90"
            style="background-color: var(--color-bg); color: var(--color-text-secondary); --tw-ring-color: var(--color-border);"
            :aria-label="isDark ? $t('theme.switchToLight') : $t('theme.switchToDark')"
            @click="toggleTheme"
          >
            <Transition name="icon-pop" mode="out-in">
              <svg v-if="isDark" key="moon" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
              <svg v-else key="sun" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </Transition>
          </button>

          <!-- Locale toggle -->
          <button
            type="button"
            class="flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset transition-all duration-200 hover:scale-105 hover:ring-[var(--color-primary)]/40 active:scale-90"
            style="background-color: var(--color-bg); color: var(--color-text); --tw-ring-color: var(--color-border);"
            @click="toggleLocale"
          >
            <Transition name="icon-pop" mode="out-in">
              <span :key="locale">{{ locale === 'en' ? 'ខ្មែរ' : 'EN' }}</span>
            </Transition>
          </button>

          <NotificationBell />

          <!-- Avatar / user menu -->
          <div class="relative" ref="menuRef">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-semibold ring-2 ring-transparent transition-all duration-200 hover:scale-105 hover:ring-[var(--color-primary)]/40 active:scale-90"
              style="background-color: var(--color-primary-light); color: var(--color-primary);"
              @click="menuOpen = !menuOpen"
            >
              <img v-if="authState.user?.profilePicture" :src="authState.user.profilePicture" alt="" class="h-full w-full object-cover" />
              <span v-else>{{ initials }}</span>
            </button>

            <transition name="fade-slide">
              <div
                v-if="menuOpen"
                class="absolute right-0 z-50 mt-2 w-52 rounded-xl border py-2 shadow-lg"
                style="background-color: var(--color-surface); border-color: var(--color-border);"
              >
                <div class="border-b px-4 py-2" style="border-color: var(--color-border);">
                  <p class="truncate text-sm font-semibold" style="color: var(--color-text);">{{ displayName }}</p>
                  <p class="text-xs" style="color: var(--color-text-secondary);">{{ authState.user?.role }}</p>
                </div>
                <RouterLink
                  to="/dashboard/profile"
                  class="flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-150 hover:bg-[var(--color-primary-light)]"
                  style="color: var(--color-text);"
                  @click="menuOpen = false"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ $t('userMenu.profile') }}
                </RouterLink>
                <RouterLink
                  to="/dashboard/settings"
                  class="flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-150 hover:bg-[var(--color-primary-light)]"
                  style="color: var(--color-text);"
                  @click="menuOpen = false"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>
                  {{ $t('userMenu.settings') }}
                </RouterLink>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors duration-150 hover:bg-red-50"
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
      </header>

      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <RouterView v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import useAuthStore from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import { useSidebar } from '@/composables/useSidebar'
import { setLocale } from '@/i18n'

const route = useRoute()
const router = useRouter()

const { state: authState, logout } = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const { locale } = useI18n()
const { toggleMobile } = useSidebar()

const menuOpen = ref(false)
const menuRef = ref(null)

const pageTitle = computed(() => {
  const segment = route.path.split('/').filter(Boolean).pop() || 'dashboard'
  return segment.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
})

const displayName = computed(() => {
  const user = authState.user
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim()
  }
  return user?.email || ''
})
const initials = computed(() => {
  const user = authState.user
  const fromName = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')
  return (fromName || user?.email || 'A').slice(0, 2).toUpperCase()
})

function toggleLocale() {
  setLocale(locale.value === 'en' ? 'km' : 'en')
}

function onLogout() {
  menuOpen.value = false
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
  transform: translateY(-4px);
}

.icon-pop-enter-active, .icon-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.icon-pop-enter-from { opacity: 0; transform: scale(0.5) rotate(-30deg); }
.icon-pop-leave-to { opacity: 0; transform: scale(0.5) rotate(30deg); }
</style>