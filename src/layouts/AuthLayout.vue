<template>
  <div class="relative flex min-h-screen w-full overflow-hidden lg:block" :style="{ backgroundColor: 'var(--color-bg)' }">

    <!-- Brand panel — slides between left half (login) and right half (register) -->
    <div
      class="slide-panel hidden flex-col justify-between overflow-hidden bg-[#1A2036] p-10 text-white lg:absolute lg:inset-y-0 lg:flex lg:w-1/2"
      :class="mode === 'login' ? 'role-brand-login' : 'role-brand-register'"
    >
      <!-- Background photo: comes from Admin > Site settings (authBackgroundUrl),
           falls back to /public/images/auth-bg.jpg when the admin has not set one
           or when the photo cannot be loaded. -->
      <div class="absolute inset-0 bg-cover bg-center" :style="bgStyle"></div>

      <!-- Light overlay only: keeps the photo clearly visible, and darkens just enough
           at the top (logo) and bottom (headline) so the white text stays readable. -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40"></div>

      <div class="relative z-10">
        <RouterLink to="/home" class="flex items-center gap-2 text-lg font-bold drop-shadow">
          <span class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/15 backdrop-blur">
            <img v-if="siteSettings.logoUrl" :src="siteSettings.logoUrl" :alt="t('auth.logoAlt')" class="h-full w-full object-cover" />
            <svg v-else viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-white">
              <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
            </svg>
          </span>
          {{ siteSettings.siteName || t('footer.defaultSiteName') }}
        </RouterLink>
      </div>

      <!-- Bottom block (like the reference): headline + subtitle + stats -->
      <div class="relative z-10">
        <transition name="brand-text" mode="out-in">
          <div :key="mode">
            <h2 class="text-4xl font-extrabold leading-tight drop-shadow-lg">
              {{ mode === 'login' ? t('auth.brandWelcomeTitle') : t('auth.brandJoinTitle') }}
            </h2>
            <p class="mt-3 max-w-sm text-sm text-white/85 drop-shadow">
              {{ mode === 'login' ? t('auth.brandLoginSub') : t('auth.brandRegisterSub') }}
            </p>
          </div>
        </transition>

        <div class="mt-8 flex gap-8">
          <div><p class="text-2xl font-bold">500+</p><p class="text-xs text-white/75">{{ t('auth.brandVehicles') }}</p></div>
          <div><p class="text-2xl font-bold">24/7</p><p class="text-xs text-white/75">{{ t('auth.brandSupport') }}</p></div>
          <div><p class="text-2xl font-bold">100%</p><p class="text-xs text-white/75">{{ t('auth.brandSecure') }}</p></div>
        </div>
      </div>
    </div>

    <!-- Form panel — slides between right half (login) and left half (register) -->
    <div
      class="slide-panel flex w-full flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:absolute lg:inset-y-0 lg:w-1/2 lg:px-16"
      :class="mode === 'login' ? 'role-form-login' : 'role-form-register'"
      :style="{ backgroundColor: 'var(--color-bg)' }"
    >
      <div class="mx-auto w-full max-w-sm">
        <transition name="form-slide-up" mode="out-in">
          <LoginForm v-if="mode === 'login'" key="login" />
          <RegisterForm v-else key="register" />
        </transition>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import useSiteSettingsStore from '@/stores/siteSettings.store'
import LoginForm from '@/pages/auth/LoginForm.vue'
import RegisterForm from '@/pages/auth/RegisterForm.vue'

defineProps({
  mode: { type: String, required: true }, // 'login' | 'register'
})

const { t } = useI18n()
const { state: siteSettings } = useSiteSettingsStore()

const FALLBACK_BG = '/images/auth-bg.jpg'

// For Cloudinary photos, ask for an optimised copy (best format, auto quality, max 1600px wide)
// so a big upload does not slow the login page down.
function optimised(url) {
  return url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', '/upload/f_auto,q_auto,w_1600/')
    : url
}

// Try each URL in order and resolve with the first one the browser can actually load.
// If none loads, resolve with the bundled fallback so the panel is never left empty.
function firstLoadable(urls) {
  return new Promise((resolve) => {
    let i = 0
    const tryNext = () => {
      if (i >= urls.length) return resolve(FALLBACK_BG)
      const url = urls[i++]
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = () => {
        console.warn('[AuthLayout] could not load background:', url)
        tryNext()
      }
      img.src = url
    }
    tryNext()
  })
}

const bgUrl = ref(FALLBACK_BG)

// Admin-uploaded photo (siteSettings.authBackgroundUrl). Re-runs whenever the settings change,
// e.g. right after the admin saves a new photo.
watch(
  () => siteSettings.authBackgroundUrl,
  async (url) => {
    if (!url) {
      bgUrl.value = FALLBACK_BG
      return
    }
    const fast = optimised(url)
    bgUrl.value = await firstLoadable(fast !== url ? [fast, url] : [url])
  },
  { immediate: true }
)

const bgStyle = computed(() => ({ backgroundImage: `url('${bgUrl.value}')` }))
</script>

<style scoped>
.slide-panel {
  transition: transform 0.65s cubic-bezier(0.65, 0, 0.35, 1);
}

/* Only slide on large screens — on mobile, brand is hidden and form is
   full-width static, so no transform should apply there at all. */
@media (min-width: 1024px) {
  /* Brand panel: left half by default, slides to right half in register mode */
  .role-brand-login { transform: translateX(0%); }
  .role-brand-register { transform: translateX(100%); }

  /* Form panel: right half by default, slides to left half in register mode.
     Both panels are positioned at inset-0/left-0 by the "absolute inset-y-0"
     class, so translateX(100%) moves a 50%-wide panel exactly into the
     other half — this is what makes them cross each other smoothly. */
  .role-form-login { transform: translateX(100%); }
  .role-form-register { transform: translateX(0%); }
}

/* Login/Register form content: slides up + fades when swapping */
.form-slide-up-enter-active,
.form-slide-up-leave-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.form-slide-up-enter-from {
  opacity: 0;
  transform: translateY(24px);
}
.form-slide-up-leave-to {
  opacity: 0;
  transform: translateY(-24px);
}

/* Brand headline/subtext crossfade as mode changes */
.brand-text-enter-active,
.brand-text-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.brand-text-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.brand-text-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

@media (prefers-reduced-motion: reduce) {
  .slide-panel, .form-slide-up-enter-active, .form-slide-up-leave-active,
  .brand-text-enter-active, .brand-text-leave-active {
    transition: none !important;
    animation: none !important;
  }
}
</style>