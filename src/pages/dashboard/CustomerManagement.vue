<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ users.length }} customers</p>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="users" :loading="loading">
      <template #cell-name="{ row }">
        {{ row.firstName }} {{ row.lastName }}
      </template>
      <template #cell-active="{ row }">
        <span :class="activeClass(row.active)">{{ row.active ? 'Active' : 'Inactive' }}</span>
      </template>
      <template #actions="{ row }">
        <select
          class="rounded-lg border border-[#E5E7EB] px-2 py-1 text-xs"
          :value="row.role"
          @change="onRoleChange(row, $event.target.value)"
        >
          <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
        </select>
        <button
          class="ml-3 text-xs font-semibold text-[#3D5FE0] hover:text-[#3350C0]"
          @click="onToggleActive(row)"
        >
          {{ row.active ? 'Deactivate' : 'Activate' }}
        </button>
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
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role' },
  { key: 'active', label: 'Status' },
]

const roleOptions = ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']

const users = ref([])
const loading = ref(true)
const actionError = ref('')

function activeClass(active) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return active ? `${base} bg-green-50 text-green-600` : `${base} bg-[#F3F4F6] text-[#6B7280]`
}

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/users')
    users.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

async function onRoleChange(row, newRole) {
  actionError.value = ''
  try {
    await api.patch(`/users/${row.id}/role`, null, { params: { role: newRole } })
    await loadUsers()
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Could not update role.'
  }
}

async function onToggleActive(row) {
  actionError.value = ''
  try {
    await api.patch(`/users/${row.id}/active`, null, { params: { active: !row.active } })
    await loadUsers()
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Could not update status.'
  }
}

async function onDelete(row) {
  if (!confirm(`Delete customer ${row.firstName} ${row.lastName}?`)) return
  await api.delete(`/users/${row.id}`)
  loadUsers()
}

onMounted(loadUsers)
</script>