<template>
  <footer class="border-t transition-colors duration-300" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }">
    <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div class="col-span-2 sm:col-span-1">
          <div class="flex items-center gap-2">
            <img
              v-if="siteSettings.logoUrl"
              :src="siteSettings.logoUrl" :alt="siteSettings.siteName"
              class="h-8 w-8 rounded-lg object-cover"
            />
            <span v-else class="flex h-8 w-8 items-center justify-center rounded-lg" :style="{ backgroundColor: 'var(--color-primary)' }">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 text-white">
                <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
              </svg>
            </span>
            <span class="text-base font-bold" :style="{ color: 'var(--color-text)' }">{{ siteSettings.siteName || $t('footer.defaultSiteName') }}</span>
          </div>
          <p class="mt-3 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
            A small, carefully kept fleet across Phnom Penh.
          </p>

          <!-- Social icons -->
          <div v-if="socials.length" class="mt-4 flex flex-wrap gap-2">
            <a
              v-for="s in socials" :key="s.label" :href="s.href" target="_blank" rel="noopener"
              class="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              :aria-label="s.label"
            >
              <component :is="s.icon" class="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h5 class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">Explore</h5>
          <ul class="mt-3 space-y-2 text-sm">
            <li><RouterLink to="/explore" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">Fleet</RouterLink></li>
            <li><RouterLink to="/favorites" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">Favorites</RouterLink></li>
          </ul>
        </div>

        <div>
          <h5 class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">Account</h5>
          <ul class="mt-3 space-y-2 text-sm">
            <li><RouterLink to="/profile" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">Profile</RouterLink></li>
            <li><RouterLink to="/my-reservations" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">Reservations</RouterLink></li>
            <li><RouterLink to="/my-rentals" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">Rentals</RouterLink></li>
          </ul>
        </div>

        <div>
          <h5 class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">Company</h5>
          <ul class="mt-3 space-y-2 text-sm">
            <li><RouterLink to="/about" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">About us</RouterLink></li>
            <li><RouterLink to="/contact" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">Contact</RouterLink></li>
            <li v-if="siteSettings.contactEmail">
              <a :href="`mailto:${siteSettings.contactEmail}`" class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text)' }">{{ siteSettings.contactEmail }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
        <span>© {{ year }} {{ siteSettings.siteName || $t('footer.defaultSiteName') }}. All rights reserved.</span>
        <div class="flex gap-4">
          <RouterLink to="/about" class="transition-opacity hover:opacity-70">About</RouterLink>
          <RouterLink to="/contact" class="transition-opacity hover:opacity-70">Contact</RouterLink>
        </div>
      </div>
    </div>

    <!-- ===== Floating actions (Telegram chat + scroll-to-top) ===== -->
    <!-- Fixed to the viewport corner so they stay visible while scrolling,
         regardless of where SiteFooter sits in the page. -->
    <div class="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <!-- Telegram floating chat button -->
      <a
        v-if="siteSettings.telegramUrl"
        :href="siteSettings.telegramUrl"
        target="_blank"
        rel="noopener"
        class="group pointer-events-auto flex items-center gap-0 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
        :style="{ backgroundColor: '#229ED9' }"
        aria-label="Chat on Telegram"
        @mouseenter="telegramHover = true"
        @mouseleave="telegramHover = false"
      >
        <!-- Tooltip label — width animates from 0 to auto on hover -->
        <span
          class="max-w-0 overflow-hidden whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300"
          :class="telegramHover ? 'max-w-[160px] px-4 py-3' : 'max-w-0 px-0 py-3'"
          :style="{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
        >
          Chat on Telegram
        </span>
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="h-5 w-5">
            <path d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.9.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.3-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 12.2l-5-1.6c-1.1-.3-1.1-1.1.2-1.6L20.6 3c.9-.3 1.7.2 1.3 1.3Z"/>
          </svg>
        </span>
      </a>

      <!-- Scroll-to-top button -->
      <Transition name="pop">
        <button
          v-if="showScrollTop"
          type="button"
          class="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)', color: '#fff' }"
          aria-label="Scroll to top"
          @click="scrollToTop"
        >
          <!-- Chevron-up icon (intentionally not the diagonal-arrow style) -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 15l6-6 6 6"/>
          </svg>
        </button>
      </Transition>
    </div>
  </footer>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import useSiteSettingsStore from '@/stores/siteSettings.store'
import { useSocialLinks } from '@/composables/useSocialLinks'

// IMPORTANT (per SiteHeader.vue's own fix note): siteSettings.store.js
// exposes a FLAT reactive state — state.siteName, state.logoUrl,
// state.contactEmail — NOT state.settings.siteName. Read it flat here too,
// or this silently regresses to the same "footer never shows real
// branding" bug SiteHeader already had to fix once.
const { state: siteSettings } = useSiteSettingsStore()

const socials = useSocialLinks()

const year = computed(() => new Date().getFullYear())

// ----- Telegram floating button tooltip -----
const telegramHover = ref(false)

// ----- Scroll-to-top floating button -----
const showScrollTop = ref(false)
function onScroll() {
  showScrollTop.value = window.scrollY > 400
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.pop-enter-active, .pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pop-enter-from, .pop-leave-to {
  opacity: 0;
  transform: scale(0.7) translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
</style>