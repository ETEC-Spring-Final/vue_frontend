<template>
  <div>
    <!-- Toolbar: status tabs (with counts) on the left, search / sort / export on the right -->
    <div ref="topRef" class="flex flex-wrap items-center justify-between gap-3">
      <div
        role="tablist"
        class="inline-flex flex-wrap gap-1 rounded-full border p-1"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="statusFilter === tab.key"
          class="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150"
          :style="statusFilter === tab.key
            ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
            : { color: 'var(--color-text-secondary)' }"
          @click="statusFilter = tab.key"
        >
          {{ tab.label }}
          <span class="ml-1 text-xs tabular-nums opacity-80">{{ tab.count }}</span>
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="search"
          type="search"
          :placeholder="tr('customers.search', 'Search by name, email or phone...')"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 sm:w-64"
          style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
        />

        <select
          v-model="sortBy"
          :aria-label="tr('customers.sortLabel', 'Sort by')"
          class="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
        >
          <option value="newest">{{ tr('customers.sortNewest', 'Newest') }}</option>
          <option value="name">{{ tr('customers.sortName', 'Name A–Z') }}</option>
          <option value="bookings">{{ tr('customers.sortBookings', 'Most bookings') }}</option>
          <option value="spent">{{ tr('customers.sortSpent', 'Highest spend') }}</option>
        </select>

        <button
          type="button"
          :disabled="sorted.length === 0"
          class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          style="border-color: var(--color-border); color: var(--color-text); background-color: var(--color-surface);"
          @click="exportCsv"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
          </svg>
          {{ tr('customers.exportCsv', 'Export CSV') }}
        </button>
      </div>
    </div>

    <!-- Load error -->
    <div
      v-if="loadError"
      role="alert"
      class="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="font-semibold underline underline-offset-2 hover:opacity-70" @click="loadUsers">
        {{ tr('customers.retry', 'Try again') }}
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="loading" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="n in Math.min(pageSize, 6)"
        :key="n"
        class="h-52 animate-pulse rounded-2xl border"
        style="border-color: var(--color-border); background-color: var(--color-surface);"
      ></div>
    </div>

    <!-- Card grid -->
    <div v-else-if="paged.length" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="c in paged"
        :key="c.id"
        class="flex flex-col rounded-2xl border p-4 transition-shadow duration-200 hover:shadow-sm"
        style="border-color: var(--color-border); background-color: var(--color-surface);"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 items-center gap-3">
            <!-- Avatar: real photo if present, else colored initial -->
            <img
              v-if="avatarSrc(c) && !brokenAvatars.has(c.id)"
              :src="avatarSrc(c)"
              :alt="c.firstName"
              loading="lazy"
              class="h-11 w-11 shrink-0 rounded-full object-cover"
              @error="brokenAvatars.add(c.id)"
            />
            <div
              v-else
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              :style="{ backgroundColor: avatarColor(c.id) }"
            >
              {{ initial(c.firstName) }}
            </div>

            <div class="min-w-0">
              <p class="break-words font-semibold leading-tight" style="color: var(--color-text);">
                {{ c.firstName }} {{ c.lastName }}
              </p>
              <p class="truncate text-xs" style="color: var(--color-text-secondary);" :title="c.email">{{ c.email }}</p>
              <p v-if="c.phone" class="truncate text-xs" style="color: var(--color-text-secondary);">{{ c.phone }}</p>
            </div>
          </div>

          <span :class="statusClass(c.active)">
            {{ c.active ? $t('customers.active') : $t('customers.inactive') }}
          </span>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2 border-t pt-3" style="border-color: var(--color-border);">
          <div>
            <p class="text-xs" style="color: var(--color-text-secondary);">{{ tr('customers.bookings', 'Bookings') }}</p>
            <p class="text-sm font-semibold tabular-nums" style="color: var(--color-text);">{{ statsFor(c.id).count }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs" style="color: var(--color-text-secondary);">{{ tr('customers.joined', 'Joined') }}</p>
            <p class="text-sm font-semibold" style="color: var(--color-text);">{{ formatDate(c.createdAt) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs" style="color: var(--color-text-secondary);">{{ tr('customers.totalSpent', 'Total spent') }}</p>
            <p class="text-sm font-semibold tabular-nums" style="color: var(--color-primary);">${{ statsFor(c.id).total.toFixed(2) }}</p>
          </div>
        </div>

        <button
          type="button"
          class="mt-3 w-full rounded-lg border py-1.5 text-xs font-semibold transition hover:opacity-80"
          style="border-color: var(--color-border); color: var(--color-text);"
          @click="openHistory(c)"
        >
          {{ tr('customers.viewHistory', 'View booking history') }} →
        </button>

        <div class="mt-auto flex items-center justify-between pt-3">
          <button
            type="button"
            :disabled="busyId === c.id"
            class="text-xs font-semibold hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
            style="color: var(--color-primary);"
            @click="onToggleActive(c)"
          >{{ c.active ? $t('customers.deactivate') : $t('customers.activate') }}</button>
          <button
            type="button"
            :disabled="busyId === c.id"
            class="text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
            @click="onDelete(c)"
          >{{ $t('customers.delete') }}</button>
        </div>
      </article>
    </div>

    <!-- Empty states -->
    <div v-else class="mt-16 flex flex-col items-center text-center">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ customers.length === 0 ? tr('customers.noCustomers', 'No customers yet.') : tr('customers.noResults', 'No customers found.') }}
      </p>
      <button
        v-if="customers.length && filtersActive"
        type="button"
        class="mt-3 text-sm font-semibold underline underline-offset-4 hover:opacity-70"
        style="color: var(--color-primary);"
        @click="clearFilters"
      >
        {{ tr('customers.clearFilters', 'Clear filters') }}
      </button>
    </div>

    <!-- Pagination -->
    <nav
      v-if="!loading && !loadError && sorted.length"
      class="mt-6 flex flex-wrap items-center justify-between gap-3"
      :aria-label="tr('customers.page', 'Page')"
    >
      <p class="text-xs tabular-nums" style="color: var(--color-text-secondary);">
        {{ tr('customers.showing', `Showing ${rangeFrom}–${rangeTo} of ${sorted.length}`, { from: rangeFrom, to: rangeTo, total: sorted.length }) }}
      </p>

      <div v-if="totalPages > 1" class="flex items-center gap-1">
        <button
          type="button"
          :disabled="page === 1"
          :aria-label="tr('customers.prev', 'Previous')"
          class="flex h-9 w-9 items-center justify-center rounded-full border transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style="border-color: var(--color-border); color: var(--color-text);"
          @click="goTo(page - 1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <template v-for="(item, idx) in pageItems" :key="`${item}-${idx}`">
          <span v-if="item === '…'" class="px-1 text-sm" style="color: var(--color-text-secondary);" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            :aria-current="item === page ? 'page' : undefined"
            class="h-9 min-w-9 rounded-full border px-3 text-sm font-medium tabular-nums transition hover:opacity-80"
            :style="item === page
              ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
              : { borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
            @click="goTo(item)"
          >
            {{ item }}
          </button>
        </template>

        <button
          type="button"
          :disabled="page === totalPages"
          :aria-label="tr('customers.next', 'Next')"
          class="flex h-9 w-9 items-center justify-center rounded-full border transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style="border-color: var(--color-border); color: var(--color-text);"
          @click="goTo(page + 1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <label class="flex items-center gap-2 text-xs" style="color: var(--color-text-secondary);">
        {{ tr('customers.perPage', 'Per page') }}
        <select
          v-model.number="pageSize"
          class="rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
          style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
        >
          <option v-for="n in PAGE_SIZES" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
    </nav>

    <p v-if="actionError" role="alert" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ actionError }}</p>

    <!-- Booking history modal -->
    <Modal :open="historyOpen" :title="historyTitle" @close="historyOpen = false">
      <div v-if="historyRentals.length === 0" class="py-6 text-center text-sm" style="color: var(--color-text-secondary);">
        {{ tr('customers.noBookings', 'No bookings yet.') }}
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="r in historyRentals"
          :key="r.id"
          class="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
          style="border-color: var(--color-border);"
        >
          <div>
            <p class="font-semibold" style="color: var(--color-text);">#{{ r.id }} — {{ vehicleLabel(r.vehicleId) }}</p>
            <p class="text-xs" style="color: var(--color-text-secondary);">
              {{ formatDate(r.pickUpDateTime) }} → {{ formatDate(r.expectedReturnDateTime) }}
            </p>
          </div>
          <span class="text-sm font-semibold tabular-nums" style="color: var(--color-text);">${{ Number(r.totalPrice ?? 0).toFixed(2) }}</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import api from '@/services/api'

