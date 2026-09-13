<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import discountService from '@/services/discount.service'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'

const { t } = useI18n()

const discounts = ref([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const statusFilter = ref('ALL')
const copiedCode = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

const emptyForm = () => ({
  code: '',
  description: '',
  type: 'PERCENTAGE',
  value: '',
  validFrom: '',
  validTo: '',
  maxUses: '',
  isActive: true,
})

const form = reactive(emptyForm())

const columns = computed(() => [
  { key: 'code', label: t('discounts.code') },
  { key: 'description', label: t('discounts.description') },
  { key: 'typeValue', label: t('discounts.typeValue') },
  { key: 'validity', label: t('discounts.validity') },
  { key: 'usage', label: t('discounts.usage') },
  { key: 'status', label: t('discounts.status') },
])

function computeStatus(d) {
  if (!d.isActive) return 'INACTIVE'
  const now = new Date()
  if (d.validFrom && new Date(d.validFrom) > now) return 'SCHEDULED'
  if (d.validTo && new Date(d.validTo) < now) return 'EXPIRED'
  if (d.maxUses && d.usedCount >= d.maxUses) return 'LIMIT_REACHED'
  return 'ACTIVE'
}

const statusMeta = {
  ACTIVE: { dot: '#10B981', label: () => t('discounts.active') },
  SCHEDULED: { dot: '#F59E0B', label: () => t('discounts.scheduled') },
  EXPIRED: { dot: '#9CA3AF', label: () => t('discounts.expired') },
  LIMIT_REACHED: { dot: '#EF4444', label: () => t('discounts.limitReached') },
  INACTIVE: { dot: '#D1D5DB', label: () => t('discounts.inactive') },
}

const enriched = computed(() =>
  discounts.value.map((d) => ({ ...d, _status: computeStatus(d) }))
)

const filtered = computed(() => {
  let list = enriched.value
  if (statusFilter.value !== 'ALL') {
    list = list.filter((d) => d._status === statusFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      (d) =>
        d.code?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    )
  }
  return list
})

const summary = computed(() => {
  const total = discounts.value.length
  const active = enriched.value.filter((d) => d._status === 'ACTIVE').length
  const in7Days = enriched.value.filter((d) => {
    if (!d.validTo) return false
    const diff = (new Date(d.validTo) - new Date()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }).length
  const totalUses = discounts.value.reduce((sum, d) => sum + (d.usedCount || 0), 0)
  return { total, active, in7Days, totalUses }
})

async function loadDiscounts() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await discountService.getAll()
    discounts.value = data
  } catch (err) {
    errorMessage.value = t('discounts.loadError')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formError.value = ''
  Object.assign(form, emptyForm())
  showModal.value = true
}

function openEditModal(discount) {
  isEditing.value = true
  editingId.value = discount.id
  formError.value = ''
  Object.assign(form, {
    code: discount.code,
    description: discount.description,
    type: discount.type,
    value: discount.value,
    validFrom: discount.validFrom ? discount.validFrom.slice(0, 16) : '',
    validTo: discount.validTo ? discount.validTo.slice(0, 16) : '',
    maxUses: discount.maxUses ?? '',
    isActive: discount.isActive,
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function validateForm() {
  if (!form.code || !form.description || !form.value || !form.validFrom) {
    return t('discounts.requiredFields')
  }
  if (form.type === 'PERCENTAGE' && Number(form.value) > 100) {
    return t('discounts.requiredFields')
  }
  if (form.validTo && new Date(form.validTo) < new Date(form.validFrom)) {
    return t('discounts.requiredFields')
  }
  return ''
}

async function submitForm() {
  const validationError = validateForm()
  if (validationError) {
    formError.value = validationError
    return
  }
  formError.value = ''

  const payload = {
    code: form.code,
    description: form.description,
    type: form.type,
    value: Number(form.value),
    validFrom: form.validFrom,
    validTo: form.validTo || null,
    maxUses: form.maxUses ? Number(form.maxUses) : null,
    isActive: form.isActive,
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await discountService.update(editingId.value, payload)
    } else {
      await discountService.create(payload)
    }
    showModal.value = false
    await loadDiscounts()
  } catch (err) {
    formError.value = err.response?.data?.message || t('discounts.saveError')
  } finally {
    saving.value = false
  }
}

async function toggleActive(discount) {
  try {
    await discountService.togglePause(discount.id, { ...discount, isActive: !discount.isActive })
    await loadDiscounts()
  } catch (err) {
    errorMessage.value = t('discounts.statusError')
  }
}

async function removeDiscount(discount) {
  if (!confirm(t('discounts.confirmDelete', { code: discount.code }))) return
  try {
    await discountService.delete(discount.id)
    await loadDiscounts()
  } catch (err) {
    errorMessage.value = t('discounts.deleteError')
  }
}

function formatValue(discount) {
  return discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    setTimeout(() => (copiedCode.value = ''), 1500)
  } catch {
    /* clipboard unavailable */
  }
}

onMounted(loadDiscounts)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('discounts.title') }}</h1>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
        style="background-color: var(--color-primary, #3D5FE0);"
        @click="openCreateModal"
      >
        + {{ t('discounts.add') }}
      </button>
    </div>

    <!-- Summary strip -->
    <div
      class="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-5 border-b pb-4"
      style="color: var(--color-text-secondary); border-color: var(--color-border);"
    >
      <div><span class="font-semibold" style="color: var(--color-text);">{{ summary.total }}</span> {{ t('discounts.count') }}</div>
      <div><span class="font-semibold" style="color: #10B981;">{{ summary.active }}</span> {{ t('discounts.active') }}</div>
      <div><span class="font-semibold" style="color: #F59E0B;">{{ summary.in7Days }}</span> ({{ t('discounts.expired') }} ≤ 7d)</div>
      <div><span class="font-semibold" style="color: var(--color-text);">{{ summary.totalUses }}</span> {{ t('discounts.usage') }}</div>
    </div>

    <!-- Search + filter pills -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        :placeholder="t('discounts.search')"
        class="rounded-lg px-3 py-2 text-sm w-64 border focus:outline-none focus:ring-2"
        style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary, #3D5FE0);"
      />
      <button
        v-for="opt in ['ALL', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'LIMIT_REACHED', 'INACTIVE']"
        :key="opt"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition"
        :style="statusFilter === opt
          ? `background-color: var(--color-primary, #3D5FE0); color: #fff; border-color: var(--color-primary, #3D5FE0);`
          : `color: var(--color-text-secondary); border-color: var(--color-border);`"
        @click="statusFilter = opt"
      >
        {{ opt === 'ALL' ? t('discounts.count') : statusMeta[opt].label() }}
      </button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="filtered" :loading="loading">
      <template #cell-code="{ row }">
        <button
          class="font-mono font-semibold transition hover:opacity-80"
          style="color: var(--color-text);"
          :title="t('discounts.copied')"
          @click="copyCode(row.code)"
        >
          {{ row.code }}
          <span v-if="copiedCode === row.code" class="text-xs ml-1" style="color: #10B981;">✓</span>
        </button>
      </template>

      <template #cell-description="{ row }">
        <span class="block max-w-xs truncate">{{ row.description }}</span>
      </template>

      <template #cell-typeValue="{ row }">
        {{ formatValue(row) }}
      </template>

      <template #cell-validity="{ row }">
        <span class="text-sm" style="color: var(--color-text-secondary);">
          {{ formatDate(row.validFrom) }} — {{ formatDate(row.validTo) }}
        </span>
      </template>

      <template #cell-usage="{ row }">
        <div class="w-32">
          <div v-if="row.maxUses" class="w-full rounded-full h-1.5 mb-1" style="background-color: var(--color-bg);">
            <div
              class="h-1.5 rounded-full"
              style="background-color: var(--color-primary, #3D5FE0);"
              :style="{ width: Math.min(100, (row.usedCount / row.maxUses) * 100) + '%' }"
            ></div>
          </div>
          <span class="text-sm" style="color: var(--color-text-secondary);">
            {{ row.usedCount }}<span v-if="row.maxUses"> / {{ row.maxUses }}</span>
          </span>
        </div>
      </template>

      <template #cell-status="{ row }">
        <span class="inline-flex items-center gap-1.5 text-xs font-medium" style="color: var(--color-text);">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: statusMeta[row._status].dot }"></span>
          {{ statusMeta[row._status].label() }}
        </span>
      </template>

      <template #actions="{ row }">
        <button class="text-sm mr-3 transition hover:underline" style="color: var(--color-primary, #3D5FE0);" @click="openEditModal(row)">
          {{ t('discounts.edit') }}
        </button>
        <button class="text-sm mr-3 transition hover:underline text-blue-500" @click="toggleActive(row)">
          {{ row.isActive ? t('discounts.deactivate') : t('discounts.activate') }}
        </button>
        <button class="text-sm transition hover:underline text-red-500" @click="removeDiscount(row)">
          {{ t('discounts.delete') }}
        </button>
      </template>
    </DataTable>

    <!-- Empty state message override (search vs no-data) -->
    <p v-if="!loading && filtered.length === 0 && discounts.length > 0" class="text-center text-sm mt-3" style="color: var(--color-text-secondary);">
      {{ t('discounts.noResults') }}
    </p>

    <p v-if="errorMessage" class="text-red-500 mt-3 text-sm">{{ errorMessage }}</p>

    <!-- Create / Edit modal -->
    <Modal :open="showModal" :title="isEditing ? t('discounts.editTitle') : t('discounts.addTitle')" @close="closeModal">
      <div class="space-y-3">
        <div>
          <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.code') }}</label>
          <input
            v-model="form.code"
            type="text"
            class="w-full rounded-lg px-3 py-2 mt-1 border"
            style="background-color: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
            :placeholder="t('discounts.codePlaceholder')"
          />
        </div>

        <div>
          <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.description') }}</label>
          <input
            v-model="form.description"
            type="text"
            class="w-full rounded-lg px-3 py-2 mt-1 border"
            style="background-color: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
          />
        </div>

        <div class="flex gap-3">
          <div class="flex-1">
            <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.type') }}</label>
            <div class="flex rounded-lg border overflow-hidden mt-1" style="border-color: var(--color-border);">
              <button
                type="button"
                class="flex-1 py-2 text-sm font-medium transition"
                :style="form.type === 'PERCENTAGE'
                  ? `background-color: var(--color-primary, #3D5FE0); color: #fff;`
                  : `color: var(--color-text-secondary);`"
                @click="form.type = 'PERCENTAGE'"
              >%</button>
              <button
                type="button"
                class="flex-1 py-2 text-sm font-medium transition"
                :style="form.type === 'FIXED_AMOUNT'
                  ? `background-color: var(--color-primary, #3D5FE0); color: #fff;`
                  : `color: var(--color-text-secondary);`"
                @click="form.type = 'FIXED_AMOUNT'"
              >$</button>
            </div>
          </div>
          <div class="flex-1">
            <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.value') }}</label>
            <input
              v-model="form.value"
              type="number" min="0" step="0.01"
              class="w-full rounded-lg px-3 py-2 mt-1 border"
              style="background-color: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
            />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1 min-w-0">
            <label class="text-sm block truncate" style="color: var(--color-text-secondary);">{{ t('discounts.validFrom') }}</label>
            <input
              v-model="form.validFrom"
              type="datetime-local"
              class="w-full rounded-lg px-3 py-2 mt-1 border text-sm"
              style="background-color: var(--color-bg); color: var(--color-text); border-color: var(--color-border); color-scheme: dark;"
            />
          </div>
          <div class="flex-1 min-w-0">
            <label class="text-sm block truncate" style="color: var(--color-text-secondary);">{{ t('discounts.validTo') }}</label>
            <input
              v-model="form.validTo"
              type="datetime-local"
              class="w-full rounded-lg px-3 py-2 mt-1 border text-sm"
              style="background-color: var(--color-bg); color: var(--color-text); border-color: var(--color-border); color-scheme: dark;"
            />
          </div>
        </div>

        <div>
          <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.maxUses') }}</label>
          <input
            v-model="form.maxUses"
            type="number" min="1"
            class="w-full rounded-lg px-3 py-2 mt-1 border"
            style="background-color: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
          />
        </div>

        <label class="flex items-center gap-3 text-sm" style="color: var(--color-text-secondary);">
          <button
            type="button"
            class="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
            :style="form.isActive ? `background-color: var(--color-primary, #3D5FE0);` : `background-color: var(--color-border);`"
            @click="form.isActive = !form.isActive"
          >
            <span
              class="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform"
              :class="form.isActive ? 'translate-x-4' : 'translate-x-0.5'"
            ></span>
          </button>
          {{ t('discounts.activeImmediately') }}
        </label>
      </div>

      <p v-if="formError" class="text-red-500 text-sm mt-3">{{ formError }}</p>

      <div class="flex justify-end gap-2 mt-5">
        <button
          class="px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
          style="color: var(--color-text-secondary);"
          @click="closeModal"
        >
          {{ t('discounts.cancel') }}
        </button>
        <button
          class="px-4 py-2 rounded-lg text-sm text-white transition hover:opacity-90 disabled:opacity-50"
          style="background-color: var(--color-primary, #3D5FE0);"
          :disabled="saving"
          @click="submitForm"
        >
          {{ saving ? t('discounts.saving') : t('discounts.save') }}
        </button>
      </div>
    </Modal>
  </div>
</template>