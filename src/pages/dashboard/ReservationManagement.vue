<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ reservations.length }} reservations</p>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="reservations" :loading="loading">
      <template #cell-pickUpDateTime="{ row }">
        {{ formatDate(row.pickUpDateTime) }}
      </template>
      <template #cell-returnDateTime="{ row }">
        {{ formatDate(row.returnDateTime) }}
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
  { key: 'userId', label: 'User ID' },
  { key: 'vehicleId', label: 'Vehicle ID' },
  { key: 'pickUpLocationId', label: 'Pickup Loc.' },
  { key: 'returnLocationId', label: 'Return Loc.' },
  { key: 'pickUpDateTime', label: 'Pickup' },
  { key: 'returnDateTime', label: 'Return' },
  { key: 'totalPrice', label: 'Total' },
  { key: 'status', label: 'Status' },
]

// TODO: confirm exact enum values against backend ReservationStatusEnum
const statusOptions = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']

const reservations = ref([])
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
    CANCELLED: 'bg-red-50 text-red-600',
    COMPLETED: 'bg-green-50 text-green-600',
  }
  return `${base} ${map[status] || 'bg-[#F3F4F6] text-[#6B7280]'}`
}

async function loadReservations() {
  loading.value = true
  try {
    const { data } = await api.get('/reservations')
    reservations.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

async function onStatusChange(row, newStatus) {
  actionError.value = ''
  try {
    await api.patch(`/reservations/${row.id}/status`, null, { params: { status: newStatus } })
    await loadReservations()
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Could not update status.'
  }
}

async function onDelete(row) {
  if (!confirm(`Delete reservation #${row.id}?`)) return
  await api.delete(`/reservations/${row.id}`)
  loadReservations()
}

onMounted(loadReservations)
</script>