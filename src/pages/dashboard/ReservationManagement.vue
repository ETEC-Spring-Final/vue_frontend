<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ reservations.length }} {{ $t('reservations.count') }}
      </p>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        + {{ $t('reservations.add') }}
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="paged" :loading="loading">
      <template #cell-vehicleId="{ row }">
        {{ vehicleLabel(row.vehicleId) }}
      </template>
      <template #cell-pickUpLocationId="{ row }">
        {{ locationLabel(row.pickUpLocationId) }}
      </template>
      <template #cell-returnLocationId="{ row }">
        {{ locationLabel(row.returnLocationId) }}
      </template>
      <template #cell-pickUpDateTime="{ row }">
        {{ formatDate(row.pickUpDateTime) }}
      </template>
      <template #cell-returnDateTime="{ row }">
        {{ formatDate(row.returnDateTime) }}
      </template>
      <template #cell-totalPrice="{ row }">
        ${{ Number(row.totalPrice ?? 0).toFixed(2) }}
      </template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #actions="{ row }">
        <span class="inline-flex items-center gap-1.5">
          <select
            class="rounded-lg border px-2 py-1 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
            :value="row.status"
            :disabled="isPaidLocked(row)"
            :title="isPaidLocked(row) ? $t('reservations.statusLockedTitle', 'Invoice already paid — status is locked to protect the customer record') : ''"
            @change="onStatusChange(row, $event.target.value)"
          >
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>

          <!-- Lock indicator: only shown once the linked invoice is PAID -->
          <span
            v-if="isPaidLocked(row)"
            class="inline-flex items-center"
            :title="$t('reservations.statusLockedTitle', 'Invoice already paid — status is locked to protect the customer record')"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #22C55E;">
              <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        </span>

        <button
          class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ $t('reservations.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Pagination -->
    <div
      v-if="!loading && reservations.length > 0"
      class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
      style="color: var(--color-text-secondary);"
    >
      <div class="flex items-center gap-3">
        <span>{{ rangeFrom }}–{{ rangeTo }} {{ $t('reservations.of', 'of') }} {{ reservations.length }}</span>
        <select
          v-model.number="pageSize"
          class="rounded-lg border px-2 py-1.5 text-xs outline-none"
          style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
        >
          <option v-for="n in pageSizes" :key="n" :value="n">{{ n }} / {{ $t('reservations.perPage', 'page') }}</option>
        </select>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
          style="border-color: var(--color-border); color: var(--color-text);"
          :disabled="page === 1"
          @click="page--"
        >{{ $t('reservations.previous', 'Previous') }}</button>

        <template v-for="(b, i) in pageButtons" :key="`${b}-${i}`">
          <span v-if="b === '…'" class="px-1">…</span>
          <button
            v-else
            type="button"
            class="h-8 min-w-8 rounded-full border px-2 text-xs font-semibold transition active:scale-95"
            :style="
              b === page
                ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
                : { borderColor: 'var(--color-border)', color: 'var(--color-text)' }
            "
            @click="page = b"
          >{{ b }}</button>
        </template>

        <button
          type="button"
          class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
          style="border-color: var(--color-border); color: var(--color-text);"
          :disabled="page >= totalPages"
          @click="page++"
        >{{ $t('reservations.next', 'Next') }}</button>
      </div>
    </div>

    <Modal :open="modalOpen" :title="$t('reservations.addTitle')" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <select v-model.number="form.vehicleId" required class="input-field" :style="inputStyle">
          <option value="" disabled>{{ $t('reservations.vehicle') }}</option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.brandName ?? v.brand }} {{ v.model }} ({{ v.licensePlate }})</option>
        </select>

        <div class="grid grid-cols-2 gap-3">
          <select v-model.number="form.pickUpLocationId" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('reservations.pickUpLocation') }}</option>
            <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
          </select>
          <select v-model.number="form.returnLocationId" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('reservations.returnLocation') }}</option>
            <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs" style="color: var(--color-text-secondary);">{{ $t('reservations.pickUpDateTime') }}</label>
            <input v-model="form.pickUpDateTime" required type="datetime-local" class="input-field" :style="inputStyle" />
          </div>
          <div>
            <label class="mb-1 block text-xs" style="color: var(--color-text-secondary);">{{ $t('reservations.returnDateTime') }}</label>
            <input v-model="form.returnDateTime" required type="datetime-local" class="input-field" :style="inputStyle" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <input v-model.number="form.depositAmount" type="number" step="0.01" :placeholder="$t('reservations.deposit')" class="input-field" :style="inputStyle" />
          <input v-model.number="form.discountAmount" type="number" step="0.01" :placeholder="$t('reservations.discount')" class="input-field" :style="inputStyle" />
          <input v-model.number="form.additionalCharges" type="number" step="0.01" :placeholder="$t('reservations.additional')" class="input-field" :style="inputStyle" />
        </div>

        <textarea
          v-model="form.notes"
          rows="2"
          maxlength="255"
          :placeholder="$t('reservations.notes')"
          class="input-field resize-none"
          :style="inputStyle"
        ></textarea>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="modalOpen = false"
          >{{ $t('reservations.cancel') }}</button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? $t('reservations.saving') : $t('reservations.save') }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import api from '@/services/api'

