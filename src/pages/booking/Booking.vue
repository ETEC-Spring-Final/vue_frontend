<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  fetchVehicleById,
  normalizeVehicleDetail,
  fetchBookedDates,
  fetchVehicleImages,
  normalizeImage,
} from "@/services/vehicles";
import { getAdditionalServices } from "@/services/additionalServices";
import {
  createReservation,
  getLocations,
  getDiscounts,
  calculatePriceBreakdown,
} from "@/services/reservations";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";

const route = useRoute();
const router = useRouter();
const { t, te, locale } = useI18n();

// Translate with a fallback so a missing key never shows "booking.xxx" on screen.
const tr = (key, fallback) => (te(key) ? t(key) : fallback);

// /booking/:vehicleId (path) or legacy /reservations?vehicleId= (query)
const vehicleId = route.params.vehicleId || route.query.vehicleId;

const vehicle = ref(null);
const locations = ref([]);
const services = ref([]);
const discounts = ref([]);
const bookedDates = ref([]);
const bookedDatesLoaded = ref(false);

const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref(false);
const createdInvoiceId = ref("");
const imgFailed = ref(false);
const galleryUrl = ref("");
const sameLocation = ref(true);

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

const isKm = computed(() => ["km", "kh"].includes(locale.value));
const localeTag = computed(() => (isKm.value ? "km-KH" : undefined));

const daysBetween = (a, b) => {
  const d = Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
  return Math.max(1, d);
};

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [vehicleRes, locationsRes, servicesRes, discountsRes, bookedRes] =
      await Promise.all([
        vehicleId ? fetchVehicleById(vehicleId) : Promise.resolve(null),
        getLocations(),
        getAdditionalServices(),
        getDiscounts(),
        vehicleId ? fetchBookedDates(vehicleId) : Promise.resolve(null),
      ]);
    vehicle.value = vehicleRes ? normalizeVehicleDetail(vehicleRes.data) : null;
    locations.value = Array.isArray(locationsRes) ? locationsRes : (locationsRes?.content ?? []);
    services.value = Array.isArray(servicesRes) ? servicesRes : (servicesRes?.content ?? []);
    discounts.value = Array.isArray(discountsRes) ? discountsRes : (discountsRes?.content ?? []);
    const booked = Array.isArray(bookedRes?.data ?? bookedRes) ? (bookedRes?.data ?? bookedRes) : [];
    bookedDates.value = booked.map((b) => ({
      startDate: b.startDate ?? b.pickUpDateTime ?? b.start,
      endDate: b.endDate ?? b.returnDateTime ?? b.end,
    }));
    bookedDatesLoaded.value = true;
  } catch (e) {
    error.value = e?.response?.data?.message || t("booking.loadError");
  } finally {
    loading.value = false;
  }
}

// normalizeVehicleDetail() leaves `image` null, so fetch the cover photo
// from GET /vehicle-images/{id} (primary first, else lowest displayOrder).
async function loadVehicleImage() {
  if (!vehicleId) return;
  try {
    const { data } = await fetchVehicleImages(vehicleId);
    const list = Array.isArray(data) ? data : (data?.content ?? []);
    const sorted = [...list].sort(
      (a, b) => (a.attachment?.displayOrder ?? 0) - (b.attachment?.displayOrder ?? 0)
    );
    const cover = sorted.find((i) => i.attachment?.isPrimary) || sorted[0];
    galleryUrl.value = cover ? normalizeImage(cover) || "" : "";
  } catch {
    galleryUrl.value = "";
  }
}

onMounted(async () => {
  await Promise.all([loadData(), loadVehicleImage()]);
  if (!vehicleId) {
    error.value = t("booking.noVehicle");
  }
});

