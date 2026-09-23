<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">{{ t('invoices.title') }}</h1>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        + {{ t('invoices.add') }}
      </button>
    </div>

    <!-- Summary strip -->
    <div
      class="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-5 border-b pb-4"
      style="color: var(--color-text-secondary); border-color: var(--color-border);"
    >
      <div><span class="font-semibold" style="color: var(--color-text);">{{ invoices.length }}</span> {{ t('invoices.count') }}</div>
      <div><span class="font-semibold text-amber-500">{{ counts.unpaid }}</span> {{ t('invoices.unpaid') }}</div>
      <div><span class="font-semibold text-emerald-600">{{ counts.paid }}</span> {{ t('invoices.paid') }}</div>
      <div><span class="font-semibold text-red-500">{{ counts.overdue }}</span> {{ t('invoices.overdue') }}</div>
    </div>

    <!-- Search + filter pills -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        :placeholder="t('invoices.search')"
        class="rounded-lg px-3 py-2 text-sm w-64 border focus:outline-none focus:ring-2"
        style="background-color: var(--color-surface); color: var(--color-text); border-color: var(--color-border); --tw-ring-color: var(--color-primary);"
      />
      <button
        v-for="opt in ['ALL', 'UNPAID', 'PAID', 'CANCELLED']"
        :key="opt"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition"
        :style="statusFilter === opt
          ? `background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);`
          : `color: var(--color-text-secondary); border-color: var(--color-border);`"
        @click="statusFilter = opt"
      >
        {{ opt === 'ALL' ? t('invoices.all') : statusLabel(opt) }}
      </button>
    </div>

    <!-- Table -->
    <DataTable :columns="columns" :rows="paged" :loading="loading">
      <template #cell-invoiceNumber="{ row }">
        <span class="font-mono font-semibold" style="color: var(--color-text);">{{ row.invoiceNumber }}</span>
      </template>
      <template #cell-rentalId="{ row }">#{{ row.rentalId }}</template>
      <template #cell-issueDate="{ row }">{{ formatDate(row.issueDate) }}</template>
      <template #cell-dueDate="{ row }">
        <span :style="isOverdue(row) ? 'color: #EF4444;' : ''">{{ formatDate(row.dueDate) }}</span>
      </template>
      <template #cell-totalAmount="{ row }">
        <span class="font-semibold" style="color: var(--color-text);">${{ Number(row.totalAmount ?? 0).toFixed(2) }}</span>
      </template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
      </template>
      <template #actions="{ row }">
        <select
          class="rounded-lg border px-2 py-1 text-xs outline-none"
          style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
          :value="row.status"
          @change="onStatusChange(row, $event.target.value)"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </select>

        <!-- Print: 80 mm receipt (thermal printer) -->
        <button
          type="button"
          class="ml-3 inline-flex items-center gap-1 text-xs font-semibold transition hover:opacity-70"
          style="color: var(--color-primary);"
          :title="tr('invoices.printReceipt', 'Print receipt (80 mm)')"
          @click="onPrint(row, 'receipt')"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          {{ tr('invoices.print', 'Print') }}
        </button>

        <!-- Print / save as PDF: A4 invoice -->
        <button
          type="button"
          class="ml-2 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold transition hover:opacity-70"
          style="color: var(--color-text-secondary); border-color: var(--color-border);"
          :title="tr('invoices.printA4', 'Print A4 invoice / save as PDF')"
          @click="onPrint(row, 'a4')"
        >
          A4
        </button>

        <button
          type="button"
          class="ml-3 text-xs font-semibold opacity-50 cursor-not-allowed"
          style="color: var(--color-text-secondary);"
          :title="t('invoices.paymentComingSoon')"
          disabled
        >
          {{ t('invoices.generateQr') }}
        </button>

        <button
          class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700"
          @click="onDelete(row)"
        >{{ t('invoices.delete') }}</button>
      </template>
    </DataTable>

    <p v-if="!loading && filtered.length === 0 && invoices.length > 0" class="text-center text-sm mt-3" style="color: var(--color-text-secondary);">
      {{ t('invoices.noResults') }}
    </p>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Pagination -->
    <div
      v-if="!loading && filtered.length > 0"
      class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
      style="color: var(--color-text-secondary);"
    >
      <div class="flex items-center gap-3">
        <span>{{ rangeFrom }}–{{ rangeTo }} {{ tr('invoices.of', 'of') }} {{ filtered.length }}</span>
        <select
          v-model.number="pageSize"
          class="rounded-lg border px-2 py-1.5 text-xs outline-none"
          style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
        >
          <option v-for="n in pageSizes" :key="n" :value="n">{{ n }} / {{ tr('invoices.perPage', 'page') }}</option>
        </select>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
          style="border-color: var(--color-border); color: var(--color-text);"
          :disabled="page === 1"
          @click="page--"
        >{{ tr('invoices.previous', 'Previous') }}</button>

        <template v-for="(b, i) in pageButtons" :key="`${b}-${i}`">
          <span v-if="b === '…'" class="px-1">…</span>
          <button
            v-else
            type="button"
            class="h-8 min-w-8 rounded-full border px-2 text-xs font-semibold transition active:scale-95"
            :style="
              b === page
                ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
                : { borderColor: 'var(--color-border)', color: 'var(--color-text)' }
            "
            @click="page = b"
          >{{ b }}</button>
        </template>

        <button
          type="button"
          class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
          style="border-color: var(--color-border); color: var(--color-text);"
          :disabled="page >= totalPages"
          @click="page++"
        >{{ tr('invoices.next', 'Next') }}</button>
      </div>
    </div>

    <!-- Create modal -->
    <Modal :open="modalOpen" :title="t('invoices.addTitle')" @close="modalOpen = false">
      <form class="space-y-5" @submit.prevent="onSave">
        <!-- Section: Rental details -->
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wide mb-2" style="color: var(--color-text-secondary);">
            {{ t('invoices.rentalDetails') }}
          </h3>
          <select v-model.number="form.rentalId" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ t('invoices.selectRental') }}</option>
            <option v-for="r in eligibleRentals" :key="r.id" :value="r.id">
              #{{ r.id }} — {{ vehicleLabel(r.vehicleId) }} (${{ Number(r.totalPrice ?? 0).toFixed(2) }})
            </option>
          </select>
          <p v-if="eligibleRentals.length === 0" class="text-xs mt-1.5" style="color: var(--color-text-secondary);">
            {{ t('invoices.noEligibleRentals') }}
          </p>

          <div class="mt-3">
            <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('invoices.dueDate') }}</label>
            <input
              v-model="form.dueDate"
              type="datetime-local"
              class="input-field mt-1"
              :style="inputStyle"
            />
          </div>
        </div>

        <!-- Section: Charges -->
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wide mb-2" style="color: var(--color-text-secondary);">
            {{ t('invoices.charges') }}
          </h3>

          <div>
            <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('invoices.subtotal') }}</label>
            <div class="relative mt-1">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-text-secondary);">$</span>
              <input v-model.number="form.subtotal" type="number" min="0" step="0.01" required class="input-field pl-7" :style="inputStyle" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 mt-3">
            <div>
              <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('invoices.discount') }}</label>
              <div class="relative mt-1">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-text-secondary);">$</span>
                <input v-model.number="form.discountAmount" type="number" min="0" step="0.01" class="input-field pl-7" :style="inputStyle" />
              </div>
            </div>
            <div>
              <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('invoices.tax') }}</label>
              <div class="relative mt-1">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-text-secondary);">$</span>
                <input v-model.number="form.taxAmount" type="number" min="0" step="0.01" class="input-field pl-7" :style="inputStyle" />
              </div>
            </div>
            <div>
              <label class="text-sm" style="color: var(--color-text-secondary);">{{ t('invoices.lateFee') }}</label>
              <div class="relative mt-1">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-text-secondary);">$</span>
                <input v-model.number="form.lateFee" type="number" min="0" step="0.01" class="input-field pl-7" :style="inputStyle" />
              </div>
            </div>
          </div>
        </div>

        <!-- Summary card -->
        <div class="rounded-xl px-4 py-3 flex items-center justify-between" style="background-color: var(--color-bg);">
          <span class="text-sm font-medium" style="color: var(--color-text-secondary);">{{ t('invoices.summary') }}</span>
          <span class="text-lg font-bold" style="color: var(--color-primary);">${{ computedTotal.toFixed(2) }}</span>
        </div>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold hover:opacity-80"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="modalOpen = false"
          >{{ t('invoices.cancel') }}</button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? t('invoices.saving') : t('invoices.save') }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Printable receipt (teleported to <body>, only rendered while printing) -->
    <InvoicePrintSheet
      v-if="printData"
      :invoice="printData.invoice"
      :vehicle="printData.vehicle"
      :cashier="printData.cashier"
      :customer="printData.customer"
      :rental="printData.rental"
      :paper="printData.paper"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { usePrintInvoice } from '@/composables/usePrintInvoice'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import InvoicePrintSheet from '@/components/ui/InvoicePrintSheet.vue'
