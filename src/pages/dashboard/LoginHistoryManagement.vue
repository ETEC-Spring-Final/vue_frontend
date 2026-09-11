<template>
  <div>
    <div class="flex flex-wrap items-center gap-3">
      <input v-model="filters.email" placeholder="Filter by email" class="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" />
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

    <p class="mt-3 text-sm text-[#6B7280]">{{ totalElements }} login attempts</p>

    <DataTable class="mt-2" :columns="columns" :rows="history" :loading="loading">
      <template #cell-success="{ row }">
        <span :class="successClass(row.success)">{{ row.success ? 'Success' : 'Failed' }}</span>
      </template>
      <template #cell-loggedInAt="{ row }">{{ formatDate(row.loggedInAt) }}</template>
      <template #cell-loggedOutAt="{ row }">{{ formatDate(row.loggedOutAt) }}</template>
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
  { key: 'attemptedUsername', label: 'Email' },
  { key: 'ipAddress', label: 'IP' },
  { key: 'device', label: 'Device' },
  { key: 'success', label: 'Status' },
  { key: 'loggedInAt', label: 'Login time' },
  { key: 'loggedOutAt', label: 'Logout time' },
]

const history = ref([])
const loading = ref(true)
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
  return success ? `${base} bg-green-50 text-green-600` : `${base} bg-red-50 text-red-600`
}

async function loadHistory() {
  loading.value = true
  try {
    const params = { page: page.value, size: 20 }
    if (filters.email) params.email = filters.email

    const { data } = await api.get('/admin/login-history', { params })
    history.value = data?.content ?? []
    totalPages.value = data?.totalPages ?? 0
    totalElements.value = data?.totalElements ?? history.value.length
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