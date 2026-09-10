<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getFavorites } from "@/services/favorites";
import { removeFavorite, normalizeVehicleDetail } from "@/services/vehicles";

const router = useRouter();

const favorites = ref([]);
const loading = ref(true);
const error = ref("");
const removingId = ref(null);

async function loadFavorites() {
  loading.value = true;
  error.value = "";
  try {
    const raw = await getFavorites();
    // Defensive: backend may return Favorite records with a nested
    // `vehicle`, or Vehicle objects directly — handle both, then run
    // through the same normalizer VehicleDetail.vue uses so fields like
    // .name / .price / .type / .status are consistent everywhere.
    favorites.value = (raw || []).map((item) =>
      normalizeVehicleDetail(item.vehicle ?? item)
    );
  } catch (e) {
    error.value =
      e?.response?.data?.message || "Failed to load your favorites.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadFavorites);

async function handleRemove(vehicle) {
  removingId.value = vehicle.id;
  const previous = favorites.value;
  // Optimistic removal
  favorites.value = favorites.value.filter((v) => v.id !== vehicle.id);
  try {
    await removeFavorite(vehicle.id);
  } catch (e) {
    // Roll back on failure
    favorites.value = previous;
    error.value =
      e?.response?.data?.message || "Could not remove this favorite.";
  } finally {
    removingId.value = null;
  }
}

function statusClass(status) {
  const map = {
    AVAILABLE: "bg-green-50 text-green-600",
    RESERVED: "bg-amber-50 text-amber-600",
    RENTED: "bg-amber-50 text-amber-600",
    MAINTENANCE: "bg-red-50 text-red-600",
  };
  return map[status] ?? "bg-[#F3F4F6] text-[#6B7280]";
}

function goToDetail(vehicle) {
  router.push(`/vehicles/${vehicle.id}`);
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-[#1A2036]">My Favorites</h1>
      <button
        type="button"
        @click="router.push('/explore')"
        class="rounded-full bg-[#3D5FE0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
      >
        Browse vehicles
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-64 animate-pulse rounded-2xl bg-[#F3F4F6]"
      ></div>
    </div>

    <!-- Error (nothing loaded at all) -->
    <div
      v-else-if="error && !favorites.length"
      class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
      <button type="button" class="ml-2 font-semibold underline" @click="loadFavorites">
        Try again
      </button>
    </div>

    <!-- Empty -->
    <div
      v-else-if="!favorites.length"
      class="mt-12 flex flex-col items-center text-center"
    >
      <div
        class="flex h-14 w-14 items-center justify-center rounded-full bg-[#E9EDFB]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6 text-[#3D5FE0]">
          <path stroke="currentColor" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
        </svg>
      </div>
      <p class="mt-4 text-sm text-[#6B7280]">
        You haven't favorited any vehicles yet.
      </p>
      <button
        type="button"
        @click="router.push('/explore')"
        class="mt-4 rounded-full bg-[#3D5FE0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
      >
        Find a vehicle to favorite
      </button>
    </div>

    <!-- Grid -->
    <template v-else>
      <div
        v-if="error"
        class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ error }}
      </div>

      <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="vehicle in favorites"
          :key="vehicle.id"
          class="overflow-hidden rounded-2xl border border-[#E5E7EB] cursor-pointer transition hover:shadow-md"
        >
          <div
            class="relative h-32 bg-gradient-to-br from-[#1A2036] to-[#3D5FE0]"
            @click="goToDetail(vehicle)"
          >
            <span
              class="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1A2036]"
            >
              {{ vehicle.type }}
            </span>
            <button
              type="button"
              :disabled="removingId === vehicle.id"
              class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 disabled:opacity-50"
              aria-label="Remove from favorites"
              @click.stop="handleRemove(vehicle)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" class="h-4 w-4">
                <path stroke="#EF4444" stroke-width="1.6" d="M12 20s-7-4.4-9.5-8.8C.7 8 2.4 4.5 6 4.5c2 0 3.4 1 6 3.3 2.6-2.3 4-3.3 6-3.3 3.6 0 5.3 3.5 3.5 6.7C19 15.6 12 20 12 20Z"/>
              </svg>
            </button>
          </div>

          <div class="p-4" @click="goToDetail(vehicle)">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-[#1A2036]">
                {{ vehicle.name }}
              </p>
              <span
                class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="statusClass(vehicle.status)"
              >
                {{ vehicle.status }}
              </span>
            </div>
            <p class="mt-1 text-sm text-[#6B7280]">
              <span class="font-semibold text-[#3D5FE0]">${{ vehicle.price }}</span>
              /day
            </p>
            <p class="mt-2 text-xs text-[#9CA3AF]">
              {{ vehicle.transmission }} · {{ vehicle.fuel }} · {{ vehicle.seats }} seats
            </p>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>