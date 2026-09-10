<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ rentals.length }} rentals</p>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="rentals" :loading="loading">
      <template #cell-pickUpDateTime="{ row }">
        {{ formatDate(row.pickUpDateTime) }}
      </template>
      <template #cell-expectedReturnDateTime="{ row }">
        {{ formatDate(row.expectedReturnDateTime) }}
      </template>
      <template #cell-actualReturnDateTime="{ row }">
        {{ formatDate(row.actualReturnDateTime) }}
      </template>
      <template #cell-totalPrice="{ row }">
        ${{ Number(row.totalPrice ?? 0).toFixed(2) }}
      </template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #actions="{ row }">
        <select
          class="rounded-lg border border-[#E5E7EB] px-2 py-1 text-xs"
          :value="row.status"
          @change="onStatusChange(row, $event.target.value)"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <button class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import api from '@/services/api'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'reservationId', label: 'Reservation' },
  { key: 'vehicleId', label: 'Vehicle ID' },
  { key: 'userId', label: 'User ID' },
  { key: 'pickUpDateTime', label: 'Pickup' },
  { key: 'expectedReturnDateTime', label: 'Expected Return' },
  { key: 'actualReturnDateTime', label: 'Actual Return' },
  { key: 'totalPrice', label: 'Total' },
  { key: 'status', label: 'Status' },
]

const statusOptions = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'ACTIVE', 'RETURNED', 'COMPLETED']

const rentals = ref([])
const loading = ref(true)
const actionError = ref('')

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-[#E9EDFB] text-[#3D5FE0]',
    PICKED_UP: 'bg-amber-100 text-amber-700',
    ACTIVE: 'bg-amber-100 text-amber-700',
    RETURNED: 'bg-[#E9EDFB] text-[#3D5FE0]',
    COMPLETED: 'bg-green-50 text-green-600',
  }
  return `${base} ${map[status] || 'bg-[#F3F4F6] text-[#6B7280]'}`
}

async function loadRentals() {
  loading.value = true
  try {
    const { data } = await api.get('/rentals')
    rentals.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

async function onStatusChange(row, newStatus) {
  actionError.value = ''
  try {
    await api.patch(`/rentals/${row.id}/status`, null, { params: { status: newStatus } })
    await loadRentals()
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Could not update status.'
  }
}

async function onDelete(row) {
  if (!confirm(`Delete rental #${row.id}?`)) return
  await api.delete(`/rentals/${row.id}`)
  loadRentals()
}

onMounted(loadRentals)
</script>