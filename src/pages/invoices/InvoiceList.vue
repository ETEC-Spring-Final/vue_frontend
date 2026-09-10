<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-[#1A2036]">My Invoices</h1>
    <p class="mt-1 text-sm text-[#6B7280]">Track payments for your rentals.</p>

    <!-- Loading -->
    <div v-if="loading" class="mt-8 space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ errorMessage }}
    </div>

    <!-- Empty -->
    <div v-else-if="invoices.length === 0" class="mt-16 text-center">
      <p class="text-sm text-[#6B7280]">You don't have any invoices yet.</p>
    </div>

    <!-- List -->
    <div v-else class="mt-8 space-y-4">
      <article
        v-for="invoice in invoices"
        :key="invoice.id"
        class="overflow-hidden rounded-2xl border border-[#E5E7EB] p-5 transition hover:border-[#3D5FE0]/40"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase text-[#9CA3AF]">Invoice #{{ invoice.id }}</p>
            <p class="mt-1 text-lg font-bold text-[#1A2036]">
              {{ formatCurrency(invoice.total ?? invoice.totalAmount) }}
            </p>
            <p v-if="invoice.dueDate" class="mt-0.5 text-xs text-[#9CA3AF]">
              Due {{ formatDate(invoice.dueDate) }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <span :class="statusBadgeClass(invoice.status)">
              {{ invoice.status }}
            </span>
            <RouterLink
              :to="`/my-invoices/${invoice.id}`"
              class="rounded-full bg-[#3D5FE0] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3350C0]"
            >
              View
            </RouterLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import invoicesApi from '@/services/invoices'

const invoices = ref([])
const loading = ref(true)
const errorMessage = ref('')

function formatCurrency(value) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// NOTE: confirm exact enum values against InvoiceStatusEnum on the backend
// (AGENTS.md lists it under backend enums but doesn't spell out the values).
function statusBadgeClass(status) {
  const base = 'inline-block rounded-full px-3 py-1 text-xs font-semibold'
  switch ((status || '').toUpperCase()) {
    case 'PAID':
      return `${base} bg-green-100 text-green-700`
    case 'OVERDUE':
      return `${base} bg-red-100 text-red-600`
    case 'PENDING':
    default:
      return `${base} bg-yellow-100 text-yellow-700`
  }
}

onMounted(async () => {
  try {
    const { data } = await invoicesApi.myInvoices()
    invoices.value = Array.isArray(data) ? data : data?.content ?? []
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Could not load your invoices.'
  } finally {
    loading.value = false
  }
})
</script>