const { t } = useI18n()

const columns = computed(() => [
  { key: 'id', label: 'ID' },
  { key: 'vehicleId', label: t('reservations.vehicle') },
  { key: 'pickUpLocationId', label: t('reservations.pickUpLocation') },
  { key: 'returnLocationId', label: t('reservations.returnLocation') },
  { key: 'pickUpDateTime', label: t('reservations.pickUpDateTime') },
  { key: 'returnDateTime', label: t('reservations.returnDateTime') },
  { key: 'totalPrice', label: t('reservations.total') },
  { key: 'status', label: t('reservations.status') },
])

// Confirmed against backend ReservationStatusEnum
const statusOptions = ['PENDING', 'CONFIRMED', 'CANCELLED']

const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
}

const reservations = ref([])
const vehicles = ref([])
const locations = ref([])
const loading = ref(true)
const actionError = ref('')

// reservationId -> true when the reservation's rental has an invoice marked
// PAID. Chain is Reservation -> Rental (rental.reservationId) -> Invoice
// (invoice.rentalId), same link used by RentalManagement.vue's
// eligibleReservations / InvoiceManagement.vue's eligibleRentals filters.
// Locking here stops a staff member from moving a paid reservation back to
// PENDING/CANCELLED, which would desync it from the payment already taken.
const paidReservationIds = ref(new Set())

function isPaidLocked(row) {
  return paidReservationIds.value.has(Number(row.id))
}

const modalOpen = ref(false)
const saving = ref(false)
const saveError = ref('')

// ----- Pagination (client-side: /reservations returns the full list) -----
const page = ref(1)
const pageSize = ref(10)
const pageSizes = [10, 20, 50]