// ----- Vehicle presentation -----
const vehicleImage = computed(() => {
  const v = vehicle.value;
  if (!v || imgFailed.value) return "";
  const first = Array.isArray(v.images) ? v.images[0] : null;
  return (
    galleryUrl.value ||
    v.image ||
    v.imageUrl ||
    v.primaryImage ||
    v.primaryImageUrl ||
    (typeof first === "string" ? first : first?.url || first?.fileUrl || first?.attachment?.fileUrl) ||
    ""
  );
});

const vehicleChips = computed(() => {
  const v = vehicle.value;
  if (!v) return [];
  return [
    v.type ?? v.category,
    v.transmission,
    v.fuelType ?? v.fuel,
    v.seats ? `${v.seats} ${tr("booking.seats", "seats")}` : "",
  ].filter((x) => x && x !== "—");
});

// ----- Services -----
const selectedServices = computed(() =>
  services.value.filter((s) => form.value.selectedServiceIds.includes(s.id))
);

const localizedServiceName = (s) => (isKm.value && s.nameKh ? s.nameKh : s.name);
const localizedServiceDesc = (s) => (isKm.value && s.descriptionKh ? s.descriptionKh : s.description);

const ICONS = {
  driver: "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  gps: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  child: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 14s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01",
  insurance: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3ZM9 12l2 2 4-4",
  plus: "M12 5v14M5 12h14",
};

// The backend "icon" field may hold an emoji or a plain word like "driver" / "gps".
const isEmoji = (v) => !!v && !/^[\w\s-]+$/.test(v) && [...v].length <= 2;

function serviceIconPath(s) {
  const key = String(s.icon || s.name || "").toLowerCase();
  if (/driver|chauffeur/.test(key)) return ICONS.driver;
  if (/gps|navig/.test(key)) return ICONS.gps;
  if (/child|baby|seat/.test(key)) return ICONS.child;
  if (/insur|cover/.test(key)) return ICONS.insurance;
  return ICONS.plus;
}

function toggleService(id) {
  const idx = form.value.selectedServiceIds.indexOf(id);
  if (idx === -1) form.value.selectedServiceIds.push(id);
  else form.value.selectedServiceIds.splice(idx, 1);
}

// ----- Discount -----
const matchedDiscount = computed(() => {
  if (!form.value.discountCode) return null;
  return (
    discounts.value.find(
      (d) => d.code?.toLowerCase() === form.value.discountCode.trim().toLowerCase()
    ) || null
  );
});

// ----- Dates -----
const datesValid = computed(() => {
  if (!form.value.pickUpDateTime || !form.value.returnDateTime) return false;
  return new Date(form.value.returnDateTime) > new Date(form.value.pickUpDateTime);
});

// Client-side overlap check against fetched booked windows.
const overlapsBooked = computed(() => {
  if (!form.value.pickUpDateTime || !form.value.returnDateTime || !bookedDates.value.length) {
    return false;
  }
  const selStart = new Date(form.value.pickUpDateTime).getTime();
  const selEnd = new Date(form.value.returnDateTime).getTime();
  return bookedDates.value.some((b) => {
    const bStart = new Date(b.startDate).getTime();
    const bEnd = new Date(b.endDate).getTime();
    return selStart < bEnd && selEnd > bStart;
  });
});

function formatBookedRange(b) {
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const start = new Date(b.startDate).toLocaleDateString(localeTag.value, opts);
  const end = new Date(b.endDate).toLocaleDateString(localeTag.value, opts);
  return `${start} – ${end}`;
}

function formatDateTime(v) {
  if (!v) return "";
  return new Date(v).toLocaleString(localeTag.value, { dateStyle: "medium", timeStyle: "short" });
}

function toInputValue(d) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 16);
}

// Quick duration buttons: set return = pick-up + N days
const quickDurations = [1, 3, 7];
function setDuration(days) {
  if (!form.value.pickUpDateTime) return;
  const d = new Date(form.value.pickUpDateTime);
  d.setDate(d.getDate() + days);
  form.value.returnDateTime = toInputValue(d);
}
const dayWord = (n) => (n === 1 ? tr("booking.day", "day") : tr("booking.daysUnit", "days"));

