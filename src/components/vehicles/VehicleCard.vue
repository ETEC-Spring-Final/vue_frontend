<template>
  <article
    class="group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
    :style="{
      backgroundColor: 'var(--color-surface)',
      boxShadow: hover
        ? '0 24px 48px -24px rgba(18,23,43,0.35)'
        : '0 1px 2px rgba(18,23,43,0.06)',
    }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- Poster-style image: title + price live on the photo itself, -->
    <!-- echoing the dark-navy gradient used on the Home/About hero banners. -->
    <div class="relative aspect-[4/3] overflow-hidden">
      <img
        v-if="vehicle.image"
        :src="vehicle.image"
        :alt="vehicle.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
        style="background: linear-gradient(135deg, #12172B 0%, #1E2648 100%);"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-14 w-14 text-white/25">
          <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
        </svg>
      </div>

      <!-- Bottom gradient so title/price stay legible over any photo -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style="background: linear-gradient(to top, rgba(18,23,43,0.88) 0%, rgba(18,23,43,0) 100%);"
      />

      <!-- Type badge: solid white pill, dark navy text hardcoded (not a -->
      <!-- theme token) since the background stays white regardless of theme. -->
      <span
        class="absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
        style="background-color: rgba(255,255,255,0.92); color: #1A2036;"
      >
        {{ vehicle.type }}
      </span>

      <button
        type="button"
        class="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-110 active:scale-90"
        style="background-color: rgba(255,255,255,0.92)"
        :aria-label="vehicle.favorite ? $t('vehicles.removeFavorite') : $t('vehicles.addFavorite')"
        @click="onToggleFavorite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="vehicle.favorite ? '#EF4444' : 'none'"
          class="h-4 w-4 text-red-500 transition-transform duration-200" :class="justFavorited ? 'scale-125' : 'scale-100'">
          <path stroke="currentColor" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
        </svg>
      </button>

      <!-- Title + price directly on the photo -->
      <div class="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-3.5">
        <h4 class="truncate text-base font-bold text-white">{{ vehicle.name }}</h4>
        <p class="shrink-0 whitespace-nowrap text-sm text-white/80">
          <span class="text-base font-bold text-white">${{ vehicle.price }}</span>
          {{ $t('vehicles.perDay') }}
        </p>
      </div>
    </div>

    <div class="p-4">
      <!-- Specs as a scannable icon row instead of a text-with-dots line -->
      <div class="flex items-center gap-4 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
        <span class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.4-6.4-2.1 2.1M8.7 15.3l-2.1 2.1m0-10.8 2.1 2.1m8.6 8.6-2.1-2.1"/>
          </svg>
          {{ vehicle.transmission }}
        </span>
        <span class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 shrink-0">
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4 21V9a2 2 0 0 1 2-2h5v14M4 21h7m6 0v-7.5l2.5-2.5a1 1 0 0 1 1.7.7V18a2 2 0 0 1-2 2h-.5a1.5 1.5 0 0 1-1.5-1.5V13"/>
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M6.5 7V4.5"/>
          </svg>
          {{ vehicle.fuel }}
        </span>
        <span class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 shrink-0">
            <circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.6"/>
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>
          </svg>
          {{ vehicle.seats }} {{ $t('vehicles.seats').toLowerCase() }}
        </span>
      </div>

      <button
        type="button"
        class="group/btn mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:gap-2.5 hover:shadow-md active:scale-[0.97]"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        @click="$emit('rent', vehicle)"
      >
        {{ $t('vehicles.rentNow') }}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5">
          <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/>
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  vehicle: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['toggle-favorite', 'rent'])

const hover = ref(false)
const justFavorited = ref(false)

function onToggleFavorite() {
  justFavorited.value = true
  setTimeout(() => { justFavorited.value = false }, 200)
  emit('toggle-favorite', props.vehicle)
}
</script>