<template>
  <div class="relative flex min-h-screen w-full overflow-hidden lg:block" :style="{ backgroundColor: 'var(--color-bg)' }">

    <!-- Brand panel — slides between left half (login) and right half (register) -->
    <div
      class="slide-panel hidden flex-col justify-between overflow-hidden p-10 text-white lg:absolute lg:inset-y-0 lg:flex lg:w-1/2"
      :class="mode === 'login' ? 'role-brand-login' : 'role-brand-register'"
    >
      <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('/images/auth-bg.jpg');"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-[#1A2036]/90 via-[#3D5FE0]/80 to-[#6C1AE0]/80"></div>

      <div class="pointer-events-none absolute inset-0">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <div class="relative z-10">
        <RouterLink to="/home" class="flex items-center gap-2 text-lg font-bold">
          <span class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/15 backdrop-blur">
            <img v-if="siteSettings.logoUrl" :src="siteSettings.logoUrl" :alt="t('auth.logoAlt')" class="h-full w-full object-cover" />
            <svg v-else viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-white">
              <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
            </svg>
          </span>
          {{ siteSettings.siteName || t('footer.defaultSiteName') }}
        </RouterLink>
      </div>

      <transition name="brand-text" mode="out-in">
        <div :key="mode" class="relative z-10">
          <h2 class="text-4xl font-extrabold leading-tight">
            {{ mode === 'login' ? t('auth.brandWelcomeTitle') : t('auth.brandJoinTitle') }}
          </h2>
          <p class="mt-4 max-w-sm text-sm text-white/80">
            {{ mode === 'login' ? t('auth.brandLoginSub') : t('auth.brandRegisterSub') }}
          </p>
        </div>
      </transition>

      <div class="relative z-10 flex gap-8">
        <div><p class="text-2xl font-bold">500+</p><p class="text-xs text-white/70">{{ t('auth.brandVehicles') }}</p></div>
        <div><p class="text-2xl font-bold">24/7</p><p class="text-xs text-white/70">{{ t('auth.brandSupport') }}</p></div>
        <div><p class="text-2xl font-bold">100%</p><p class="text-xs text-white/70">{{ t('auth.brandSecure') }}</p></div>
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

.circle {
  position: absolute;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  animation: floatCircle 8s ease-in-out infinite;
}
.circle-1 { top: 8%; right: 15%; width: 140px; height: 140px; }
.circle-2 { bottom: 10%; left: 8%; width: 110px; height: 110px; animation-delay: 2s; }
@keyframes floatCircle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

@media (prefers-reduced-motion: reduce) {
  .slide-panel, .form-slide-up-enter-active, .form-slide-up-leave-active,
  .brand-text-enter-active, .brand-text-leave-active, .circle {
    transition: none !important;
    animation: none !important;
  }
}
</style>