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

    <DataTable class="mt-4" :columns="columns" :rows="reservations" :loading="loading">
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
        >{{ $t('reservations.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <Modal :open="modalOpen" :title="$t('reservations.addTitle')" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <select v-model.number="form.vehicleId" required class="input-field" :style="inputStyle">
          <option value="" disabled>{{ $t('reservations.vehicle') }}</option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.brand }} {{ v.model }} ({{ v.licensePlate }})</option>
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
import { computed, onMounted, reactive, ref } from 'vue'
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

const modalOpen = ref(false)
const saving = ref(false)
const saveError = ref('')

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
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-50 text-red-600',
  }
  return `${base} ${map[status] || 'bg-gray-100 text-gray-500'}`
}

async function loadReservations() {
  loading.value = true
  try {
    const { data } = await api.get('/reservations')
    reservations.value = Array.isArray(data) ? data : data?.content ?? []
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