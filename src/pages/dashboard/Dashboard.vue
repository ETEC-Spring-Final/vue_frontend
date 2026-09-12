<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold" style="color: var(--color-text);">{{ $t('dashboard.title') }}</h2>
      <div class="hidden md:flex items-center gap-2 rounded-full px-4 py-2 border" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <svg class="h-4 w-4" style="color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <input placeholder="Search..." class="bg-transparent text-sm outline-none w-48" style="color: var(--color-text);" />
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error && !loading"
      class="mb-5 flex items-center justify-between rounded-2xl border p-4"
      style="background-color: #FEF2F2; border-color: #FECACA;"
    >
      <p class="text-sm" style="color: #B91C1C;">{{ $t('dashboard.loadError') }}</p>
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        style="background-color: #DC2626;"
        @click="loadStats"
      >
        {{ $t('dashboard.retry') }}
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
      <div
        v-for="(card, i) in cards"
        :key="card.key"
        class="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        :style="`background-color: var(--color-surface); border-color: var(--color-border); animation: fadeInUp 0.4s ease ${i * 0.06}s both;`"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium" style="color: var(--color-text-secondary);">{{ $t(`dashboard.${card.key}`) }}</p>
            <p class="mt-2 text-2xl font-bold" style="color: var(--color-text);">
              <span v-if="loading" class="inline-block h-7 w-14 animate-pulse rounded" style="background-color: var(--color-border);"></span>
              <span v-else>{{ card.value }}</span>
            </p>
            <p class="mt-1 text-xs font-semibold" :style="`color: ${card.trend >= 0 ? '#16A34A' : '#DC2626'}`">
              {{ card.trend >= 0 ? '▲' : '▼' }} {{ Math.abs(card.trend) }}%
            </p>
          </div>
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
            :style="`background-color: ${card.bg}; color: ${card.fg};`"
            v-html="card.icon"
          ></span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-2xl border p-5" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <p class="text-sm font-semibold mb-4" style="color: var(--color-text);">{{ $t('dashboard.reservationsChart') }}</p>
        <div class="h-56"><canvas ref="barCanvas"></canvas></div>
      </div>
      <div class="rounded-2xl border p-5" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <p class="text-sm font-semibold mb-4" style="color: var(--color-text);">{{ $t('dashboard.statusChart') }}</p>
        <div class="h-56"><canvas ref="donutCanvas"></canvas></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import Chart from 'chart.js/auto'
import { fetchDashboardStats } from '@/services/dashboard'

const loading = ref(true)
const error = ref(false)
const stats = ref({ totalVehicles: 0, availableVehicles: 0, activeRentals: 0, pendingReservations: 0 })
const barCanvas = ref(null)
const donutCanvas = ref(null)
let barChart = null
let donutChart = null

const svgIcon = {
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path d="M3 13l2-6h14l2 6"/><path d="M5 13h14v5H5z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path d="M20 6L9 17l-5-5"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><circle cx="8" cy="15" r="4"/><path d="M10.5 12.5L19 4M19 4h-4M19 4v4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
}

const cards = computed(() => [
  { key: 'totalVehicles', value: stats.value.totalVehicles, trend: 4, bg: 'var(--color-primary-light)', fg: 'var(--color-primary)', icon: svgIcon.car },
  { key: 'availableNow', value: stats.value.availableVehicles, trend: 2, bg: '#DCFCE7', fg: '#16A34A', icon: svgIcon.check },
  { key: 'activeRentals', value: stats.value.activeRentals, trend: -1, bg: '#FEF3C7', fg: '#D97706', icon: svgIcon.key },
  { key: 'pendingReservations', value: stats.value.pendingReservations, trend: 6, bg: '#FEE2E2', fg: '#DC2626', icon: svgIcon.calendar },
])

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#3B82F6'
}

function renderCharts() {
  if (barChart) barChart.destroy()
  if (donutChart) donutChart.destroy()

  if (barCanvas.value) {
    barChart = new Chart(barCanvas.value, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [3, 5, 2, 6, 4, 8, 5], backgroundColor: cssVar('--color-primary'), borderRadius: 6, maxBarThickness: 28 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: cssVar('--color-text-secondary') } },
          y: { grid: { color: cssVar('--color-border') }, ticks: { color: cssVar('--color-text-secondary') } },
        },
      },
    })
  }

  if (donutCanvas.value) {
    donutChart = new Chart(donutCanvas.value, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Rented', 'Maintenance'],
        datasets: [{ data: [12, 4, 2], backgroundColor: ['#34D399', '#FBBF24', '#F87171'], borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { color: cssVar('--color-text-secondary'), boxWidth: 10, font: { size: 11 } } } },
      },
    })
  }
}

async function loadStats() {
  loading.value = true
  error.value = false
  try {
    stats.value = await fetchDashboardStats()
  } catch (e) {
    console.error('[Dashboard] failed to load stats:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadStats()
  await nextTick()
  renderCharts()
})
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>