<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-4xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ $t('invoices.myInvoices') }}</h1>
      <p class="mt-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('invoices.myInvoicesSub') }}</p>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 space-y-3">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {{ errorMessage }}
      </div>

      <!-- Empty -->
      <div v-else-if="invoices.length === 0" class="mt-16 flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105" :style="{ backgroundColor: 'var(--color-primary-light)' }">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6" :style="{ color: 'var(--color-primary)' }">
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M6 3h9l3 3v15H6V3Zm3 6h6M9 12h6M9 15h4"/>
          </svg>
        </div>
        <p class="mt-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('invoices.noInvoices') }}</p>
      </div>

      <template v-else>
        <!-- List -->
        <TransitionGroup tag="div" name="card" class="mt-8 space-y-4">
          <article
            v-for="invoice in paged" :key="invoice.id"
            class="overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:shadow-sm"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('invoices.invoiceNumber') }}{{ invoice.invoiceNumber || invoice.id }}</p>
                <p class="mt-1 text-lg font-bold" :style="{ color: 'var(--color-text)' }">
                  {{ formatCurrency(invoice.total ?? invoice.totalAmount) }}
                </p>
                <p v-if="invoice.dueDate" class="mt-0.5 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  {{ $t('invoices.due') }} {{ formatDate(invoice.dueDate) }}
                </p>
              </div>

              <div class="flex items-center gap-3">
                <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold" :style="statusStyle(invoice.status)">
                  {{ invoice.status }}
                </span>
                <RouterLink
                  :to="`/my-invoices/${invoice.id}`"
                  class="rounded-full px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-sm active:scale-95"
                  :style="{ backgroundColor: 'var(--color-primary)' }"
                >
                  {{ $t('invoices.view') }}
                </RouterLink>
              </div>
            </div>
          </article>
        </TransitionGroup>

        <!-- Pagination (only when there is more than one page) -->
        <div
          v-if="totalPages > 1"
          class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"
          :style="{ color: 'var(--color-text-secondary)' }"
        >
          <span>{{ rangeFrom }}–{{ rangeTo }} {{ tr('invoices.of', 'of') }} {{ invoices.length }}</span>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
              :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
              :disabled="page === 1"
              @click="goTo(page - 1)"
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
                @click="goTo(b)"
              >{{ b }}</button>
            </template>

            <button
              type="button"
              class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
              :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
              :disabled="page >= totalPages"
              @click="goTo(page + 1)"
            >{{ tr('invoices.next', 'Next') }}</button>
          </div>
        </div>
      </template>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import invoicesApi from '@/services/invoices'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

const { t, te } = useI18n()

// Translate with a fallback so a missing key never shows "invoices.xxx" on screen.
const tr = (key, fallback) => (te(key) ? t(key) : fallback)

const invoices = ref([])
const loading = ref(true)
const errorMessage = ref('')

// ----- Pagination (client-side: /invoices/my returns the full list) -----
const PAGE_SIZE = 6
const page = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(invoices.value.length / PAGE_SIZE)))
const paged = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return invoices.value.slice(start, start + PAGE_SIZE)
})
const rangeFrom = computed(() => (invoices.value.length === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1))
const rangeTo = computed(() => Math.min(page.value * PAGE_SIZE, invoices.value.length))

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

function goTo(n) {
  page.value = Math.min(Math.max(1, n), totalPages.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Backend statuses are UNPAID / PAID / CANCELLED (OVERDUE/PENDING kept for safety)
function statusStyle(status) {
  switch ((status || '').toUpperCase()) {
    case 'PAID':
      return { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }
    case 'CANCELLED':
    case 'OVERDUE':
      return { backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }
    case 'UNPAID':
    case 'PENDING':
    default:
      return { backgroundColor: 'rgba(234,179,8,0.14)', color: '#CA8A04' }
  }
}

onMounted(async () => {
  try {
    const { data } = await invoicesApi.myInvoices()
    invoices.value = Array.isArray(data) ? data : data?.content ?? []
  } catch (err) {
    errorMessage.value = err.response?.data?.message || t('invoices.loadError')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-page-in { animation: page-in 0.35s ease-out; }
.card-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.card-enter-from { opacity: 0; transform: translateY(16px); }
.card-move { transition: transform 0.3s ease; }
@media (prefers-reduced-motion: reduce) {
  .animate-page-in { animation: none; }
}
</style>