<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('loginHistory.title') }}</h1>
    </div>

    <!-- Summary strip -->
    <div
      class="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-5 border-b pb-4"
      style="color: var(--color-text-secondary); border-color: var(--color-border);"
    >
      <div><span class="font-semibold" style="color: var(--color-text);">{{ totalElements }}</span> {{ t('loginHistory.count') }}</div>
      <div>{{ t('loginHistory.page') }} <span class="font-semibold" style="color: var(--color-text);">{{ page + 1 }}</span> / {{ totalPages || 1 }}</div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        v-model="filters.email"
        :placeholder="t('loginHistory.emailPlaceholder')"
        class="input-field w-64"
        :style="inputStyle"
      />
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="applyFilters"
      >
        {{ t('loginHistory.filter') }}
      </button>
      <button
        type="button"
        class="text-xs font-semibold transition hover:opacity-80"
        style="color: var(--color-text-secondary);"
        @click="clearFilters"
      >
        {{ t('loginHistory.clear') }}
      </button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="history" :loading="loading">
      <template #cell-device="{ row }">
        <span class="block max-w-xs truncate text-xs" :title="row.device">{{ row.device || '—' }}</span>
      </template>
      <template #cell-success="{ row }">
        <span :class="successClass(row.success)">{{ row.success ? t('loginHistory.success') : t('loginHistory.failed') }}</span>
      </template>
      <template #cell-loggedInAt="{ row }">{{ formatDate(row.loggedInAt) }}</template>
      <template #cell-loggedOutAt="{ row }">{{ formatDate(row.loggedOutAt) }}</template>
    </DataTable>

    <p v-if="loadError" class="mt-3 text-sm text-red-600">{{ loadError }}</p>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-between text-sm" style="color: var(--color-text-secondary);">
      <button
        class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
        style="border-color: var(--color-border); color: var(--color-text);"
        :disabled="page === 0"
        @click="page--"
      >{{ t('loginHistory.previous') }}</button>
      <span>{{ t('loginHistory.page') }} {{ page + 1 }} {{ t('loginHistory.of') }} {{ totalPages || 1 }}</span>
      <button
        class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
        style="border-color: var(--color-border); color: var(--color-text);"
        :disabled="page + 1 >= totalPages"
        @click="page++"
      >{{ t('loginHistory.next') }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import DataTable from '@/components/ui/DataTable.vue'
import api from '@/services/api'

const { t } = useI18n()
const { isDark } = useTheme()

const columns = computed(() => [
  { key: 'id', label: t('loginHistory.id') },
  { key: 'attemptedUsername', label: t('loginHistory.email') },
  { key: 'ipAddress', label: t('loginHistory.ip') },
  { key: 'device', label: t('loginHistory.device') },
  { key: 'success', label: t('loginHistory.status') },
  { key: 'loggedInAt', label: t('loginHistory.loginTime') },
  { key: 'loggedOutAt', label: t('loginHistory.logoutTime') },
])

const inputStyle = computed(() => ({
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
  colorScheme: isDark.value ? 'dark' : 'light',
}))

const history = ref([])
const loading = ref(true)
const loadError = ref('')
const page = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

const filters = reactive({ email: '' })

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function successClass(success) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return success ? `${base} bg-green-100 text-green-700` : `${base} bg-red-100 text-red-600`
}

async function loadHistory() {
  loading.value = true
  loadError.value = ''
  try {
    const params = { page: page.value, size: 20 }
    if (filters.email) params.email = filters.email

    const { data } = await api.get('/admin/login-history', { params })
    history.value = data?.content ?? []
    totalPages.value = data?.totalPages ?? 0
    totalElements.value = data?.totalElements ?? history.value.length
  } catch {
    loadError.value = t('loginHistory.loadError')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 0
  loadHistory()
}

function clearFilters() {
  filters.email = ''
  applyFilters()
}

watch(page, loadHistory)
onMounted(loadHistory)
</script>

<style scoped>
.input-field {
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