import useAuthStore from '@/stores/auth.store'
import invoiceService from '@/services/invoice.service'
import api from '@/services/api'

const { t, te } = useI18n()
const { isDark } = useTheme()
const { printData, printInvoice } = usePrintInvoice()

// Translate with a fallback so a missing key never shows "invoices.xxx" on screen.
const tr = (key, fallback) => (te(key) ? t(key) : fallback)

const columns = computed(() => [
  { key: 'invoiceNumber', label: t('invoices.invoiceNumber') },
  { key: 'rentalId', label: t('invoices.rental') },
  { key: 'issueDate', label: t('invoices.issued') },
  { key: 'dueDate', label: t('invoices.due') },
  { key: 'totalAmount', label: t('invoices.total') },
  { key: 'status', label: t('invoices.status') },
])

const statusOptions = ['UNPAID', 'PAID', 'CANCELLED']

function statusLabel(status) {
  const map = { UNPAID: t('invoices.unpaid'), PAID: t('invoices.paid'), CANCELLED: t('invoices.cancelled') }
  return map[status] ?? status
}

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    UNPAID: 'bg-amber-100 text-amber-700',
    PAID: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-600',
  }
  return `${base} ${map[status] || 'bg-gray-100 text-gray-500'}`
}

function isOverdue(row) {
  return row.status === 'UNPAID' && row.dueDate && new Date(row.dueDate) < new Date()
}

