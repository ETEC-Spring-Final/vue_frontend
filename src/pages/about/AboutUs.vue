<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <!-- Hero split -->
    <div class="mx-auto max-w-6xl animate-page-in px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--color-primary)' }">{{ $t('about.eyebrow') }}</p>
          <h1 class="mt-2 text-3xl font-bold leading-tight sm:text-4xl" :style="{ color: 'var(--color-text)' }">
            {{ $t('about.title') }}
          </h1>
          <p class="mt-3 max-w-lg text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
            {{ $t('about.intro') }}
          </p>
          <div class="mt-6 flex gap-8">
            <div v-for="s in heroStats" :key="s.labelKey">
              <p class="text-2xl font-bold" :style="{ color: 'var(--color-primary)' }">{{ s.value }}</p>
              <p class="mt-0.5 text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ $t(s.labelKey) }}</p>
            </div>
          </div>
        </div>

        <div
          class="relative h-56 overflow-hidden rounded-3xl shadow-sm sm:h-72"
          style="background: linear-gradient(135deg, #12172B 0%, #1E2648 100%);"
        >
          <svg class="absolute inset-0 h-full w-full" viewBox="0 0 400 260" fill="none" preserveAspectRatio="xMidYMid slice">
            <path
              d="M40 220 C 120 220, 140 130, 220 120 S 320 70, 355 45"
              stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-dasharray="1 10" stroke-linecap="round"
            />
            <circle cx="40" cy="220" r="5" :fill="journeyColors[0]" />
            <circle cx="220" cy="120" r="7" :fill="journeyColors[1]" />
            <circle cx="355" cy="45" r="9" :fill="journeyColors[2]" />
            <g transform="translate(196, 96) rotate(-20) scale(1.3)">
              <path fill="white" fill-opacity="0.92" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
            </g>
          </svg>
        </div>
      </div>

      <!-- Full stats row -->
      <div class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="s in stats" :key="s.labelKey"
          class="rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <p class="text-2xl font-bold" :style="{ color: 'var(--color-primary)' }">{{ s.value }}</p>
          <p class="mt-1 text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ $t(s.labelKey) }}</p>
        </div>
      </div>

      <!-- What we offer -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('about.offerTitle') }}</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('about.offerSubtitle') }}</p>
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="v in values" :key="v.titleKey"
          class="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full"
            :style="{ backgroundColor: 'var(--color-primary-light)', border: '1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)' }"
          >
            <component :is="v.icon" class="h-5 w-5" :style="{ color: 'var(--color-primary)' }" />
          </div>
          <h3 class="mt-3 text-sm font-bold" :style="{ color: 'var(--color-text)' }">{{ $t(v.titleKey) }}</h3>
          <p class="mt-1 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">{{ $t(v.descKey) }}</p>
        </div>
      </div>

      <!-- Our journey (timeline) -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('about.journeyTitle') }}</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('about.journeySubtitle') }}</p>
      <div class="relative mx-auto mt-8 max-w-xl">
        <div class="absolute bottom-2 left-4 top-2 w-px" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        <div v-for="(step, i) in journey" :key="step.titleKey" class="relative flex gap-4 pb-8 last:pb-0">
          <div
            class="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            :style="{ backgroundColor: journeyColors[i % journeyColors.length] }"
          >
            {{ i + 1 }}
          </div>
          <div>
            <p class="text-xs font-semibold" :style="{ color: journeyColors[i % journeyColors.length] }">{{ $t(step.yearKey) }}</p>
            <p class="text-sm font-bold" :style="{ color: 'var(--color-text)' }">{{ $t(step.titleKey) }}</p>
            <p class="mt-0.5 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t(step.descKey) }}</p>
          </div>
        </div>
      </div>

      <!-- Testimonials -->
      <!-- NOTE: placeholder testimonials — wire to a real "public reviews"
           endpoint if/when one exists on the backend; today's reviews API
           is scoped per-vehicle, not site-wide. -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('about.testimonialsTitle') }}</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('about.testimonialsSubtitle') }}</p>
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="item in testimonials" :key="item.name"
          class="rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-sm"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <div class="flex items-center gap-0.5" aria-hidden="true">
            <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" class="h-4 w-4">
              <path d="m12 3 2.8 5.9 6.2.9-4.5 4.5 1.1 6.4L12 17.8l-5.6 2.9 1.1-6.4L3 9.8l6.2-.9L12 3Z"/>
            </svg>
          </div>
          <p class="mt-3 text-sm leading-relaxed" :style="{ color: 'var(--color-text)' }">"{{ $t(item.quoteKey) }}"</p>
          <div class="mt-4 flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" :style="{ backgroundColor: journeyColors[testimonials.indexOf(item) % journeyColors.length] }">
              {{ item.name[0] }}
            </div>
            <div>
              <p class="text-xs font-semibold" :style="{ color: 'var(--color-text)' }">{{ item.name }}</p>
              <p class="text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">{{ $t(item.roleKey) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
        <div
          class="mt-16 flex flex-col items-center gap-5 rounded-2xl p-10 text-center"
          style="background: linear-gradient(120deg, #12172B 0%, #1E2648 60%, color-mix(in srgb, var(--color-primary) 40%, #12172B) 100%);"
        >
        <h2 class="text-xl font-bold text-white sm:text-2xl">{{ $t('about.ctaTitle') }}</h2>
        <p class="max-w-md text-sm text-white/80">{{ $t('about.ctaSubtitle') }}</p>
        <RouterLink
          to="/explore"
          class="rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ color: 'var(--color-primary)' }"
        >
          {{ $t('about.ctaButton') }}
        </RouterLink>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { h } from 'vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

const icon = (path) => ({ render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none' }, [h('path', { stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: path })]) })

const heroStats = [
  { value: '38+', labelKey: 'about.heroStatVehicles' },
  { value: '6+', labelKey: 'about.heroStatCities' },
  { value: '2,400+', labelKey: 'about.heroStatTrips' },
]

const stats = [
  { value: '38', labelKey: 'about.statVehicles' },
  { value: '6', labelKey: 'about.statCities' },
  { value: '4.9', labelKey: 'about.statRating' },
  { value: '24h', labelKey: 'about.statDelivery' },
]

const values = [
  { titleKey: 'about.valueSurprisesTitle', descKey: 'about.valueSurprisesDesc', icon: icon('M4 12l6 6L20 6') },
  { titleKey: 'about.valueDeliveryTitle', descKey: 'about.valueDeliveryDesc', icon: icon('M4 10h16v8H4v-8Zm0 0 2-5h12l2 5') },
  { titleKey: 'about.valueContactTitle', descKey: 'about.valueContactDesc', icon: icon('M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z') },
]

const journeyColors = ['#3D5FE0', '#7C3AED', '#22C55E', '#F59E0B']

const journey = [
  { yearKey: 'about.j1Year', titleKey: 'about.j1Title', descKey: 'about.j1Desc' },
  { yearKey: 'about.j2Year', titleKey: 'about.j2Title', descKey: 'about.j2Desc' },
  { yearKey: 'about.j3Year', titleKey: 'about.j3Title', descKey: 'about.j3Desc' },
]

// Placeholder — see note above template's Testimonials section.
const testimonials = [
  { name: 'Sokha', roleKey: 'about.t1Role', quoteKey: 'about.t1Quote' },
  { name: 'Dara', roleKey: 'about.t2Role', quoteKey: 'about.t2Quote' },
  { name: 'Bopha', roleKey: 'about.t3Role', quoteKey: 'about.t3Quote' },
]
</script>

<style scoped>
@keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-page-in { animation: page-in 0.35s ease-out; }
</style>