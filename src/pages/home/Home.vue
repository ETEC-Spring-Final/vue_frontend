<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">

      <!-- Greeting -->
      <header class="flex items-center justify-between gap-4">
        <div>
          <template v-if="isAuthenticated()">
            <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">
              {{ $t('home.greeting', { name: firstName }) }}
            </h1>
            <p class="mt-1 text-sm" :style="{ color: 'var(--color-primary)' }">{{ $t('home.subGreeting') }}</p>
          </template>
          <template v-else>
            <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ $t('home.findRide') }}</h1>
            <p class="mt-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              <RouterLink to="/login" class="font-semibold transition-colors" :style="{ color: 'var(--color-primary)' }">
                {{ $t('home.signIn') }}
              </RouterLink>
              {{ $t('home.signInPrompt') }}
            </p>
          </template>
        </div>
      </header>

      <!-- Search -->
      <div
        class="group mt-6 flex items-center gap-3 rounded-full px-5 py-3.5 ring-1 ring-transparent transition-all duration-200 focus-within:shadow-md focus-within:ring-[var(--color-primary)]"
        :style="{ backgroundColor: 'var(--color-border)' }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 transition-colors duration-200 group-focus-within:text-[var(--color-primary)]" :style="{ color: 'var(--color-text-secondary)' }">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m20 20-3.5-3.5"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('home.searchPlaceholder')"
          class="w-full bg-transparent text-sm outline-none"
          :style="{ color: 'var(--color-text)' }"
          @keyup.enter="goToExplore"
        />
        <Transition name="fade">
          <button
            v-if="searchQuery"
            type="button"
            class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white transition-transform duration-150 active:scale-95"
            :style="{ backgroundColor: 'var(--color-primary)' }"
            @click="goToExplore"
          >
            {{ $t('home.seeAll') }}
          </button>
        </Transition>
      </div>

      <!-- Hero banner -->
      <div
          class="relative mt-6 h-72 overflow-hidden rounded-3xl shadow-lg sm:h-96 lg:h-[28rem]"
          style="background: linear-gradient(135deg, #12172B 0%, #1E2648 60%, color-mix(in srgb, var(--color-primary) 40%, #12172B) 100%);"
        >
        <div
          class="flex h-full transition-transform duration-500 ease-out"
          :style="{ transform: `translateX(-${activeBanner * 100}%)` }"
        >
          <div
            v-for="banner in banners" :key="banner.id"
            class="relative flex h-full w-full shrink-0 flex-col items-start justify-center overflow-hidden px-6 sm:px-10 lg:px-14"
          >
            <!-- Full-bleed car photo, pulled from a randomly-picked vehicle
                 from the API (re-picked on every load — see heroVehicle in
                 the script). Fills the whole banner as a background layer;
                 the gradient (--color-bg) on the outer wrapper shows through
                 as a fallback whenever there's no image yet. -->
            <img
              v-if="heroCarImage"
              :src="heroCarImage"
              alt=""
              class="absolute inset-0 z-0 h-full w-full object-cover"
              loading="lazy"
            />

            <!-- Dark gradient scrim over the photo so the white text/button
                 stay legible — strongest on the left where the copy sits,
                 fading out toward the right so the car is still visible. -->
            <div
              class="pointer-events-none absolute inset-0 z-[1]"
              style="background: linear-gradient(100deg, rgba(12,17,35,0.88) 0%, rgba(12,17,35,0.45) 32%, rgba(12,17,35,0.08) 58%, rgba(12,17,35,0) 75%);"
            />

            <!-- FIX: glow pushed further out + lower opacity + z-[1], so it
                 no longer washes out the banner text on top of it. -->
            <div
              class="pointer-events-none absolute -right-16 -top-16 z-[1] h-48 w-48 rounded-full opacity-10 blur-3xl"
              :style="{ backgroundColor: 'var(--color-primary)' }"
            />

            <span class="relative z-10 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white" :style="{ backgroundColor: 'var(--color-primary)' }">
              {{ banner.tag }}
            </span>
            <h2 class="relative z-10 mt-4 max-w-xs text-2xl font-bold leading-tight text-white sm:max-w-sm sm:text-3xl lg:max-w-md lg:text-4xl">
              {{ banner.title }}
            </h2>
            <p class="relative z-10 mt-3 max-w-xs text-sm text-white/70 sm:max-w-sm lg:max-w-md lg:text-base">
              {{ banner.subtitle }}
            </p>
            <RouterLink
              to="/explore"
              class="relative z-10 mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1A2036] transition-all duration-200 hover:gap-2.5 hover:shadow-lg active:scale-95"
            >
              {{ $t('home.seeAll') }}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 transition-transform duration-200">
                <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/>
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Progress-bar indicators -->
        <div class="absolute bottom-4 left-6 z-10 flex gap-2">
          <button
            v-for="(banner, i) in banners"
            :key="banner.id"
            type="button"
            class="relative h-1.5 w-8 overflow-hidden rounded-full bg-white/25"
            :aria-label="`Show banner ${i + 1}`"
            @click="setBanner(i)"
          >
            <span
              v-if="i === activeBanner"
              :key="progressKey"
              class="absolute inset-y-0 left-0 rounded-full bg-white"
              :style="{ animation: `bannerProgress ${bannerIntervalMs}ms linear` }"
            />
            <span v-else-if="i < activeBanner" class="absolute inset-0 rounded-full bg-white/70" />
          </button>
        </div>
      </div>

      <!-- Trust stats strip -->
      <div class="mt-6 grid grid-cols-3 gap-3 rounded-2xl border p-4 sm:p-5" :style="{ borderColor: 'var(--color-border)' }">
        <div v-for="s in trustStats" :key="s.label" class="text-center">
          <p class="text-lg font-bold sm:text-xl" :style="{ color: 'var(--color-primary)' }">{{ s.value }}</p>
          <p class="mt-0.5 text-[11px] sm:text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ s.label }}</p>
        </div>
      </div>

      <!-- Category quick-filters -->
      <div v-if="categories.length > 1" class="mt-6 flex gap-3 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat.value"
          type="button"
          class="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-2.5 transition-all duration-200 active:scale-95"
          :style="activeCategory === cat.value
            ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' }
            : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
          @click="activeCategory = cat.value"
        >
          <component
            :is="cat.icon"
            class="h-5 w-5"
            :style="{ color: activeCategory === cat.value ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
          />
          <span
            class="text-xs font-semibold"
            :style="{ color: activeCategory === cat.value ? 'var(--color-primary)' : 'var(--color-text)' }"
          >
            {{ cat.label }}
          </span>
        </button>
      </div>

      <!-- Brand filter (with brand logos) -->
      <div v-if="brands.length > 1" class="mt-4 flex gap-3 overflow-x-auto pb-1">
        <button
          v-for="brand in brands"
          :key="brand.name"
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95"
          :style="activeBrand === brand.name
            ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)', color: '#fff' }
            : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }"
          @click="activeBrand = brand.name"
        >
          <img
            v-if="brand.image"
            :src="brand.image"
            :alt="brand.name"
            class="h-5 w-5 rounded-full bg-white object-contain"
            loading="lazy"
          />
          {{ brand.name === 'All' ? $t('home.allBrands') : brand.name }}
        </button>
      </div>

      <!-- Popular cars -->
      <div class="mt-8 flex items-center justify-between">
        <h3 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('home.popularCars') }}</h3>
        <RouterLink to="/explore" class="group flex items-center gap-1 text-sm font-semibold transition-colors" :style="{ color: 'var(--color-primary)' }">
          {{ $t('home.seeAll') }}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1">
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/>
          </svg>
        </RouterLink>
      </div>

      <!-- Loading (shimmer skeleton) -->
      <div v-if="loading" class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-64 overflow-hidden rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }">
          <div class="shimmer h-full w-full"></div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-10 text-center" :style="{ borderColor: 'var(--color-border)' }">
        <div class="flex h-12 w-12 items-center justify-center rounded-full" style="background-color: rgba(239,68,68,0.1);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6 text-red-600">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
            <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ loadError }}</p>
        <button
          type="button"
          class="rounded-full px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          @click="loadVehicles"
        >
          {{ $t('common.tryAgain') }}
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredVehicles.length === 0" class="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-10 text-center" :style="{ borderColor: 'var(--color-border)' }">
        <div class="flex h-12 w-12 items-center justify-center rounded-full" :style="{ backgroundColor: 'var(--color-primary-light)' }">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6" :style="{ color: 'var(--color-primary)' }">
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M9 9h.01M15 9h.01M8 14s1.5 2 4 2 4-2 4-2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/>
          </svg>
        </div>
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('home.noVehicles') }}</p>
      </div>

      <!-- Vehicle grid (max HOME_LIMIT cards; the full fleet lives on /explore) -->
      <TransitionGroup
        v-else
        tag="div"
        name="card"
        class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <VehicleCard
          v-for="(vehicle, i) in visibleVehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          :style="{ transitionDelay: `${Math.min(i, 6) * 60}ms` }"
          @toggle-favorite="toggleFavorite"
          @rent="handleRentNow"
        />
      </TransitionGroup>

      <!-- "See all" button — only when there are more vehicles than the grid shows -->
      <div v-if="!loading && !loadError && hasMore" class="mt-8 text-center">
        <RouterLink
          to="/explore"
          class="group inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:gap-3 hover:shadow-md active:scale-95"
          :style="{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }"
        >
          {{ $t('home.seeAll') }}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/>
          </svg>
        </RouterLink>
      </div>

      <!-- Why book with us -->
      <section ref="whyUsRef" class="mt-16" :class="whyUsVisible ? 'reveal-in' : 'reveal-pending'">
        <h2 class="text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('home.whyUs.title') }}</h2>
        <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('home.whyUs.subtitle') }}</p>
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            v-for="(item, i) in whyUsItems" :key="item.title"
            class="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm"
            :style="{ borderColor: 'var(--color-border)', transitionDelay: `${i * 80}ms` }"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full"
              :style="{ backgroundColor: 'var(--color-primary-light)' }"
            >
              <component :is="item.icon" class="h-5 w-5" :style="{ color: 'var(--color-primary)' }" />
            </div>
            <h3 class="mt-3 text-sm font-bold" :style="{ color: 'var(--color-text)' }">{{ item.title }}</h3>
            <p class="mt-1 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">{{ item.description }}</p>
          </div>
        </div>
      </section>

    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
