<template>
  <article
    class="group overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: hover ? '0 20px 40px -20px rgba(0,0,0,0.25)' : 'none' }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br sm:h-44"
      :style="{ '--tw-gradient-from': 'var(--color-text)', '--tw-gradient-to': 'var(--color-primary)' }">
      <span
        class="absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm"
        :style="{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--color-text)' }"
      >
        {{ vehicle.type }}
      </span>

      <button
        type="button"
        class="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-110 active:scale-90"
        style="background-color: rgba(255,255,255,0.9)"
        :aria-label="vehicle.favorite ? $t('vehicles.removeFavorite') : $t('vehicles.addFavorite')"
        @click="onToggleFavorite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="vehicle.favorite ? '#EF4444' : 'none'"
          class="h-4 w-4 text-red-500 transition-transform duration-200" :class="justFavorited ? 'scale-125' : 'scale-100'">
          <path stroke="currentColor" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
        </svg>
      </button>

      <img
        v-if="vehicle.image"
        :src="vehicle.image"
        :alt="vehicle.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        class="h-16 w-16 text-white/30 transition-transform duration-500 group-hover:scale-110">
        <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
      </svg>
    </div>

    <div class="p-4">
      <div class="flex items-center justify-between gap-2">
        <h4 class="truncate font-bold" :style="{ color: 'var(--color-text)' }">{{ vehicle.name }}</h4>
        <p class="shrink-0 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          <span class="text-base font-bold" :style="{ color: 'var(--color-primary)' }">${{ vehicle.price }}</span>
          {{ $t('vehicles.perDay') }}
        </p>
      </div>
      <p class="mt-1 truncate text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        {{ vehicle.transmission }} · {{ vehicle.fuel }} · {{ vehicle.seats }} {{ $t('vehicles.seats').toLowerCase() }}
      </p>

      <button
        type="button"
        class="mt-3 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-[0.97]"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        @click="$emit('rent', vehicle)"
      >
        {{ $t('vehicles.rentNow') }}
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