const { t, te, locale } = useI18n()
// Translate when the key exists, otherwise fall back to the English default.
const tr = (key, fallback, params) => (te(key) ? t(key, params ?? {}) : fallback)

// ---------- State ----------
const allUsers = ref([])
const rentals = ref([])
const vehicles = ref([])
const loading = ref(true)
const loadError = ref('')
const actionError = ref('')
const busyId = ref(null)
const topRef = ref(null)

const search = ref('')
const statusFilter = ref('all') // all | active | inactive
const sortBy = ref('newest') // newest | name | bookings | spent

// Track avatars that failed to load so we fall back to the initial circle
const brokenAvatars = reactive(new Set())

// ---------- Pagination state ----------
const PAGE_SIZES = [6, 12, 24, 48]
function readPageSize() {
  try {
    const n = Number(localStorage.getItem('customers.pageSize'))
    return PAGE_SIZES.includes(n) ? n : 12
  } catch {
    return 12
  }
}
const pageSize = ref(readPageSize())
const page = ref(1)

watch(pageSize, (n) => {
  try { localStorage.setItem('customers.pageSize', String(n)) } catch { /* storage unavailable */ }
})
// Any change to what is being listed sends the user back to page 1.
watch([search, statusFilter, sortBy, pageSize], () => { page.value = 1 })

