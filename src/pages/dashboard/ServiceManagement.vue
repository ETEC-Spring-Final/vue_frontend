<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('services.title') }}</h1>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        + {{ t('services.add') }}
      </button>
    </div>

    <!-- Summary strip -->
    <div
      class="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-5 border-b pb-4"
      style="color: var(--color-text-secondary); border-color: var(--color-border);"
    >
      <div><span class="font-semibold" style="color: var(--color-text);">{{ services.length }}</span> {{ t('services.count') }}</div>
      <div><span class="font-semibold text-emerald-600">{{ counts.active }}</span> {{ t('services.active') }}</div>
      <div><span class="font-semibold text-gray-400">{{ counts.inactive }}</span> {{ t('services.inactive') }}</div>
      <div><span class="font-semibold" style="color: var(--color-text);">${{ counts.totalPrice.toFixed(2) }}</span> {{ t('services.totalPrice') }}</div>
    </div>

    <!-- Search + filter pills -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        :placeholder="t('services.search')"
        class="rounded-lg px-3 py-2 text-sm w-64 border focus:outline-none focus:ring-2"
        style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
      />
      <button
        v-for="opt in ['ALL', 'ACTIVE', 'INACTIVE']"
        :key="opt"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition"
        :style="statusFilter === opt
          ? `background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);`
          : `color: var(--color-text-secondary); border-color: var(--color-border);`"
        @click="statusFilter = opt"
      >
        {{ opt === 'ALL' ? t('services.all') : statusLabel(opt) }}
      </button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="filtered" :loading="loading">
      <template #cell-description="{ row }">
        <span class="block max-w-xs truncate">{{ row.description || '—' }}</span>
      </template>
      <template #cell-price="{ row }">${{ Number(row.price ?? 0).toFixed(2) }}</template>
      <template #cell-isActive="{ row }">
        <span :class="statusClass(row.isActive)">{{ row.isActive ? t('services.active') : t('services.inactive') }}</span>
      </template>
      <template #actions="{ row }">
        <button class="text-sm mr-3 transition hover:underline" style="color: var(--color-primary);" @click="openEdit(row)">
          {{ t('services.edit') }}
        </button>
        <button class="text-sm text-red-600 hover:text-red-700" @click="onDelete(row)">
          {{ t('services.delete') }}
        </button>
      </template>
    </DataTable>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Create / Edit modal -->
    <Modal :open="modalOpen" :title="isEditing ? t('services.editTitle') : t('services.addTitle')" @close="modalOpen = false">
      <form class="space-y-3" @submit.prevent="onSave">
        <input
          v-model="form.name"
          required
          maxlength="100"
          :placeholder="t('services.name')"
          class="input-field"
          :style="inputStyle"
        />

        <textarea
          v-model="form.description"
          required
          maxlength="255"
          rows="3"
          :placeholder="t('services.description')"
          class="input-field resize-none"
          :style="inputStyle"
        ></textarea>

        <div>
          <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('services.price') }}</label>
          <div class="relative mt-1">
            <span
              class="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
              style="color: var(--color-text-secondary);"
            >$</span>
            <input
              v-model.number="form.price"
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
          <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('services.status') }}</label>
          <select v-model="form.isActive" required class="input-field mt-1" :style="inputStyle">
            <option :value="true">{{ t('services.active') }}</option>
            <option :value="false">{{ t('services.inactive') }}</option>
          </select>
        </div>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="modalOpen = false"
          >{{ t('services.cancel') }}</button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? t('services.saving') : t('services.save') }}
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
import api from '@/services/api'

const { t } = useI18n()
const { isDark } = useTheme()

function statusLabel(status) {
  return status === 'ACTIVE' ? t('services.active') : t('services.inactive')
}

function statusClass(isActive) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return isActive ? `${base} bg-green-100 text-green-700` : `${base} bg-gray-100 text-gray-500`
}

const columns = computed(() => [
  { key: 'id', label: t('services.id') },
  { key: 'name', label: t('services.name') },
  { key: 'description', label: t('services.description') },
  { key: 'price', label: t('services.price') },
  { key: 'isActive', label: t('services.status') },
])

const inputStyle = computed(() => ({
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
  colorScheme: isDark.value ? 'dark' : 'light',
}))

const services = ref([])
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
  return { name: '', description: '', price: null, isActive: true }
}

const form = reactive(emptyForm())

const counts = computed(() => {
  const active = services.value.filter((s) => s.isActive).length
  const inactive = services.value.filter((s) => !s.isActive).length
  const totalPrice = services.value.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
  return { active, inactive, totalPrice }
})

const filtered = computed(() => {
  let list = services.value
  if (statusFilter.value === 'ACTIVE') list = list.filter((s) => s.isActive)
  if (statusFilter.value === 'INACTIVE') list = list.filter((s) => !s.isActive)
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    )
  }
  return list
})

async function loadServices() {
  loading.value = true
  actionError.value = ''
  try {
    const { data } = await api.get('/services')
    services.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    actionError.value = t('services.loadError')
  } finally {
    loading.value = false
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
    name: row.name,
    description: row.description,
    price: row.price,
    isActive: row.isActive,
  })
  modalOpen.value = true
}

function validateForm() {
  if (!form.name || !form.name.trim()) {
    return t('services.requiredFields') || 'Name is required.'
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
    name: form.name.trim(),
    description: form.description?.trim() || '',
    price: form.price,
    isActive: form.isActive,
  }
  try {
    if (isEditing.value) {
      await api.put(`/services/${editingId.value}`, payload)
    } else {
      await api.post('/services', payload)
    }
    modalOpen.value = false
    await loadServices()
  } catch (err) {
    saveError.value = err.response?.data?.message || t('services.saveError')
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`${t('services.confirmDelete')} "${row.name}"?`)) return
  try {
    await api.delete(`/services/${row.id}`)
    await loadServices()
  } catch {
    actionError.value = t('services.deleteError')
  }
}

onMounted(loadServices)
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