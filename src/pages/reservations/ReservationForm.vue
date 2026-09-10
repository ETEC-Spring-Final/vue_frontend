<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchVehicleById, normalizeVehicleDetail } from "@/services/vehicles";
import {
  createReservation,
  getLocations,
  getServices,
  getDiscounts,
  calculatePriceBreakdown,
} from "@/services/reservations";

const route = useRoute();
const router = useRouter();

// Vehicle comes from /vehicles/:id "Rent now" -> /reservations?vehicleId=123
const vehicleId = route.query.vehicleId || route.params.vehicleId;

const vehicle = ref(null);
const locations = ref([]);
const services = ref([]);
const discounts = ref([]);

const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref(false);

// Form state
const form = ref({
  pickupLocationId: "",
  returnLocationId: "",
  pickupDate: "",
  returnDate: "",
  selectedServiceIds: [],
  discountCode: "",
});

const today = new Date().toISOString().split("T")[0];

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
    locations.value = locationsRes || [];
    services.value = servicesRes || [];
    discounts.value = discountsRes || [];
  } catch (e) {
    error.value =
      e?.response?.data?.message || "Failed to load reservation data.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadData();
  if (!vehicleId) {
    error.value = "No vehicle selected. Please choose a vehicle first.";
  }
});

const selectedServices = computed(() =>
  services.value.filter((s) => form.value.selectedServiceIds.includes(s.id))
);

const matchedDiscount = computed(() => {
  if (!form.value.discountCode) return null;
  return (
    discounts.value.find(
      (d) =>
        d.code?.toLowerCase() === form.value.discountCode.trim().toLowerCase()
    ) || null
  );
});

const datesValid = computed(() => {
  if (!form.value.pickupDate || !form.value.returnDate) return false;
  return new Date(form.value.returnDate) > new Date(form.value.pickupDate);
});

const breakdown = computed(() => {
  if (!vehicle.value || !datesValid.value) return null;
  return calculatePriceBreakdown({
    pricePerDay: vehicle.value.price ?? 0,
    pickupDate: form.value.pickupDate,
    returnDate: form.value.returnDate,
    insurancePerDay: 0, // wire to a real insurance rate once backend exposes one
    selectedServices: selectedServices.value,
    discount: matchedDiscount.value,
  });
});

const canSubmit = computed(() => {
  return (
    !!vehicle.value &&
    !!form.value.pickupLocationId &&
    !!form.value.returnLocationId &&
    datesValid.value &&
    !submitting.value
  );
});

