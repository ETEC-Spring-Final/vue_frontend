<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      <h1 class="text-xl font-bold text-[#1A2036] sm:text-2xl">Explore vehicles</h1>

      <!-- Search -->
      <div class="mt-4 flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-[#9CA3AF]">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m20 20-3.5-3.5"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search cars or brands…"
          class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
        />
      </div>

      <!-- Type filter -->
      <div v-if="types.length > 1" class="mt-4 flex gap-3 overflow-x-auto pb-1">
        <button
          v-for="type in types"
          :key="type"
          type="button"
          class="shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition"
          :class="activeType === type
            ? 'border-[#3D5FE0] bg-[#3D5FE0] text-white'
            : 'border-[#E5E7EB] bg-white text-[#1A2036] hover:bg-[#F9FAFB]'"
          @click="activeType = type"
        >
          {{ type }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="h-64 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ loadError }}
        <button type="button" class="ml-2 font-semibold underline" @click="loadVehicles">Try again</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredVehicles.length === 0" class="mt-6 rounded-2xl border border-dashed border-[#E5E7EB] px-4 py-10 text-center text-sm text-[#6B7280]">
        <template v-if="searchQuery || activeType !== 'All'">
          No vehicles match {{ searchQuery ? `"${searchQuery}"` : `"${activeType}"` }}. Try a different search or filter.
        </template>
        <template v-else>
          No vehicles available yet — check back soon.
        </template>
      </div>

      <!-- Results -->
      <template v-else>
        <p class="mt-6 text-sm text-[#6B7280]">{{ filteredVehicles.length }} vehicles found</p>
        <div class="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <VehicleCard
            v-for="vehicle in filteredVehicles"
            :key="vehicle.id"
            :vehicle="vehicle"
            @toggle-favorite="toggleFavorite"
            @rent="handleRentNow"
          />
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth.store'
import VehicleCard from '@/components/vehicles/VehicleCard.vue'
import {
  fetchVehicles,
  fetchMyFavorites,
  addFavorite,
  removeFavorite,
  normalizeVehicle,
} from '@/services/vehicles'

const route = useRoute()
const router = useRouter()
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
    loadError.value =
      err.response?.data?.message || 'Could not load vehicles. Please check your connection.'
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