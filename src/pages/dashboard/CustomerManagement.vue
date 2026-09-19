<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ customers.length }} {{ $t('customers.count') }}
      </p>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="customers" :loading="loading">
      <template #cell-name="{ row }">{{ row.firstName }} {{ row.lastName }}</template>
      <template #cell-active="{ row }">
        <span :class="statusClass(row.active)">
          {{ row.active ? $t('customers.active') : $t('customers.inactive') }}
        </span>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <button
          class="text-xs font-semibold hover:opacity-70"
          style="color: var(--color-primary);"
          @click="onToggleActive(row)"
        >{{ row.active ? $t('customers.deactivate') : $t('customers.activate') }}</button>
        <button
          class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ $t('customers.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/ui/DataTable.vue'
import api from '@/services/api'

const { t } = useI18n()

const columns = computed(() => [
  { key: 'name', label: t('customers.name') },
  { key: 'email', label: t('customers.email') },
  { key: 'phone', label: t('customers.phone') },
  { key: 'gender', label: t('customers.gender') },
  { key: 'active', label: t('customers.status') },
  { key: 'createdAt', label: t('customers.joined') },
])

const allUsers = ref([])
const loading = ref(true)
const actionError = ref('')

// Only show users with role CUSTOMER on this page
const customers = computed(() => allUsers.value.filter((u) => u.role === 'CUSTOMER'))

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

function statusClass(active) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return active ? `${base} bg-green-100 text-green-700` : `${base} bg-gray-200 text-gray-600`
}

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/auth/users')
    allUsers.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

async function onToggleActive(row) {
  actionError.value = ''
  try {
    await api.patch(`/auth/users/${row.id}/active`, null, { params: { active: !row.active } })
    await loadUsers()
  } catch (err) {
    actionError.value = err.response?.data?.message || t('customers.statusError')
  }
}

async function onDelete(row) {
  if (!confirm(`${t('customers.confirmDelete')} ${row.firstName} ${row.lastName}?`)) return
  actionError.value = ''
  try {
    await api.delete(`/auth/users/${row.id}`)
    await loadUsers()
  } catch (err) {
    actionError.value = err.response?.data?.message || t('customers.deleteError')
  }
}

onMounted(loadUsers)
</script>