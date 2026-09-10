<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ discounts.length }} discounts</p>
      <button
        type="button"
        class="rounded-full bg-[#3D5FE0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3350C0]"
        @click="openCreate"
      >
        + Add discount
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="discounts" :loading="loading">
      <template #cell-value="{ row }">
        {{ row.type === 'PERCENTAGE' ? `${row.value}%` : `$${row.value}` }}
      </template>
      <template #cell-validFrom="{ row }">{{ formatDate(row.validFrom) }}</template>
      <template #cell-validTo="{ row }">{{ formatDate(row.validTo) }}</template>
      <template #cell-isActive="{ row }">
        <span :class="activeClass(row.isActive)">{{ row.isActive ? 'Active' : 'Inactive' }}</span>
      </template>
      <template #actions="{ row }">
        <button class="text-xs font-semibold text-[#3D5FE0] hover:text-[#3350C0]" @click="openEdit(row)">Edit</button>
        <button class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <Modal :open="modalOpen" :title="editing ? 'Edit discount' : 'Add discount'" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <input v-model="form.code" required placeholder="Code" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.description" required placeholder="Description" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <select v-model="form.type" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm">
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED_AMOUNT">Fixed amount</option>
        </select>
        <input v-model.number="form.value" required type="number" placeholder="Value" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.validFrom" required type="datetime-local" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model="form.validTo" required type="datetime-local" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <input v-model.number="form.maxUses" required type="number" placeholder="Max uses" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
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
  { key: 'code', label: 'Code' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value' },
  { key: 'validFrom', label: 'Valid from' },
  { key: 'validTo', label: 'Valid to' },
  { key: 'usedCount', label: 'Used' },
  { key: 'maxUses', label: 'Max uses' },
  { key: 'isActive', label: 'Status' },
]

const discounts = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')

const form = reactive({
  code: '', description: '', type: 'PERCENTAGE', value: null,
  validFrom: '', validTo: '', maxUses: null, isActive: true,
})

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function activeClass(active) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return active ? `${base} bg-green-50 text-green-600` : `${base} bg-[#F3F4F6] text-[#6B7280]`
}

async function loadDiscounts() {
  loading.value = true
  try {
    const { data } = await api.get('/discounts')
    discounts.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    code: '', description: '', type: 'PERCENTAGE', value: null,
    validFrom: '', validTo: '', maxUses: null, isActive: true,
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
    code: row.code, description: row.description, type: row.type, value: row.value,
    validFrom: row.validFrom?.slice(0, 16), validTo: row.validTo?.slice(0, 16),
    maxUses: row.maxUses, isActive: row.isActive,
  })
  saveError.value = ''
  modalOpen.value = true
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    if (editing.value) {
      await api.put(`/discounts/${editing.value.id}`, form)
    } else {
      await api.post('/discounts', form)
    }
    modalOpen.value = false
    await loadDiscounts()
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Could not save this discount.'
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`Delete discount ${row.code}?`)) return
  await api.delete(`/discounts/${row.id}`)
  loadDiscounts()
}

onMounted(loadDiscounts)
</script>