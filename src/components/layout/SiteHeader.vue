<template>
  <header
    class="sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300"
    :class="scrolled ? 'shadow-sm' : ''"
    :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
  >
    <div
      class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8"
      :class="scrolled ? 'h-14' : 'h-16'"
    >

      <!-- Logo -->
      <RouterLink to="/" class="group flex shrink-0 items-center gap-2">
        <div class="overflow-hidden rounded-xl transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-3">
          <img
            v-if="siteSettings.logoUrl"
            :src="siteSettings.logoUrl"
            :alt="siteSettings.siteName"
            class="h-9 w-9 object-cover"
          />
          <span
            v-else
            class="flex h-9 w-9 items-center justify-center"
            :style="{ backgroundColor: 'var(--color-primary)' }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-white">
              <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
            </svg>
          </span>
        </div>
        <span
          class="text-lg font-bold tracking-tight transition-colors duration-200 group-hover:text-[var(--color-primary)]"
          :style="{ color: 'var(--color-text)' }"
        >
          {{ siteSettings.siteName || $t('footer.defaultSiteName') }}
        </span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-1 md:flex">
        <RouterLink
          v-for="link in links" :key="link.to" :to="link.to"
          class="group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200"
          :style="{ color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
        >
          <span class="relative z-10 transition-colors duration-200 group-hover:text-[var(--color-primary)]">
            {{ link.label }}
          </span>
          <!-- Hover fill pill (behind text) -->
          <span
            class="absolute inset-0 scale-75 rounded-full opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100"
            :style="{ backgroundColor: 'var(--color-primary-light)' }"
          />
          <!-- Active underline -->
          <span
            class="absolute inset-x-4 -bottom-[1px] z-10 h-0.5 origin-center rounded-full transition-transform duration-200"
            :style="{ backgroundColor: 'var(--color-primary)', transform: isActive(link.to) ? 'scaleX(1)' : 'scaleX(0)' }"
          />
        </RouterLink>
      </nav>

      <!-- Right cluster -->
      <div class="flex items-center gap-2">
        <LanguageSwitcher class="hidden sm:flex" />
        <div class="transition-transform duration-200 hover:scale-110 hover:rotate-12">
          <ThemeToggle />
        </div>

        <NotificationBell v-if="isAuthenticated()" />

        <RouterLink
          v-if="isAuthenticated()"
          to="/profile"
          class="ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-semibold ring-2 ring-transparent transition-all duration-200 hover:scale-110 hover:ring-[var(--color-primary)]"
          :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
        >
          <img
            v-if="state.user?.profilePicture"
            :src="state.user.profilePicture"
            alt=""
            class="h-full w-full object-cover"
          />
          <span v-else>{{ initials }}</span>
        </RouterLink>
        <template v-else>
          <RouterLink
            to="/login"
            class="hidden rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-[var(--color-border)] sm:inline-block"
            :style="{ color: 'var(--color-text)' }"
          >
            {{ $t('nav.login') }}
          </RouterLink>
          <RouterLink
            to="/register"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
            :style="{ backgroundColor: 'var(--color-primary)' }"
          >
            {{ $t('nav.signup') }}
          </RouterLink>
        </template>

        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 md:hidden"
          :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          @click="menuOpen = !menuOpen"
        >
          <span class="relative block h-4 w-5">
            <span
              class="absolute left-0 top-0 h-[1.8px] w-5 rounded-full bg-current transition-all duration-300"
              :style="menuOpen ? 'transform: translateY(7px) rotate(45deg);' : ''"
            />
            <span
              class="absolute left-0 top-1/2 h-[1.8px] w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-200"
              :style="menuOpen ? 'opacity: 0;' : 'opacity: 1;'"
            />
            <span
              class="absolute bottom-0 left-0 h-[1.8px] w-5 rounded-full bg-current transition-all duration-300"
              :style="menuOpen ? 'transform: translateY(-7px) rotate(-45deg);' : ''"
            />
          </span>
        </button>
      </div>
    </div>

    <!-- Mobile nav sheet -->
    <Transition name="sheet">
      <nav
        v-if="menuOpen"
        class="border-t px-4 py-3 md:hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <RouterLink
          v-for="(link, i) in links" :key="link.to" :to="link.to"
          class="block translate-x-0 rounded-xl px-3 py-2.5 text-sm font-semibold opacity-100 transition-all duration-200"
          :style="{
            color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text)',
            backgroundColor: isActive(link.to) ? 'var(--color-primary-light)' : 'transparent',
            animation: `slideIn 0.25s ease-out ${i * 0.05}s both`,
          }"
          @click="menuOpen = false"
        >
          {{ link.label }}
        </RouterLink>
        <div class="mt-2 flex items-center justify-between px-3 py-1">
          <LanguageSwitcher />
        </div>
      </nav>
    </Transition>
  </header>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import useAuthStore from '@/stores/auth.store'
import useSiteSettingsStore from '@/stores/siteSettings.store'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'

const route = useRoute()
const { t } = useI18n()
const { state, isAuthenticated } = useAuthStore()
const { state: siteSettings } = useSiteSettingsStore()

const menuOpen = ref(false)

// NEW: shrinks header height + adds a shadow once the page is scrolled,
// so the header feels alive rather than a static bar.
const scrolled = ref(false)
function onScroll() {
  scrolled.value = window.scrollY > 8
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const links = computed(() => [
  { to: '/', label: t('nav.home') },
  { to: '/explore', label: t('nav.explore') },
  { to: '/favorites', label: t('nav.favorites') },
  { to: '/about', label: t('nav.about') },
  { to: '/contact', label: t('nav.contact') },
])

function isActive(path) {
  return route.path === path
}

const initials = computed(() => (state.user?.email?.slice(0, 2) ?? '??').toUpperCase())
</script>

<style scoped>
.sheet-enter-active, .sheet-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease, max-height 0.25s ease;
  overflow: hidden;
}
.sheet-enter-from, .sheet-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.sheet-enter-to, .sheet-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 400px;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
</style>