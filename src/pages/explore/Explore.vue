<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">

      <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ $t('explore.title') }}</h1>
      <p class="mt-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('explore.subtitle') }}</p>

      <!-- Search -->
      <div
        class="mt-4 flex items-center gap-3 rounded-full px-5 py-3.5 transition-all duration-200 focus-within:shadow-sm"
        :style="{ backgroundColor: 'var(--color-border)' }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0" :style="{ color: 'var(--color-text-secondary)' }">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m20 20-3.5-3.5"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('explore.searchPlaceholder')"
          class="w-full bg-transparent text-sm outline-none"
          :style="{ color: 'var(--color-text)' }"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="shrink-0 text-xs font-semibold transition-opacity hover:opacity-70"
          :style="{ color: 'var(--color-text-secondary)' }"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Type filter -->
      <div v-if="types.length > 1" class="mt-4 flex gap-3 overflow-x-auto pb-1">
        <button
          v-for="type in types"
          :key="type"
          type="button"
          class="shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95"
          :style="activeType === type
            ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)', color: '#fff' }
            : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
          @click="activeType = type"
        >
          {{ type === 'All' ? $t('explore.allTypes') : type }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="h-64 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {{ loadError }}
        <button type="button" class="ml-2 font-semibold underline" @click="loadVehicles">{{ $t('explore.tryAgain') }}</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredVehicles.length === 0" class="mt-6 rounded-2xl border border-dashed px-4 py-10 text-center text-sm"
        :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
        <template v-if="searchQuery">{{ $t('explore.noResultsQuery', { query: searchQuery }) }}</template>
        <template v-else-if="activeType !== 'All'">{{ $t('explore.noResultsType', { type: activeType }) }}</template>
        <template v-else>{{ $t('explore.noVehiclesYet') }}</template>
      </div>

      <!-- Results -->
      <template v-else>
        <p class="mt-6 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ $t('explore.resultsFound', { count: filteredVehicles.length }) }}
        </p>
        <TransitionGroup tag="div" name="card" class="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <VehicleCard
            v-for="(vehicle, i) in filteredVehicles"
            :key="vehicle.id"
            :vehicle="vehicle"
            :style="{ transitionDelay: `${Math.min(i, 8) * 50}ms` }"
            @toggle-favorite="toggleFavorite"
            @rent="handleRentNow"
          />
        </TransitionGroup>
      </template>

    </div>
    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import useAuthStore from '@/stores/auth.store'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import VehicleCard from '@/components/vehicles/VehicleCard.vue'
import {
  fetchVehicles,
  fetchMyFavorites,
  fetchVehicleImages,
  addFavorite,
  removeFavorite,
  normalizeVehicle,
  normalizeImage,
} from '@/services/vehicles'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isAuthenticated } = useAuthStore()

const vehicles = ref([])
const loading = ref(true)
const loadError = ref('')

// Seed the search box from ?q= if the user arrived via Home's search bar.
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const activeType = ref('All')

const types = computed(() => {
  const unique = [...new Set(vehicles.value.map((v) => v.type).filter(Boolean))]
  return ['All', ...unique]
})

// NOTE: filtered client-side — the Agent Guide's vehicle list endpoint
// (`GET /api/vehicles`) doesn't document filter query params, so this
// fetches the full list once and narrows it in the browser. Swap for
// server-side params (e.g. `fetchVehicles({ q, type })`) once the backend
// supports them — cheaper for a large fleet.
const filteredVehicles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return vehicles.value.filter((v) => {
    const matchesType = activeType.value === 'All' || v.type === activeType.value
    const matchesQuery = !q || v.name.toLowerCase().includes(q) || (v.brand ?? '').toLowerCase().includes(q)
    return matchesType && matchesQuery
  })
})

// Keep the URL in sync so the search is shareable/bookmarkable.
watch(searchQuery, (q) => {
  router.replace({ query: { ...route.query, q: q || undefined } })
})

async function loadVehicles() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await fetchVehicles()
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    vehicles.value = list.map(normalizeVehicle)

    // GET /api/vehicles (list) doesn't include images — only
    // GET /api/vehicle-images/{id} does, per vehicle. Fetch all covers in
    // parallel; one failing image request never blocks the grid.
    await Promise.all(
      vehicles.value.map(async (v) => {
        try {
          const { data: imgData } = await fetchVehicleImages(v.id)
          const imgList = Array.isArray(imgData) ? imgData : (imgData?.content ?? [])
          v.image = imgList.map(normalizeImage).find(Boolean) ?? null
        } catch {
          v.image = null
        }
      })
    )

    if (isAuthenticated()) {
      try {
        const { data: favData } = await fetchMyFavorites()
        const favIds = new Set((Array.isArray(favData) ? favData : favData?.content ?? []).map((f) => f.vehicleId ?? f.id))
        vehicles.value.forEach((v) => { v.favorite = favIds.has(v.id) })
      } catch {
        // non-fatal
      }
    }
  } catch (err) {
    loadError.value = err.response?.data?.message || t('explore.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(loadVehicles)

async function toggleFavorite(vehicle) {
  if (!isAuthenticated()) {
    router.push({ path: '/login', query: { redirect: '/explore' } })
    return
  }
  const next = !vehicle.favorite
  vehicle.favorite = next
  try {
    await (next ? addFavorite(vehicle.id) : removeFavorite(vehicle.id))
  } catch {
    vehicle.favorite = !next
  }
}

function handleRentNow(vehicle) {
  if (!isAuthenticated()) {
    router.push({ path: '/login', query: { redirect: `/vehicles/${vehicle.id}` } })
    return
  }
  router.push(`/vehicles/${vehicle.id}`)
}
</script>

<style scoped>
@keyframes page-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-page-in {
  animation: page-in 0.35s ease-out;
}

.card-enter-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.card-move {
  transition: transform 0.3s ease;
}
</style>