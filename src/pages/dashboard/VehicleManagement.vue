<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ vehicles.length }} vehicles</p>
      <button
        type="button"
        class="rounded-full bg-[#3D5FE0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3350C0]"
        @click="openCreate"
      >
        + Add vehicle
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="vehicles" :loading="loading">
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #actions="{ row }">
        <button class="text-xs font-semibold text-[#3D5FE0] hover:text-[#3350C0]" @click="openEdit(row)">Edit</button>
        <button class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <Modal :open="modalOpen" :title="editing ? 'Edit vehicle' : 'Add vehicle'" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <input v-model="form.name" required placeholder="Name" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.brand" required placeholder="Brand" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model.number="form.price" required type="number" placeholder="Price per day" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.licensePlate" required placeholder="License plate" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />

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
  { key: 'name', label: 'Name' },
  { key: 'brand', label: 'Brand' },
  { key: 'price', label: 'Price/day' },
  { key: 'licensePlate', label: 'Plate' },
  { key: 'status', label: 'Status' },
]

const vehicles = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')

const form = reactive({ name: '', brand: '', price: null, licensePlate: '' })

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    AVAILABLE: 'bg-green-100 text-green-700',
    RESERVED: 'bg-amber-100 text-amber-700',
    RENTED: 'bg-amber-100 text-amber-700',
    MAINTENANCE: 'bg-red-100 text-red-600',
  }
  return `${base} ${map[status] || 'bg-[#F3F4F6] text-[#6B7280]'}`
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
  Object.assign(form, { name: '', brand: '', price: null, licensePlate: '' })
  saveError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, { name: row.name, brand: row.brand, price: row.price, licensePlate: row.licensePlate })
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
    saveError.value = err.response?.data?.message || 'Could not save this vehicle.'
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`Delete ${row.name}?`)) return
  await api.delete(`/vehicles/${row.id}`)
  loadVehicles()
}

onMounted(loadVehicles)
</script>   