const totalPages = computed(() => Math.max(1, Math.ceil(reservations.value.length / pageSize.value)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return reservations.value.slice(start, start + pageSize.value)
})
const rangeFrom = computed(() => (reservations.value.length === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeTo = computed(() => Math.min(page.value * pageSize.value, reservations.value.length))

// 1 … 4 5 6 … 9
const pageButtons = computed(() => {
  const total = totalPages.value
  const cur = page.value
  const nums = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
})

watch(pageSize, () => {
  page.value = 1
})
// Stay in range after deleting the last row on a page
watch(totalPages, (n) => {
  if (page.value > n) page.value = n
})

function emptyForm() {
  return {
    vehicleId: '',
    pickUpLocationId: '',
    returnLocationId: '',
    pickUpDateTime: '',
    returnDateTime: '',
    depositAmount: null,
    discountAmount: null,
    additionalCharges: null,
    notes: '',
  }
}

const form = reactive(emptyForm())

function vehicleLabel(id) {
  const v = vehicles.value.find((x) => x.id === id)
  return v ? `${v.brandName ?? v.brand} ${v.model}` : `#${id}`
}

function locationLabel(id) {
  const l = locations.value.find((x) => x.id === id)
  return l ? l.name : `#${id}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-50 text-red-600',
  }
  return `${base} ${map[status] || 'bg-gray-100 text-gray-500'}`
}

async function loadReservations() {
  loading.value = true
  try {
    const { data } = await api.get('/reservations')
    const list = Array.isArray(data) ? data : data?.content ?? []
    // ថ្មីបំផុត (id ធំបំផុត) នៅលើគេ
    reservations.value = list.sort((a, b) => b.id - a.id)
  } finally {
    loading.value = false
  }
}

async function loadVehicles() {
  try {
    const { data } = await api.get('/vehicles')
    vehicles.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    vehicles.value = []
  }
}

async function loadLocations() {
  try {
    const { data } = await api.get('/locations')
    locations.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    locations.value = []
  }
}

// Builds the Reservation -> Rental -> Invoice(PAID) chain:
//   1. Load all rentals, keep only { id, reservationId }
//   2. Load all invoices, keep only rentalId of the PAID ones
//   3. A reservation is locked when some rental has
//      rental.reservationId === reservation.id AND that rental's id is in
//      the paid-invoice rentalId set.
async function loadPaidReservationIds() {
  try {
    const [rentalsRes, invoicesRes] = await Promise.all([
      api.get('/rentals'),
      api.get('/invoices'),
    ])
    const rentalList = Array.isArray(rentalsRes.data) ? rentalsRes.data : (rentalsRes.data?.content ?? [])
    const invoiceList = Array.isArray(invoicesRes.data) ? invoicesRes.data : (invoicesRes.data?.content ?? [])

    const paidRentalIds = new Set(
      invoiceList.filter((inv) => inv.status === 'PAID').map((inv) => Number(inv.rentalId))
    )

    paidReservationIds.value = new Set(
      rentalList
        .filter((r) => paidRentalIds.has(Number(r.id)))
        .map((r) => Number(r.reservationId))
    )
  } catch {
    // Non-fatal — if this fails, no rows get locked (fails open, not closed).
    paidReservationIds.value = new Set()
  }
}

function openCreate() {
  Object.assign(form, emptyForm())
  saveError.value = ''
  modalOpen.value = true
}

// datetime-local gives "2026-01-01T10:00" -> backend LocalDateTime needs seconds
function toIsoDateTime(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    const payload = {
      ...form,
      pickUpDateTime: toIsoDateTime(form.pickUpDateTime),
      returnDateTime: toIsoDateTime(form.returnDateTime),
    }
    await api.post('/reservations', payload)
    modalOpen.value = false
    await loadReservations()
  } catch (err) {
    saveError.value = err.response?.data?.message || t('reservations.saveError')
  } finally {
    saving.value = false
  }
}

async function onStatusChange(row, newStatus) {
  // Guard against a locked row even if the disabled attribute is somehow
  // bypassed (e.g. stale DOM during a fast re-render).
  if (isPaidLocked(row)) return

  actionError.value = ''
  try {
    await api.patch(`/reservations/${row.id}/status`, null, { params: { status: newStatus } })
    await loadReservations()
  } catch (err) {
    actionError.value = err.response?.data?.message || t('reservations.statusError')
  }
}

async function onDelete(row) {
  if (!confirm(`${t('reservations.confirmDelete')} #${row.id}?`)) return
  await api.delete(`/reservations/${row.id}`)
  loadReservations()
}

onMounted(() => {
  loadReservations()
  loadVehicles()
  loadLocations()
  loadPaidReservationIds()
})
</script>

<style scoped>
.input-field {
  width: 100%;
  border-radius: 0.75rem;
  border-width: 1px;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  outline: none;
}
.input-field::placeholder {
  color: var(--color-text-secondary);
}
</style>