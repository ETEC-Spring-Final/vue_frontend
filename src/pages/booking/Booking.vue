<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { fetchVehicleById, normalizeVehicleDetail } from "@/services/vehicles";
import {
  createReservation,
  getLocations,
  getServices,
  getDiscounts,
  calculatePriceBreakdown,
} from "@/services/reservations";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// /booking/:vehicleId (path) or legacy /reservations?vehicleId= (query)
const vehicleId = route.params.vehicleId || route.query.vehicleId;

const vehicle = ref(null);
const locations = ref([]);
const services = ref([]);
const discounts = ref([]);

const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref(false);
const createdInvoiceId = ref("");

const form = ref({
  pickUpLocationId: "",
  returnLocationId: "",
  pickUpDateTime: "",
  returnDateTime: "",
  selectedServiceIds: [],
  discountCode: "",
});

const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
const minDateTime = now.toISOString().slice(0, 16);

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [vehicleRes, locationsRes, servicesRes, discountsRes] =
      await Promise.all([
        vehicleId ? fetchVehicleById(vehicleId) : Promise.resolve(null),
        getLocations(),
        getServices(),
        getDiscounts(),
      ]);
    vehicle.value = vehicleRes ? normalizeVehicleDetail(vehicleRes.data) : null;
    locations.value = Array.isArray(locationsRes) ? locationsRes : (locationsRes?.content ?? []);
    services.value = Array.isArray(servicesRes) ? servicesRes : (servicesRes?.content ?? []);
    discounts.value = Array.isArray(discountsRes) ? discountsRes : (discountsRes?.content ?? []);
  } catch (e) {
    error.value = e?.response?.data?.message || t("booking.loadError");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadData();
  if (!vehicleId) {
    error.value = t("booking.noVehicle");
  }
});

const selectedServices = computed(() =>
  services.value.filter((s) => form.value.selectedServiceIds.includes(s.id))
);

const matchedDiscount = computed(() => {
  if (!form.value.discountCode) return null;
  return (
    discounts.value.find(
      (d) => d.code?.toLowerCase() === form.value.discountCode.trim().toLowerCase()
    ) || null
  );
});

const datesValid = computed(() => {
  if (!form.value.pickUpDateTime || !form.value.returnDateTime) return false;
  return new Date(form.value.returnDateTime) > new Date(form.value.pickUpDateTime);
});

const breakdown = computed(() => {
  if (!vehicle.value || !datesValid.value) return null;
  return calculatePriceBreakdown({
    pricePerDay: vehicle.value.price ?? 0,
    pickupDate: form.value.pickUpDateTime,
    returnDate: form.value.returnDateTime,
    insurancePerDay: 0,
    selectedServices: selectedServices.value,
    discount: matchedDiscount.value,
  });
});

const canSubmit = computed(() => {
  return (
    !!vehicle.value &&
    !!form.value.pickUpLocationId &&
    !!form.value.returnLocationId &&
    datesValid.value &&
    !submitting.value
  );
});

function toggleService(id) {
  const idx = form.value.selectedServiceIds.indexOf(id);
  if (idx === -1) form.value.selectedServiceIds.push(id);
  else form.value.selectedServiceIds.splice(idx, 1);
}

function toLocalDateTime(v) {
  if (!v) return v;
  return `${v}:00`;
}

