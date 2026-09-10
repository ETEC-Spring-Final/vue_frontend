<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- Header: greeting adapts to auth state -->
      <header class="flex items-center justify-between gap-4">
        <div>
          <template v-if="isAuthenticated()">
            <h1 class="text-xl font-bold text-[#1A2036] sm:text-2xl">Hello, {{ firstName }} 👋</h1>
            <p class="mt-1 text-sm text-[#3D5FE0]">Ready for your next journey?</p>
          </template>
          <template v-else>
            <h1 class="text-xl font-bold text-[#1A2036] sm:text-2xl">Find your next ride</h1>
            <p class="mt-1 text-sm text-[#6B7280]">
              <RouterLink to="/login" class="font-semibold text-[#3D5FE0] hover:text-[#3350C0]">Sign in</RouterLink>
              to book a car and track your trips.
            </p>
          </template>
        </div>

        <RouterLink
          v-if="isAuthenticated()"
          to="/profile"
          class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E9EDFB] text-sm font-semibold text-[#3D5FE0]"
        >
          {{ initials }}
        </RouterLink>
        <RouterLink
          v-else
          to="/register"
          class="shrink-0 rounded-full bg-[#3D5FE0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
        >
          Sign up
        </RouterLink>
      </header>

      <!-- Search -->
      <div class="mt-6 flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-[#9CA3AF]">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m20 20-3.5-3.5"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search cars or brands…"
          class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
          @keyup.enter="goToExplore"
        />
      </div>

      <!-- Hero banner -->
      <div class="relative mt-6 overflow-hidden rounded-3xl bg-[#1A2036]">
        <div
          class="flex transition-transform duration-500 ease-out"
          :style="{ transform: `translateX(-${activeBanner * 100}%)` }"
        >
          <div v-for="banner in banners" :key="banner.id" class="w-full shrink-0 px-6 py-10 sm:px-10 sm:py-14">
            <span class="inline-block rounded-full bg-[#3D5FE0] px-3 py-1 text-xs font-semibold text-white">
              {{ banner.tag }}
            </span>
            <h2 class="mt-4 max-w-xs text-2xl font-bold leading-tight text-white sm:max-w-sm sm:text-3xl">
              {{ banner.title }}
            </h2>
            <p class="mt-3 max-w-xs text-sm text-white/70 sm:max-w-sm">
              {{ banner.subtitle }}
            </p>
          </div>
        </div>

        <div class="absolute bottom-4 left-6 flex gap-1.5">
          <button
            v-for="(banner, i) in banners"
            :key="banner.id"
            type="button"
            class="h-1.5 rounded-full transition-all"
            :class="i === activeBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/40'"
            :aria-label="`Show banner ${i + 1}`"
            @click="activeBanner = i"
          />
        </div>
      </div>

      <!-- Brand filter (derived from the fetched vehicles, not hardcoded) -->
      <div v-if="brands.length > 1" class="mt-6 flex gap-3 overflow-x-auto pb-1">
        <button
          v-for="brand in brands"
          :key="brand"
          type="button"
          class="shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition"
          :class="activeBrand === brand
            ? 'border-[#3D5FE0] bg-[#3D5FE0] text-white'
            : 'border-[#E5E7EB] bg-white text-[#1A2036] hover:bg-[#F9FAFB]'"
          @click="activeBrand = brand"
        >
          {{ brand }}
        </button>
      </div>

      <!-- Popular cars -->
      <div class="mt-8 flex items-center justify-between">
        <h3 class="text-lg font-bold text-[#1A2036]">Popular cars</h3>
        <RouterLink to="/explore" class="text-sm font-semibold text-[#3D5FE0] hover:text-[#3350C0]">
          See all
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-64 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ loadError }}
        <button type="button" class="ml-2 font-semibold underline" @click="loadVehicles">Try again</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredVehicles.length === 0" class="mt-6 rounded-2xl border border-dashed border-[#E5E7EB] px-4 py-10 text-center text-sm text-[#6B7280]">
        No vehicles match this filter yet.
      </div>

      <!-- Vehicle grid -->
      <div v-else class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <VehicleCard
          v-for="vehicle in filteredVehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          @toggle-favorite="toggleFavorite"
          @rent="handleRentNow"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth.store'
import VehicleCard from '@/components/vehicles/VehicleCard.vue'
import {
  fetchVehicles,
  fetchMyFavorites,
  addFavorite,
  removeFavorite,
  normalizeVehicle,
} from '@/services/vehicles'

const router = useRouter()
const { state, isAuthenticated } = useAuthStore()

// TODO: swap for a real `firstName` field once the backend returns one on
// the user object (currently OAuth/local login only give id, email, role).
const firstName = computed(() => state.user?.email?.split('@')[0] ?? 'there')
const initials = computed(() => firstName.value.slice(0, 2).toUpperCase())

const searchQuery = ref('')
function goToExplore() {
  router.push({ path: '/explore', query: searchQuery.value ? { q: searchQuery.value } : {} })
}

const banners = [
  {
    id: 1,
    tag: 'Easy rental',
    title: 'Rent your car in just minutes',
    subtitle: 'Choose your favorite vehicle, pick your dates, and hit the road.',
  },
  {
    id: 2,
    tag: 'Weekend deal',
    title: '15% off weekend rentals',
    subtitle: 'Book Friday to Sunday and save on every SUV in the fleet.',
  },
]
const activeBanner = ref(0)
let bannerTimer
onMounted(() => {
  bannerTimer = setInterval(() => {
    activeBanner.value = (activeBanner.value + 1) % banners.length
  }, 4500)
})
onUnmounted(() => clearInterval(bannerTimer))

// ----- Vehicles: live data from GET /api/vehicles -----
const vehicles = ref([])
const loading = ref(true)
const loadError = ref('')
const activeBrand = ref('All')

const brands = computed(() => {
  const unique = [...new Set(vehicles.value.map((v) => v.brand).filter(Boolean))]
  return ['All', ...unique]
})

const filteredVehicles = computed(() =>
  activeBrand.value === 'All'
    ? vehicles.value
    : vehicles.value.filter((v) => v.brand === activeBrand.value)
)

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
        // non-fatal — leave favorite=false
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
    router.push({ path: '/login', query: { redirect: '/home' } })
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