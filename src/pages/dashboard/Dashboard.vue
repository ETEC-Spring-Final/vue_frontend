<template>
  <div>
    <!-- Title + toolbar -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold" style="color: var(--color-text);">{{ $t('dashboard.title') }}</h2>
        <!-- Only visible on the printed / PDF page -->
        <p class="dash-print-only text-xs" style="color: var(--color-text-secondary);">{{ printedAt }}</p>
      </div>

      <div class="dash-no-print flex flex-wrap items-center gap-2">
        <div class="hidden md:flex items-center gap-2 rounded-full px-4 py-2 border" style="background-color: var(--color-surface); border-color: var(--color-border);">
          <svg class="h-4 w-4" style="color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          <input :placeholder="tr('dashboard.search', 'Search...')" class="bg-transparent text-sm outline-none w-48" style="color: var(--color-text);" />
        </div>

        <!-- Refresh -->
        <button
          type="button"
          class="action-btn"
          :disabled="refreshing || loading"
          :title="tr('dashboard.refresh', 'Refresh')"
          @click="refresh"
        >
          <svg class="h-4 w-4" :class="{ 'animate-spin': refreshing }" style="color: var(--color-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
          </svg>
          <span class="hidden sm:inline">{{ tr('dashboard.refresh', 'Refresh') }}</span>
        </button>

        <!-- Export CSV -->
        <button
          type="button"
          class="action-btn"
          :disabled="loading"
          :title="tr('dashboard.exportCsv', 'Export CSV')"
          @click="exportCsv"
        >
          <svg class="h-4 w-4" style="color: #16A34A;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
          </svg>
          <span class="hidden sm:inline">{{ tr('dashboard.exportCsv', 'Export CSV') }}</span>
        </button>

        <!-- Print / Export PDF -->
        <button
          type="button"
          class="action-btn"
          :disabled="loading"
          :title="tr('dashboard.print', 'Print / PDF')"
          @click="printDashboard"
        >
          <svg class="h-4 w-4" style="color: #DC2626;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span class="hidden sm:inline">{{ tr('dashboard.print', 'Print / PDF') }}</span>
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error && !loading"
      class="dash-no-print mb-5 flex items-center justify-between rounded-2xl border p-4"
      style="background-color: #FEF2F2; border-color: #FECACA;"
    >
      <p class="text-sm" style="color: #B91C1C;">{{ $t('dashboard.loadError') }}</p>
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        style="background-color: #DC2626;"
        @click="loadAll"
      >
        {{ $t('dashboard.retry') }}
      </button>
    </div>

    <!-- Stat cards -->
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

    <!-- Featured vehicle banner + fleet utilization gauge -->
    <div v-if="!loadingTop && topCars.length" class="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-5">
      <div class="lg:col-span-2 relative overflow-hidden rounded-2xl p-6 min-h-[160px] flex flex-col justify-end">
        <img
          v-if="topCars[0].imageUrl"
          :src="topCars[0].imageUrl"
          :alt="`${topCars[0].brandName} ${topCars[0].model}`"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          class="absolute inset-0"
          style="background:
            linear-gradient(135deg, rgba(37,99,235,0.35), rgba(124,58,237,0.35)),
            linear-gradient(to top, rgba(10,12,25,0.85) 0%, rgba(10,12,25,0.35) 55%, rgba(10,12,25,0.05) 100%);"
        ></div>
        <div class="relative z-10 text-white" style="text-shadow: 0 1px 3px rgba(0,0,0,0.4);">
          <p class="text-xs font-semibold uppercase tracking-wide opacity-90 flex items-center gap-1.5">
            <span>✨</span> {{ $t('dashboard.mostRented') }}
          </p>
          <p class="text-2xl font-bold mt-1">{{ topCars[0].brandName }} {{ topCars[0].model }}</p>
          <p class="text-sm opacity-90 mt-1">{{ topCars[0].rentalCount }} {{ $t('dashboard.rentals') }} · {{ $t('dashboard.mostPopularThisPeriod') }}</p>
        </div>
      </div>

      <div class="rounded-2xl border p-5 flex flex-col items-center justify-center" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <div class="relative h-28 w-28">
          <svg viewBox="0 0 120 120" class="h-28 w-28 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" stroke-width="12" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke="#8B5CF6" stroke-width="12" stroke-linecap="round"
              :stroke-dasharray="`${utilizationRate * 3.267} 326.7`"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <p class="text-xl font-bold" style="color: var(--color-text);">{{ utilizationRate }}%</p>
          </div>
        </div>
        <p class="text-xs mt-3 text-center font-medium" style="color: var(--color-text);">{{ $t('dashboard.fleetUtilization') }}</p>
        <p class="text-[11px]" style="color: var(--color-text-secondary);">{{ stats.vehicleStatusBreakdown.RENTED }}/{{ stats.totalVehicles }} {{ $t('dashboard.vehiclesLower') }}</p>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-5">
      <div class="lg:col-span-2 rounded-2xl border p-5" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <!-- Title now follows the selected period (day / week / month / 6 months) -->
          <p class="text-sm font-semibold" style="color: var(--color-text);">{{ chartTitle }}</p>
          <div class="dash-no-print flex gap-1 rounded-lg p-1" style="background-color: var(--color-bg);">
            <button
              v-for="p in periods"
              :key="p"
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium transition"
              :style="period === p ? 'background-color: var(--color-primary); color: #fff;' : 'color: var(--color-text-secondary);'"
              @click="changePeriod(p)"
            >
              {{ $t(`dashboard.period.${p}`) }}
            </button>
          </div>
        </div>
        <div class="h-56 relative">
          <div v-if="loadingChart" class="absolute inset-0 flex items-center justify-center">
            <span class="text-xs" style="color: var(--color-text-secondary);">{{ $t('dashboard.loading') }}</span>
          </div>
          <canvas ref="barCanvas"></canvas>
        </div>
      </div>
      <div class="rounded-2xl border p-5" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <p class="text-sm font-semibold mb-4" style="color: var(--color-text);">{{ $t('dashboard.statusChart') }}</p>
        <div class="h-56"><canvas ref="donutCanvas"></canvas></div>
      </div>
    </div>

    <!-- Top Rented Cars + Popular Brands -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-2xl border p-5" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <p class="text-sm font-semibold mb-4 flex items-center gap-2" style="color: var(--color-text);">
          <span>🏆</span> {{ $t('dashboard.topRentedCars') }}
        </p>

        <div v-if="loadingTop" class="space-y-3">
          <div v-for="n in 4" :key="n" class="flex items-center gap-3">
            <div class="h-12 w-16 shrink-0 animate-pulse rounded-lg" style="background-color: var(--color-border);"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-2/3 animate-pulse rounded" style="background-color: var(--color-border);"></div>
              <div class="h-2 w-full animate-pulse rounded" style="background-color: var(--color-border);"></div>
            </div>
          </div>
        </div>

        <p v-else-if="!topCars.length" class="text-sm py-6 text-center" style="color: var(--color-text-secondary);">
          {{ $t('dashboard.noData') }}
        </p>

        <div v-else class="space-y-4">
          <div v-for="(car, i) in topCars" :key="car.vehicleId" class="flex items-center gap-3">
            <span class="text-xs font-bold w-4 shrink-0" style="color: var(--color-text-secondary);">{{ i + 1 }}</span>
            <div class="h-12 w-16 shrink-0 overflow-hidden rounded-lg border" style="border-color: var(--color-border); background-color: var(--color-bg);">
              <img
                v-if="car.imageUrl"
                :src="car.imageUrl"
                :alt="`${car.brandName} ${car.model}`"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div v-else class="flex h-full w-full items-center justify-center" style="color: var(--color-text-secondary);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6"><path d="M3 13l2-6h14l2 6"/><path d="M5 13h14v5H5z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium truncate" style="color: var(--color-text);">{{ car.brandName }} {{ car.model }}</p>
                <span class="text-xs font-semibold shrink-0" style="color: var(--color-text-secondary);">{{ car.rentalCount }} {{ $t('dashboard.rentals') }}</span>
              </div>
              <div class="mt-1.5 h-1.5 w-full rounded-full overflow-hidden" style="background-color: var(--color-border);">
                <div class="h-full rounded-full" :style="`width: ${car.percentage}%; background-color: var(--color-primary);`"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border p-5" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <p class="text-sm font-semibold mb-4 flex items-center gap-2" style="color: var(--color-text);">
          <span>⭐</span> {{ $t('dashboard.popularBrands') }}
        </p>

        <div v-if="loadingTop" class="space-y-4">
          <div v-for="n in 4" :key="n" class="h-3 w-full animate-pulse rounded" style="background-color: var(--color-border);"></div>
        </div>

        <p v-else-if="!topBrands.length" class="text-sm py-6 text-center" style="color: var(--color-text-secondary);">
          {{ $t('dashboard.noData') }}
        </p>

        <div v-else class="space-y-4">
          <div v-for="(brand, i) in topBrands" :key="brand.brandName">
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="font-medium truncate" style="color: var(--color-text);">{{ i + 1 }}. {{ brand.brandName }}</span>
              <span class="text-xs font-semibold shrink-0" style="color: var(--color-text-secondary);">{{ brand.count }}</span>
            </div>
            <div class="h-1.5 w-full rounded-full overflow-hidden" style="background-color: var(--color-border);">
              <div class="h-full rounded-full" :style="`width: ${brand.percentage}%; background-color: ${brandColors[i % brandColors.length]};`"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from 'chart.js/auto'
