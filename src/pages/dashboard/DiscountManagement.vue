<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import discountService from '@/services/discount.service'
import Modal from '@/components/ui/Modal.vue'

const { t, te, locale } = useI18n()
// Translate when the key exists, otherwise fall back to the English default.
const tr = (key, fallback, params) => (te(key) ? t(key, params ?? {}) : fallback)

// ---------- State ----------
const discounts = ref([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const statusFilter = ref('ALL')
const copiedCode = ref('')
const busyId = ref(null)

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const errors = reactive({ code: '', description: '', value: '', validFrom: '', validTo: '', maxUses: '' })

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time
function toLocalInput(date) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const emptyForm = () => ({
  code: '',
  description: '',
  type: 'PERCENTAGE',
  value: '',
  validFrom: toLocalInput(new Date()), // starts now by default instead of forcing the admin to type it
  validTo: '',
  maxUses: '',
  isActive: true,
})
const form = reactive(emptyForm())

// ---------- Status ----------
function computeStatus(d) {
  if (!d.isActive) return 'INACTIVE'
  const now = new Date()
  if (d.validFrom && new Date(d.validFrom) > now) return 'SCHEDULED'
  if (d.validTo && new Date(d.validTo) < now) return 'EXPIRED'
  if (d.maxUses && (d.usedCount || 0) >= d.maxUses) return 'LIMIT_REACHED'
  return 'ACTIVE'
}

const STATUS_KEY = {
  ACTIVE: 'active',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  LIMIT_REACHED: 'limitReached',
  INACTIVE: 'inactive',
}
const statusLabel = (s) => t(`discounts.${STATUS_KEY[s]}`)

// Tinted pill + dot per status (same idea as the gray "expired" pill in EventPlace, but readable at a glance)
const STATUS_STYLE = {
  ACTIVE: { bg: 'rgba(16,185,129,0.12)', color: '#059669', dot: '#10B981' },
  SCHEDULED: { bg: 'rgba(245,158,11,0.14)', color: '#B45309', dot: '#F59E0B' },
  LIMIT_REACHED: { bg: 'rgba(239,68,68,0.12)', color: '#DC2626', dot: '#EF4444' },
  INACTIVE: { bg: 'var(--color-border)', color: 'var(--color-text-secondary)', dot: '#9CA3AF' },
  EXPIRED: { bg: 'var(--color-border)', color: 'var(--color-text-secondary)', dot: '#9CA3AF' },
}

// Rows that need attention come first: live codes (soonest ending first), then scheduled, etc.
const STATUS_ORDER = { ACTIVE: 0, SCHEDULED: 1, LIMIT_REACHED: 2, INACTIVE: 3, EXPIRED: 4 }
const endTime = (d) => (d.validTo ? Date.parse(d.validTo) : Number.POSITIVE_INFINITY)

const enriched = computed(() => discounts.value.map((d) => ({ ...d, _status: computeStatus(d) })))

const tabs = computed(() => {
  const counts = { ALL: enriched.value.length }
  for (const d of enriched.value) counts[d._status] = (counts[d._status] || 0) + 1
  return ['ALL', 'ACTIVE', 'SCHEDULED', 'LIMIT_REACHED', 'INACTIVE', 'EXPIRED']
    // Empty tabs are noise, so only show them when they have rows (or are selected)
    .filter((k) => k === 'ALL' || k === 'ACTIVE' || counts[k] || statusFilter.value === k)
    .map((k) => ({
      key: k,
      count: counts[k] || 0,
      label: k === 'ALL' ? tr('discounts.filterAll', 'All') : statusLabel(k),
    }))
})

const filtered = computed(() => {
  let list = enriched.value
  if (statusFilter.value !== 'ALL') list = list.filter((d) => d._status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (d) => d.code?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
    )
  }
  return [...list].sort((a, b) => {
    const byStatus = STATUS_ORDER[a._status] - STATUS_ORDER[b._status]
    if (byStatus) return byStatus
    const ea = endTime(a)
    const eb = endTime(b)
    return ea === eb ? 0 : ea < eb ? -1 : 1
  })
})

const filtersActive = computed(() => !!search.value.trim() || statusFilter.value !== 'ALL')
function clearFilters() {
  search.value = ''
  statusFilter.value = 'ALL'
}

// Live codes that stop working within a week: the one thing an admin should act on
const DAY_MS = 24 * 60 * 60 * 1000
const daysLeft = (d) => Math.ceil((Date.parse(d.validTo) - Date.now()) / DAY_MS)
const expiringSoon = computed(
  () => enriched.value.filter((d) => d._status === 'ACTIVE' && d.validTo && daysLeft(d) <= 7).length
)
function endsInLabel(d) {
  if (d._status !== 'ACTIVE' || !d.validTo) return ''
  const n = daysLeft(d)
  return n <= 7 ? tr('discounts.endsIn', `Ends in ${n} d`, { n }) : ''
}

// ---------- Formatting ----------
function formatValue(d) {
  return d.type === 'PERCENTAGE' ? `−${d.value}%` : `−$${d.value}`
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function usagePercent(d) {
  return Math.min(100, ((d.usedCount || 0) / d.maxUses) * 100)
}
function usageColor(d) {
  const p = usagePercent(d)
  if (p >= 100) return '#EF4444'
  if (p >= 80) return '#F59E0B'
  return 'var(--color-primary)'
}

// ---------- Data ----------
async function loadDiscounts({ silent = false } = {}) {
  if (!silent) loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await discountService.getAll()
    discounts.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    errorMessage.value = t('discounts.loadError')
  } finally {
    loading.value = false
  }
}

// ---------- Modal ----------
function resetErrors() {
  Object.keys(errors).forEach((k) => (errors[k] = ''))
  formError.value = ''
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  resetErrors()
  Object.assign(form, emptyForm())
  showModal.value = true
}

function openEditModal(d) {
  isEditing.value = true
  editingId.value = d.id
  resetErrors()
  Object.assign(form, {
    code: d.code,
    description: d.description,
    type: d.type,
    value: d.value,
    validFrom: d.validFrom ? d.validFrom.slice(0, 16) : '',
    validTo: d.validTo ? d.validTo.slice(0, 16) : '',
    maxUses: d.maxUses ?? '',
    isActive: d.isActive,
  })
  showModal.value = true
}

// Same settings, fresh code and start date: quickest way to make "SUMMER2027" from "SUMMER2026"
function openDuplicate(d) {
  openCreateModal()
  Object.assign(form, {
    description: d.description,
    type: d.type,
    value: d.value,
    maxUses: d.maxUses ?? '',
  })
  generateCode()
}

function closeModal() {
  showModal.value = false
}

// Codes are typed by customers, so keep them to unambiguous characters
function onCodeInput() {
  form.code = form.code.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
  errors.code = ''
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid mix-ups
  const bytes = new Uint32Array(6)
  crypto.getRandomValues(bytes)
  form.code = Array.from(bytes, (n) => chars[n % chars.length]).join('')
  errors.code = ''
}

function setEndIn(days) {
  const base = form.validFrom ? new Date(form.validFrom) : new Date()
  base.setDate(base.getDate() + days)
  form.validTo = toLocalInput(base)
  errors.validTo = ''
}

// Preview shown at the top of the modal, so the admin sees what customers will see
const previewValue = computed(() => {
  if (form.value === '' || form.value == null) return '—'
  return form.type === 'PERCENTAGE' ? `${form.value}%` : `$${form.value}`
})
const previewUntil = computed(() =>
  form.validTo
    ? tr('discounts.previewUntil', `Until ${formatDateTime(form.validTo)}`, { date: formatDateTime(form.validTo) })
    : tr('discounts.noEnd', 'No end date')
)

function validateForm() {
  resetErrors()
  const code = form.code.trim()

  if (!code) errors.code = t('discounts.requiredFields')
  else if (
    discounts.value.some((d) => d.id !== editingId.value && d.code?.toLowerCase() === code.toLowerCase())
  ) {
    errors.code = tr('discounts.codeTaken', 'This code already exists.')
  }

  if (!form.description.trim()) errors.description = t('discounts.requiredFields')

  const value = Number(form.value)
  if (form.value === '' || form.value == null) errors.value = t('discounts.requiredFields')
  else if (!(value > 0)) errors.value = tr('discounts.valueMin', 'Value must be greater than 0.')
  else if (form.type === 'PERCENTAGE' && value > 100) errors.value = tr('discounts.percentMax', 'A percentage cannot exceed 100.')

  if (!form.validFrom) errors.validFrom = t('discounts.requiredFields')

  if (form.validTo && form.validFrom && new Date(form.validTo) <= new Date(form.validFrom)) {
    errors.validTo = tr('discounts.endBeforeStart', 'The end date must be after the start date.')
  }

  if (form.maxUses !== '' && form.maxUses != null && !(Number(form.maxUses) >= 1)) {
    errors.maxUses = tr('discounts.maxUsesMin', 'Must be at least 1.')
  }

  return !Object.values(errors).some(Boolean)
}

async function submitForm() {
  if (!validateForm()) return

  const payload = {
    code: form.code.trim(),
    description: form.description.trim(),
    type: form.type,
    value: Number(form.value),
    validFrom: form.validFrom,
    validTo: form.validTo || null,
    maxUses: form.maxUses ? Number(form.maxUses) : null,
    isActive: form.isActive,
  }

  saving.value = true
  formError.value = ''
  try {
    if (isEditing.value) await discountService.update(editingId.value, payload)
    else await discountService.create(payload)
    showModal.value = false
    await loadDiscounts({ silent: true })
  } catch (err) {
    formError.value = err.response?.data?.message || t('discounts.saveError')
  } finally {
    saving.value = false
  }
}

// ---------- Row actions (updated in place so the list doesn't flash or jump) ----------
async function toggleActive(d) {
  if (busyId.value) return
  busyId.value = d.id
  errorMessage.value = ''
  try {
    const { _status, ...raw } = d // don't send our computed helper field to the API
    await discountService.togglePause(d.id, { ...raw, isActive: !d.isActive })
    const target = discounts.value.find((x) => x.id === d.id)
    if (target) target.isActive = !d.isActive
  } catch {
    errorMessage.value = t('discounts.statusError')
  } finally {
    busyId.value = null
  }
}

async function removeDiscount(d) {
  if (busyId.value) return
  if (!confirm(t('discounts.confirmDelete', { code: d.code }))) return
  busyId.value = d.id
  errorMessage.value = ''
  try {
    await discountService.delete(d.id)
    discounts.value = discounts.value.filter((x) => x.id !== d.id)
  } catch {
    errorMessage.value = t('discounts.deleteError')
  } finally {
    busyId.value = null
  }
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

// ---------- Static bits ----------
const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
  borderColor: 'var(--color-border)',
  '--tw-ring-color': 'var(--color-primary)',
}
const columnLabels = computed(() => [
  t('discounts.code'),
  tr('discounts.discountCol', 'Discount'),
  tr('discounts.startsCol', 'Starts'),
  tr('discounts.endsCol', 'Ends'),
  t('discounts.usage'),
  t('discounts.status'),
])

onMounted(loadDiscounts)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
          </svg>
        </span>
        <div>
          <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('discounts.title') }}</h1>
          <p class="mt-0.5 text-sm" style="color: var(--color-text-secondary);">
            {{ tr('discounts.subtitle', 'Create and manage the promo codes customers can use when booking.') }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreateModal"
      >
        + {{ t('discounts.add') }}
      </button>
    </div>

    <!-- The one alert worth interrupting for: live codes about to stop working -->
    <div
      v-if="expiringSoon"
      role="status"
      class="mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
      style="background-color: rgba(234,179,8,0.14); color: #B45309; border: 1px solid rgba(234,179,8,0.4);"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 shrink-0">
        <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
      {{ tr('discounts.expiringBanner', `${expiringSoon} code(s) expire within 7 days.`, { n: expiringSoon }) }}
    </div>

    <!-- Toolbar -->
    <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
      <div
        role="tablist"
        class="inline-flex flex-wrap gap-1 rounded-full border p-1"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="statusFilter === tab.key"
          class="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150"
          :style="statusFilter === tab.key
            ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
            : { color: 'var(--color-text-secondary)' }"
          @click="statusFilter = tab.key"
        >
          {{ tab.label }}
          <span class="ml-1 text-xs tabular-nums opacity-80">{{ tab.count }}</span>
        </button>
      </div>

      <input
        v-model="search"
        type="search"
        :placeholder="t('discounts.search')"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 sm:w-64"
        style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
      />
    </div>

    <p v-if="errorMessage" role="alert" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>

    <!-- Empty: no discounts at all -->
    <div
      v-if="!loading && discounts.length === 0 && !errorMessage"
      class="mt-6 flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center"
      style="border-color: var(--color-border);"
    >
      <span
        class="flex h-12 w-12 items-center justify-center rounded-full"
        :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
          <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        </svg>
      </span>
      <p class="mt-4 text-sm font-semibold" style="color: var(--color-text);">{{ tr('discounts.emptyTitle', 'No discount codes yet.') }}</p>
      <p class="mt-1 max-w-sm text-sm" style="color: var(--color-text-secondary);">
        {{ tr('discounts.emptyHint', 'Create your first code to offer customers a discount.') }}
      </p>
      <button
        type="button"
        class="mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreateModal"
      >
        + {{ t('discounts.add') }}
      </button>
    </div>

    <!-- Table -->
    <div
      v-else-if="loading || filtered.length"
      class="mt-6 overflow-x-auto rounded-2xl border"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <table class="w-full min-w-[880px] text-sm">
        <thead>
          <tr class="text-left text-xs" style="color: var(--color-text-secondary);">
            <th v-for="label in columnLabels" :key="label" class="px-5 py-3.5 font-medium">{{ label }}</th>
            <th class="px-5 py-3.5"><span class="sr-only">{{ tr('discounts.actions', 'Actions') }}</span></th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="n in 4" :key="`sk-${n}`" class="border-t" style="border-color: var(--color-border);">
              <td v-for="c in 7" :key="c" class="px-5 py-4">
                <div class="h-4 animate-pulse rounded" :style="{ backgroundColor: 'var(--color-border)', width: c === 1 ? '7rem' : '4.5rem' }"></div>
              </td>
            </tr>
          </template>

          <template v-else>
            <tr
              v-for="d in filtered"
              :key="d.id"
              class="border-t transition-colors duration-150 hover:bg-[var(--color-bg)]"
              :class="d._status === 'EXPIRED' || d._status === 'INACTIVE' ? 'opacity-70' : ''"
              style="border-color: var(--color-border);"
            >
              <!-- Code + description -->
              <td class="px-5 py-4 align-middle">
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-sm font-semibold" style="color: var(--color-text);">{{ d.code }}</span>
                  <button
                    type="button"
                    class="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[var(--color-border)]"
                    :title="tr('discounts.copy', 'Copy code')"
                    :aria-label="tr('discounts.copy', 'Copy code')"
                    @click="copyCode(d.code)"
                  >
                    <svg v-if="copiedCode === d.code" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5" style="color: #10B981;">
                      <path stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5" style="color: var(--color-text-secondary);">
                      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 8h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm-3 8H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                    </svg>
                  </button>
                </div>
                <p class="mt-0.5 max-w-[16rem] truncate text-xs" style="color: var(--color-text-secondary);" :title="d.description">{{ d.description }}</p>
              </td>

              <!-- Discount pill -->
              <td class="px-5 py-4 align-middle">
                <span class="inline-block whitespace-nowrap rounded-full bg-red-500 px-3 py-1 text-xs font-bold tabular-nums text-white">
                  {{ formatValue(d) }}
                </span>
              </td>

              <!-- Starts -->
              <td class="whitespace-nowrap px-5 py-4 align-middle" style="color: var(--color-text);">{{ formatDateTime(d.validFrom) || '—' }}</td>

              <!-- Ends -->
              <td class="px-5 py-4 align-middle">
                <p class="whitespace-nowrap" :style="{ color: d.validTo ? 'var(--color-text)' : 'var(--color-text-secondary)' }">
                  {{ d.validTo ? formatDateTime(d.validTo) : tr('discounts.noEnd', 'No end date') }}
                </p>
                <p v-if="endsInLabel(d)" class="mt-0.5 text-xs font-medium" style="color: #B45309;">{{ endsInLabel(d) }}</p>
              </td>

              <!-- Usage -->
              <td class="px-5 py-4 align-middle">
                <div class="w-28">
                  <div v-if="d.maxUses" class="mb-1 h-1.5 w-full rounded-full" style="background-color: var(--color-border);">
                    <div class="h-1.5 rounded-full" :style="{ width: usagePercent(d) + '%', backgroundColor: usageColor(d) }"></div>
                  </div>
                  <span class="text-xs tabular-nums" style="color: var(--color-text-secondary);">
                    {{ d.usedCount || 0 }}<template v-if="d.maxUses"> / {{ d.maxUses }}</template><template v-else> · {{ tr('discounts.unlimited', 'Unlimited') }}</template>
                  </span>
                </div>
              </td>

              <!-- Status -->
              <td class="px-5 py-4 align-middle">
                <span
                  class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
                  :style="{ backgroundColor: STATUS_STYLE[d._status].bg, color: STATUS_STYLE[d._status].color }"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: STATUS_STYLE[d._status].dot }"></span>
                  {{ statusLabel(d._status) }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-5 py-4 align-middle">
                <div class="flex items-center justify-end gap-0.5">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[var(--color-border)]"
                    style="color: var(--color-primary);"
                    :title="t('discounts.edit')"
                    :aria-label="t('discounts.edit')"
                    @click="openEditModal(d)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Zm9-13 4 4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[var(--color-border)]"
                    style="color: var(--color-text-secondary);"
                    :title="tr('discounts.duplicate', 'Duplicate')"
                    :aria-label="tr('discounts.duplicate', 'Duplicate')"
                    @click="openDuplicate(d)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    :disabled="busyId === d.id"
                    class="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-50"
                    style="color: var(--color-text-secondary);"
                    :title="d.isActive ? t('discounts.deactivate') : t('discounts.activate')"
                    :aria-label="d.isActive ? t('discounts.deactivate') : t('discounts.activate')"
                    @click="toggleActive(d)"
                  >
                    <svg v-if="d.isActive" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 5v14m6-14v14" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 5v14l11-7L8 5Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    :disabled="busyId === d.id"
                    class="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40"
                    :title="t('discounts.delete')"
                    :aria-label="t('discounts.delete')"
                    @click="removeDiscount(d)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Empty: filters/search hide everything -->
    <div v-else-if="discounts.length" class="mt-10 flex flex-col items-center text-center">
      <p class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.noResults') }}</p>
      <button
        v-if="filtersActive"
        type="button"
        class="mt-3 text-sm font-semibold underline underline-offset-4 hover:opacity-70"
        style="color: var(--color-primary);"
        @click="clearFilters"
      >
        {{ tr('discounts.clearFilters', 'Clear filters') }}
      </button>
    </div>

    <!-- Create / Edit modal -->
    <Modal :open="showModal" :title="isEditing ? t('discounts.editTitle') : t('discounts.addTitle')" @close="closeModal">
      <form novalidate @submit.prevent="submitForm">
        <!-- Coupon preview: what this code will look like to customers -->
        <div class="mb-5 flex overflow-hidden rounded-2xl border" :style="{ borderColor: 'var(--color-border)' }" aria-hidden="true">
          <div class="flex w-28 shrink-0 flex-col items-center justify-center bg-red-500 px-3 py-4 text-white">
            <span class="text-2xl font-bold tabular-nums">{{ previewValue }}</span>
            <span class="text-xs opacity-90">{{ tr('discounts.previewOff', 'off') }}</span>
          </div>
          <div class="min-w-0 flex-1 border-l border-dashed px-4 py-3" :style="{ borderColor: 'var(--color-border)' }">
            <p class="truncate font-mono text-base font-bold" :style="{ color: form.code ? 'var(--color-text)' : 'var(--color-text-secondary)' }">
              {{ form.code || tr('discounts.codePreview', 'YOURCODE') }}
            </p>
            <p class="mt-0.5 truncate text-xs" style="color: var(--color-text-secondary);">{{ form.description || '—' }}</p>
            <p class="mt-1.5 text-xs" style="color: var(--color-text-secondary);">{{ previewUntil }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Code -->
          <div>
            <label for="dc-code" class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.code') }}</label>
            <div class="relative mt-1">
              <input
                id="dc-code"
                v-model="form.code"
                type="text"
                maxlength="20"
                autocomplete="off"
                class="w-full rounded-lg border py-2 pl-3 pr-28 font-mono text-sm uppercase focus:outline-none focus:ring-2"
                :style="inputStyle"
                :placeholder="t('discounts.codePlaceholder')"
                @input="onCodeInput"
              />
              <button
                type="button"
                class="absolute inset-y-1 right-1 rounded-md px-3 text-xs font-semibold transition hover:opacity-80"
                :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
                @click="generateCode"
              >
                {{ tr('discounts.generate', 'Generate') }}
              </button>
            </div>
            <p v-if="errors.code" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errors.code }}</p>
          </div>

          <!-- Description -->
          <div>
            <label for="dc-desc" class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.description') }}</label>
            <input
              id="dc-desc"
              v-model="form.description"
              type="text"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              :style="inputStyle"
              @input="errors.description = ''"
            />
            <p v-if="errors.description" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errors.description }}</p>
          </div>

          <!-- Type + value -->
          <div class="flex gap-3">
            <div class="flex-1">
              <span class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.type') }}</span>
              <div role="radiogroup" class="mt-1 flex overflow-hidden rounded-lg border" :style="{ borderColor: 'var(--color-border)' }">
                <button
                  type="button"
                  role="radio"
                  :aria-checked="form.type === 'PERCENTAGE'"
                  class="flex-1 py-2 text-sm font-medium transition"
                  :style="form.type === 'PERCENTAGE' ? { backgroundColor: 'var(--color-primary)', color: '#fff' } : { color: 'var(--color-text-secondary)' }"
                  @click="form.type = 'PERCENTAGE'; errors.value = ''"
                >%</button>
                <button
                  type="button"
                  role="radio"
                  :aria-checked="form.type === 'FIXED_AMOUNT'"
                  class="flex-1 py-2 text-sm font-medium transition"
                  :style="form.type === 'FIXED_AMOUNT' ? { backgroundColor: 'var(--color-primary)', color: '#fff' } : { color: 'var(--color-text-secondary)' }"
                  @click="form.type = 'FIXED_AMOUNT'; errors.value = ''"
                >$</button>
              </div>
            </div>
            <div class="flex-1">
              <label for="dc-value" class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.value') }}</label>
              <div class="relative mt-1">
                <input
                  id="dc-value"
                  v-model="form.value"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-lg border py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2"
                  :style="inputStyle"
                  @input="errors.value = ''"
                />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm" style="color: var(--color-text-secondary);">
                  {{ form.type === 'PERCENTAGE' ? '%' : '$' }}
                </span>
              </div>
            </div>
          </div>
          <p v-if="errors.value" class="-mt-2 text-xs text-red-600 dark:text-red-400">{{ errors.value }}</p>

          <!-- Dates -->
          <div class="flex flex-col gap-3 sm:flex-row">
            <div class="min-w-0 flex-1">
              <label for="dc-from" class="block truncate text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.validFrom') }}</label>
              <input
                id="dc-from"
                v-model="form.validFrom"
                type="datetime-local"
                class="dt-input mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :style="inputStyle"
                @input="errors.validFrom = ''"
              />
              <p v-if="errors.validFrom" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errors.validFrom }}</p>
            </div>
            <div class="min-w-0 flex-1">
              <label for="dc-to" class="block truncate text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.validTo') }}</label>
              <input
                id="dc-to"
                v-model="form.validTo"
                type="datetime-local"
                class="dt-input mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                :style="inputStyle"
                @input="errors.validTo = ''"
              />
              <p v-if="errors.validTo" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errors.validTo }}</p>
              <!-- Quick end dates -->
              <div class="mt-2 flex flex-wrap gap-1.5">
                <button
                  v-for="opt in [{ days: 7, label: tr('discounts.days7', '7 days') }, { days: 30, label: tr('discounts.days30', '30 days') }]"
                  :key="opt.days"
                  type="button"
                  class="rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-80"
                  :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
                  @click="setEndIn(opt.days)"
                >
                  +{{ opt.label }}
                </button>
                <button
                  type="button"
                  class="rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-80"
                  :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
                  @click="form.validTo = ''; errors.validTo = ''"
                >
                  {{ tr('discounts.noEnd', 'No end date') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Max uses -->
          <div>
            <label for="dc-max" class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.maxUses') }}</label>
            <input
              id="dc-max"
              v-model="form.maxUses"
              type="number"
              min="1"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              :style="inputStyle"
              :placeholder="tr('discounts.unlimited', 'Unlimited')"
              @input="errors.maxUses = ''"
            />
            <p v-if="errors.maxUses" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errors.maxUses }}</p>
          </div>

          <!-- Active switch -->
          <div class="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              :aria-checked="form.isActive"
              :aria-label="t('discounts.activeImmediately')"
              class="relative h-6 w-10 shrink-0 rounded-full transition-colors"
              :style="{ backgroundColor: form.isActive ? 'var(--color-primary)' : 'var(--color-border)' }"
              @click="form.isActive = !form.isActive"
            >
              <span
                class="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                :class="form.isActive ? 'translate-x-4' : 'translate-x-0.5'"
              ></span>
            </button>
            <span class="text-sm" style="color: var(--color-text-secondary);">{{ t('discounts.activeImmediately') }}</span>
          </div>
        </div>

        <p v-if="formError" role="alert" class="mt-4 text-sm text-red-600 dark:text-red-400">{{ formError }}</p>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm transition hover:opacity-80"
            style="color: var(--color-text-secondary);"
            @click="closeModal"
          >
            {{ t('discounts.cancel') }}
          </button>
          <button
            type="submit"
            class="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style="background-color: var(--color-primary);"
            :disabled="saving"
          >
            {{ saving ? t('discounts.saving') : t('discounts.save') }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
/* Native date pickers follow the app theme (was hard-coded to dark, which washed out the calendar icon in light mode). */
.dt-input { color-scheme: light; }
:global(.dark) .dt-input,
:global([data-theme='dark']) .dt-input { color-scheme: dark; }
</style>