const { t } = useI18n()
const { state, isAuthenticated } = useAuthStore()

const firstName = computed(() => state.user?.email?.split('@')[0] ?? 'there')

const searchQuery = ref('')
function goToExplore() {
  router.push({ path: '/explore', query: searchQuery.value ? { q: searchQuery.value } : {} })
}

// ----- Hero banners -----
const banners = computed(() => [
  { id: 1, tag: t('home.banner1.tag'), title: t('home.banner1.title'), subtitle: t('home.banner1.subtitle') },
  { id: 2, tag: t('home.banner2.tag'), title: t('home.banner2.title'), subtitle: t('home.banner2.subtitle') },
])
const activeBanner = ref(0)
const bannerIntervalMs = 4500
const progressKey = ref(0)
let bannerTimer
function setBanner(i) {
  activeBanner.value = i
  progressKey.value++
  restartBannerTimer()
}
function restartBannerTimer() {
  clearInterval(bannerTimer)
  bannerTimer = setInterval(() => {
    activeBanner.value = (activeBanner.value + 1) % banners.value.length
    progressKey.value++
  }, bannerIntervalMs)
}
onMounted(restartBannerTimer)
onUnmounted(() => clearInterval(bannerTimer))

// ----- Trust stats strip -----
const trustStats = computed(() => [
  { value: '38+', label: t('home.stats.vehicles') },
  { value: '6', label: t('home.stats.cities') },
  { value: '4.9★', label: t('home.stats.rating') },
])

