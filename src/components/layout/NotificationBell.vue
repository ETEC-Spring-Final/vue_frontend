<template>
  <RouterLink to="/notifications" class="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F9FAFB]">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-[#1A2036]">
      <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
      <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
    <span
      v-if="unreadCount > 0"
      class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
    >
      {{ unreadCount > 9 ? '9+' : unreadCount }}
    </span>
  </RouterLink>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import notificationsApi from '@/services/notifications'

const unreadCount = ref(0)

onMounted(async () => {
  try {
    const { data } = await notificationsApi.inbox()
    const list = Array.isArray(data) ? data : data?.content ?? []
    unreadCount.value = list.filter((n) => !n.read).length
  } catch (e) {
    // fail silently — bell just shows no badge
  }
})
</script>