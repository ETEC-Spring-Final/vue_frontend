<template>
  <div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('notifications.title') }}</h1>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
    </div>

    <div v-else-if="notifications.length === 0" class="mt-16 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
      {{ $t('notifications.empty') }}
    </div>

    <div v-else class="mt-6 space-y-3">
      <article
        v-for="n in notifications"
        :key="n.id"
        class="rounded-2xl border p-4"
        :style="{
          borderColor: 'var(--color-border)',
          backgroundColor: n.read ? 'transparent' : 'color-mix(in srgb, var(--color-primary-light) 40%, transparent)',
        }"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ n.title || n.type }}</p>
            <p class="mt-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ n.message || n.content }}</p>
          </div>
          <span v-if="!n.read" class="mt-1 h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: 'var(--color-primary)' }"></span>
        </div>
        <p class="mt-2 text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ formatDate(n.createdAt) }}</p>
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