async function handleSubmit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  error.value = "";
  try {
    const payload = {
      vehicleId: vehicle.value.id,
      pickUpLocationId: form.value.pickUpLocationId,
      returnLocationId: form.value.returnLocationId,
      pickUpDateTime: toLocalDateTime(form.value.pickUpDateTime),
      returnDateTime: toLocalDateTime(form.value.returnDateTime),
      serviceIds: form.value.selectedServiceIds,
      discountCode: form.value.discountCode.trim() || undefined,
    };
    const created = await createReservation(payload);
    const invoiceId = created?.invoiceId ?? route.query.invoiceId;
    createdInvoiceId.value = invoiceId ? String(invoiceId) : "";
    success.value = true;
    if (createdInvoiceId.value) {
      setTimeout(() => router.push(`/payment/${createdInvoiceId.value}`), 1400);
    } else {
      setTimeout(() => router.push("/my-reservations"), 1400);
    }
  } catch (e) {
    error.value = e?.response?.data?.message || t("booking.submitError");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ t('booking.title') }}</h1>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <div class="h-24 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
          <div class="h-14 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
          <div class="h-14 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        </div>
        <div class="h-56 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error (no vehicle / load failure) -->
      <div v-else-if="error && !vehicle" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
        {{ error }}
      </div>

      <!-- Success -->
      <Transition name="fade">
        <div v-if="success" class="mt-6 rounded-2xl px-4 py-3 text-sm font-medium" :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }">
          {{ t(createdInvoiceId ? 'booking.success' : 'booking.successNoInvoice') }}
        </div>
      </Transition>

      <!-- Main form -->
      <div v-if="!loading && !success && vehicle" class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: form -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Vehicle summary -->
          <article
            class="overflow-hidden rounded-2xl border p-4 flex gap-4 items-center transition-shadow duration-200 hover:shadow-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <div class="h-16 w-16 shrink-0 rounded-xl" :style="{ background: `linear-gradient(135deg, var(--color-primary), var(--color-text))` }"></div>
            <div>
              <p class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ vehicle.name }}</p>
              <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">${{ Number(vehicle.price ?? 0).toFixed(2) }} / {{ t('booking.day') }}</p>
            </div>
          </article>

          <!-- Dates -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ t('booking.pickupDateTime') }}</span>
              <input
                v-model="form.pickUpDateTime" type="datetime-local" :min="minDateTime"
                class="mt-1 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-shadow duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              />
            </label>
            <label class="block">
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ t('booking.returnDateTime') }}</span>
              <input
                v-model="form.returnDateTime" type="datetime-local" :min="form.pickUpDateTime || minDateTime"
                class="mt-1 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-shadow duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              />
            </label>
          </div>
          <Transition name="fade">
            <p v-if="form.pickUpDateTime && form.returnDateTime && !datesValid" class="text-sm text-red-600">
              {{ t('booking.datesInvalid') }}
            </p>
          </Transition>

          <!-- Locations -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ t('booking.pickupLocation') }}</span>
              <select
                v-model="form.pickUpLocationId"
                class="mt-1 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-shadow duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              >
                <option value="" disabled>{{ t('booking.selectLocation') }}</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ t('booking.returnLocation') }}</span>
              <select
                v-model="form.returnLocationId"
                class="mt-1 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-shadow duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              >
                <option value="" disabled>{{ t('booking.selectLocation') }}</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </label>
          </div>

          <!-- Additional services -->
          <div v-if="services.length">
            <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ t('booking.services') }}</span>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="s in services" :key="s.id" type="button" @click="toggleService(s.id)"
                class="rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 active:scale-95"
                :style="form.selectedServiceIds.includes(s.id)
                  ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                  : { backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
              >
                {{ s.name }} (+${{ Number(s.price).toFixed(2) }})
              </button>
            </div>
          </div>

          <!-- Discount code -->
          <label class="block">
            <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ t('booking.discountCode') }}</span>
            <input
              v-model="form.discountCode" type="text" placeholder="e.g. SUMMER10"
              class="mt-1 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-shadow duration-200 focus:shadow-sm"
              :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
            />
            <Transition name="fade" mode="out-in">
              <span v-if="form.discountCode && !matchedDiscount" key="pending" class="mt-1 block text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                {{ t('booking.codeHint') }}
              </span>
              <span v-else-if="matchedDiscount" key="ok" class="mt-1 block text-xs text-green-600">
                {{ t('booking.codeApplied') }}
              </span>
            </Transition>
          </label>

          <Transition name="fade">
            <div v-if="error" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">{{ error }}</div>
          </Transition>
        </div>

        <!-- Right: price breakdown -->
        <aside class="lg:col-span-1">
          <article
            class="rounded-2xl border p-5 sticky top-6 space-y-3 transition-shadow duration-200 hover:shadow-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ t('booking.priceSummary') }}</h2>

            <Transition name="fade" mode="out-in">
              <div v-if="!breakdown" key="empty" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                {{ t('booking.briefHint') }}
              </div>

              <div v-else key="filled" class="space-y-3">
                <div class="flex justify-between text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                  <span>{{ t('booking.rental', { days: breakdown.days }) }}</span>
                  <span>${{ breakdown.rentalTotal.toFixed(2) }}</span>
                </div>
                <div v-if="breakdown.insuranceTotal" class="flex justify-between text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                  <span>{{ t('booking.insurance') }}</span>
                  <span>${{ breakdown.insuranceTotal.toFixed(2) }}</span>
                </div>
                <div v-if="breakdown.servicesTotal" class="flex justify-between text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                  <span>{{ t('booking.additionalServices') }}</span>
                  <span>${{ breakdown.servicesTotal.toFixed(2) }}</span>
                </div>
                <div v-if="breakdown.discountAmount" class="flex justify-between text-sm text-green-600">
                  <span>{{ t('booking.discount') }}</span>
                  <span>-${{ breakdown.discountAmount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between border-t pt-3 text-base font-bold" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }">
                  <span>{{ t('booking.total') }}</span>
                  <span>${{ breakdown.grandTotal.toFixed(2) }}</span>
                </div>
              </div>
            </Transition>

            <button
              type="button" :disabled="!canSubmit" @click="handleSubmit"
              class="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
              :style="{ backgroundColor: 'var(--color-primary)' }"
            >
              {{ submitting ? t('booking.submitting') : t('booking.confirm') }}
            </button>
          </article>
        </aside>
      </div>
    </div>

    <SiteFooter />
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
</style>