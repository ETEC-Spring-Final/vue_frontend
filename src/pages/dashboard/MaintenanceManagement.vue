<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('maintenance.title') }}</h1>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        + {{ t('maintenance.add') }}
      </button>
    </div>

    <!-- Summary strip -->
    <div
      class="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-5 border-b pb-4"
      style="color: var(--color-text-secondary); border-color: var(--color-border);"
    >
      <div><span class="font-semibold" style="color: var(--color-text);">{{ records.length }}</span> {{ t('maintenance.count') }}</div>
      <div><span class="font-semibold text-blue-500">{{ counts.scheduled }}</span> {{ t('maintenance.scheduled') }}</div>
      <div><span class="font-semibold text-amber-500">{{ counts.inProgress }}</span> {{ t('maintenance.inProgress') }}</div>
      <div><span class="font-semibold text-emerald-600">{{ counts.completed }}</span> {{ t('maintenance.completed') }}</div>
      <div><span class="font-semibold" style="color: var(--color-text);">${{ counts.totalCost.toFixed(2) }}</span> {{ t('maintenance.totalCost') }}</div>
    </div>

    <!-- Search + filter pills -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        :placeholder="t('maintenance.search')"
        class="rounded-lg px-3 py-2 text-sm w-64 border focus:outline-none focus:ring-2"
        style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
      />
      <button
        v-for="opt in ['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']"
        :key="opt"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition"
        :style="statusFilter === opt
          ? `background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);`
          : `color: var(--color-text-secondary); border-color: var(--color-border);`"
        @click="statusFilter = opt"
      >
        {{ opt === 'ALL' ? t('maintenance.all') : statusLabel(opt) }}
      </button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="filtered" :loading="loading">
      <template #cell-vehicleId="{ row }">{{ vehicleLabel(row.vehicleId) }}</template>
      <template #cell-type="{ row }">{{ typeLabel(row.type) }}</template>
      <template #cell-description="{ row }">
        <span class="block max-w-xs truncate">{{ row.description || '—' }}</span>
      </template>
      <template #cell-scheduledDate="{ row }">{{ formatDate(row.scheduledDate) }}</template>
      <template #cell-cost="{ row }">${{ Number(row.cost ?? 0).toFixed(2) }}</template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
      </template>
      <template #actions="{ row }">
        <button class="text-sm mr-3 transition hover:underline" style="color: var(--color-primary);" @click="openEdit(row)">
          {{ t('maintenance.edit') }}
        </button>
        <button
          class="text-sm text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ t('maintenance.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="!loading && filtered.length === 0 && records.length > 0" class="text-center text-sm mt-3" style="color: var(--color-text-secondary);">
      {{ t('maintenance.noResults') }}
    </p>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Create / Edit modal -->
    <Modal :open="modalOpen" :title="isEditing ? t('maintenance.editTitle') : t('maintenance.addTitle')" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <select v-model.number="form.vehicleId" required class="input-field" :style="inputStyle">
          <option value="" disabled>{{ t('maintenance.selectVehicle') }}</option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">
            {{ v.brand }} {{ v.model }} — #{{ v.id }}
          </option>
        </select>

        <select v-model="form.type" required class="input-field" :style="inputStyle">
          <option v-for="opt in typeOptions" :key="opt" :value="opt">{{ typeLabel(opt) }}</option>
        </select>

        <div>
          <textarea
            v-model="form.description"
            required
            minlength="1"
            maxlength="255"
            rows="2"
            :placeholder="t('maintenance.description')"
            class="input-field resize-none"
            :style="inputStyle"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('maintenance.scheduledDate') }}</label>
            <input v-model="form.scheduledDate" type="datetime-local" required class="input-field mt-1" :style="inputStyle" />
          </div>
          <div>
            <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('maintenance.completedDate') }}</label>
            <input v-model="form.completedDate" type="datetime-local" class="input-field mt-1" :style="inputStyle" />
          </div>
        </div>

        <div>
          <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('maintenance.cost') }}</label>
          <div class="relative mt-1">
            <span
              class="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
              style="color: var(--color-text-secondary);"
            >$</span>
            <input
              v-model.number="form.cost"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              class="input-field pl-10 w-full"
              :style="inputStyle"
            />
          </div>
        </div>

        <div>
          <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('maintenance.status') }}</label>
          <select v-model="form.status" required class="input-field mt-1" :style="inputStyle">
            <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
          </select>
        </div>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="modalOpen = false"
          >{{ t('maintenance.cancel') }}</button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? t('maintenance.saving') : t('maintenance.save') }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import maintenanceService from '@/services/maintenance.service'