function toggleService(id) {
  const idx = form.value.selectedServiceIds.indexOf(id);
  if (idx === -1) {
    form.value.selectedServiceIds.push(id);
  } else {
    form.value.selectedServiceIds.splice(idx, 1);
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  error.value = "";
  try {
    const payload = {
      vehicleId: vehicle.value.id,
      pickupLocationId: form.value.pickupLocationId,
      returnLocationId: form.value.returnLocationId,
      pickupDate: form.value.pickupDate,
      returnDate: form.value.returnDate,
      serviceIds: form.value.selectedServiceIds,
      discountCode: form.value.discountCode || undefined,
    };
    await createReservation(payload);
    success.value = true;
    setTimeout(() => router.push("/my-reservations"), 1200);
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      "Something went wrong creating your reservation.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-[#1A2036]">Reserve your vehicle</h1>

    <!-- Loading state -->
    <div v-if="loading" class="mt-8 text-sm text-[#6B7280]">
      Loading reservation details…
    </div>

    <!-- Error state (no vehicle / load failure) -->
    <div
      v-else-if="error && !vehicle"
      class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </div>

    <!-- Success state -->
    <div
      v-else-if="success"
      class="mt-6 rounded-2xl bg-[#E9EDFB] px-4 py-3 text-sm text-[#3D5FE0]"
    >
      Reservation created! Redirecting to your reservations…
    </div>

    <!-- Main form -->
    <div v-else class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Vehicle summary -->
        <article
          class="overflow-hidden rounded-2xl border border-[#E5E7EB] p-4 flex gap-4 items-center"
        >
          <div
            class="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-[#1A2036] to-[#3D5FE0]"
          ></div>
          <div>
            <p class="text-lg font-bold text-[#1A2036]">
              {{ vehicle.name }}
            </p>
            <p class="text-sm text-[#6B7280]">
              ${{ Number(vehicle.price ?? 0).toFixed(2) }} / day
            </p>
          </div>
        </article>

        <!-- Dates -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-xs font-semibold uppercase text-[#9CA3AF]"
              >Pickup date</span
            >
            <input
              v-model="form.pickupDate"
              type="date"
              :min="today"
              class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3.5 text-sm text-[#1A2036] outline-none"
            />
          </label>
          <label class="block">
            <span class="text-xs font-semibold uppercase text-[#9CA3AF]"
              >Return date</span
            >
            <input
              v-model="form.returnDate"
              type="date"
              :min="form.pickupDate || today"
              class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3.5 text-sm text-[#1A2036] outline-none"
            />
          </label>
        </div>
        <p
          v-if="form.pickupDate && form.returnDate && !datesValid"
          class="text-sm text-red-600"
        >
          Return date must be after pickup date.
        </p>

        <!-- Locations -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-xs font-semibold uppercase text-[#9CA3AF]"
              >Pickup location</span
            >
            <select
              v-model="form.pickupLocationId"
              class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3.5 text-sm text-[#1A2036] outline-none"
            >
              <option value="" disabled>Select location</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="text-xs font-semibold uppercase text-[#9CA3AF]"
              >Return location</span
            >
            <select
              v-model="form.returnLocationId"
              class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3.5 text-sm text-[#1A2036] outline-none"
            >
              <option value="" disabled>Select location</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </label>
        </div>

        <!-- Additional services -->
        <div v-if="services.length">
          <span class="text-xs font-semibold uppercase text-[#9CA3AF]"
            >Additional services</span
          >
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="s in services"
              :key="s.id"
              type="button"
              @click="toggleService(s.id)"
              class="rounded-full px-4 py-2 text-xs font-semibold transition"
              :class="
                form.selectedServiceIds.includes(s.id)
                  ? 'bg-[#3D5FE0] text-white'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F9FAFB]'
              "
            >
              {{ s.name }} (+${{ Number(s.price).toFixed(2) }})
            </button>
          </div>
        </div>

        <!-- Discount code -->
        <label class="block">
          <span class="text-xs font-semibold uppercase text-[#9CA3AF]"
            >Discount code (optional)</span
          >
          <input
            v-model="form.discountCode"
            type="text"
            placeholder="e.g. SUMMER10"
            class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3.5 text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
          />
          <span
            v-if="form.discountCode && !matchedDiscount"
            class="mt-1 block text-xs text-[#9CA3AF]"
          >
            Code will be validated on submit.
          </span>
          <span
            v-else-if="matchedDiscount"
            class="mt-1 block text-xs text-[#22C55E]"
          >
            Discount applied.
          </span>
        </label>

        <div
          v-if="error"
          class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ error }}
        </div>
      </div>

      <!-- Right: price breakdown -->
      <aside class="lg:col-span-1">
        <article
          class="rounded-2xl border border-[#E5E7EB] p-5 sticky top-6 space-y-3"
        >
          <h2 class="text-lg font-bold text-[#1A2036]">Price summary</h2>

          <div v-if="!breakdown" class="text-sm text-[#6B7280]">
            Select your pickup and return dates to see pricing.
          </div>

          <template v-else>
            <div class="flex justify-between text-sm text-[#6B7280]">
              <span>Rental ({{ breakdown.days }} day{{ breakdown.days > 1 ? "s" : "" }})</span>
              <span>${{ breakdown.rentalTotal.toFixed(2) }}</span>
            </div>
            <div
              v-if="breakdown.insuranceTotal"
              class="flex justify-between text-sm text-[#6B7280]"
            >
              <span>Insurance</span>
              <span>${{ breakdown.insuranceTotal.toFixed(2) }}</span>
            </div>
            <div
              v-if="breakdown.servicesTotal"
              class="flex justify-between text-sm text-[#6B7280]"
            >
              <span>Additional services</span>
              <span>${{ breakdown.servicesTotal.toFixed(2) }}</span>
            </div>
            <div
              v-if="breakdown.discountAmount"
              class="flex justify-between text-sm text-[#22C55E]"
            >
              <span>Discount</span>
              <span>-${{ breakdown.discountAmount.toFixed(2) }}</span>
            </div>
            <div
              class="flex justify-between border-t border-[#E5E7EB] pt-3 text-base font-bold text-[#1A2036]"
            >
              <span>Total</span>
              <span>${{ breakdown.grandTotal.toFixed(2) }}</span>
            </div>
          </template>

          <button
            type="button"
            :disabled="!canSubmit"
            @click="handleSubmit"
            class="w-full rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ submitting ? "Submitting…" : "Confirm reservation" }}
          </button>
        </article>
      </aside>
    </div>
  </div>
</template>