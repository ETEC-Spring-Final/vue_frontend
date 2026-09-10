<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  getMyRentals,
  uploadRentalDocument,
  getMyRentalDocuments,
  RENTAL_STATUS_STEPS,
  rentalStatusStepIndex,
} from "@/services/rentals";

const router = useRouter();

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
      getMyRentalDocuments().catch(() => []), // non-fatal
    ]);
    rentals.value = rentalsRes || [];
    documents.value = docsRes || [];
  } catch (e) {
    error.value = e?.response?.data?.message || "Failed to load your rentals.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);

const active = computed(() =>
  rentals.value.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  )
);
const completed = computed(() =>
  rentals.value.filter(
    (r) => r.status === "COMPLETED" || r.status === "CANCELLED"
  )
);

function docsForRental(rentalId) {
  return documents.value.filter((d) => d.rentalId === rentalId);
}

function vehicleLabel(r) {
  const v = r.vehicle;
  if (!v) return `Vehicle #${r.vehicleId ?? ""}`;
  return `${v.brand ?? ""} ${v.model ?? ""}`.trim();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
    uploadError.value =
      e?.response?.data?.message || "Could not upload this document.";
  } finally {
    uploadingRentalId.value = null;
    event.target.value = ""; // allow re-selecting the same file
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-[#1A2036]">My Rentals</h1>
      <button
        type="button"
        @click="router.push('/my-reservations')"
        class="rounded-full bg-[#F3F4F6] px-5 py-2.5 text-sm font-semibold text-[#1A2036] transition hover:bg-[#F9FAFB]"
      >
        View reservations
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mt-8 text-sm text-[#6B7280]">
      Loading your rentals…
    </div>

    <!-- Error -->
    <div
      v-else-if="error && !rentals.length"
      class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {{ error }}
    </div>

    <!-- Empty -->
    <div
      v-else-if="!rentals.length"
      class="mt-12 flex flex-col items-center text-center"
    >
      <p class="text-sm text-[#6B7280]">You don't have any rentals yet.</p>
      <button
        type="button"
        @click="router.push('/explore')"
        class="mt-4 rounded-full bg-[#3D5FE0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
      >
        Find a vehicle to rent
      </button>
    </div>

    <template v-else>
      <div
        v-if="error"
        class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ error }}
      </div>
      <div
        v-if="uploadError"
        class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ uploadError }}
      </div>

      <!-- Current / upcoming -->
      <section v-if="active.length" class="mt-8">
        <h2 class="text-lg font-bold text-[#1A2036]">Current &amp; upcoming</h2>
        <div class="mt-4 space-y-6">
          <article
            v-for="r in active"
            :key="r.id"
            class="rounded-2xl border border-[#E5E7EB] p-5"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center gap-4">
                <div
                  class="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-[#1A2036] to-[#3D5FE0]"
                ></div>
                <div>
                  <p class="text-sm font-semibold text-[#1A2036]">
                    {{ vehicleLabel(r) }}
                  </p>
                  <p class="text-xs text-[#6B7280] mt-0.5">
                    {{ formatDate(r.startDate ?? r.pickupDate) }} →
                    {{ formatDate(r.endDate ?? r.returnDate) }}
                  </p>
                </div>
              </div>
              <span
                class="inline-block w-fit rounded-full bg-[#E9EDFB] px-3 py-1 text-xs font-semibold text-[#3D5FE0]"
              >
                {{ statusLabel(r.status) }}
              </span>
            </div>

            <!-- Status timeline -->
            <div class="mt-5 flex items-center">
              <template v-for="(step, i) in RENTAL_STATUS_STEPS" :key="step">
                <div class="flex flex-col items-center flex-1">
                  <div
                    class="h-2.5 w-2.5 rounded-full"
                    :class="
                      i <= rentalStatusStepIndex(r.status)
                        ? 'bg-[#3D5FE0]'
                        : 'bg-[#E5E7EB]'
                    "
                  ></div>
                  <span
                    class="mt-1.5 hidden text-center text-[10px] leading-tight text-[#9CA3AF] sm:block"
                  >
                    {{ statusLabel(step) }}
                  </span>
                </div>
                <div
                  v-if="i < RENTAL_STATUS_STEPS.length - 1"
                  class="h-0.5 flex-1 -mt-4 sm:-mt-5"
                  :class="
                    i < rentalStatusStepIndex(r.status)
                      ? 'bg-[#3D5FE0]'
                      : 'bg-[#E5E7EB]'
                  "
                ></div>
              </template>
            </div>

            <!-- Documents -->
            <div class="mt-6 border-t border-[#E5E7EB] pt-4">
              <p class="text-xs font-semibold uppercase text-[#9CA3AF]">
                Documents
              </p>
              <ul v-if="docsForRental(r.id).length" class="mt-2 space-y-1">
                <li
                  v-for="doc in docsForRental(r.id)"
                  :key="doc.id ?? doc.fileName"
                  class="text-sm text-[#1A2036]"
                >
                  {{ doc.fileName ?? doc.name ?? "Document" }}
                </li>
              </ul>
              <p v-else class="mt-2 text-sm text-[#6B7280]">
                No documents uploaded yet.
              </p>

              <label
                class="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-semibold text-[#1A2036] transition hover:bg-[#F9FAFB]"
              >
                <input
                  type="file"
                  class="hidden"
                  :disabled="uploadingRentalId === r.id"
                  @change="(e) => handleFileChange(r, e)"
                />
                {{
                  uploadingRentalId === r.id
                    ? "Uploading…"
                    : "Upload document"
                }}
              </label>
            </div>
          </article>
        </div>
      </section>

      <!-- Completed / cancelled -->
      <section v-if="completed.length" class="mt-10">
        <h2 class="text-lg font-bold text-[#1A2036]">Past</h2>
        <div class="mt-4 space-y-4">
          <article
            v-for="r in completed"
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
                  {{ formatDate(r.startDate ?? r.pickupDate) }} →
                  {{ formatDate(r.endDate ?? r.returnDate) }}
                </p>
              </div>
            </div>
            <span
              class="inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold"
              :class="
                r.status === 'CANCELLED'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-green-50 text-[#22C55E]'
              "
            >
              {{ statusLabel(r.status) }}
            </span>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>