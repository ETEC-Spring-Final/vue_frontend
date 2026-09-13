<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('notifications.title') }}</h1>
    </div>

    <!-- Send form -->
    <div
      class="w-full rounded-2xl border p-5 mb-8"
      style="background-color: var(--color-surface); border-color: var(--color-border);"
    >
      <p class="text-sm" style="color: var(--color-text-secondary);">{{ t('notifications.sendSubtitle') }}</p>

      <form class="mt-4 space-y-3" @submit.prevent="onSend">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select v-model="form.userId" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ t('notifications.selectUser') }}</option>
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.firstName }} {{ u.lastName }} ({{ u.email }})
            </option>
          </select>

          <select v-model="form.type" required class="input-field" :style="inputStyle">
            <option v-for="opt in typeOptions" :key="opt" :value="opt">{{ typeLabel(opt) }}</option>
          </select>
        </div>

        <input
          v-model="form.title"
          required
          minlength="1"
          :placeholder="t('notifications.titlePlaceholder')"
          class="input-field"
          :style="inputStyle"
        />
        <textarea
          v-model="form.message"
          required
          minlength="1"
          rows="4"
          :placeholder="t('notifications.messagePlaceholder')"
          class="input-field"
          :style="inputStyle"
        ></textarea>

        <p v-if="sendError" class="text-sm text-red-600">{{ sendError }}</p>
        <p v-if="sendSuccess" class="text-sm text-emerald-600">{{ t('notifications.sendSuccess') }}</p>

        <button
          type="submit"
          :disabled="sending"
          class="rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
          style="background-color: var(--color-primary);"
        >
          {{ sending ? t('notifications.sending') : t('notifications.send') }}
        </button>
      </form>
    </div>

    <!-- History -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ notifications.length }} {{ t('notifications.sentCount') }}
      </p>
      <input
        v-model="search"
        type="text"
        :placeholder="t('notifications.search')"
        class="rounded-lg px-3 py-2 text-sm w-64 border focus:outline-none focus:ring-2"
        style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
      />
      <button
        v-for="opt in ['ALL', 'READ', 'UNREAD']"
        :key="opt"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition"
        :style="statusFilter === opt
          ? `background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);`
          : `color: var(--color-text-secondary); border-color: var(--color-border);`"
        @click="statusFilter = opt"
      >
        {{ opt === 'ALL' ? t('notifications.all') : opt === 'READ' ? t('notifications.read') : t('notifications.unread') }}
      </button>
    </div>

    <DataTable :columns="columns" :rows="filtered" :loading="loadingHistory">
      <template #cell-type="{ row }">{{ typeLabel(row.type) }}</template>
      <template #cell-message="{ row }">
        <span class="line-clamp-2 max-w-xs inline-block" style="color: var(--color-text);">{{ row.message }}</span>
      </template>
      <template #cell-isRead="{ row }">
        <span :class="readClass(row.isRead)">{{ row.isRead ? t('notifications.read') : t('notifications.unread') }}</span>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <button
          class="text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ t('notifications.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="!loadingHistory && filtered.length === 0 && notifications.length > 0" class="text-center text-sm mt-3" style="color: var(--color-text-secondary);">
      {{ t('notifications.noResults') }}
    </p>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import DataTable from '@/components/ui/DataTable.vue'
import notificationsService from '@/services/notifications.service'
import api from '@/services/api'

const { t } = useI18n()
const { isDark } = useTheme()

const typeOptions = [
  'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'RENTAL_STARTING_SOON', 'RENTAL_ENDING_SOON',
  'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RETURN_REMINDER', 'LATE_RETURN', 'PROMOTION',
]

function typeLabel(type) {
  return t(`notifications.types.${type}`)
}

const columns = computed(() => [
  { key: 'id', label: t('notifications.id') },
  { key: 'userEmail', label: t('notifications.sentTo') },
  { key: 'type', label: t('notifications.type') },
  { key: 'title', label: t('notifications.titleCol') },
  { key: 'message', label: t('notifications.message') },
  { key: 'isRead', label: t('notifications.status') },
  { key: 'createdAt', label: t('notifications.sentAt') },
])

const inputStyle = computed(() => ({
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
  colorScheme: isDark.value ? 'dark' : 'light',
}))

function readClass(isRead) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return isRead ? `${base} bg-gray-100 text-gray-500` : `${base} bg-blue-100 text-blue-700`
}

const users = ref([])
const notifications = ref([])
const loadingHistory = ref(true)
const actionError = ref('')
const search = ref('')
const statusFilter = ref('ALL')

const sending = ref(false)
const sendError = ref('')
const sendSuccess = ref(false)

const form = reactive({ userId: '', type: 'PROMOTION', title: '', message: '' })

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const filtered = computed(() => {
  let list = notifications.value
  if (statusFilter.value === 'READ') {
    list = list.filter((n) => n.isRead)
  } else if (statusFilter.value === 'UNREAD') {
    list = list.filter((n) => !n.isRead)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      (n) =>
        n.userEmail?.toLowerCase().includes(q) ||
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q)
    )
  }
  return list
})

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
  actionError.value = ''
  try {
    const { data } = await notificationsService.getAll()
    notifications.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    actionError.value = t('notifications.loadError')
  } finally {
    loadingHistory.value = false
  }
}

async function onSend() {
  sending.value = true
  sendError.value = ''
  sendSuccess.value = false
  try {
    await notificationsService.send(form.userId, {
      type: form.type,
      title: form.title,
      message: form.message,
    })
    sendSuccess.value = true
    form.title = ''
    form.message = ''
    await loadNotifications()
  } catch (err) {
    sendError.value = err.response?.data?.message || t('notifications.sendError')
  } finally {
    sending.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`${t('notifications.confirmDelete')} "${row.title}"?`)) return
  try {
    await notificationsService.remove(row.id)
    await loadNotifications()
  } catch {
    actionError.value = t('notifications.deleteError')
  }
}

onMounted(() => {
  loadUsers()
  loadNotifications()
})
</script>

<style scoped>
.input-field {
  width: 100%;
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