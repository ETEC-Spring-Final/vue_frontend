<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getMyReservations, getLocations, cancelReservation } from "@/services/reservations";
import { fetchVehicles, normalizeVehicle } from "@/services/vehicles";
import SiteHeader from "@/components/layout/SiteHeader.vue";

const router = useRouter();
const { t } = useI18n();

const reservations = ref([]);
const loading = ref(true);
const error = ref("");
const cancellingId = ref(null);

const vehicleNames = ref({});
const locationNames = ref({});

// Status -> style mapping using theme tokens (not hardcoded hex) so this
// respects dark/light mode and any future palette change automatically.
function statusStyle(status) {
  switch (status) {
    case "CONFIRMED":
      return { backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" };
    case "CANCELLED":
      return { backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444" };
    case "COMPLETED":
      return { backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E" };
    case "EXPIRED":
      return { backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" };
    case "PENDING":
    default:
      return { backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" };
  }
}

async function loadReservations() {
  loading.value = true;
  error.value = "";
  try {
    reservations.value = await getMyReservations();

    // Backend returns flat IDs (vehicleId / pickUpLocationId /
    // returnLocationId), not nested objects. Resolve display names once
    // (both endpoints are public) so the list renders readable labels.
    try {
      const [vehiclesRaw, locationsRaw] = await Promise.all([fetchVehicles(), getLocations()]);
      const vehicles = Array.isArray(vehiclesRaw.data) ? vehiclesRaw.data : (vehiclesRaw.data?.content ?? []);
      const locations = Array.isArray(locationsRaw.data) ? locationsRaw.data : (locationsRaw.data?.content ?? []);

      vehicleNames.value = Object.fromEntries(
        vehicles.map((v) => [v.id, normalizeVehicle(v).name])
      );
      locationNames.value = Object.fromEntries(
        locations.map((l) => [l.id, l.name ?? l.city ?? `#${l.id}`])
      );
    } catch {
      // Non-fatal — labels fall back to the raw id below.
    }
  } catch (e) {
    error.value = e?.response?.data?.message || t("myReservations.loadError");
  } finally {
    loading.value = false;
  }
}

onMounted(loadReservations);

const upcoming = computed(() =>
  reservations.value.filter((r) => r.status !== "CANCELLED" && r.status !== "COMPLETED")
);
const past = computed(() =>
  reservations.value.filter((r) => r.status === "CANCELLED" || r.status === "COMPLETED")
);

function canCancel(r) {
  return r.status === "PENDING";
}

function canPay(r) {
  return !!r.invoiceId && r.status !== "CANCELLED" && r.status !== "COMPLETED";
}

async function handleCancel(id) {
  cancellingId.value = id;
  error.value = "";
  try {
    const updated = await cancelReservation(id);
    const idx = reservations.value.findIndex((r) => r.id === id);
    if (idx !== -1) {
      reservations.value[idx] = updated ?? { ...reservations.value[idx], status: "CANCELLED" };
    }
  } catch (e) {
    error.value = e?.response?.data?.message || t("myReservations.cancelError");
  } finally {
    cancellingId.value = null;
  }
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function vehicleLabel(r) {
  return vehicleNames.value[r.vehicleId] ?? `${t("myReservations.vehicle")} #${r.vehicleId ?? ""}`;
}

function locationLabel(id) {
  return locationNames.value[id] ?? `${t("myReservations.location")} #${id ?? ""}`;
}
</script>

<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ t('myReservations.title') }}</h1>
        <button
          type="button"
          @click="router.push('/explore')"
          class="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
        >
          {{ t('myReservations.browse') }}
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mt-8 space-y-4">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error (nothing loaded) -->
      <div v-else-if="error && !reservations.length" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {{ error }}
        <button type="button" class="ml-2 font-semibold underline" @click="loadReservations">{{ t('myReservations.tryAgain') }}</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!reservations.length" class="mt-16 flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105" :style="{ backgroundColor: 'var(--color-primary-light)' }">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6" :style="{ color: 'var(--color-primary)' }">
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3M4 11h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/>
          </svg>
        </div>
        <p class="mt-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ t('myReservations.emptyTitle') }}</p>
        <button
          type="button" @click="router.push('/explore')"
          class="mt-4 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
        >
          {{ t('myReservations.emptyCta') }}
        </button>
      </div>

      <!-- Lists -->
      <template v-else>
        <Transition name="fade">
          <div v-if="error" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{{ error }}</div>
        </Transition>

        <section v-if="upcoming.length" class="mt-8">
          <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ t('myReservations.upcoming') }}</h2>
          <TransitionGroup tag="div" name="card" class="mt-4 space-y-4">
            <article
              v-for="r in upcoming" :key="r.id"
              class="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-shadow duration-200 hover:shadow-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 shrink-0 rounded-xl" :style="{ background: `linear-gradient(135deg, var(--color-primary), var(--color-text))` }"></div>
                <div>
                  <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ vehicleLabel(r) }}</p>
                  <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                    {{ formatDate(r.pickUpDateTime) }} → {{ formatDate(r.returnDateTime) }}
                  </p>
                  <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                    {{ locationLabel(r.pickUpLocationId) }} → {{ locationLabel(r.returnLocationId) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold" :style="statusStyle(r.status)">
                  {{ r.status }}
                </span>
                <span v-if="r.totalPrice != null" class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">
                  ${{ Number(r.totalPrice).toFixed(2) }}
                </span>
                <button
                  v-if="canPay(r)" type="button"
                  @click="router.push(`/payment/${r.invoiceId}`)"
                  class="rounded-full px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-sm active:scale-95"
                  :style="{ backgroundColor: 'var(--color-primary)' }"
                >
                  {{ t('myReservations.pay') }}
                </button>
                <button
                  v-if="canCancel(r)" type="button" :disabled="cancellingId === r.id"
                  @click="handleCancel(r.id)"
                  class="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  {{ cancellingId === r.id ? t('myReservations.cancelling') : t('myReservations.cancel') }}
                </button>
              </div>
            </article>
          </TransitionGroup>
        </section>

        <section v-if="past.length" class="mt-10">
          <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ t('myReservations.past') }}</h2>
          <div class="mt-4 space-y-4">
            <article
              v-for="r in past" :key="r.id"
              class="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-80 transition-opacity duration-200 hover:opacity-100"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 shrink-0 rounded-xl" :style="{ background: `linear-gradient(135deg, var(--color-primary), var(--color-text))` }"></div>
                <div>
                  <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ vehicleLabel(r) }}</p>
                  <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                    {{ formatDate(r.pickUpDateTime) }} → {{ formatDate(r.returnDateTime) }}
                  </p>
                </div>
              </div>
              <span class="inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold" :style="statusStyle(r.status)">
                {{ r.status }}
              </span>
            </article>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes page-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-page-in { animation: page-in 0.35s ease-out; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.card-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.card-enter-from { opacity: 0; transform: translateY(16px); }
.card-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; position: absolute; }
.card-leave-to { opacity: 0; transform: scale(0.95); }
.card-move { transition: transform 0.3s ease; }
</style>