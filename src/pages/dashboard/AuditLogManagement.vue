<template>
  <div>
    <div class="flex flex-wrap items-center gap-3">
      <input v-model="filters.entityName" placeholder="Entity name (e.g. Vehicle)" class="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" />
      <input v-model.number="filters.userId" type="number" placeholder="User ID" class="w-32 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" />
      <select v-model="filters.action" class="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm">
        <option value="">All actions</option>
        <option v-for="a in actionOptions" :key="a" :value="a">{{ a }}</option>
      </select>
      <button
        type="button"
        class="rounded-full bg-[#3D5FE0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3350C0]"
        @click="applyFilters"
      >
        Filter
      </button>
      <button type="button" class="text-xs font-semibold text-[#6B7280] hover:text-[#1A2036]" @click="clearFilters">
        Clear
      </button>
    </div>

    <p class="mt-3 text-sm text-[#6B7280]">{{ totalElements }} audit logs</p>

    <DataTable class="mt-2" :columns="columns" :rows="logs" :loading="loading">
      <template #cell-action="{ row }">
        <span :class="actionClass(row.action)">{{ row.action }}</span>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #cell-oldValue="{ row }">
        <span class="line-clamp-1 max-w-xs text-xs" :title="row.oldValue">{{ row.oldValue }}</span>
      </template>
      <template #cell-newValue="{ row }">
        <span class="line-clamp-1 max-w-xs text-xs" :title="row.newValue">{{ row.newValue }}</span>
      </template>
    </DataTable>

    <div class="mt-4 flex items-center justify-between text-sm text-[#6B7280]">
      <button
        class="rounded-full border border-[#E5E7EB] px-3 py-1.5 disabled:opacity-40"
        :disabled="page === 0"
        @click="page--"
      >Previous</button>
      <span>Page {{ page + 1 }} of {{ totalPages || 1 }}</span>
      <button
        class="rounded-full border border-[#E5E7EB] px-3 py-1.5 disabled:opacity-40"
        :disabled="page + 1 >= totalPages"
        @click="page++"
      >Next</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import api from '@/services/api'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'userEmail', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'entityName', label: 'Entity' },
  { key: 'entityId', label: 'Entity ID' },
  { key: 'oldValue', label: 'Old value' },
  { key: 'newValue', label: 'New value' },
  { key: 'ipAddress', label: 'IP' },
  { key: 'createdAt', label: 'Date' },
]

const actionOptions = ['CREATE', 'UPDATE', 'DELETE']

const logs = ref([])
const loading = ref(true)
const page = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

const filters = reactive({ entityName: '', userId: null, action: '' })

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function actionClass(action) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    CREATE: 'bg-green-50 text-green-600',
    UPDATE: 'bg-[#E9EDFB] text-[#3D5FE0]',
    DELETE: 'bg-red-50 text-red-600',
  }
  return `${base} ${map[action] || 'bg-[#F3F4F6] text-[#6B7280]'}`
}

async function loadLogs() {
  loading.value = true
  try {
    const params = { page: page.value, size: 20 }
    if (filters.entityName) params.entityName = filters.entityName
    if (filters.userId) params.userId = filters.userId
    if (filters.action) params.action = filters.action

    const { data } = await api.get('/admin/audit-logs', { params })
    logs.value = data?.content ?? []
    totalPages.value = data?.totalPages ?? 0
    totalElements.value = data?.totalElements ?? logs.value.length
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