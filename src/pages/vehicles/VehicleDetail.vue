<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- Back -->
      <button
        type="button"
        class="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#1A2036]"
        @click="router.back()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
          <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div class="h-64 animate-pulse rounded-3xl bg-[#F3F4F6]"></div>
        <div class="h-6 w-1/2 animate-pulse rounded bg-[#F3F4F6]"></div>
        <div class="h-4 w-1/3 animate-pulse rounded bg-[#F3F4F6]"></div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ loadError }}
        <button type="button" class="ml-2 font-semibold underline" @click="loadAll">Try again</button>
      </div>

      <template v-else-if="vehicle">
        <!-- Image gallery -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A2036] to-[#3D5FE0]">
          <div class="flex h-64 items-center justify-center sm:h-80">
            <img
              v-if="images[activeImage]"
              :src="images[activeImage]"
              :alt="vehicle.name"
              class="h-full w-full object-cover"
            />
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-20 w-20 text-white/30">
              <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 01 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
            </svg>
          </div>
          <span class="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1A2036]">
            {{ vehicle.type }}
          </span>
          <button
            type="button"
            class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90"
            :aria-label="vehicle.favorite ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavorite"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="vehicle.favorite ? '#EF4444' : 'none'" class="h-4 w-4 text-red-500">
              <path stroke="currentColor" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
            </svg>
          </button>
        </div>

        <div v-if="images.length > 1" class="mt-3 flex gap-2 overflow-x-auto">
          <button
            v-for="(img, i) in images"
            :key="i"
            type="button"
            class="h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2"
            :class="i === activeImage ? 'border-[#3D5FE0]' : 'border-transparent'"
            @click="activeImage = i"
          >
            <img :src="img" :alt="`${vehicle.name} photo ${i + 1}`" class="h-full w-full object-cover" />
          </button>
        </div>

        <!-- Title + price -->
        <div class="mt-6 flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-[#1A2036]">{{ vehicle.name }}</h1>
            <span class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="statusClass">
              {{ vehicle.status }}
            </span>
          </div>
          <p class="shrink-0 text-right">
            <span class="text-2xl font-bold text-[#3D5FE0]">${{ vehicle.price }}</span>
            <span class="text-sm text-[#6B7280]"> /day</span>
          </p>
        </div>

        <!-- Specs -->
        <h2 class="mt-8 text-lg font-bold text-[#1A2036]">Specifications</h2>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="spec in specs" :key="spec.label" class="rounded-2xl border border-[#E5E7EB] p-3 text-center">
            <p class="text-xs text-[#9CA3AF]">{{ spec.label }}</p>
            <p class="mt-1 text-sm font-semibold text-[#1A2036]">{{ spec.value }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="vehicle.status !== 'AVAILABLE'"
            @click="handleRentNow"
          >
            {{ vehicle.status === 'AVAILABLE' ? 'Rent now' : 'Currently unavailable' }}
          </button>
        </div>

        <!-- Reviews -->
        <h2 class="mt-10 text-lg font-bold text-[#1A2036]">Reviews</h2>

        <ReviewForm
          v-if="isAuthenticated()"
          :vehicle-id="route.params.id"
          class="mt-4"
          @submitted="loadReviews"
        />

        <div v-if="reviewsLoading" class="mt-3 space-y-2">
          <div class="h-16 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
          <div class="h-16 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
        </div>
        <p v-else-if="reviews.length === 0" class="mt-3 text-sm text-[#6B7280]">
          No reviews yet — be the first to rent and review this car.
        </p>
        <div v-else class="mt-3 space-y-3">
          <div v-for="review in reviews" :key="review.id" class="rounded-2xl border border-[#E5E7EB] p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-[#1A2036]">{{ review.authorName }}</p>
              <div class="flex items-center gap-0.5" aria-hidden="true">
                <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                  :fill="i <= review.rating ? '#F59E0B' : 'none'" class="h-4 w-4 text-[#F59E0B]">
                  <path stroke="currentColor" stroke-width="1.2" d="m12 3 2.8 5.9 6.2.9-4.5 4.5 1.1 6.4L12 17.8l-5.6 2.9 1.1-6.4L3 9.8l6.2-.9L12 3Z"/>
                </svg>
              </div>
            </div>
            <p class="mt-2 text-sm text-[#6B7280]">{{ review.comment }}</p>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth.store'
import ReviewForm from '@/components/reviews/ReviewForm.vue'
import {
  fetchVehicleById,
  fetchVehicleImages,
  fetchVehicleReviews,
  addFavorite,
  removeFavorite,
  normalizeVehicleDetail,
  normalizeImage,
  normalizeReview,
} from '@/services/vehicles'

const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuthStore()

const vehicle = ref(null)
const images = ref([])
const activeImage = ref(0)
const loading = ref(true)
const loadError = ref('')

const reviews = ref([])
const reviewsLoading = ref(true)

const specs = computed(() => {
  if (!vehicle.value) return []
  return [
    { label: 'Transmission', value: vehicle.value.transmission },
    { label: 'Fuel', value: vehicle.value.fuel },
    { label: 'Seats', value: vehicle.value.seats },
    { label: 'Year', value: vehicle.value.year },
    { label: 'Color', value: vehicle.value.color },
    { label: 'Mileage', value: vehicle.value.mileage != null ? `${vehicle.value.mileage} km` : '—' },
  ]
})

const statusClass = computed(() => {
  const map = {
    AVAILABLE: 'bg-green-50 text-green-600',
    RESERVED: 'bg-amber-50 text-amber-600',
    RENTED: 'bg-amber-50 text-amber-600',
    MAINTENANCE: 'bg-red-50 text-red-600',
  }
  return map[vehicle.value?.status] ?? 'bg-[#F3F4F6] text-[#6B7280]'
})

async function loadAll() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await fetchVehicleById(route.params.id)
    vehicle.value = normalizeVehicleDetail(data)

    // Non-fatal: page still works without photos.
    try {
      const { data: imgData } = await fetchVehicleImages(route.params.id)
      const list = Array.isArray(imgData) ? imgData : (imgData?.content ?? [])
      images.value = list.map(normalizeImage).filter(Boolean)
    } catch {
      images.value = []
    }
  } catch (err) {
    loadError.value =
      err.response?.status === 404
        ? 'This vehicle could not be found.'
        : err.response?.data?.message || 'Could not load this vehicle. Please try again.'
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  reviewsLoading.value = true
  try {
    const { data } = await fetchVehicleReviews(route.params.id)
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    reviews.value = list.map(normalizeReview)
  } catch {
    reviews.value = []
  } finally {
    reviewsLoading.value = false
  }
}

onMounted(() => {
  loadAll()
  loadReviews()
})

async function toggleFavorite() {
  if (!isAuthenticated()) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  const next = !vehicle.value.favorite
  vehicle.value.favorite = next
  try {
    await (next ? addFavorite(vehicle.value.id) : removeFavorite(vehicle.value.id))
  } catch {
    vehicle.value.favorite = !next
  }
}

function handleRentNow() {
  if (!isAuthenticated()) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  // Reservation flow (Phase 3) is wired up: /reservations reads
  // ?vehicleId= and requires auth (see router/index.js).
  router.push(`/reservations?vehicleId=${vehicle.value.id}`)
}
</script>