// ---------- Derived data ----------
// Only show users with role CUSTOMER on this page
const customers = computed(() => allUsers.value.filter((u) => u.role === 'CUSTOMER'))

// Rental stats are computed once per data change (a Map lookup per card),
// instead of re-filtering every rental for every card on every render.
const statsByUser = computed(() => {
  const map = new Map()
  for (const r of rentals.value) {
    if (r.status === 'CANCELLED') continue // cancelled rentals aren't "spent"
    const key = Number(r.userId)
    const cur = map.get(key) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += Number(r.totalPrice) || 0
    map.set(key, cur)
  }
  return map
})
const EMPTY_STATS = { count: 0, total: 0 }
const statsFor = (userId) => statsByUser.value.get(Number(userId)) ?? EMPTY_STATS

const statusTabs = computed(() => [
  { key: 'all', label: tr('customers.filterAll', 'All'), count: customers.value.length },
  { key: 'active', label: t('customers.active'), count: customers.value.filter((c) => c.active).length },
  { key: 'inactive', label: t('customers.inactive'), count: customers.value.filter((c) => !c.active).length },
])

const fullName = (c) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()

const searched = computed(() => {
  let list = customers.value
  if (statusFilter.value === 'active') list = list.filter((c) => c.active)
  else if (statusFilter.value === 'inactive') list = list.filter((c) => !c.active)

  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      fullName(c).toLowerCase().includes(q) ||
      String(c.email ?? '').toLowerCase().includes(q) ||
      String(c.phone ?? '').toLowerCase().includes(q)
  )
})

const sorted = computed(() => {
  const list = [...searched.value]
  const byName = (a, b) => fullName(a).localeCompare(fullName(b))
  switch (sortBy.value) {
    case 'name':
      return list.sort(byName)
    case 'bookings':
      return list.sort((a, b) => statsFor(b.id).count - statsFor(a.id).count || byName(a, b))
    case 'spent':
      return list.sort((a, b) => statsFor(b.id).total - statsFor(a.id).total || byName(a, b))
    case 'newest':
    default:
      return list.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
  }
})

const filtersActive = computed(() => !!search.value.trim() || statusFilter.value !== 'all')

// ---------- Pagination (client-side: /auth/users already returns everyone) ----------
const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize.value)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sorted.value.slice(start, start + pageSize.value)
})
const rangeFrom = computed(() => (sorted.value.length ? (page.value - 1) * pageSize.value + 1 : 0))
const rangeTo = computed(() => Math.min(page.value * pageSize.value, sorted.value.length))

// If a delete / deactivate empties the current page, step back instead of showing nothing.
watch(totalPages, (n) => {
  if (page.value > n) page.value = n
})

// 1 … 4 5 6 … 12 style page list
const pageItems = computed(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  let start = Math.max(2, cur - 1)
  let end = Math.min(total - 1, cur + 1)
  if (cur <= 3) end = Math.min(total - 1, 4)
  if (cur >= total - 2) start = Math.max(2, total - 3)

  const items = [1]
  if (start > 2) items.push('…')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total - 1) items.push('…')
  items.push(total)
  return items
})

