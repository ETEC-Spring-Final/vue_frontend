<template>
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
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '@/services/api'

const typeOptions = [
  'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'RENTAL_STARTING_SOON', 'RENTAL_ENDING_SOON',
  'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RETURN_REMINDER', 'LATE_RETURN', 'PROMOTION',
]

const users = ref([])
const sending = ref(false)
const sendError = ref('')
const sendSuccess = ref(false)

const form = reactive({ userId: '', type: 'PROMOTION', title: '', message: '' })

async function loadUsers() {
  try {
    const { data } = await api.get('/users')
    users.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    users.value = []
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
  } catch (err) {
    sendError.value = err.response?.data?.message || 'Could not send notification.'
  } finally {
    sending.value = false
  }
}

onMounted(loadUsers)
</script>