import { useTheme } from '@/composables/useTheme'
import {
  fetchDashboardStats,
  fetchReservationsTrend,
  fetchTopRentedCars,
  fetchTopBrands,
} from '@/services/dashboard'

const { t, te, locale } = useI18n()
const { isDark } = useTheme()

// Translate with a fallback, so a missing key never shows "dashboard.xxx" on screen.
const tr = (key, fallback) => (te(key) ? t(key) : fallback)

const loading = ref(true)
const loadingTop = ref(true)
const loadingChart = ref(false)
const refreshing = ref(false)
const error = ref(false)
const period = ref('week')
const periods = ['day', 'week', 'month', 'sixMonths']
const printedAt = ref('')

const stats = ref({
  totalVehicles: 0,
  availableVehicles: 0,
  activeRentals: 0,
  pendingReservations: 0,
  vehicleStatusBreakdown: { AVAILABLE: 0, RENTED: 0, MAINTENANCE: 0, RESERVED: 0, UNAVAILABLE: 0 },
})
const trend = ref({ labels: [], data: [] })
const topCars = ref([])
const topBrands = ref([])

const barCanvas = ref(null)
const donutCanvas = ref(null)
let barChart = null
let donutChart = null

const brandColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444']

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

const utilizationRate = computed(() => {
  if (!stats.value.totalVehicles) return 0
  return Math.round((stats.value.vehicleStatusBreakdown.RENTED / stats.value.totalVehicles) * 100)
})