import api from '@/services/api'

const { t } = useI18n()
const { isDark } = useTheme()

const typeOptions = ['OIL_CHANGE', 'TIRE_REPLACEMENT', 'REPAIR', 'GENERAL_SERVICE', 'INSPECTION']
const statusOptions = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function typeLabel(type) {
  return t(`maintenance.types.${type}`)
}

function statusLabel(status) {
  const map = {
    SCHEDULED: t('maintenance.scheduled'),
    IN_PROGRESS: t('maintenance.inProgress'),
    COMPLETED: t('maintenance.completed'),
    CANCELLED: t('maintenance.cancelled'),
  }
  return map[status] ?? status
}

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-600',
  }
  return `${base} ${map[status] || 'bg-gray-100 text-gray-500'}`
}

const columns = computed(() => [
  { key: 'vehicleId', label: t('maintenance.vehicle') },
  { key: 'type', label: t('maintenance.type') },
  { key: 'description', label: t('maintenance.description') },
  { key: 'scheduledDate', label: t('maintenance.scheduledDate') },
  { key: 'cost', label: t('maintenance.cost') },
  { key: 'status', label: t('maintenance.status') },
])

const inputStyle = computed(() => ({
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
  colorScheme: isDark.value ? 'dark' : 'light',
}))

const records = ref([])
const vehicles = ref([])
const loading = ref(true)
const actionError = ref('')
const search = ref('')
const statusFilter = ref('ALL')

const modalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const saveError = ref('')

function emptyForm() {
  return {
    vehicleId: '',
    type: 'GENERAL_SERVICE',
    description: '',
    scheduledDate: '',
    completedDate: '',
    cost: null,
    status: 'SCHEDULED',
  }
}

const form = reactive(emptyForm())

const counts = computed(() => {
  const scheduled = records.value.filter((r) => r.status === 'SCHEDULED').length
  const inProgress = records.value.filter((r) => r.status === 'IN_PROGRESS').length
  const completed = records.value.filter((r) => r.status === 'COMPLETED').length
  const totalCost = records.value.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)
  return { scheduled, inProgress, completed, totalCost }
})

const filtered = computed(() => {
  let list = records.value
  if (statusFilter.value !== 'ALL') {
    list = list.filter((r) => r.status === statusFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      (r) =>
        r.description?.toLowerCase().includes(q) ||
        vehicleLabel(r.vehicleId).toLowerCase().includes(q)
    )
  }
  return list
})

function vehicleLabel(id) {
  const v = vehicles.value.find((x) => x.id === id)
  return v ? `${v.brand} ${v.model}` : `#${id}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

async function loadRecords() {
  loading.value = true
  actionError.value = ''
  try {
    const { data } = await maintenanceService.getAll()
    records.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    actionError.value = t('maintenance.loadError')
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

function openCreate() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, emptyForm())
  saveError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  isEditing.value = true
  editingId.value = row.id
  saveError.value = ''
  Object.assign(form, {
    vehicleId: row.vehicleId,
    type: row.type,
    description: row.description,
    scheduledDate: row.scheduledDate ? row.scheduledDate.slice(0, 16) : '',
    completedDate: row.completedDate ? row.completedDate.slice(0, 16) : '',
    cost: row.cost,
    status: row.status,
  })
  modalOpen.value = true
}

function validateForm() {
  if (!form.description || !form.description.trim()) {
    return t('maintenance.requiredFields') || 'Description is required.'
  }
  return ''
}

async function onSave() {
  const validationError = validateForm()
  if (validationError) {
    saveError.value = validationError
    return
  }

  saving.value = true
  saveError.value = ''
  const payload = {
    vehicleId: form.vehicleId,
    type: form.type,
    description: form.description.trim(),
    scheduledDate: form.scheduledDate,
    completedDate: form.completedDate || null,
    cost: form.cost,
    status: form.status,
  }
  try {
    if (isEditing.value) {
      await maintenanceService.update(editingId.value, payload)
    } else {
      await maintenanceService.create(payload)
    }
    modalOpen.value = false
    await loadRecords()
  } catch (err) {
    saveError.value = err.response?.data?.message || t('maintenance.saveError')
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`${t('maintenance.confirmDelete')} #${row.id}?`)) return
  try {
    await maintenanceService.delete(row.id)
    await loadRecords()
  } catch {
    actionError.value = t('maintenance.deleteError')
  }
}

onMounted(() => {
  loadRecords()
  loadVehicles()
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