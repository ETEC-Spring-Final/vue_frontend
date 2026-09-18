<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <!-- Hero split -->
    <div class="mx-auto max-w-6xl animate-page-in px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--color-primary)' }">About us</p>
          <h1 class="mt-2 text-3xl font-bold leading-tight sm:text-4xl" :style="{ color: 'var(--color-text)' }">
            A small fleet, kept small on purpose.
          </h1>
          <p class="mt-3 max-w-lg text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
            We started Car Rental because renting a car in Phnom Penh shouldn't mean surprises —
            every vehicle we list is inspected, insured, and driven by us before it ever reaches you.
          </p>
          <div class="mt-6 flex gap-8">
            <div v-for="s in heroStats" :key="s.label">
              <p class="text-2xl font-bold" :style="{ color: 'var(--color-primary)' }">{{ s.value }}</p>
              <p class="mt-0.5 text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ s.label }}</p>
            </div>
          </div>
        </div>

        <div
          class="flex h-56 items-center justify-center overflow-hidden rounded-3xl shadow-sm sm:h-72"
          :style="{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-20 w-20 text-white/30">
            <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
          </svg>
        </div>
      </div>

      <!-- Full stats row -->
      <div class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="s in stats" :key="s.label"
          class="rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <p class="text-2xl font-bold" :style="{ color: 'var(--color-primary)' }">{{ s.value }}</p>
          <p class="mt-1 text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ s.label }}</p>
        </div>
      </div>

      <!-- What we offer -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">What we offer</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">Everything about renting, made simple</p>
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="v in values" :key="v.title"
          class="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full"
            :style="{ backgroundColor: 'var(--color-primary-light)', border: '1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)' }"
          >
            <component :is="v.icon" class="h-5 w-5" :style="{ color: 'var(--color-primary)' }" />
          </div>
          <h3 class="mt-3 text-sm font-bold" :style="{ color: 'var(--color-text)' }">{{ v.title }}</h3>
          <p class="mt-1 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">{{ v.description }}</p>
        </div>
      </div>

      <!-- Our journey (timeline) -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">Our journey</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">A quick look at how we got here</p>
      <div class="relative mx-auto mt-8 max-w-xl">
        <div class="absolute bottom-2 left-4 top-2 w-px" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        <div v-for="(step, i) in journey" :key="step.year" class="relative flex gap-4 pb-8 last:pb-0">
          <div
            class="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            :style="{ backgroundColor: journeyColors[i % journeyColors.length] }"
          >
            {{ i + 1 }}
          </div>
          <div>
            <p class="text-xs font-semibold" :style="{ color: journeyColors[i % journeyColors.length] }">{{ step.year }}</p>
            <p class="text-sm font-bold" :style="{ color: 'var(--color-text)' }">{{ step.title }}</p>
            <p class="mt-0.5 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ step.description }}</p>
          </div>
        </div>
      </div>

      <!-- Testimonials -->
      <!-- NOTE: placeholder testimonials — wire to a real "public reviews"
           endpoint if/when one exists on the backend; today's reviews API
           is scoped per-vehicle, not site-wide. -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">What renters say</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">Real feedback from real trips</p>
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="t in testimonials" :key="t.name"
          class="rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-sm"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <div class="flex items-center gap-0.5" aria-hidden="true">
            <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" class="h-4 w-4">
              <path d="m12 3 2.8 5.9 6.2.9-4.5 4.5 1.1 6.4L12 17.8l-5.6 2.9 1.1-6.4L3 9.8l6.2-.9L12 3Z"/>
            </svg>
          </div>
          <p class="mt-3 text-sm leading-relaxed" :style="{ color: 'var(--color-text)' }">"{{ t.quote }}"</p>
          <div class="mt-4 flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" :style="{ backgroundColor: journeyColors[testimonials.indexOf(t) % journeyColors.length] }">
              {{ t.name[0] }}
            </div>
            <div>
              <p class="text-xs font-semibold" :style="{ color: 'var(--color-text)' }">{{ t.name }}</p>
              <p class="text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">{{ t.role }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div
        class="mt-16 flex flex-col items-center gap-5 rounded-2xl p-10 text-center"
        :style="{ background: 'linear-gradient(120deg, var(--color-primary), var(--color-primary-hover))' }"
      >
        <h2 class="text-xl font-bold text-white sm:text-2xl">Ready to book your next drive?</h2>
        <p class="max-w-md text-sm text-white/80">Browse the fleet — confirmed in minutes, no deposit held until pickup.</p>
        <RouterLink
          to="/explore"
          class="rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ color: 'var(--color-primary)' }"
        >
          Browse the fleet
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
  { value: '38+', label: 'Vehicles' },
  { value: '6+', label: 'Cities' },
  { value: '2,400+', label: 'Trips completed' },
]

const stats = [
  { value: '38', label: 'Vehicles in rotation' },
  { value: '6', label: 'Cities served' },
  { value: '4.9', label: 'Average rating' },
  { value: '24h', label: 'Delivery window' },
]

const values = [
  { title: 'No surprises', description: 'Flat daily rate, insurance and fuel spelled out before you confirm.', icon: icon('M4 12l6 6L20 6') },
  { title: 'Delivered to you', description: 'We bring the car to your address and walk through it together.', icon: icon('M4 10h16v8H4v-8Zm0 0 2-5h12l2 5') },
  { title: 'One point of contact', description: 'A single line that knows the car and the booking end to end.', icon: icon('M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z') },
]

const journeyColors = ['#3D5FE0', '#7C3AED', '#22C55E', '#F59E0B']

const journey = [
  { year: '2024', title: 'Car Rental founded', description: 'Started with 5 vehicles and a promise: no surprises at pickup.' },
  { year: '2025', title: 'Crossed 2,000 trips', description: 'Expanded the fleet and added same-day delivery across the city.' },
  { year: '2026', title: 'Document upload & QR check-in', description: 'Streamlined rentals with digital documents and faster handovers.' },
]

// Placeholder — see note above template's Testimonials section.
const testimonials = [
  { name: 'Sokha', role: 'Frequent renter', quote: 'Booking took two minutes and the car was exactly as described.' },
  { name: 'Dara', role: 'Weekend trip', quote: 'Delivery to my door saved so much time — will book again.' },
  { name: 'Bopha', role: 'Business travel', quote: 'Clear pricing, no hidden fees. Exactly what I needed.' },
]
</script>

<style scoped>
@keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-page-in { animation: page-in 0.35s ease-out; }
</style>