// Chart title follows the selected period instead of always saying "this week".
const chartTitle = computed(() =>
  tr(`dashboard.reservationsChartBy.${period.value}`, t('dashboard.reservationsChart')),
)

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#3B82F6'
}

function renderBarChart(animate = true) {
  if (barChart) barChart.destroy()
  if (!barCanvas.value) return
  barChart = new Chart(barCanvas.value, {
    type: 'bar',
    data: {
      labels: trend.value.labels,
      datasets: [{ data: trend.value.data, backgroundColor: cssVar('--color-primary'), borderRadius: 6, maxBarThickness: 28 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      ...(animate ? {} : { animation: false }),
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: cssVar('--color-text-secondary') } },
        y: { grid: { color: cssVar('--color-border') }, ticks: { color: cssVar('--color-text-secondary'), precision: 0 } },
      },
    },
  })
}

function renderDonutChart(animate = true) {
  if (donutChart) donutChart.destroy()
  if (!donutCanvas.value) return
  const b = stats.value.vehicleStatusBreakdown
  const entries = [
    { label: tr('dashboard.status.available', 'Available'), value: b.AVAILABLE, color: '#34D399' },
    { label: tr('dashboard.status.rented', 'Rented'), value: b.RENTED, color: '#FBBF24' },
    { label: tr('dashboard.status.maintenance', 'Maintenance'), value: b.MAINTENANCE, color: '#F87171' },
    { label: tr('dashboard.status.reserved', 'Reserved'), value: b.RESERVED, color: '#60A5FA' },
    { label: tr('dashboard.status.unavailable', 'Unavailable'), value: b.UNAVAILABLE, color: '#9CA3AF' },
  ].filter((e) => e.value > 0)

  donutChart = new Chart(donutCanvas.value, {
    type: 'doughnut',
    data: {
      labels: entries.map((e) => e.label),
      datasets: [{ data: entries.map((e) => e.value), backgroundColor: entries.map((e) => e.color), borderWidth: 0 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      ...(animate ? {} : { animation: false }),
      plugins: { legend: { position: 'bottom', labels: { color: cssVar('--color-text-secondary'), boxWidth: 10, font: { size: 11 } } } },
    },
  })
}

async function changePeriod(p) {
  if (p === period.value) return
  period.value = p
  loadingChart.value = true
  try {
    trend.value = await fetchReservationsTrend(p)
    await nextTick()
    renderBarChart()
  } catch (e) {
    console.error('[Dashboard] failed to load trend:', e)
  } finally {
    loadingChart.value = false
  }
}

async function loadStats() {
  loading.value = true
  error.value = false
  try {
    const [statsData, trendData] = await Promise.all([fetchDashboardStats(), fetchReservationsTrend(period.value)])
    stats.value = statsData
    trend.value = trendData
  } catch (e) {
    console.error('[Dashboard] failed to load stats:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadTopLists() {
  loadingTop.value = true
  try {
    const [cars, brands] = await Promise.all([fetchTopRentedCars(5), fetchTopBrands(5)])
    topCars.value = cars
    topBrands.value = brands
  } catch (e) {
    console.error('[Dashboard] failed to load top lists:', e)
  } finally {
    loadingTop.value = false
  }
}

async function loadAll() {
  await Promise.all([loadStats(), loadTopLists()])
  await nextTick()
  renderBarChart()
  renderDonutChart()
}

// ---- Toolbar actions -------------------------------------------------------

async function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await loadAll()
  } finally {
    refreshing.value = false
  }
}

// CSV cell escaping: wrap in quotes when needed and double any quotes inside.
function csvCell(value) {
  const s = String(value ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Client-side export (no backend endpoint needed). The BOM (\uFEFF) makes
// Excel read Khmer / UTF-8 text correctly.
function exportCsv() {
  const s = stats.value
  const rows = [
    ['Dashboard report', new Date().toLocaleString()],
    [],
    ['Summary'],
    ['Metric', 'Value'],
    ['Total vehicles', s.totalVehicles],
    ['Available now', s.availableVehicles],
    ['Active rentals', s.activeRentals],
    ['Pending reservations', s.pendingReservations],
    ['Fleet utilization (%)', utilizationRate.value],
    [],
    ['Vehicle status'],
    ['Status', 'Vehicles'],
    ...Object.entries(s.vehicleStatusBreakdown),
    [],
    [`Rentals trend (${period.value})`],
    ['Period', 'Count'],
    ...trend.value.labels.map((label, i) => [label, trend.value.data[i]]),
    [],
    ['Top rented cars'],
    ['Rank', 'Vehicle', 'Rentals'],
    ...topCars.value.map((c, i) => [i + 1, `${c.brandName} ${c.model}`, c.rentalCount]),
    [],
    ['Popular brands'],
    ['Rank', 'Brand', 'Rentals'],
    ...topBrands.value.map((b, i) => [i + 1, b.brandName, b.count]),
  ]

  const csv = '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Opens the browser print dialog; choose "Save as PDF" as the destination.
// The sidebar / header / buttons are hidden by the @media print block below.
// In dark mode we briefly switch to the light palette (and redraw the charts)
// so the PDF has dark text on a white page, then restore the theme afterwards.
async function printDashboard() {
  printedAt.value = new Date().toLocaleString()
  const html = document.documentElement
  const wasDark = html.classList.contains('dark')

  if (wasDark) html.classList.remove('dark')
  await nextTick()
  renderBarChart(false)
  renderDonutChart(false)
  await nextTick()

  window.print() // blocks until the dialog is closed

  if (wasDark) {
    html.classList.add('dark')
    await nextTick()
    renderBarChart(false)
    renderDonutChart(false)
  }
}

// Redraw charts when the theme or language changes (canvas colours and
// labels are baked in at draw time, so they don't update on their own).
watch([isDark, locale], async () => {
  await nextTick()
  renderBarChart()
  renderDonutChart()
})

onMounted(loadAll)
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: transform 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}
.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--color-primary);
}
.action-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

<!-- Not scoped on purpose: printing has to hide the sidebar and header,
     which live in AppSidebar.vue / BackLayout.vue. -->
<style>
.dash-print-only { display: none; }

@page { margin: 12mm; }

@media print {
  aside,
  header,
  .dash-no-print { display: none !important; }
  .dash-print-only { display: block !important; }

  /* The layout is a fixed-height, inner-scrolling screen; let it flow across pages. */
  html, body, #app { height: auto !important; overflow: visible !important; }
  .h-screen { height: auto !important; }
  .flex-1.flex-col.overflow-hidden { overflow: visible !important; }
  main.overflow-y-auto { overflow: visible !important; padding: 0 !important; }

  /* Keep colours (banner gradient, bars) in the PDF and avoid cutting cards in half. */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .rounded-2xl { break-inside: avoid; }
}
</style>
