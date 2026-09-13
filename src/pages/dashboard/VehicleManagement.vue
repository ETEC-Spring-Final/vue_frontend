<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ vehicles.length }} {{ $t('vehicles.count') }}
      </p>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        + {{ $t('vehicles.add') }}
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="vehicles" :loading="loading">
      <template #cell-pricePerDay="{ row }">${{ row.pricePerDay }}</template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #actions="{ row }">
        <button
          class="text-xs font-semibold hover:opacity-70"
          style="color: var(--color-primary);"
          @click="openEdit(row)"
        >{{ $t('vehicles.edit') }}</button>
        <button
          class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ $t('vehicles.delete') }}</button>
      </template>
    </DataTable>

    <Modal :open="modalOpen" :title="editing ? $t('vehicles.editTitle') : $t('vehicles.addTitle')" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <div class="grid grid-cols-2 gap-3">
          <input v-model="form.brand" required :placeholder="$t('vehicles.brand')" class="input-field" :style="inputStyle" />
          <input v-model="form.model" required :placeholder="$t('vehicles.model')" class="input-field" :style="inputStyle" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="form.yearOfManufacture" required type="number" :placeholder="$t('vehicles.year')" class="input-field" :style="inputStyle" />
          <input v-model="form.color" required :placeholder="$t('vehicles.color')" class="input-field" :style="inputStyle" />
        </div>

        <input v-model="form.licensePlate" required :placeholder="$t('vehicles.plate')" class="input-field" :style="inputStyle" />

        <div class="grid grid-cols-2 gap-3">
          <select v-model="form.type" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('vehicles.type') }}</option>
            <option v-for="opt in carTypes" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <select v-model="form.transmission" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('vehicles.transmission') }}</option>
            <option v-for="opt in transmissions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <select v-model="form.fuelType" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('vehicles.fuelType') }}</option>
            <option v-for="opt in fuelTypes" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input v-model.number="form.seats" required type="number" min="1" :placeholder="$t('vehicles.seats')" class="input-field" :style="inputStyle" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="form.doors" required type="number" min="1" :placeholder="$t('vehicles.doors')" class="input-field" :style="inputStyle" />
          <input v-model.number="form.luggages" required type="number" min="0" :placeholder="$t('vehicles.luggages')" class="input-field" :style="inputStyle" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="form.pricePerDay" required type="number" step="0.01" :placeholder="$t('vehicles.price')" class="input-field" :style="inputStyle" />
          <input v-model.number="form.mileAge" required type="number" step="0.01" :placeholder="$t('vehicles.mileAge')" class="input-field" :style="inputStyle" />
        </div>

        <select v-model="form.status" required class="input-field" :style="inputStyle">
          <option value="" disabled>{{ $t('vehicles.status') }}</option>
          <option v-for="opt in statuses" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <textarea
          v-model="form.description"
          required
          rows="3"
          :placeholder="$t('vehicles.description')"
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
          >{{ $t('vehicles.cancel') }}</button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? $t('vehicles.saving') : $t('vehicles.save') }}
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

const carTypes = ['SEDAN', 'SUV', 'PICKUP', 'HATCHBACK', 'COUPE', 'TRUCK', 'VAN', 'LUXURY', 'ELECTRIC']
const transmissions = ['AUTOMATIC', 'MANUAL', 'CVT']
const fuelTypes = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']
const statuses = ['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE']

const columns = computed(() => [
  { key: 'brand', label: t('vehicles.brand') },
  { key: 'model', label: t('vehicles.model') },
  { key: 'licensePlate', label: t('vehicles.plate') },
  { key: 'type', label: t('vehicles.type') },
  { key: 'seats', label: t('vehicles.seats') },
  { key: 'doors', label: t('vehicles.doors') },
  { key: 'pricePerDay', label: t('vehicles.priceDay') },
  { key: 'status', label: t('vehicles.status') },
])

const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
}

const vehicles = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')

function emptyForm() {
  return {
    brand: '',
    model: '',
    yearOfManufacture: null,
    licensePlate: '',
    color: '',
    type: '',
    transmission: '',
    fuelType: '',
    seats: null,
    doors: null,
    luggages: null,
    pricePerDay: null,
    mileAge: 0,
    description: '',
    status: '',
  }
}

const form = reactive(emptyForm())

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    AVAILABLE: 'bg-green-100 text-green-700',
    RESERVED: 'bg-amber-100 text-amber-700',
    RENTED: 'bg-amber-100 text-amber-700',
    MAINTENANCE: 'bg-red-100 text-red-600',
    UNAVAILABLE: 'bg-gray-200 text-gray-600',
  }
  return `${base} ${map[status] || 'bg-gray-100 text-gray-500'}`
}

async function loadVehicles() {
  loading.value = true
  try {
    const { data } = await api.get('/vehicles')
    vehicles.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, emptyForm())
  saveError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    brand: row.brand,
    model: row.model,
    yearOfManufacture: row.yearOfManufacture,
    licensePlate: row.licensePlate,
    color: row.color,
    type: row.type,
    transmission: row.transmission,
    fuelType: row.fuelType,
    seats: row.seats,
    doors: row.doors,
    luggages: row.luggages,
    pricePerDay: row.pricePerDay,
    mileAge: row.mileAge,
    description: row.description,
    status: row.status,
  })
  saveError.value = ''
  modalOpen.value = true
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    if (editing.value) {
      await api.put(`/vehicles/${editing.value.id}`, form)
    } else {
      await api.post('/vehicles', form)
    }
    modalOpen.value = false
    await loadVehicles()
  } catch (err) {
    saveError.value = err.response?.data?.message || t('vehicles.saveError')
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`${t('vehicles.confirmDelete')} ${row.brand} ${row.model}?`)) return
  await api.delete(`/vehicles/${row.id}`)
  loadVehicles()
}

onMounted(loadVehicles)
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