// ----- Locations -----
watch(
  () => form.value.pickUpLocationId,
  (id) => {
    if (sameLocation.value) form.value.returnLocationId = id;
  }
);
watch(sameLocation, (on) => {
  if (on) form.value.returnLocationId = form.value.pickUpLocationId;
});

// ----- Price -----
const breakdown = computed(() => {
  if (!vehicle.value || !datesValid.value) return null;
  const days = daysBetween(form.value.pickUpDateTime, form.value.returnDateTime);
  const perDayTotal = selectedServices.value.reduce(
    (sum, s) => sum + (Number(s.pricePerDay) || Number(s.price) || 0),
    0
  );
  return {
    ...calculatePriceBreakdown({
      pricePerDay: vehicle.value.price ?? 0,
      pickupDate: form.value.pickUpDateTime,
      returnDate: form.value.returnDateTime,
      insurancePerDay: 0,
      selectedServices: [{ id: "__perDayTotal", name: "", price: perDayTotal * days }],
      discount: matchedDiscount.value,
    }),
    perDayTotal,
  };
});

// ----- Steps / validation -----
const datesDone = computed(() => datesValid.value && !overlapsBooked.value);
const locationsDone = computed(() => !!form.value.pickUpLocationId && !!form.value.returnLocationId);

const canSubmit = computed(() => {
  return (
    !!vehicle.value &&
    locationsDone.value &&
    datesValid.value &&
    !overlapsBooked.value &&
    !submitting.value
  );
});

// What is still needed before the confirm button works
const missing = computed(() => {
  const m = [];
  if (!datesValid.value) m.push(tr("booking.missingDates", "Choose valid pick-up and return dates"));
  else if (overlapsBooked.value) m.push(t("booking.overlapsBooked"));
  if (!form.value.pickUpLocationId) m.push(tr("booking.missingPickup", "Choose a pick-up location"));
  if (!form.value.returnLocationId) m.push(tr("booking.missingReturn", "Choose a return location"));
  return m;
});

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

