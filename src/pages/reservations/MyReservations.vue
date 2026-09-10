<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { getMyReservations, cancelReservation } from "@/services/reservations";

const router = useRouter();

const reservations = ref([]);
const loading = ref(true);
const error = ref("");
const cancellingId = ref(null);

// Status -> badge color mapping (ReservationStatusEnum values from backend)
const STATUS_STYLES = {
  PENDING: "bg-[#F3F4F6] text-[#6B7280]",
  CONFIRMED: "bg-[#E9EDFB] text-[#3D5FE0]",
  CANCELLED: "bg-red-50 text-red-600",
  COMPLETED: "bg-green-50 text-[#22C55E]",
  EXPIRED: "bg-[#F3F4F6] text-[#9CA3AF]",
};

function statusClass(status) {
  return STATUS_STYLES[status] || "bg-[#F3F4F6] text-[#6B7280]";
}

async function loadReservations() {
  loading.value = true;
  error.value = "";
  try {
    reservations.value = await getMyReservations();
  } catch (e) {
    error.value =
      e?.response?.data?.message || "Failed to load your reservations.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadReservations);

const upcoming = computed(() =>
  reservations.value.filter(
    (r) => r.status !== "CANCELLED" && r.status !== "COMPLETED"
  )
);
const past = computed(() =>
  reservations.value.filter(
    (r) => r.status === "CANCELLED" || r.status === "COMPLETED"
  )
);

function canCancel(r) {
  return r.status === "PENDING" || r.status === "CONFIRMED";
}

async function handleCancel(id) {
  cancellingId.value = id;
  try {
    const updated = await cancelReservation(id);
    const idx = reservations.value.findIndex((r) => r.id === id);
    if (idx !== -1) {
      reservations.value[idx] = updated ?? {
        ...reservations.value[idx],
        status: "CANCELLED",
      };
    }
  } catch (e) {
    error.value =
      e?.response?.data?.message || "Could not cancel this reservation.";
  } finally {
    cancellingId.value = null;
  }
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function vehicleLabel(r) {
  const v = r.vehicle;
  if (!v) return `Vehicle #${r.vehicleId ?? ""}`;
  return `${v.brand ?? ""} ${v.model ?? ""}`.trim();
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-[#1A2036]">My Reservations</h1>
      <button
        type="button"
        @click="router.push('/explore')"
        class="rounded-full bg-[#3D5FE0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
      >
        Browse vehicles
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mt-8 text-sm text-[#6B7280]">
      Loading your reservations…
    </div>

    <!-- Error -->
    <div
      v-else-if="error && !reservations.length"
      class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </div>

    <!-- Empty -->
    <div
      v-else-if="!reservations.length"
      class="mt-12 flex flex-col items-center text-center"
    >
      <p class="text-sm text-[#6B7280]">
        You don't have any reservations yet.
      </p>
      <button
        type="button"
        @click="router.push('/explore')"
        class="mt-4 rounded-full bg-[#3D5FE0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
      >
        Find a vehicle to rent
      </button>
    </div>

    <!-- Reservation lists -->
    <template v-else>
      <div
        v-if="error"
        class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ error }}
      </div>

      <section v-if="upcoming.length" class="mt-8">
        <h2 class="text-lg font-bold text-[#1A2036]">Upcoming</h2>
        <div class="mt-4 space-y-4">
          <article
            v-for="r in upcoming"
            :key="r.id"
            class="rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <div
                class="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-[#1A2036] to-[#3D5FE0]"
              ></div>
              <div>
                <p class="text-sm font-semibold text-[#1A2036]">
                  {{ vehicleLabel(r) }}
                </p>
                <p class="text-xs text-[#6B7280] mt-0.5">
                  {{ formatDate(r.pickupDate) }} → {{ formatDate(r.returnDate) }}
                </p>
                <p class="text-xs text-[#6B7280]">
                  {{ r.pickupLocation?.name ?? "Pickup location" }} →
                  {{ r.returnLocation?.name ?? "Return location" }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                :class="statusClass(r.status)"
              >
                {{ r.status }}
              </span>
              <span
                v-if="r.totalPrice != null"
                class="text-sm font-semibold text-[#1A2036]"
              >
                ${{ Number(r.totalPrice).toFixed(2) }}
              </span>
              <button
                v-if="canCancel(r)"
                type="button"
                :disabled="cancellingId === r.id"
                @click="handleCancel(r.id)"
                class="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ cancellingId === r.id ? "Cancelling…" : "Cancel" }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="past.length" class="mt-10">
        <h2 class="text-lg font-bold text-[#1A2036]">Past</h2>
        <div class="mt-4 space-y-4">
          <article
            v-for="r in past"
            :key="r.id"
            class="rounded-2xl border border-[#E5E7EB] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-80"
          >
            <div class="flex items-center gap-4">
              <div
                class="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-[#1A2036] to-[#3D5FE0]"
              ></div>
              <div>
                <p class="text-sm font-semibold text-[#1A2036]">
                  {{ vehicleLabel(r) }}
                </p>
                <p class="text-xs text-[#6B7280] mt-0.5">
                  {{ formatDate(r.pickupDate) }} → {{ formatDate(r.returnDate) }}
                </p>
              </div>
            </div>
            <span
              class="inline-block rounded-full px-3 py-1 text-xs font-semibold"
              :class="statusClass(r.status)"
            >
              {{ r.status }}
            </span>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>