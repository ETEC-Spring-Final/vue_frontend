<template>
  <div class="flex h-screen overflow-hidden bg-[#F9FAFB]">
    <AppSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
        <h1 class="text-lg font-bold text-[#1A2036]">{{ pageTitle }}</h1>
        <NotificationBell />
      </header>
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'

const route = useRoute()

// Derives a human title from the route path, e.g. /dashboard/vehicles -> "Vehicles"
const pageTitle = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  if (!last || last === 'dashboard') return 'Dashboard'
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
})
</script>