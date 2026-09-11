<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ services.length }} services</p>
      <button
        type="button"
        class="rounded-full bg-[#3D5FE0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3350C0]"
        @click="openCreate"
      >
        + Add service
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="services" :loading="loading">
      <template #cell-price="{ row }">${{ Number(row.price ?? 0).toFixed(2) }}</template>
      <template #cell-isActive="{ row }">
        <span :class="activeClass(row.isActive)">{{ row.isActive ? 'Active' : 'Inactive' }}</span>
      </template>
      <template #actions="{ row }">
        <button class="text-xs font-semibold text-[#3D5FE0] hover:text-[#3350C0]" @click="openEdit(row)">Edit</button>
        <button class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <Modal :open="modalOpen" :title="editing ? 'Edit service' : 'Add service'" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <input v-model="form.name" required maxlength="100" placeholder="Name" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <textarea v-model="form.description" maxlength="255" rows="3" placeholder="Description" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm"></textarea>
        <input v-model.number="form.price" required type="number" placeholder="Price" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <label class="flex items-center gap-2 text-sm text-[#1A2036]">
          <input v-model="form.isActive" type="checkbox" /> Active
        </label>

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
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'price', label: 'Price' },
  { key: 'isActive', label: 'Status' },
]

const services = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')

const form = reactive({ name: '', description: '', price: null, isActive: true })

function activeClass(active) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return active ? `${base} bg-green-50 text-green-600` : `${base} bg-[#F3F4F6] text-[#6B7280]`
}

async function loadServices() {
  loading.value = true
  try {
    const { data } = await api.get('/services')
    services.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', description: '', price: null, isActive: true })
}

function openCreate() {
  editing.value = null
  resetForm()
  saveError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, { name: row.name, description: row.description, price: row.price, isActive: row.isActive })
  saveError.value = ''
  modalOpen.value = true
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    if (editing.value) {
      await api.put(`/services/${editing.value.id}`, form)
    } else {
      await api.post('/services', form)
    }
    modalOpen.value = false
    await loadServices()
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Could not save this service.'
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`Delete service ${row.name}?`)) return
  await api.delete(`/services/${row.id}`)
  loadServices()
}

onMounted(loadServices)
</script>