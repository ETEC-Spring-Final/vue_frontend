<template>
  <div>
    <div class="max-w-xl">
      <p class="text-sm text-[#6B7280]">Send a notification to a specific customer.</p>

      <form class="mt-4 space-y-3" @submit.prevent="onSend">
        <select v-model="form.userId" required class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm">
          <option value="" disabled>Select user…</option>
          <option v-for="u in users" :key="u.id" :value="u.id">
            {{ u.firstName }} {{ u.lastName }} ({{ u.email }})
          </option>
        </select>

        <select v-model="form.type" required class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm">
          <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
        </select>

        <input v-model="form.title" required minlength="1" placeholder="Title" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm" />
        <textarea v-model="form.message" required minlength="1" rows="4" placeholder="Message" class="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm"></textarea>

        <p v-if="sendError" class="text-sm text-red-600">{{ sendError }}</p>
        <p v-if="sendSuccess" class="text-sm text-green-600">Notification sent!</p>

        <button type="submit" :disabled="sending" class="rounded-full bg-[#3D5FE0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {{ sending ? 'Sending…' : 'Send notification' }}
        </button>
      </form>
    </div>

    <div class="mt-8">
      <p class="text-sm text-[#6B7280]">{{ notifications.length }} notifications sent</p>
      <DataTable class="mt-2" :columns="columns" :rows="notifications" :loading="loadingHistory">
        <template #cell-isRead="{ row }">
          <span :class="readClass(row.isRead)">{{ row.isRead ? 'Read' : 'Unread' }}</span>
        </template>
        <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import api from '@/services/api'

const typeOptions = [
  'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'RENTAL_STARTING_SOON', 'RENTAL_ENDING_SOON',
  'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RETURN_REMINDER', 'LATE_RETURN', 'PROMOTION',
]

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'userEmail', label: 'Sent to' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'message', label: 'Message' },
  { key: 'isRead', label: 'Status' },
  { key: 'createdAt', label: 'Sent at' },
]

const users = ref([])
const notifications = ref([])
const loadingHistory = ref(true)
const sending = ref(false)
const sendError = ref('')
const sendSuccess = ref(false)

const form = reactive({ userId: '', type: 'PROMOTION', title: '', message: '' })

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function readClass(isRead) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return isRead ? `${base} bg-[#F3F4F6] text-[#6B7280]` : `${base} bg-[#E9EDFB] text-[#3D5FE0]`
}

async function loadUsers() {
  try {
    const { data } = await api.get('/users')
    users.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    users.value = []
  }
}

async function loadNotifications() {
  loadingHistory.value = true
  try {
    const { data } = await api.get('/notifications')
    notifications.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loadingHistory.value = false
  }
}

async function onSend() {
  sending.value = true
  sendError.value = ''
  sendSuccess.value = false
  try {
    await api.post(`/notifications/${form.userId}/notify`, {
      type: form.type,
      title: form.title,
      message: form.message,
    })
    sendSuccess.value = true
    form.title = ''
    form.message = ''
    await loadNotifications()
  } catch (err) {
    sendError.value = err.response?.data?.message || 'Could not send notification.'
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadNotifications()
})
</script>