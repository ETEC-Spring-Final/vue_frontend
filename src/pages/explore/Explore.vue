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
        <p ref="resultsTop" class="mt-6 scroll-mt-24 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ $t('explore.resultsFound', { count: filteredVehicles.length }) }}
        </p>

        <TransitionGroup tag="div" name="card" class="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <VehicleCard
            v-for="(vehicle, i) in pagedVehicles"
            :key="vehicle.id"
            :vehicle="vehicle"
            :style="{ transitionDelay: `${Math.min(i, 8) * 50}ms` }"
            @toggle-favorite="toggleFavorite"
            @rent="handleRentNow"
          />
        </TransitionGroup>

        <!-- Pagination -->
        <nav
          v-if="totalPages > 1"
          class="mt-8 flex flex-wrap items-center justify-center gap-1.5"
          aria-label="Pagination"
        >
          <button
            type="button"
            :disabled="page === 1"
            aria-label="Previous page"
            class="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
            @click="goToPage(page - 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m15 6-6 6 6 6"/>
            </svg>
          </button>

          <template v-for="(p, i) in pageNumbers" :key="`${p}-${i}`">
            <span v-if="p === '...'" class="px-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">…</span>
            <button
              v-else
              type="button"
              class="h-9 min-w-9 rounded-full border px-3 text-sm font-semibold transition-all duration-200 active:scale-95"
              :style="p === page
                ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)', color: '#fff' }
                : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
          </template>

          <button
            type="button"
            :disabled="page === totalPages"
            aria-label="Next page"
            class="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
            @click="goToPage(page + 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6"/>
            </svg>
          </button>
        </nav>
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
// server-side params (e.g. `fetchVehicles({ q, type, page, size })`) once
// the backend supports them — cheaper for a large fleet.
const filteredVehicles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return vehicles.value.filter((v) => {
    const matchesType = activeType.value === 'All' || v.type === activeType.value
    const matchesQuery = !q || v.name.toLowerCase().includes(q) || (v.brand ?? '').toLowerCase().includes(q)
    return matchesType && matchesQuery
  })
})

// ----- Pagination (client-side, 9 cards per page = 3x3 grid) -----
const PAGE_SIZE = 9
const initialPage = parseInt(route.query.page, 10)
const page = ref(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1)
const resultsTop = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredVehicles.value.length / PAGE_SIZE)))

const pagedVehicles = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredVehicles.value.slice(start, start + PAGE_SIZE)
})

// e.g. 1 … 4 5 6 … 12
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)
  return pages
})

function goToPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  resultsTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Changing the search text or the type filter goes back to page 1.
watch([searchQuery, activeType], () => { page.value = 1 })

// Keep ?q= and ?page= in the URL so the view is shareable/bookmarkable.
watch([searchQuery, page], ([q, p]) => {
  router.replace({ query: { ...route.query, q: q || undefined, page: p > 1 ? String(p) : undefined } })
})

// GET /api/vehicles (list) doesn't include images — only
// GET /api/vehicle-images/{id} does, per vehicle. Only the cards on the
// current page need a cover photo, so request images just for those.
// One failing image request never blocks the grid.
const imageRequested = new Set()

async function loadCoverImages(list) {
  const pending = list.filter((v) => !imageRequested.has(v.id))
  pending.forEach((v) => imageRequested.add(v.id))
  await Promise.all(
    pending.map(async (v) => {
      try {
        const { data: imgData } = await fetchVehicleImages(v.id)
        const imgList = Array.isArray(imgData) ? imgData : (imgData?.content ?? [])
        v.image = imgList.map(normalizeImage).find(Boolean) ?? null
      } catch {
        v.image = null
      }
    })
  )
}

// Runs on first load, on page change, and on search/type filter change.
watch(pagedVehicles, (list) => loadCoverImages(list), { immediate: true })

async function loadVehicles() {
  loading.value = true
  loadError.value = ''
  imageRequested.clear() // fresh vehicle objects after a reload need their images again
  try {
    const { data } = await fetchVehicles()
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    vehicles.value = list.map(normalizeVehicle)

    if (isAuthenticated()) {
      try {
        const { data: favData } = await fetchMyFavorites()
        const favIds = new Set((Array.isArray(favData) ? favData : favData?.content ?? []).map((f) => f.vehicleId ?? f.id))
        vehicles.value.forEach((v) => { v.favorite = favIds.has(v.id) })
      } catch {
        // non-fatal
      }
    }

    // A stale ?page=99 in the URL shouldn't leave the user on an empty page.
    if (page.value > totalPages.value) page.value = totalPages.value
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