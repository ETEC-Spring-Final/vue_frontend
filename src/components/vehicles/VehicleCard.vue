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
        class="h-full w-full object-cover transition-transform duration-500"
        :class="isAvailable ? 'group-hover:scale-105' : 'grayscale-[35%] opacity-80'"
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

      <!-- Dark scrim over the whole photo while the car is booked, so the -->
      <!-- "Unavailable" state reads clearly even before you notice the badge. -->
      <div v-if="!isAvailable" class="pointer-events-none absolute inset-0 bg-black/35" />

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

      <!-- Unavailable status badge, next to the type badge -->
      <span
        v-if="!isAvailable"
        class="absolute left-3 top-11 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
        :style="{ backgroundColor: statusColor.bg, color: statusColor.text }"
      >
        {{ $t(`vehicles.statusValues.${vehicle.status}`, vehicle.status) }}
      </span>

      <!-- Discount ribbon — only renders once the backend actually sends a
           discountPercent (see normalizeVehicle in services/vehicles.js). -->
      <span
        v-if="vehicle.discountPercent"
        class="absolute right-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm"
      >
        -{{ vehicle.discountPercent }}%
      </span>

      <button
        type="button"
        class="absolute right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-110 active:scale-90"
        :class="vehicle.discountPercent ? 'top-11' : 'top-3'"
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
        <div class="flex min-w-0 items-center gap-2">
          <!-- Brand logo (BrandResponseDTO.imageUrl via VehicleResponseDTO.brandImage) -->
          <img
            v-if="vehicle.brandImage"
            :src="vehicle.brandImage"
            :alt="vehicle.brand"
            class="h-7 w-7 shrink-0 rounded-full bg-white object-contain p-0.5"
            loading="lazy"
          />
          <h4 class="truncate text-base font-bold text-white">{{ vehicle.name }}</h4>
        </div>
        <p class="shrink-0 whitespace-nowrap text-right text-sm text-white/80">
          <span v-if="vehicle.discountPercent && vehicle.originalPrice" class="mr-1 text-xs text-white/50 line-through">
            ${{ vehicle.originalPrice }}
          </span>
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

      <!-- "Booked: <date range>" — only shown once the booked-dates request -->
      <!-- resolves and there's an upcoming window; silently omitted otherwise. -->
      <p v-if="isAvailable && nextBookedRangeLabel" class="mt-2 flex items-center gap-1.5 text-xs font-medium" style="color:#92600B;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5 shrink-0">
          <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
        </svg>
        {{ $t('vehicles.bookedFor', { range: nextBookedRangeLabel }, `Booked ${nextBookedRangeLabel}`) }}
      </p>

      <!-- "Available again on <date>" — only shown once the booked-dates
           request resolves; silently omitted if it fails or is still loading. -->
      <p v-if="!isAvailable && nextAvailableLabel" class="mt-2 text-xs font-medium" :style="{ color: statusColor.text }">
        {{ $t('vehicles.availableAgain', { date: nextAvailableLabel }, `Available again ${nextAvailableLabel}`) }}
      </p>

      <button
        type="button"
        class="group/btn mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
        :class="isAvailable ? 'hover:gap-2.5 hover:shadow-md active:scale-[0.97]' : ''"
        :style="{ backgroundColor: isAvailable ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
        :disabled="!isAvailable"
        @click="$emit('rent', vehicle)"
      >
        {{ isAvailable ? $t('vehicles.rentNow') : $t(`vehicles.statusValues.${vehicle.status}`, vehicle.status) }}
        <svg v-if="isAvailable" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5">
          <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/>
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchBookedDates, normalizeBookedDate } from '@/services/vehicles'

const { locale } = useI18n()

const props = defineProps({
  vehicle: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['toggle-favorite', 'rent'])

const hover = ref(false)
const justFavorited = ref(false)

const isAvailable = computed(() => (props.vehicle.status ?? 'AVAILABLE') === 'AVAILABLE')

const STATUS_COLORS = {
  RESERVED: { bg: 'rgba(245,158,11,0.95)', text: '#fff' },
  RENTED: { bg: 'rgba(245,158,11,0.95)', text: '#fff' },
  MAINTENANCE: { bg: 'rgba(239,68,68,0.95)', text: '#fff' },
}
const statusColor = computed(() => STATUS_COLORS[props.vehicle.status] ?? { bg: 'rgba(107,114,128,0.95)', text: '#fff' })

// Fetched for every card now (not just unavailable ones) — a vehicle's
// overall `status` and its specific booked date-ranges are two different
// things: a car can be AVAILABLE overall but still have upcoming reserved
// dates, which customers need to see *before* clicking Rent, not after.
const nextAvailableLabel = ref('') // shown when the card itself is unavailable
const nextBookedRangeLabel = ref('') // shown as a heads-up on otherwise-available cards

function formatRange(w) {
  const opts = { day: 'numeric', month: 'short' }
  if (w.start && w.end) return `${w.start.toLocaleDateString(locale.value, opts)}–${w.end.toLocaleDateString(locale.value, opts)}`
  if (w.end) return w.end.toLocaleDateString(locale.value, opts)
  return ''
}

async function loadBookedDates(vehicleId) {
  nextAvailableLabel.value = ''
  nextBookedRangeLabel.value = ''
  try {
    const { data } = await fetchBookedDates(vehicleId)
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    const windows = list.map(normalizeBookedDate).filter(Boolean)
    const today = new Date()
    const upcoming = windows.filter((w) => !w.end || w.end >= today).sort((a, b) => (a.start ?? a.end ?? 0) - (b.start ?? b.end ?? 0))

    if (!isAvailable.value) {
      // Card is fully unavailable — surface when it frees up.
      const active = upcoming[0] ?? windows.sort((a, b) => (b.end ?? 0) - (a.end ?? 0))[0]
      if (active?.end) nextAvailableLabel.value = active.end.toLocaleDateString(locale.value, { day: 'numeric', month: 'short' })
    } else if (upcoming.length) {
      // Card is generally available but has specific dates already taken.
      nextBookedRangeLabel.value = formatRange(upcoming[0])
    }
  } catch {
    // non-fatal — card just shows no date info
  }
}

watch(
  () => [props.vehicle.id, props.vehicle.status],
  ([id]) => { if (id) loadBookedDates(id) },
  { immediate: true }
)

function onToggleFavorite() {
  justFavorited.value = true
  setTimeout(() => { justFavorited.value = false }, 200)
  emit('toggle-favorite', props.vehicle)
}
</script>