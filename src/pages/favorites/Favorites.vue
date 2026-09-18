<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ $t('favorites.title') }}</h1>
        <button
          type="button"
          class="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          @click="router.push('/explore')"
        >
          {{ $t('favorites.browse') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-64 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error (nothing loaded at all) -->
      <div v-else-if="error && !favorites.length" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
        {{ error }}
        <button type="button" class="ml-2 font-semibold underline" @click="loadFavorites">{{ $t('favorites.tryAgain') }}</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!favorites.length" class="mt-16 flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105" :style="{ backgroundColor: 'var(--color-primary-light)' }">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6" :style="{ color: 'var(--color-primary)' }">
            <path stroke="currentColor" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
          </svg>
        </div>
        <p class="mt-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('favorites.emptyTitle') }}</p>
        <button
          type="button"
          class="mt-4 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
          @click="router.push('/explore')"
        >
          {{ $t('favorites.emptyCta') }}
        </button>
      </div>

      <!-- Grid -->
      <template v-else>
        <div v-if="error" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
          {{ error }}
        </div>

        <TransitionGroup tag="div" name="card" class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <VehicleCard
            v-for="(vehicle, i) in favorites"
            :key="vehicle.id"
            :vehicle="{ ...vehicle, favorite: true }"
            :style="{ transitionDelay: `${Math.min(i, 8) * 50}ms` }"
            @toggle-favorite="handleRemove"
            @rent="goToDetail"
          />
        </TransitionGroup>
      </template>
    </div>
    <SiteFooter /> 
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getFavorites } from '@/services/favorites'
import { removeFavorite, normalizeVehicleDetail, fetchVehicleImages, normalizeImage } from '@/services/vehicles'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue' 
import VehicleCard from '@/components/vehicles/VehicleCard.vue'

const router = useRouter()
const { t } = useI18n()

const favorites = ref([])
const loading = ref(true)
const error = ref('')

async function loadFavorites() {
  loading.value = true
  error.value = ''
  try {
    const raw = await getFavorites()
    // Defensive: backend may return Favorite records with a nested
    // `vehicle`, or Vehicle objects directly — handle both, then run
    // through the same normalizer VehicleDetail.vue uses so fields like
    // .name / .price / .type / .status are consistent everywhere.
    favorites.value = (raw || []).map((item) => normalizeVehicleDetail(item.vehicle ?? item))

    // Favorites DTO doesn't embed images — fetch the primary cover for each
    // vehicle in parallel; one failing image request never blocks the grid.
    await Promise.all(
      favorites.value.map(async (v) => {
        try {
          const { data: imgData } = await fetchVehicleImages(v.id)
          const imgList = Array.isArray(imgData) ? imgData : (imgData?.content ?? [])
          v.image = imgList.map(normalizeImage).find(Boolean) ?? null
        } catch {
          v.image = null
        }
      })
    )
  } catch (e) {
    error.value = e?.response?.data?.message || t('favorites.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(loadFavorites)

// VehicleCard emits 'toggle-favorite' regardless of direction; on this
// page that action only ever means "remove", since everything shown here
// is already a favorite.
async function handleRemove(vehicle) {
  const previous = favorites.value
  favorites.value = favorites.value.filter((v) => v.id !== vehicle.id)
  try {
    await removeFavorite(vehicle.id)
  } catch (e) {
    favorites.value = previous
    error.value = e?.response?.data?.message || t('favorites.removeError')
  }
}

function goToDetail(vehicle) {
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
.card-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.card-enter-from { opacity: 0; transform: translateY(16px); }
.card-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; position: absolute; }
.card-leave-to { opacity: 0; transform: scale(0.9); }
.card-move { transition: transform 0.3s ease; }
</style>