<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- Back -->
      <button
        type="button"
        class="mb-4 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 hover:opacity-80 active:scale-95"
        :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
        :aria-label="$t('common.back')"
        @click="router.back()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
          <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div class="h-64 animate-pulse rounded-3xl sm:h-80" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        <div class="h-6 w-1/2 animate-pulse rounded" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        <div class="h-4 w-1/3 animate-pulse rounded" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="flex flex-wrap items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        <span>{{ loadError }}</span>
        <button type="button" class="font-semibold underline underline-offset-2 transition hover:opacity-70" @click="loadAll">
          {{ $t('common.tryAgain') }}
        </button>
      </div>

      <Transition name="fade" mode="out-in">
      <template v-if="vehicle">
        <div>
        <!-- Image gallery -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br shadow-sm" :style="{ '--tw-gradient-from': 'var(--color-primary)', '--tw-gradient-to': 'var(--color-text)' }">
          <div class="flex h-64 items-center justify-center overflow-hidden sm:h-80 md:h-96">
            <Transition name="crossfade" mode="out-in">
              <img
                v-if="images[activeImage]"
                :key="activeImage"
                :src="images[activeImage]"
                :alt="`${vehicle.name} — ${$t('vehicleDetail.photo')} ${activeImage + 1}`"
                class="h-full w-full object-cover"
              />
              <svg v-else key="placeholder" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-20 w-20 text-white/30">
                <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
              </svg>
            </Transition>
          </div>

          <span class="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-text)] shadow-sm">
            {{ vehicle.type }}
          </span>

          <button
            type="button"
            class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform duration-200 hover:scale-110 active:scale-90"
            :aria-label="vehicle.favorite ? $t('vehicleDetail.removeFavorite') : $t('vehicleDetail.addFavorite')"
            @click="toggleFavorite"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="vehicle.favorite ? '#EF4444' : 'none'"
              class="h-4 w-4 text-red-500 transition-transform duration-200" :class="{ 'scale-125': vehicle.favorite }">
              <path stroke="currentColor" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
            </svg>
          </button>

          <!-- Prev/Next arrows for multi-image gallery -->
          <template v-if="images.length > 1">
            <button type="button"
              class="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm transition hover:scale-110 hover:bg-white active:scale-90"
              :aria-label="$t('vehicleDetail.prevPhoto')"
              @click="activeImage = (activeImage - 1 + images.length) % images.length">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 text-[var(--color-text)]">
                <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button type="button"
              class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm transition hover:scale-110 hover:bg-white active:scale-90"
              :aria-label="$t('vehicleDetail.nextPhoto')"
              @click="activeImage = (activeImage + 1) % images.length">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 text-[var(--color-text)]">
                <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </template>
        </div>

        <div v-if="images.length > 1" class="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="(img, i) in images"
            :key="i"
            type="button"
            class="h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 hover:opacity-90"
            :class="i === activeImage ? 'scale-100 shadow-sm' : 'opacity-70 hover:opacity-100'"
            :style="{ borderColor: i === activeImage ? 'var(--color-primary)' : 'transparent' }"
            @click="activeImage = i"
          >
            <img :src="img" :alt="`${vehicle.name} ${$t('vehicleDetail.photo')} ${i + 1}`" class="h-full w-full object-cover" />
          </button>
        </div>

        <!-- Title + price -->
        <div class="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ vehicle.name }}</h1>
            <span class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="statusClass">
              {{ $t(`vehicles.statusValues.${vehicle.status}`, vehicle.status) }}
            </span>
          </div>
          <p class="shrink-0 text-right">
            <span class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-primary)' }">${{ vehicle.price }}</span>
            <span class="text-sm" :style="{ color: 'var(--color-text-secondary)' }"> /{{ $t('vehicleDetail.day') }}</span>
          </p>
        </div>

        <!-- Specs -->
        <h2 class="mt-8 text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('vehicleDetail.specifications') }}</h2>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div v-for="spec in specs" :key="spec.label"
            class="rounded-2xl border p-3 text-center transition-shadow duration-200 hover:shadow-sm"
            :style="{ borderColor: 'var(--color-border)' }">
            <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ spec.label }}</p>
            <p class="mt-1 text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ spec.value }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-full py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
            :style="{ backgroundColor: 'var(--color-primary)' }"
            :disabled="vehicle.status !== 'AVAILABLE'"
            @click="handleRentNow"
          >
            {{ vehicle.status === 'AVAILABLE' ? $t('vehicleDetail.rentNow') : $t('vehicleDetail.unavailable') }}
          </button>
        </div>

        <!-- Reviews -->
        <h2 class="mt-10 text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('vehicleDetail.reviews') }}</h2>

        <ReviewForm
          v-if="isAuthenticated()"
          :vehicle-id="route.params.id"
          class="mt-4"
          @submitted="loadReviews"
        />

        <div v-if="reviewsLoading" class="mt-3 space-y-2">
          <div class="h-16 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
          <div class="h-16 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        </div>
        <p v-else-if="reviews.length === 0" class="mt-3 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ $t('vehicleDetail.noReviews') }}
        </p>
        <TransitionGroup v-else name="list" tag="div" class="mt-3 space-y-3">
          <div v-for="review in reviews" :key="review.id"
            class="rounded-2xl border p-4 transition-shadow duration-200 hover:shadow-sm"
            :style="{ borderColor: 'var(--color-border)' }">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ review.authorName }}</p>
              <div class="flex items-center gap-0.5" aria-hidden="true">
                <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                  :fill="i <= review.rating ? '#F59E0B' : 'none'" class="h-4 w-4 text-[#F59E0B]">
                  <path stroke="currentColor" stroke-width="1.2" d="m12 3 2.8 5.9 6.2.9-4.5 4.5 1.1 6.4L12 17.8l-5.6 2.9 1.1-6.4L3 9.8l6.2-.9L12 3Z"/>
                </svg>
              </div>
            </div>
            <p class="mt-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ review.comment }}</p>
          </div>
        </TransitionGroup>
        </div>
      </template>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()
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
    { label: t('vehicles.transmission'), value: vehicle.value.transmission },
    { label: t('vehicles.fuelType'), value: vehicle.value.fuel },
    { label: t('vehicles.seats'), value: vehicle.value.seats },
    { label: t('vehicles.year'), value: vehicle.value.year },
    { label: t('vehicles.color'), value: vehicle.value.color },
    { label: t('vehicles.mileAge'), value: vehicle.value.mileage != null ? `${vehicle.value.mileage} km` : '—' },
  ]
})

