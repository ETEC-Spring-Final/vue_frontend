<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('reviews.title') }}</h1>
    </div>

    <!-- Summary strip -->
    <div
      class="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-5 border-b pb-4"
      style="color: var(--color-text-secondary); border-color: var(--color-border);"
    >
      <div><span class="font-semibold" style="color: var(--color-text);">{{ reviews.length }}</span> {{ t('reviews.count') }}</div>
      <div class="flex items-center gap-1.5">
        <span class="font-semibold" style="color: var(--color-text);">{{ overallAverage }}</span>
        <StarRating :model-value="Math.round(overallAverage)" :size="14" />
        {{ t('reviews.avgRating') }}
      </div>
      <div><span class="font-semibold text-red-500">{{ counts.lowRated }}</span> {{ t('reviews.lowRated') }}</div>
      <div><span class="font-semibold text-gray-500">{{ counts.hidden }}</span> {{ t('reviews.hidden') }}</div>
    </div>

    <!-- Search + filter pills -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        :placeholder="t('reviews.search')"
        class="rounded-lg px-3 py-2 text-sm w-64 border focus:outline-none focus:ring-2"
        style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
      />
      <button
        v-for="opt in ratingFilters"
        :key="opt.value"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition"
        :style="ratingFilter === opt.value
          ? `background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);`
          : `color: var(--color-text-secondary); border-color: var(--color-border);`"
        @click="ratingFilter = opt.value"
      >
        {{ opt.label }}
      </button>

      <span class="w-px h-5" style="background-color: var(--color-border);"></span>

      <button
        v-for="opt in visibilityFilters"
        :key="opt.value"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition"
        :style="visibilityFilter === opt.value
          ? `background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);`
          : `color: var(--color-text-secondary); border-color: var(--color-border);`"
        @click="visibilityFilter = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="filtered" :loading="loading">
      <template #cell-userName="{ row }">
        <span class="font-semibold" style="color: var(--color-text);">{{ row.userName }}</span>
      </template>
      <template #cell-vehicleId="{ row }">{{ vehicleLabel(row.vehicleId) }}</template>
      <template #cell-rating="{ row }">
        <StarRating :model-value="row.rating" />
      </template>
      <template #cell-comment="{ row }">
        <span class="line-clamp-2 max-w-xs inline-block" style="color: var(--color-text);">
          {{ row.comment || '—' }}
        </span>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #cell-isVisible="{ row }">
        <span :class="visibilityClass(row.isVisible)">
          {{ row.isVisible ? t('reviews.visible') : t('reviews.hiddenStatus') }}
        </span>
      </template>
      <template #actions="{ row }">
        <button
          class="text-xs font-semibold hover:opacity-80"
          :style="`color: ${row.isVisible ? '#6B7280' : '#059669'};`"
          @click="onToggleVisibility(row)"
        >{{ row.isVisible ? t('reviews.hide') : t('reviews.unhide') }}</button>

        <button
          class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ t('reviews.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="!loading && filtered.length === 0 && reviews.length > 0" class="text-center text-sm mt-3" style="color: var(--color-text-secondary);">
      {{ t('reviews.noResults') }}
    </p>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/ui/DataTable.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import reviewService from '@/services/reviews.service'
import api from '@/services/api'

const { t } = useI18n()

const columns = computed(() => [
  { key: 'id', label: t('reviews.id') },
  { key: 'userName', label: t('reviews.customer') },
  { key: 'vehicleId', label: t('reviews.vehicle') },
  { key: 'rating', label: t('reviews.rating') },
  { key: 'comment', label: t('reviews.comment') },
  { key: 'createdAt', label: t('reviews.date') },
  { key: 'isVisible', label: t('reviews.status') },
])

const visibilityFilters = computed(() => [
  { value: 'ALL', label: t('reviews.allStatus') },
  { value: 'VISIBLE', label: t('reviews.visible') },
  { value: 'HIDDEN', label: t('reviews.hiddenStatus') },
])

const ratingFilters = computed(() => [
  { value: 'ALL', label: t('reviews.all') },
  { value: 5, label: '5★' },
  { value: 4, label: '4★' },
  { value: 3, label: '3★' },
  { value: 2, label: '2★' },
  { value: 1, label: '1★' },
])

const reviews = ref([])
const vehicles = ref([])
const loading = ref(true)
const actionError = ref('')
const search = ref('')
const ratingFilter = ref('ALL')
const visibilityFilter = ref('ALL')

const overallAverage = computed(() => {
  if (reviews.value.length === 0) return '0.0'
  const sum = reviews.value.reduce((acc, r) => acc + (r.rating || 0), 0)
  return (sum / reviews.value.length).toFixed(1)
})

const counts = computed(() => ({
  lowRated: reviews.value.filter((r) => r.rating <= 2).length,
  hidden: reviews.value.filter((r) => !r.isVisible).length,
}))

function visibilityClass(isVisible) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return isVisible ? `${base} bg-green-100 text-green-700` : `${base} bg-gray-100 text-gray-500`
}

const filtered = computed(() => {
  let list = reviews.value
  if (ratingFilter.value !== 'ALL') {
    list = list.filter((r) => r.rating === ratingFilter.value)
  }
  if (visibilityFilter.value === 'VISIBLE') {
    list = list.filter((r) => r.isVisible)
  } else if (visibilityFilter.value === 'HIDDEN') {
    list = list.filter((r) => !r.isVisible)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      (r) =>
        r.userName?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        String(r.vehicleId).includes(q)
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

async function loadReviews() {
  loading.value = true
  actionError.value = ''
  try {
    // size=1000: backend paginates, but there's no server-side rating filter,
    // so we pull a large page and filter/search client-side (same pattern as
    // InvoiceManagement, which relies on a full, unpaginated list).
    const { data } = await reviewService.getAll(0, 1000)
    reviews.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    actionError.value = t('reviews.loadError')
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

async function onToggleVisibility(row) {
  actionError.value = ''
  try {
    await reviewService.updateVisibility(row.id, !row.isVisible)
    await loadReviews()
  } catch (err) {
    actionError.value = err.response?.data?.message || t('reviews.visibilityError')
  }
}

async function onDelete(row) {
  if (!confirm(`${t('reviews.confirmDelete')} ${row.userName}?`)) return
  try {
    await reviewService.remove(row.id)
    await loadReviews()
  } catch (err) {
    actionError.value = err.response?.data?.message || t('reviews.deleteError')
  }
}

onMounted(() => {
  loadReviews()
  loadVehicles()
})
</script>