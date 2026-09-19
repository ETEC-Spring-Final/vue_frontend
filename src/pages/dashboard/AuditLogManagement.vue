<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('auditLogs.title') }}</h1>
    </div>

    <!-- Summary strip -->
    <div
      class="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-5 border-b pb-4"
      style="color: var(--color-text-secondary); border-color: var(--color-border);"
    >
      <div><span class="font-semibold" style="color: var(--color-text);">{{ totalElements }}</span> {{ t('auditLogs.count') }}</div>
      <div>{{ t('auditLogs.page') }} <span class="font-semibold" style="color: var(--color-text);">{{ page + 1 }}</span> / {{ totalPages || 1 }}</div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        v-model="filters.entityName"
        :placeholder="t('auditLogs.entityNamePlaceholder')"
        class="input-field w-56"
        :style="inputStyle"
      />
      <input
        v-model.number="filters.userId"
        type="number"
        :placeholder="t('auditLogs.userIdPlaceholder')"
        class="input-field w-32"
        :style="inputStyle"
      />
      <select v-model="filters.action" class="input-field w-40" :style="inputStyle">
        <option value="">{{ t('auditLogs.allActions') }}</option>
        <option v-for="a in actionOptions" :key="a" :value="a">{{ actionLabel(a) }}</option>
      </select>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="applyFilters"
      >
        {{ t('auditLogs.filter') }}
      </button>
      <button
        type="button"
        class="text-xs font-semibold transition hover:opacity-80"
        style="color: var(--color-text-secondary);"
        @click="clearFilters"
      >
        {{ t('auditLogs.clear') }}
      </button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="logs" :loading="loading">
      <template #cell-action="{ row }">
        <span :class="actionClass(row.action)">{{ actionLabel(row.action) }}</span>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #cell-oldValue="{ row }">
        <span class="block max-w-xs truncate text-xs" :title="row.oldValue">{{ row.oldValue || '—' }}</span>
      </template>
      <template #cell-newValue="{ row }">
        <span class="block max-w-xs truncate text-xs" :title="row.newValue">{{ row.newValue || '—' }}</span>
      </template>
    </DataTable>

    <p v-if="loadError" class="mt-3 text-sm text-red-600">{{ loadError }}</p>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-between text-sm" style="color: var(--color-text-secondary);">
      <button
        class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
        style="border-color: var(--color-border); color: var(--color-text);"
        :disabled="page === 0"
        @click="page--"
      >{{ t('auditLogs.previous') }}</button>
      <span>{{ t('auditLogs.page') }} {{ page + 1 }} {{ t('auditLogs.of') }} {{ totalPages || 1 }}</span>
      <button
        class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
        style="border-color: var(--color-border); color: var(--color-text);"
        :disabled="page + 1 >= totalPages"
        @click="page++"
      >{{ t('auditLogs.next') }}</button>
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

const actionOptions = ['CREATE', 'UPDATE', 'DELETE']

function actionLabel(action) {
  const map = {
    CREATE: t('auditLogs.actions.CREATE'),
    UPDATE: t('auditLogs.actions.UPDATE'),
    DELETE: t('auditLogs.actions.DELETE'),
  }
  return map[action] ?? action
}

function actionClass(action) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-600',
  }
  return `${base} ${map[action] || 'bg-gray-100 text-gray-500'}`
}

const columns = computed(() => [
  { key: 'id', label: t('auditLogs.id') },
  { key: 'userEmail', label: t('auditLogs.user') },
  { key: 'action', label: t('auditLogs.action') },
  { key: 'entityName', label: t('auditLogs.entity') },
  { key: 'entityId', label: t('auditLogs.entityId') },
  { key: 'oldValue', label: t('auditLogs.oldValue') },
  { key: 'newValue', label: t('auditLogs.newValue') },
  { key: 'ipAddress', label: t('auditLogs.ip') },
  { key: 'createdAt', label: t('auditLogs.date') },
])

const inputStyle = computed(() => ({
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
  colorScheme: isDark.value ? 'dark' : 'light',
}))

const logs = ref([])
const loading = ref(true)
const loadError = ref('')
const page = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

const filters = reactive({ entityName: '', userId: null, action: '' })

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

async function loadLogs() {
  loading.value = true
  loadError.value = ''
  try {
    const params = { page: page.value, size: 20 }
    if (filters.entityName) params.entityName = filters.entityName
    if (filters.userId) params.userId = filters.userId
    if (filters.action) params.action = filters.action

    const { data } = await api.get('/admin/audit-logs', { params })
    logs.value = data?.content ?? []
    totalPages.value = data?.totalPages ?? 0
    totalElements.value = data?.totalElements ?? logs.value.length
  } catch {
    loadError.value = t('auditLogs.loadError')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 0
  loadLogs()
}

function clearFilters() {
  filters.entityName = ''
  filters.userId = null
  filters.action = ''
  applyFilters()
}

watch(page, loadLogs)
onMounted(loadLogs)
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