const cardStyle = { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" };
const pillInput = { backgroundColor: "var(--color-border)", color: "var(--color-text)" };
</script>

<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
      <!-- Title row -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:opacity-80 active:scale-95"
          :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
          :aria-label="tr('booking.back', 'Back')"
          @click="router.back()"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ t('booking.title') }}</h1>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">
          <div class="h-40 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
          <div class="h-48 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
          <div class="h-32 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        </div>
        <div class="h-72 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error (no vehicle / load failure) -->
      <div v-else-if="error && !vehicle" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
        {{ error }}
      </div>

      <!-- Success -->
      <Transition name="fade">
        <div
          v-if="success"
          class="mt-8 flex items-center gap-4 rounded-2xl border p-6"
          :style="{ backgroundColor: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }"
        >
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white" :style="{ backgroundColor: 'var(--color-primary)' }">
            <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6"><path stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </span>
          <div>
            <p class="font-semibold" :style="{ color: 'var(--color-primary)' }">
              {{ t(createdInvoiceId ? 'booking.success' : 'booking.successNoInvoice') }}
            </p>
            <p v-if="createdInvoiceId" class="mt-0.5 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
              {{ tr('booking.redirecting', 'Taking you to payment…') }}
            </p>
          </div>
        </div>
      </Transition>

      <!-- Main -->
      <div v-if="!loading && !success && vehicle" class="mt-6">
          <!-- Vehicle card -->
          <article class="overflow-hidden rounded-2xl border sm:flex sm:items-stretch" :style="cardStyle">
            <div class="relative h-48 shrink-0 sm:h-auto sm:min-h-[12rem] sm:w-80">
              <img
                v-if="vehicleImage"
                :src="vehicleImage"
                :alt="vehicle.name"
                class="absolute inset-0 h-full w-full object-cover"
                @error="imgFailed = true"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center text-white"
                :style="{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-text))' }"
              >
                <svg viewBox="0 0 24 24" fill="none" class="h-14 w-14 opacity-80">
                  <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M5 16v2m14-2v2M3 12l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 7l2 5v4H3v-4Zm3.5 2.5h.01m11 0h.01" />
                </svg>
              </div>
            </div>
            <div class="flex flex-1 flex-col justify-center p-6">
              <p class="text-xl font-bold" :style="{ color: 'var(--color-text)' }">{{ vehicle.name }}</p>
              <p class="mt-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                <span class="text-lg font-bold" :style="{ color: 'var(--color-primary)' }">${{ Number(vehicle.price ?? 0).toFixed(2) }}</span>
                / {{ t('booking.day') }}
              </p>
              <div v-if="vehicleChips.length" class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="c in vehicleChips" :key="c"
                  class="rounded-full px-3 py-1 text-xs font-medium"
                  :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
                >{{ c }}</span>
              </div>
            </div>
          </article>

        <div class="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <!-- ============ Left column ============ -->
        <div class="space-y-5 lg:col-span-2">
          <!-- Step 1: dates -->
          <section class="rounded-2xl border p-5" :style="cardStyle">
            <header class="mb-4 flex items-center gap-3">
              <span class="step-dot" :class="{ done: datesDone }">
                <template v-if="datesDone">✓</template><template v-else>1</template>
              </span>
              <h2 class="text-base font-bold" :style="{ color: 'var(--color-text)' }">{{ tr('booking.stepDates', 'Trip dates') }}</h2>
              <span
                v-if="breakdown"
                class="ml-auto rounded-full px-3 py-1 text-xs font-semibold"
                :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
              >{{ breakdown.days }} {{ dayWord(breakdown.days) }}</span>
            </header>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="field-label">{{ t('booking.pickupDateTime') }}</span>
                <input v-model="form.pickUpDateTime" type="datetime-local" :min="minDateTime" class="pill-input" :style="pillInput" />
              </label>
              <label class="block">
                <span class="field-label">{{ t('booking.returnDateTime') }}</span>
                <input v-model="form.returnDateTime" type="datetime-local" :min="form.pickUpDateTime || minDateTime" class="pill-input" :style="pillInput" />
              </label>
            </div>

            <!-- Quick durations -->
            <div v-if="form.pickUpDateTime" class="mt-3 flex flex-wrap items-center gap-2">
              <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ tr('booking.quickDuration', 'Quick pick') }}</span>
              <button
                v-for="n in quickDurations" :key="n" type="button"
                class="rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 active:scale-95"
                :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
                @click="setDuration(n)"
              >{{ n }} {{ dayWord(n) }}</button>
            </div>

            <Transition name="fade">
              <p v-if="form.pickUpDateTime && form.returnDateTime && !datesValid" class="mt-3 text-sm text-red-600">
                {{ t('booking.datesInvalid') }}
              </p>
            </Transition>

            <!-- Already-booked windows -->
            <Transition name="fade">
              <div
                v-if="bookedDatesLoaded && bookedDates.length"
                class="mt-4 rounded-2xl px-4 py-3 text-sm"
                :style="{ backgroundColor: 'rgba(234,179,8,0.14)', color: '#B45309', border: '1px solid rgba(234,179,8,0.4)' }"
              >
                <p class="flex items-start gap-2 font-medium">
                  <span aria-hidden="true">⚠</span>
                  <span>{{ t(bookedDates.length > 1 ? 'booking.unavailableMany' : 'booking.unavailable') }}</span>
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="(b, i) in bookedDates" :key="i"
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    :style="{ backgroundColor: 'rgba(234,179,8,0.22)' }"
                  >{{ formatBookedRange(b) }}</span>
                </div>
              </div>
            </Transition>

            <Transition name="fade">
              <p v-if="overlapsBooked" class="mt-3 text-sm font-medium text-red-600">{{ t('booking.overlapsBooked') }}</p>
            </Transition>
          </section>

          <!-- Step 2: locations -->
          <section class="rounded-2xl border p-5" :style="cardStyle">
            <header class="mb-4 flex items-center gap-3">
              <span class="step-dot" :class="{ done: locationsDone }">
                <template v-if="locationsDone">✓</template><template v-else>2</template>
              </span>
              <h2 class="text-base font-bold" :style="{ color: 'var(--color-text)' }">{{ tr('booking.stepLocations', 'Locations') }}</h2>
            </header>

            <label class="block">
              <span class="field-label">{{ t('booking.pickupLocation') }}</span>
              <select v-model="form.pickUpLocationId" class="pill-input" :style="pillInput">
                <option value="" disabled>{{ t('booking.selectLocation') }}</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </label>

            <label class="mt-3 flex cursor-pointer select-none items-center gap-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              <input v-model="sameLocation" type="checkbox" class="h-4 w-4" :style="{ accentColor: 'var(--color-primary)' }" />
              {{ tr('booking.sameLocation', 'Return to the same location') }}
            </label>

            <Transition name="fade">
              <label v-if="!sameLocation" class="mt-3 block">
                <span class="field-label">{{ t('booking.returnLocation') }}</span>
                <select v-model="form.returnLocationId" class="pill-input" :style="pillInput">
                  <option value="" disabled>{{ t('booking.selectLocation') }}</option>
                  <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
                </select>
              </label>
            </Transition>
          </section>

          <!-- Step 3: additional services -->
          <section v-if="services.length" class="rounded-2xl border p-5" :style="cardStyle">
            <header class="mb-4 flex items-center gap-3">
              <span class="step-dot" :class="{ done: selectedServices.length }">
                <template v-if="selectedServices.length">✓</template><template v-else>3</template>
              </span>
              <h2 class="text-base font-bold" :style="{ color: 'var(--color-text)' }">{{ t('booking.additionalServicesTitle') }}</h2>
              <span class="ml-auto text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ tr('booking.optional', 'Optional') }} · {{ t('booking.perDay') }}</span>
            </header>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                v-for="s in services" :key="s.id" type="button"
                :aria-pressed="form.selectedServiceIds.includes(s.id)"
                class="group rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99]"
                :style="form.selectedServiceIds.includes(s.id)
                  ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', boxShadow: '0 0 0 3px rgba(61,95,224,0.12)' }
                  : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }"
                @click="toggleService(s.id)"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200"
                    :style="form.selectedServiceIds.includes(s.id)
                      ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                      : { backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
                  >
                    <span v-if="isEmoji(s.icon)" class="text-lg leading-none">{{ s.icon }}</span>
                    <svg v-else viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                      <path :d="serviceIconPath(s)" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>

                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ localizedServiceName(s) }}</p>
                    <p v-if="localizedServiceDesc(s)" class="mt-0.5 line-clamp-2 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                      {{ localizedServiceDesc(s) }}
                    </p>
                    <p class="mt-2 text-sm font-bold" :style="{ color: 'var(--color-primary)' }">
                      ${{ Number(s.pricePerDay ?? s.price ?? 0).toFixed(2) }}<span class="text-xs font-medium" :style="{ color: 'var(--color-text-secondary)' }"> /{{ t('booking.day') }}</span>
                    </p>
                  </div>

                  <span
                    class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all duration-200"
                    :style="form.selectedServiceIds.includes(s.id)
                      ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
                      : { borderColor: 'var(--color-border)', color: 'transparent' }"
                  >✓</span>
                </div>
              </button>
            </div>

            <Transition name="fade">
              <p v-if="selectedServices.length" class="mt-3 text-xs font-medium" :style="{ color: 'var(--color-primary)' }">
                {{ t('booking.addOnsTotal', { total: (breakdown?.perDayTotal ?? 0).toFixed(2) }) }}
              </p>
            </Transition>
          </section>

          <!-- Step 4: discount -->
          <section class="rounded-2xl border p-5" :style="cardStyle">
            <header class="mb-4 flex items-center gap-3">
              <span class="step-dot" :class="{ done: matchedDiscount }">
                <template v-if="matchedDiscount">✓</template><template v-else>{{ services.length ? 4 : 3 }}</template>
              </span>
              <h2 class="text-base font-bold" :style="{ color: 'var(--color-text)' }">{{ t('booking.discountCode') }}</h2>
              <span class="ml-auto text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ tr('booking.optional', 'Optional') }}</span>
            </header>

            <input v-model="form.discountCode" type="text" placeholder="e.g. SUMMER10" class="pill-input" :style="pillInput" />
            <Transition name="fade" mode="out-in">
              <span v-if="form.discountCode && !matchedDiscount" key="pending" class="mt-2 block text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                {{ t('booking.codeHint') }}
              </span>
              <span v-else-if="matchedDiscount" key="ok" class="mt-2 block text-xs font-medium text-green-600">
                ✓ {{ t('booking.codeApplied') }}
              </span>
            </Transition>
          </section>

          <Transition name="fade">
            <div v-if="error" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">{{ error }}</div>
          </Transition>
        </div>

        <!-- ============ Right column: summary ============ -->
        <aside class="lg:col-span-1">
          <article class="h-full rounded-2xl border p-5" :style="cardStyle">
            <div class="space-y-4 lg:sticky lg:top-24">
            <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ t('booking.priceSummary') }}</h2>

            <!-- Trip recap -->
            <div v-if="datesValid" class="space-y-1 rounded-xl px-4 py-3 text-xs" :style="{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }">
              <p><span class="font-semibold" :style="{ color: 'var(--color-text)' }">{{ vehicle.name }}</span></p>
              <p>{{ formatDateTime(form.pickUpDateTime) }}</p>
              <p>→ {{ formatDateTime(form.returnDateTime) }}</p>
            </div>

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
                <div class="flex items-baseline justify-between border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
                  <span class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ t('booking.total') }}</span>
                  <span class="text-2xl font-bold" :style="{ color: 'var(--color-primary)' }">${{ breakdown.grandTotal.toFixed(2) }}</span>
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

            <!-- What is still missing -->
            <Transition name="fade">
              <ul v-if="missing.length && !submitting" class="space-y-1 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                <li v-for="m in missing" :key="m" class="flex items-start gap-1.5">
                  <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" :style="{ backgroundColor: 'var(--color-primary)' }"></span>{{ m }}
                </li>
              </ul>
            </Transition>
            </div>
          </article>
        </aside>
        </div>
      </div>
    </div>

    <!-- Mobile sticky bar -->
    <div
      v-if="!loading && !success && vehicle"
      class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t px-4 py-3 lg:hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div>
        <p class="text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">{{ t('booking.total') }}</p>
        <p class="text-lg font-bold leading-tight" :style="{ color: 'var(--color-primary)' }">
          {{ breakdown ? `$${breakdown.grandTotal.toFixed(2)}` : '—' }}
        </p>
      </div>
      <button
        type="button" :disabled="!canSubmit" @click="handleSubmit"
        class="rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        :style="{ backgroundColor: 'var(--color-primary)' }"
      >
        {{ submitting ? t('booking.submitting') : t('booking.confirm') }}
      </button>
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

.field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.pill-input {
  margin-top: 0.25rem;
  width: 100%;
  box-sizing: border-box;
  height: 3.5rem;
  border-radius: 9999px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  outline: none;
  transition: box-shadow 0.2s ease;
}
.pill-input:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
}

.step-dot {
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1.5px solid var(--color-border);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.step-dot.done {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .animate-page-in { animation: none; }
}
</style>