<template>
  <div>
    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article v-for="card in cards" :key="card.label" class="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <p class="text-xs font-semibold uppercase text-[#9CA3AF]">{{ card.label }}</p>
        <p class="mt-2 text-3xl font-bold text-[#1A2036]">{{ card.value }}</p>
      </article>
    </div>

    <div class="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <p class="text-sm text-[#6B7280]">
        Use the sidebar to manage vehicles, reservations, rentals, and more.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchDashboardStats } from '@/services/dashboard'

const stats = ref(null)
const loading = ref(true)

const cards = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Total Vehicles', value: stats.value.totalVehicles },
    { label: 'Available Now', value: stats.value.availableVehicles },
    { label: 'Active Rentals', value: stats.value.activeRentals },
    { label: 'Pending Reservations', value: stats.value.pendingReservations },
  ]
})

onMounted(async () => {
  try {
    stats.value = await fetchDashboardStats()
  } finally {
    loading.value = false
  }
})
</script>