const inputStyle = computed(() => ({
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
  colorScheme: isDark.value ? 'dark' : 'light',
}))

const invoices = ref([])
const rentals = ref([])
const vehicles = ref([])
const loading = ref(true)
const actionError = ref('')
const search = ref('')
const statusFilter = ref('ALL')

const modalOpen = ref(false)
const saving = ref(false)
const saveError = ref('')

function emptyForm() {
  return { rentalId: '', dueDate: '', subtotal: null, discountAmount: 0, taxAmount: 0, lateFee: 0 }
}

const form = reactive(emptyForm())

const computedTotal = computed(() => {
  const subtotal = Number(form.subtotal) || 0
  const discount = Number(form.discountAmount) || 0
  const tax = Number(form.taxAmount) || 0
  const lateFee = Number(form.lateFee) || 0
  return subtotal - discount + tax + lateFee
})

const counts = computed(() => {
  const unpaid = invoices.value.filter((i) => i.status === 'UNPAID').length
  const paid = invoices.value.filter((i) => i.status === 'PAID').length
  const overdue = invoices.value.filter(isOverdue).length
  return { unpaid, paid, overdue }
})

const filtered = computed(() => {
  let list = invoices.value
  if (statusFilter.value !== 'ALL') {
    list = list.filter((i) => i.status === statusFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      (i) =>
        i.invoiceNumber?.toLowerCase().includes(q) ||
        String(i.rentalId).includes(q)
    )
  }
  return list
})