async function goTo(p) {
  const next = Math.min(Math.max(1, p), totalPages.value)
  if (next === page.value) return
  page.value = next
  await nextTick()
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  topRef.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function clearFilters() {
  search.value = ''
  statusFilter.value = 'all'
}

// ---------- Display helpers ----------
function initial(name) {
  return (name || '?').charAt(0).toUpperCase()
}

// Deterministic color per user id so the same person always gets the same color
const PALETTE = ['#7C6FF0', '#22C55E', '#F59E0B', '#EF4444', '#0EA5E9', '#EC4899', '#14B8A6', '#8B5CF6']
function avatarColor(id) {
  return PALETTE[Number(id) % PALETTE.length]
}

// Full URLs pass through untouched; relative paths (e.g. /uploads/a.jpg) are
// resolved against the API server's origin.
const apiOrigin = (() => {
  try {
    return new URL(api.defaults?.baseURL || '/', window.location.origin).origin
  } catch {
    return window.location.origin
  }
})()
function avatarSrc(user) {
  const p = user.profilePicture
  if (!p) return ''
  if (/^(https?:|data:|blob:)/i.test(p)) return p
  return `${apiOrigin}${p.startsWith('/') ? '' : '/'}${p}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusClass(active) {
  const base = 'inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold'
  return active
    ? `${base} bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400`
    : `${base} bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300`
}

function vehicleLabel(id) {
  const v = vehicles.value.find((x) => x.id === id)
  return v ? `${v.brandName ?? v.brand} ${v.model}` : `#${id}`
}

// ---------- Data loading ----------
async function loadUsers() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/auth/users')
    allUsers.value = Array.isArray(data) ? data : data?.content ?? []
  } catch (err) {
    loadError.value = err.response?.data?.message || tr('customers.loadError', 'Could not load customers.')
  } finally {
    loading.value = false
  }
}

async function loadRentals() {
  try {
    const { data } = await api.get('/rentals')
    rentals.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    rentals.value = []
  }
}

async function loadVehicles() {
  try {
    const { data } = await api.get('/vehicles')
    vehicles.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    vehicles.value = []
  }
}

// ---------- Booking history modal ----------
const historyOpen = ref(false)
const historyCustomer = ref(null)
const historyTitle = computed(() => (historyCustomer.value ? fullName(historyCustomer.value) : ''))
const historyRentals = computed(() =>
  historyCustomer.value ? rentals.value.filter((r) => Number(r.userId) === Number(historyCustomer.value.id)) : []
)
function openHistory(customer) {
  historyCustomer.value = customer
  historyOpen.value = true
}

// ---------- Actions ----------
// Updated in place (no full reload) so the list keeps its page and scroll position.
async function onToggleActive(row) {
  if (busyId.value) return
  busyId.value = row.id
  actionError.value = ''
  try {
    await api.patch(`/auth/users/${row.id}/active`, null, { params: { active: !row.active } })
    row.active = !row.active
  } catch (err) {
    actionError.value = err.response?.data?.message || t('customers.statusError')
  } finally {
    busyId.value = null
  }
}

async function onDelete(row) {
  if (busyId.value) return
  if (!confirm(`${t('customers.confirmDelete')} ${fullName(row)}?`)) return
  busyId.value = row.id
  actionError.value = ''
  try {
    await api.delete(`/auth/users/${row.id}`)
    allUsers.value = allUsers.value.filter((u) => u.id !== row.id)
  } catch (err) {
    actionError.value = err.response?.data?.message || t('customers.deleteError')
  } finally {
    busyId.value = null
  }
}

// ---------- CSV export (everything matching the current filters, not just this page) ----------
function csvCell(value) {
  let s = String(value ?? '')
  // Stop spreadsheet apps from running cells that start like formulas.
  if (/^[=@]/.test(s) || (/^[+-]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s))) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv() {
  const header = ['ID', 'Name', 'Email', 'Phone', 'Gender', 'Status', 'Joined', 'Bookings', 'Total spent']
  const rows = sorted.value.map((c) => [
    c.id,
    fullName(c),
    c.email,
    c.phone,
    c.gender,
    c.active ? 'Active' : 'Inactive',
    c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
    statsFor(c.id).count,
    statsFor(c.id).total.toFixed(2),
  ])
  // BOM so Excel opens Khmer names as UTF-8.
  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

onMounted(() => {
  loadUsers()
  loadRentals()
  loadVehicles()
})
</script>