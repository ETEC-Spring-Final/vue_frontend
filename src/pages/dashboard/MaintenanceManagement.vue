<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ records.length }} maintenance records</p>
      <button
        type="button"
        class="rounded-full bg-[#3D5FE0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3350C0]"
        @click="openCreate"
      >
        + Add record
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="records" :loading="loading">
      <template #cell-scheduledDate="{ row }">{{ formatDate(row.scheduledDate) }}</template>
      <template #cell-completedDate="{ row }">{{ formatDate(row.completedDate) }}</template>
      <template #cell-cost="{ row }">${{ Number(row.cost ?? 0).toFixed(2) }}</template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #actions="{ row }">
        <button class="text-xs font-semibold text-[#3D5FE0] hover:text-[#3350C0]" @click="openEdit(row)">Edit</button>
        <button class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <Modal :open="modalOpen" :title="editing ? 'Edit record' : 'Add record'" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <input v-model.number="form.vehicleId" required type="number" placeholder="Vehicle ID" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <select v-model="form.type" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm">
          <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
        </select>
        <textarea v-model="form.description" required rows="3" placeholder="Description" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm"></textarea>
        <input v-model="form.scheduledDate" required type="datetime-local" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.completedDate" type="datetime-local" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model.number="form.cost" required type="number" placeholder="Cost" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <select v-model="form.status" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm">
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold" @click="modalOpen = false">Cancel</button>
          <button type="submit" :disabled="saving" class="rounded-full bg-[#3D5FE0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import api from '@/services/api'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'vehicleId', label: 'Vehicle ID' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'scheduledDate', label: 'Scheduled' },
  { key: 'completedDate', label: 'Completed' },
  { key: 'cost', label: 'Cost' },
  { key: 'status', label: 'Status' },
]

const typeOptions = ['OIL_CHANGE', 'TIRE_REPLACEMENT', 'REPAIR', 'GENERAL_SERVICE', 'INSPECTION']
const statusOptions = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const records = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')

const form = reactive({
  vehicleId: null, type: 'GENERAL_SERVICE', description: '',
  scheduledDate: '', completedDate: '', cost: null, status: 'SCHEDULED',
})

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    SCHEDULED: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-[#E9EDFB] text-[#3D5FE0]',
    COMPLETED: 'bg-green-50 text-green-600',
    CANCELLED: 'bg-red-50 text-red-600',
  }
  return `${base} ${map[status] || 'bg-[#F3F4F6] text-[#6B7280]'}`
}

async function loadRecords() {
  loading.value = true
  try {
    const { data } = await api.get('/maintenace-records')
    records.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    vehicleId: null, type: 'GENERAL_SERVICE', description: '',
    scheduledDate: '', completedDate: '', cost: null, status: 'SCHEDULED',
  })
}

function openCreate() {
  editing.value = null
  resetForm()
  saveError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    vehicleId: row.vehicleId, type: row.type, description: row.description,
    scheduledDate: row.scheduledDate?.slice(0, 16), completedDate: row.completedDate?.slice(0, 16),
    cost: row.cost, status: row.status,
  })
  saveError.value = ''
  modalOpen.value = true
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    if (editing.value) {
      await api.put(`/maintenace-records/${editing.value.id}`, form)
    } else {
      await api.post('/maintenace-records', form)
    }
    modalOpen.value = false
    await loadRecords()
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Could not save this record.'
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`Delete maintenance record #${row.id}?`)) return
  await api.delete(`/maintenace-records/${row.id}`)
  loadRecords()
}

onMounted(loadRecords)
</script>