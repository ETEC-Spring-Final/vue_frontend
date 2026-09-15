<template>
  <article class="group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#3D5FE0]/30 hover:shadow-xl hover:shadow-[#1A2036]/5">
    <div class="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#1A2036] to-[#3D5FE0] sm:h-44">
      <span class="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1A2036] shadow-sm backdrop-blur-sm">
        {{ vehicle.type }}
      </span>
      <button
        type="button"
        class="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform duration-200 hover:scale-110 active:scale-90"
        :aria-label="vehicle.favorite ? 'Remove from favorites' : 'Add to favorites'"
        @click="onToggleFavorite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="vehicle.favorite ? '#EF4444' : 'none'" class="h-4 w-4 text-red-500 transition-transform duration-200" :class="justFavorited ? 'scale-125' : 'scale-100'">
          <path stroke="currentColor" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
        </svg>
      </button>
      <!-- TODO: swap for a real photo once vehicle-images are wired in per card -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-16 w-16 text-white/30 transition-transform duration-500 group-hover:scale-110">
        <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
      </svg>
    </div>

    <div class="p-4">
      <div class="flex items-center justify-between gap-2">
        <h4 class="truncate font-bold text-[#1A2036]">{{ vehicle.name }}</h4>
        <p class="shrink-0 text-sm text-[#6B7280]">
          <span class="text-base font-bold text-[#3D5FE0]">${{ vehicle.price }}</span> /day
        </p>
      </div>
      <p class="mt-1 truncate text-sm text-[#6B7280]">{{ vehicle.transmission }} · {{ vehicle.fuel }} · {{ vehicle.seats }} seats</p>

      <button
        type="button"
        class="mt-3 w-full rounded-full bg-[#3D5FE0] py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#3350C0] hover:shadow-md hover:shadow-[#3D5FE0]/25 active:scale-[0.97]"
        @click="$emit('rent', vehicle)"
      >
        Rent now
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

const justFavorited = ref(false)

function onToggleFavorite() {
  justFavorited.value = true
  setTimeout(() => { justFavorited.value = false }, 200)
  emit('toggle-favorite', props.vehicle)
}
</script>