const statusClass = computed(() => {
  const map = {
    AVAILABLE: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
    RESERVED: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    RENTED: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    MAINTENANCE: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  }
  return map[vehicle.value?.status] ?? ''
})

async function loadAll() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await fetchVehicleById(route.params.id)
    vehicle.value = normalizeVehicleDetail(data)

    try {
      const { data: imgData } = await fetchVehicleImages(route.params.id)
      const list = Array.isArray(imgData) ? imgData : (imgData?.content ?? [])
      images.value = list
        .map(normalizeImage)
        .filter(Boolean)
      activeImage.value = 0
    } catch {
      images.value = []
    }
  } catch (err) {
    loadError.value =
      err.response?.status === 404
        ? t('vehicleDetail.notFound')
        : err.response?.data?.message || t('vehicleDetail.loadError')
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
  router.push(`/booking/${vehicle.value.id}`)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.crossfade-enter-active, .crossfade-leave-active { transition: opacity 0.3s ease; }
.crossfade-enter-from, .crossfade-leave-to { opacity: 0; }

.list-enter-active, .list-leave-active { transition: all 0.25s ease; }
.list-enter-from { opacity: 0; transform: translateY(8px); }
.list-leave-to { opacity: 0; transform: translateY(-8px); }
.list-move { transition: transform 0.25s ease; }
</style>