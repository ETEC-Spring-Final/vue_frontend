<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ locations.length }} {{ $t('locations.count') }}
      </p>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        + {{ $t('locations.add') }}
      </button>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="locations" :loading="loading">
      <template #cell-isActive="{ row }">
        <span :class="statusClass(row.isActive)">
          {{ row.isActive ? $t('locations.active') : $t('locations.inactive') }}
        </span>
      </template>
      <template #actions="{ row }">
        <button
          class="text-xs font-semibold hover:opacity-70"
          style="color: var(--color-primary);"
          @click="openEdit(row)"
        >{{ $t('locations.edit') }}</button>
        <button
          class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ $t('locations.delete') }}</button>
      </template>
    </DataTable>

    <Modal :open="modalOpen" :title="editing ? $t('locations.editTitle') : $t('locations.addTitle')" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <input v-model="form.name" required :placeholder="$t('locations.name')" class="input-field" :style="inputStyle" />
        <input v-model="form.address" required :placeholder="$t('locations.address')" class="input-field" :style="inputStyle" />
        <input v-model="form.city" required :placeholder="$t('locations.city')" class="input-field" :style="inputStyle" />
        <input v-model="form.phone" required :placeholder="$t('locations.phone')" class="input-field" :style="inputStyle" />

        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded" style="accent-color: var(--color-primary);" />
          {{ $t('locations.isActive') }}
        </label>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="modalOpen = false"
          >{{ $t('locations.cancel') }}</button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? $t('locations.saving') : $t('locations.save') }}
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
  { key: 'name', label: t('locations.name') },
  { key: 'address', label: t('locations.address') },
  { key: 'city', label: t('locations.city') },
  { key: 'phone', label: t('locations.phone') },
  { key: 'isActive', label: t('locations.status') },
])

const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
}

const locations = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')

function emptyForm() {
  return { name: '', address: '', city: '', phone: '', isActive: true }
}

const form = reactive(emptyForm())

function statusClass(isActive) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return isActive ? `${base} bg-green-100 text-green-700` : `${base} bg-gray-200 text-gray-600`
}

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
  Object.assign(form, emptyForm())
  saveError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    isActive: !!row.isActive,
  })
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
    saveError.value = err.response?.data?.message || t('locations.saveError')
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`${t('locations.confirmDelete')} ${row.name}?`)) return
  await api.delete(`/locations/${row.id}`)
  loadLocations()
}

onMounted(loadLocations)
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