// ----- Pagination (client-side, applied after search + status filter) -----
const page = ref(1)
const pageSize = ref(10)
const pageSizes = [10, 20, 50]

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
const rangeFrom = computed(() => (filtered.value.length === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeTo = computed(() => Math.min(page.value * pageSize.value, filtered.value.length))

// 1 … 4 5 6 … 9
const pageButtons = computed(() => {
  const total = totalPages.value
  const cur = page.value
  const nums = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
})

// Back to page 1 whenever the result set changes shape
watch([search, statusFilter, pageSize], () => {
  page.value = 1
})
// Stay in range after deleting the last row on a page
watch(totalPages, (n) => {
  if (page.value > n) page.value = n
})

// Only COMPLETED rentals that don't already have an invoice
const eligibleRentals = computed(() => {
  const invoicedRentalIds = new Set(invoices.value.map((i) => i.rentalId))
  return rentals.value.filter(
    (r) => r.status === 'COMPLETED' && !invoicedRentalIds.has(r.id)
  )
})

function vehicleLabel(id) {
  const v = vehicles.value.find((x) => x.id === id)
  return v ? `${v.brandName ?? v.brand} ${v.model}` : `#${id}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

async function loadInvoices() {
  loading.value = true
  actionError.value = ''
  try {
    const { data } = await invoiceService.getAll()
    invoices.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    actionError.value = t('invoices.loadError')
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

function openCreate() {
  Object.assign(form, emptyForm())
  saveError.value = ''
  modalOpen.value = true
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    await invoiceService.create({
      rentalId: form.rentalId,
      dueDate: form.dueDate || null,
      subtotal: form.subtotal,
      discountAmount: form.discountAmount || 0,
      taxAmount: form.taxAmount || 0,
      lateFee: form.lateFee || 0,
    })
    modalOpen.value = false
    await loadInvoices()
  } catch (err) {
    saveError.value = err.response?.data?.message || t('invoices.saveError')
  } finally {
    saving.value = false
  }
}

async function onStatusChange(row, newStatus) {
  actionError.value = ''
  try {
    await invoiceService.update(row.id, {
      rentalId: row.rentalId,
      dueDate: row.dueDate,
      subtotal: row.subtotal,
      discountAmount: row.discountAmount,
      taxAmount: row.taxAmount,
      lateFee: row.lateFee,
      status: newStatus,
    })
    await loadInvoices()
  } catch (err) {
    actionError.value = err.response?.data?.message || t('invoices.statusError')
  }
}

async function onDelete(row) {
  if (!confirm(`${t('invoices.confirmDelete')} ${row.invoiceNumber}?`)) return
  try {
    await invoiceService.delete(row.id)
    await loadInvoices()
  } catch {
    actionError.value = t('invoices.deleteError')
  }
}

// Logged-in admin/staff = cashier printed on the receipt
const { state: authState } = useAuthStore()
const cashierName = computed(() => {
  const u = authState.user
  const full = [u?.firstName, u?.lastName].filter(Boolean).join(' ')
  return full || u?.email || ''
})

// The backend now returns customerName / customerEmail / customerPhone
// directly on the invoice and rental, so prefer those; fall back to a
// nested customer/user object just in case.
function customerFor(row, rental) {
  const c = row?.customer ?? rental?.customer ?? rental?.user ?? {}
  const pick = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== '') ?? ''
  return {
    name: pick(
      row?.customerName, rental?.customerName, c.fullName, c.name,
      [c.firstName, c.lastName].filter(Boolean).join(' '),
    ),
    email: pick(row?.customerEmail, rental?.customerEmail, c.email),
    phone: pick(row?.customerPhone, rental?.customerPhone, c.phoneNumber, c.phone),
  }
}

// paper: 'receipt' = thermal receipt printer, 'a4' = A4 invoice (good for saving as PDF)
function onPrint(row, paper = 'receipt') {
  const rental = rentals.value.find((r) => r.id === row.rentalId)
  printInvoice(row, {
    vehicle: rental ? vehicleLabel(rental.vehicleId) : '',
    cashier: cashierName.value,
    customer: customerFor(row, rental),
    rental: rental
      ? { pickUpDateTime: rental.pickUpDateTime, expectedReturnDateTime: rental.expectedReturnDateTime }
      : null,
    paper,
  })
}

onMounted(() => {
  loadInvoices()
  loadRentals()
  loadVehicles()
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