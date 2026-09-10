<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ locations.length }} locations</p>
      <button
        type="button"
        class="rounded-full bg-[#3D5FE0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3350C0]"
        @click="openCreate"
      >
        + Add location
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="locations" :loading="loading">
      <template #actions="{ row }">
        <button class="text-xs font-semibold text-[#3D5FE0] hover:text-[#3350C0]" @click="openEdit(row)">Edit</button>
        <button class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <Modal :open="modalOpen" :title="editing ? 'Edit location' : 'Add location'" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <input v-model="form.name" required placeholder="Name" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.address" required placeholder="Address" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.city" required placeholder="City" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.phone" required placeholder="Phone" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />

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
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'phone', label: 'Phone' },
]

const locations = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')

const form = reactive({ name: '', address: '', city: '', phone: '' })

async function loadLocations() {
  loading.value = true
  try {
    const { data } = await api.get('/locations')
    locations.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', address: '', city: '', phone: '' })
  saveError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, { name: row.name, address: row.address, city: row.city, phone: row.phone })
  saveError.value = ''
  modalOpen.value = true
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    if (editing.value) {
      await api.put(`/locations/${editing.value.id}`, form)
    } else {
      await api.post('/locations', form)
    }
    modalOpen.value = false
    await loadLocations()
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Could not save this location.'
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`Delete ${row.name}?`)) return
  await api.delete(`/locations/${row.id}`)
  loadLocations()
}

onMounted(loadLocations)
</script>