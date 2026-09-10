<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <RouterLink to="/my-invoices" class="text-sm font-medium text-[#3D5FE0] hover:text-[#3350C0]">
      ← Back to invoices
    </RouterLink>

    <div v-if="loading" class="mt-6 h-64 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>

    <div v-else-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ errorMessage }}
    </div>

    <template v-else-if="invoice">
      <div class="mt-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-[#1A2036]">Invoice #{{ invoice.id }}</h1>
        <span :class="statusBadgeClass(invoice.status)">{{ invoice.status }}</span>
      </div>

      <!-- Line items -->
      <article class="mt-6 overflow-hidden rounded-2xl border border-[#E5E7EB]">
        <div class="p-5 space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-[#6B7280]">Rental price</span>
            <span class="text-[#1A2036]">{{ formatCurrency(invoice.rentalPrice) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-[#6B7280]">Insurance</span>
            <span class="text-[#1A2036]">{{ formatCurrency(invoice.insuranceFee) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-[#6B7280]">Additional services</span>
            <span class="text-[#1A2036]">{{ formatCurrency(invoice.servicesTotal) }}</span>
          </div>
          <div v-if="invoice.discountAmount" class="flex justify-between text-sm">
            <span class="text-[#6B7280]">Discount</span>
            <span class="text-red-600">−{{ formatCurrency(invoice.discountAmount) }}</span>
          </div>

          <div class="border-t border-[#E5E7EB] pt-3 flex justify-between">
            <span class="font-semibold text-[#1A2036]">Total</span>
            <span class="font-bold text-[#1A2036]">{{ formatCurrency(invoice.total) }}</span>
          </div>
          <div v-if="invoice.depositAmount" class="flex justify-between text-sm">
            <span class="text-[#6B7280]">Deposit paid</span>
            <span class="text-[#1A2036]">{{ formatCurrency(invoice.depositAmount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-[#6B7280]">Remaining balance</span>
            <span class="font-semibold text-[#1A2036]">{{ formatCurrency(remaining) }}</span>
          </div>
        </div>
      </article>

      <!-- Payment section -->
      <div v-if="invoice.status?.toUpperCase() !== 'PAID'" class="mt-6">
        <button
          v-if="!qrData"
          type="button"
          :disabled="generatingQr"
          class="w-full rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
          @click="onGenerateQr"
        >
          {{ generatingQr ? 'Generating QR…' : 'Pay with Bakong' }}
        </button>

        <div v-else class="rounded-2xl border border-[#E5E7EB] p-6 text-center">
          <p class="text-sm font-semibold text-[#1A2036]">Scan with Bakong app</p>
          <img
            v-if="qrData.qrImage || qrData.qrCode"
            :src="qrData.qrImage || qrData.qrCode"
            alt="Bakong QR code"
            class="mx-auto mt-4 h-56 w-56"
          />
          <p class="mt-4 text-xs text-[#9CA3AF]">
            {{ polling ? 'Checking payment status…' : 'Waiting for payment' }}
          </p>
        </div>

        <p v-if="paymentError" class="mt-3 text-sm text-red-600">{{ paymentError }}</p>
      </div>

      <div v-else class="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
        This invoice has been paid in full.
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import invoicesApi from '@/services/invoices'

const route = useRoute()

const invoice = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const qrData = ref(null)
const generatingQr = ref(false)
const polling = ref(false)
const paymentError = ref('')
let pollTimer = null

const remaining = computed(() => {
  if (!invoice.value) return 0
  const total = invoice.value.total ?? 0
  const deposit = invoice.value.depositAmount ?? 0
  return Math.max(total - deposit, 0)
})

function formatCurrency(value) {
  if (value === undefined || value === null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function statusBadgeClass(status) {
  const base = 'inline-block rounded-full px-3 py-1 text-xs font-semibold'
  switch ((status || '').toUpperCase()) {
    case 'PAID':
      return `${base} bg-green-100 text-green-700`
    case 'OVERDUE':
      return `${base} bg-red-100 text-red-600`
    default:
      return `${base} bg-yellow-100 text-yellow-700`
  }
}

async function onGenerateQr() {
  generatingQr.value = true
  paymentError.value = ''
  try {
    const { data } = await invoicesApi.generateQr(invoice.value.id)
    qrData.value = data
    startPolling()
  } catch (err) {
    paymentError.value = err.response?.data?.message || 'Could not generate the payment QR code.'
  } finally {
    generatingQr.value = false
  }
}

function startPolling() {
  polling.value = true
  pollTimer = setInterval(async () => {
    try {
      const { data } = await invoicesApi.checkPayment(invoice.value.id)
      // NOTE: confirm actual field name for payment success (e.g. `status`,
      // `paid`, `success`) against the backend response.
      if (data?.status === 'PAID' || data?.paid === true) {
        clearInterval(pollTimer)
        polling.value = false
        invoice.value.status = 'PAID'
        qrData.value = null
      }
    } catch (err) {
      // Silently retry — a transient network error shouldn't stop polling.
    }
  }, 4000)
}

onMounted(async () => {
  try {
    const { data } = await invoicesApi.getById(route.params.id)
    invoice.value = data
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Could not load this invoice.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>