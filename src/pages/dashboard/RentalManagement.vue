<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ rentals.length }} {{ $t('rentals.count') }}
      </p>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        + {{ $t('rentals.add') }}
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="rentals" :loading="loading">
      <template #cell-vehicleId="{ row }">{{ vehicleLabel(row.vehicleId) }}</template>
      <template #cell-pickUpLocationId="{ row }">{{ locationLabel(row.pickUpLocationId) }}</template>
      <template #cell-returnLocationId="{ row }">{{ locationLabel(row.returnLocationId) }}</template>
      <template #cell-pickUpDateTime="{ row }">{{ formatDate(row.pickUpDateTime) }}</template>
      <template #cell-expectedReturnDateTime="{ row }">{{ formatDate(row.expectedReturnDateTime) }}</template>
      <template #cell-actualReturnDateTime="{ row }">{{ formatDate(row.actualReturnDateTime) }}</template>
      <template #cell-totalPrice="{ row }">${{ Number(row.totalPrice ?? 0).toFixed(2) }}</template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #actions="{ row }">
        <select
          class="rounded-lg border px-2 py-1 text-xs outline-none"
          style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
          :value="row.status"
          @change="onStatusChange(row, $event.target.value)"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <button
          class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ $t('rentals.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <Modal :open="modalOpen" :title="$t('rentals.addTitle')" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <select v-model.number="form.reservationId" required class="input-field" :style="inputStyle">
          <option value="" disabled>{{ $t('rentals.reservation') }}</option>
          <option v-for="r in eligibleReservations" :key="r.id" :value="r.id">
            #{{ r.id }} — {{ vehicleLabel(r.vehicleId) }} ({{ formatDate(r.pickUpDateTime) }})
          </option>
        </select>
        <p v-if="eligibleReservations.length === 0" class="text-xs" style="color: var(--color-text-secondary);">
          {{ $t('rentals.noEligibleReservations') }}
        </p>

        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="form.discountAmount" type="number" step="0.01" :placeholder="$t('rentals.discount')" class="input-field" :style="inputStyle" />
          <input v-model.number="form.additionalCharges" type="number" step="0.01" :placeholder="$t('rentals.additional')" class="input-field" :style="inputStyle" />
        </div>

        <textarea
          v-model="form.notes"
          rows="2"
          maxlength="255"
          :placeholder="$t('rentals.notes')"
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
          >{{ $t('rentals.cancel') }}</button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? $t('rentals.saving') : $t('rentals.save') }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import api from '@/services/api'

const { t } = useI18n()

const columns = computed(() => [
  { key: 'id', label: 'ID' },
  { key: 'vehicleId', label: t('rentals.vehicle') },
  { key: 'pickUpLocationId', label: t('rentals.pickUpLocation') },
  { key: 'returnLocationId', label: t('rentals.returnLocation') },
  { key: 'pickUpDateTime', label: t('rentals.pickUpDateTime') },
  { key: 'expectedReturnDateTime', label: t('rentals.expectedReturn') },
  { key: 'actualReturnDateTime', label: t('rentals.actualReturn') },
  { key: 'totalPrice', label: t('rentals.total') },
  { key: 'status', label: t('rentals.status') },
])

// Confirmed against backend RentalStatusEnum
const statusOptions = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'ACTIVE', 'RETURNED', 'COMPLETED']

const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
}

const rentals = ref([])
const reservations = ref([])
const vehicles = ref([])
const locations = ref([])
const loading = ref(true)
const actionError = ref('')

const modalOpen = ref(false)
const saving = ref(false)
const saveError = ref('')

function emptyForm() {
  return { reservationId: '', discountAmount: null, additionalCharges: null, notes: '' }
}

const form = reactive(emptyForm())

// Only reservations that don't already have a rental created, and that are CONFIRMED
const eligibleReservations = computed(() => {
  const rentedReservationIds = new Set(rentals.value.map((r) => r.reservationId))
  return reservations.value.filter(
    (r) => r.status === 'CONFIRMED' && !rentedReservationIds.has(r.id)
  )
})

function vehicleLabel(id) {
  const v = vehicles.value.find((x) => x.id === id)
  return v ? `${v.brand} ${v.model}` : `#${id}`
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
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PICKED_UP: 'bg-amber-100 text-amber-700',
    ACTIVE: 'bg-amber-100 text-amber-700',
    RETURNED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
  }
  return `${base} ${map[status] || 'bg-gray-100 text-gray-500'}`
}

async function loadRentals() {
  loading.value = true
  try {
    const { data } = await api.get('/rentals')
    rentals.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

async function loadReservations() {
  try {
    const { data } = await api.get('/reservations')
    reservations.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    reservations.value = []
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

function openCreate() {
  Object.assign(form, emptyForm())
  saveError.value = ''
  modalOpen.value = true
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    await api.post('/rentals', { ...form })
    modalOpen.value = false
    await loadRentals()
  } catch (err) {
    saveError.value = err.response?.data?.message || t('rentals.saveError')
  } finally {
    saving.value = false
  }
}

async function onStatusChange(row, newStatus) {
  actionError.value = ''
  try {
    await api.patch(`/rentals/${row.id}/status`, null, { params: { status: newStatus } })
    await loadRentals()
  } catch (err) {
    actionError.value = err.response?.data?.message || t('rentals.statusError')
  }
}

async function onDelete(row) {
  if (!confirm(`${t('rentals.confirmDelete')} #${row.id}?`)) return
  await api.delete(`/rentals/${row.id}`)
  loadRentals()
}

onMounted(() => {
  loadRentals()
  loadReservations()
  loadVehicles()
  loadLocations()
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