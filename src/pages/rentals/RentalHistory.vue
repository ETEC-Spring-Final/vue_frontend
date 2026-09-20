<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  getMyRentals,
  uploadRentalDocument,
  getMyRentalDocuments,
  RENTAL_STATUS_STEPS,
  rentalStatusStepIndex,
} from "@/services/rentals";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";

const router = useRouter();
const { t } = useI18n();

const rentals = ref([]);
const documents = ref([]);
const loading = ref(true);
const error = ref("");

const uploadingRentalId = ref(null);
const uploadError = ref("");

async function loadAll() {
  loading.value = true;
  error.value = "";
  try {
    const [rentalsRes, docsRes] = await Promise.all([
      getMyRentals(),
      getMyRentalDocuments().catch(() => []),
    ]);
    rentals.value = rentalsRes || [];
    documents.value = docsRes || [];
  } catch (e) {
    error.value = e?.response?.data?.message || t("rentals.loadError");
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);

const active = computed(() =>
  rentals.value.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED")
);
const completed = computed(() =>
  rentals.value.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED")
);

function docsForRental(rentalId) {
  return documents.value.filter((d) => d.rentalId === rentalId);
}

function vehicleLabel(r) {
  const v = r.vehicle;
  if (!v) return `${t("rentals.vehicle")} #${r.vehicleId ?? ""}`;
  return `${v.brandName ?? v.brand ?? ""} ${v.model ?? ""}`.trim();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusLabel(status) {
  return (status || "").replaceAll("_", " ");
}

async function handleFileChange(rental, event) {
  const file = event.target.files?.[0];
  if (!file) return;

  uploadingRentalId.value = rental.id;
  uploadError.value = "";
  try {
    const uploaded = await uploadRentalDocument(rental.id, file);
    documents.value.push(uploaded ?? { rentalId: rental.id, fileName: file.name });
  } catch (e) {
    uploadError.value = e?.response?.data?.message || t("rentals.uploadError");
  } finally {
    uploadingRentalId.value = null;
    event.target.value = "";
  }
}
</script>

<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ $t('rentals.myRentals') }}</h1>
        <button
          type="button" @click="router.push('/my-reservations')"
          class="rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-95"
          :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
        >
          {{ $t('rentals.viewReservations') }}
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mt-8 space-y-4">
        <div v-for="i in 2" :key="i" class="h-40 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error && !rentals.length" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="!rentals.length" class="mt-16 flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105" :style="{ backgroundColor: 'var(--color-primary-light)' }">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6" :style="{ color: 'var(--color-primary)' }">
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M3 13l2-6h14l2 6M5 13h14v6H5v-6ZM7 19v2M17 19v2"/>
          </svg>
        </div>
        <p class="mt-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('rentals.noRentals') }}</p>
        <button
          type="button" @click="router.push('/explore')"
          class="mt-4 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
        >
          {{ $t('rentals.findVehicle') }}
        </button>
      </div>

      <template v-else>
        <Transition name="fade">
          <div v-if="error" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{{ error }}</div>
        </Transition>
        <Transition name="fade">
          <div v-if="uploadError" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{{ uploadError }}</div>
        </Transition>

        <!-- Current / upcoming -->
        <section v-if="active.length" class="mt-8">
          <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('rentals.currentUpcoming') }}</h2>
          <div class="mt-4 space-y-6">
            <article
              v-for="r in active" :key="r.id"
              class="rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex items-center gap-4">
                  <div class="h-12 w-12 shrink-0 rounded-xl" :style="{ background: `linear-gradient(135deg, var(--color-primary), var(--color-text))` }"></div>
                  <div>
                    <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ vehicleLabel(r) }}</p>
                    <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                      {{ formatDate(r.startDate ?? r.pickupDate) }} → {{ formatDate(r.endDate ?? r.returnDate) }}
                    </p>
                  </div>
                </div>
                <span class="inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold" :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }">
                  {{ statusLabel(r.status) }}
                </span>
              </div>

              <!-- Status timeline -->
              <div class="mt-5 flex items-center">
                <template v-for="(step, i) in RENTAL_STATUS_STEPS" :key="step">
                  <div class="flex flex-col items-center flex-1">
                    <div
                      class="h-2.5 w-2.5 rounded-full transition-colors duration-300"
                      :style="{ backgroundColor: i <= rentalStatusStepIndex(r.status) ? 'var(--color-primary)' : 'var(--color-border)' }"
                    ></div>
                    <span class="mt-1.5 hidden text-center text-[10px] leading-tight sm:block" :style="{ color: 'var(--color-text-secondary)' }">
                      {{ statusLabel(step) }}
                    </span>
                  </div>
                  <div
                    v-if="i < RENTAL_STATUS_STEPS.length - 1"
                    class="h-0.5 flex-1 -mt-4 transition-colors duration-300 sm:-mt-5"
                    :style="{ backgroundColor: i < rentalStatusStepIndex(r.status) ? 'var(--color-primary)' : 'var(--color-border)' }"
                  ></div>
                </template>
              </div>

              <!-- Documents -->
              <div class="mt-6 border-t pt-4" :style="{ borderColor: 'var(--color-border)' }">
                <p class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('rentals.documents') }}</p>
                <ul v-if="docsForRental(r.id).length" class="mt-2 space-y-1">
                  <li v-for="doc in docsForRental(r.id)" :key="doc.id ?? doc.fileName" class="text-sm" :style="{ color: 'var(--color-text)' }">
                    {{ doc.fileName ?? doc.name ?? $t('rentals.vehicle') }}
                  </li>
                </ul>
                <p v-else class="mt-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('rentals.noDocuments') }}</p>

                <label
                  class="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:shadow-sm active:scale-95"
                  :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
                >
                  <input type="file" class="hidden" :disabled="uploadingRentalId === r.id" @change="(e) => handleFileChange(r, e)" />
                  {{ uploadingRentalId === r.id ? $t('rentals.uploading') : $t('rentals.uploadDocument') }}
                </label>
              </div>
            </article>
          </div>
        </section>

        <!-- Completed / cancelled -->
        <section v-if="completed.length" class="mt-10">
          <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('rentals.past') }}</h2>
          <div class="mt-4 space-y-4">
            <article
              v-for="r in completed" :key="r.id"
              class="flex flex-col gap-4 rounded-2xl border p-4 opacity-80 transition-opacity duration-200 hover:opacity-100 sm:flex-row sm:items-center sm:justify-between"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 shrink-0 rounded-xl" :style="{ background: `linear-gradient(135deg, var(--color-primary), var(--color-text))` }"></div>
                <div>
                  <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ vehicleLabel(r) }}</p>
                  <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
                    {{ formatDate(r.startDate ?? r.pickupDate) }} → {{ formatDate(r.endDate ?? r.returnDate) }}
                  </p>
                </div>
              </div>
              <span
                class="inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold"
                :style="r.status === 'CANCELLED' ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' } : { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }"
              >
                {{ statusLabel(r.status) }}
              </span>
            </article>
          </div>
        </section>
      </template>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
@keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-page-in { animation: page-in 0.35s ease-out; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>