// ----- Category icons -----
const icon = (path) => ({ render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none' }, [h('path', { stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: path })]) })
const CATEGORY_ICONS = {
  All: icon('M4 11l1.5-4.5A2 2 0 0 1 7.4 5h9.2a2 2 0 0 1 1.9 1.5L20 11m-16 0h16m-16 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2'),
  SEDAN: icon('M4 11l1.5-4.5A2 2 0 0 1 7.4 5h9.2a2 2 0 0 1 1.9 1.5L20 11m-16 0h16m-16 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2'),
  SUV: icon('M3 12l1.5-5A2 2 0 0 1 6.4 5.5h11.2a2 2 0 0 1 1.9 1.5L21 12m-18 0h18m-18 0a2 2 0 0 0-2 2v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h14v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3a2 2 0 0 0-2-2M7 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'),
  VAN: icon('M3 16V9a2 2 0 0 1 2-2h9l4 4v5m-15 0h15m-15 0a1.5 1.5 0 1 0 3 0m-3 0a1.5 1.5 0 1 1 3 0m9 0a1.5 1.5 0 1 0 3 0m-3 0a1.5 1.5 0 1 1 3 0'),
  ELECTRIC: icon('M13 2 4 14h6l-1 8 9-12h-6l1-8Z'),
}
const iconFor = (type) => CATEGORY_ICONS[type] ?? CATEGORY_ICONS.All

// ----- Vehicles: live data from GET /api/vehicles -----
// The home page only shows a small "popular" selection; the whole fleet
// (with search + filters) lives on /explore.
const HOME_LIMIT = 9

const vehicles = ref([])
const loading = ref(true)
const loadError = ref('')
const activeBrand = ref('All')
const activeCategory = ref('All')

// Brand chips carry the brand logo (VehicleResponseDTO.brandImage) when one exists.
const brands = computed(() => {
  const map = new Map()
  for (const v of vehicles.value) {
    if (v.brand && !map.has(v.brand)) map.set(v.brand, { name: v.brand, image: v.brandImage })
  }
  return [{ name: 'All', image: null }, ...map.values()]
})

const categories = computed(() => {
  const unique = [...new Set(vehicles.value.map((v) => v.type).filter((t) => t && t !== '—'))]
  // The "All" chip filters by car TYPE, so it uses the "All types" label.
  return [{ value: 'All', label: t('explore.allTypes'), icon: iconFor('All') },
    ...unique.map((type) => ({ value: type, label: type, icon: iconFor(type) }))]
})

const filteredVehicles = computed(() =>
  vehicles.value.filter((v) =>
    (activeBrand.value === 'All' || v.brand === activeBrand.value) &&
    (activeCategory.value === 'All' || v.type === activeCategory.value)
  )
)

// Only the first HOME_LIMIT matches are rendered.
const visibleVehicles = computed(() => filteredVehicles.value.slice(0, HOME_LIMIT))
const hasMore = computed(() => filteredVehicles.value.length > HOME_LIMIT)

// Hero banner car photo: picked at random from the full vehicle list on
// every load (see pickHeroVehicle() in loadVehicles()), not just the first
// one. heroVehicle holds a reference into vehicles.value, so once
// loadCoverImages() sets its `.image` field the computed below updates
// reactively — normalizeImage() may return either a plain URL string or an
// object with a url/imageUrl field, so heroCarImage handles both shapes.
const heroVehicle = ref(null)
const heroCarImage = computed(() => {
  const img = heroVehicle.value?.image
  if (!img) return null
  return typeof img === 'string' ? img : (img.url ?? img.imageUrl ?? null)
})

// GET /api/vehicles (list) doesn't include images — only
// GET /api/vehicle-images/{id} does, per vehicle. Since only the visible
// cards (plus the hero banner's first vehicle) need a cover photo, request
// images just for those (max HOME_LIMIT + 1 requests instead of one per
// vehicle in the whole fleet). One failing image request never blocks the grid.
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

// Runs whenever the visible set changes (initial load, brand/category filter).
// The hero banner's random vehicle is fetched separately in loadVehicles();
// loadCoverImages() dedupes via imageRequested, so there's no double-fetch
// if that random vehicle also happens to be in visibleVehicles.
watch(visibleVehicles, (list) => loadCoverImages(list), { immediate: true })

async function loadVehicles() {
  loading.value = true
  loadError.value = ''
  imageRequested.clear() // fresh vehicle objects after a reload need their images again
  try {
    const { data } = await fetchVehicles()
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    vehicles.value = list.map(normalizeVehicle)

    // Hero banner shows a random car each load. loadCoverImages() dedupes
    // against imageRequested (cleared above), so this is a no-op if the
    // chosen vehicle is already being fetched as part of visibleVehicles.
    if (vehicles.value.length) {
      heroVehicle.value = vehicles.value[Math.floor(Math.random() * vehicles.value.length)]
      loadCoverImages([heroVehicle.value])
    } else {
      heroVehicle.value = null
    }

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
    loadError.value = err.response?.data?.message || t('home.loadError')
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

// ----- "Why book with us" -----
const whyIcon = (path) => ({ render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none' }, [h('path', { stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: path })]) })
const whyUsItems = computed(() => [
  { title: t('home.whyUs.item1Title'), description: t('home.whyUs.item1Desc'), icon: whyIcon('M4 12l6 6L20 6') },
  { title: t('home.whyUs.item2Title'), description: t('home.whyUs.item2Desc'), icon: whyIcon('M4 10h16v8H4v-8Zm0 0 2-5h12l2 5') },
  { title: t('home.whyUs.item3Title'), description: t('home.whyUs.item3Desc'), icon: whyIcon('M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z') },
])

const whyUsRef = ref(null)
const whyUsVisible = ref(false)
let observer
onMounted(() => {
  if (!whyUsRef.value) return
  observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { whyUsVisible.value = true; observer.disconnect() } },
    { threshold: 0.15 }
  )
  observer.observe(whyUsRef.value)
})
onUnmounted(() => observer?.disconnect())
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.shimmer {
  background: linear-gradient(
    100deg,
    transparent 30%,
    color-mix(in srgb, var(--color-text) 8%, transparent) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  from { background-position: 150% 0; }
  to { background-position: -50% 0; }
}

@keyframes bannerProgress {
  from { width: 0%; }
  to { width: 100%; }
}

.reveal-pending {
  opacity: 0;
  transform: translateY(24px);
}
.reveal-in {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
  .reveal-pending, .reveal-in { opacity: 1; transform: none; }
}
</style>
