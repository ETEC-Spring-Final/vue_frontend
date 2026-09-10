<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-[#1A2036]">Notifications</h1>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
    </div>

    <div v-else-if="notifications.length === 0" class="mt-16 text-center text-sm text-[#6B7280]">
      You're all caught up — no notifications yet.
    </div>

    <div v-else class="mt-6 space-y-3">
      <article
        v-for="n in notifications"
        :key="n.id"
        class="rounded-2xl border border-[#E5E7EB] p-4"
        :class="{ 'bg-[#E9EDFB]/40': !n.read }"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[#1A2036]">{{ n.title || n.type }}</p>
            <p class="mt-1 text-sm text-[#6B7280]">{{ n.message || n.content }}</p>
          </div>
          <span v-if="!n.read" class="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#3D5FE0]"></span>
        </div>
        <p class="mt-2 text-xs text-[#9CA3AF]">{{ formatDate(n.createdAt) }}</p>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import notificationsApi from '@/services/notifications'

const notifications = ref([])
const loading = ref(true)

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(async () => {
  try {
    const { data } = await notificationsApi.inbox()
    notifications.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
})
</script>