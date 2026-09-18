<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-2xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <RouterLink to="/my-invoices" class="text-sm font-medium transition-opacity hover:opacity-70" :style="{ color: 'var(--color-primary)' }">
        ← Back to invoices
      </RouterLink>

      <div v-if="loading" class="mt-6 h-64 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>

      <div v-else-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
        {{ errorMessage }}
      </div>

      <Transition name="fade">
        <template v-if="invoice">
          <div class="mt-6">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">Invoice #{{ invoice.id }}</h1>
              <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold" :style="statusStyle(invoice.status)">{{ invoice.status }}</span>
            </div>

            <article class="mt-6 overflow-hidden rounded-2xl border transition-shadow duration-200 hover:shadow-sm" :style="{ borderColor: 'var(--color-border)' }">
              <div class="space-y-3 p-5">
                <div class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">Rental price</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.rentalPrice) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">Insurance</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.insuranceFee) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">Additional services</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.servicesTotal) }}</span>
                </div>
                <div v-if="invoice.discountAmount" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">Discount</span>
                  <span class="text-red-600">−{{ formatCurrency(invoice.discountAmount) }}</span>
                </div>

                <div class="flex justify-between border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
                  <span class="font-semibold" :style="{ color: 'var(--color-text)' }">Total</span>
                  <span class="font-bold" :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.total) }}</span>
                </div>
                <div v-if="invoice.depositAmount" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">Deposit paid</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.depositAmount) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">Remaining balance</span>
                  <span class="font-semibold" :style="{ color: 'var(--color-text)' }">{{ formatCurrency(remaining) }}</span>
                </div>
              </div>
            </article>

            <div v-if="invoice.status?.toUpperCase() !== 'PAID'" class="mt-6">
              <button
                v-if="!qrData" type="button" :disabled="generatingQr"
                class="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                :style="{ backgroundColor: 'var(--color-primary)' }"
                @click="onGenerateQr"
              >
                {{ generatingQr ? 'Generating QR…' : 'Pay with Bakong' }}
              </button>

              <div v-else class="rounded-2xl border p-6 text-center" :style="{ borderColor: 'var(--color-border)' }">
                <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">Scan with Bakong app</p>
                <img
                  v-if="qrData.qrImage || qrData.qrCode"
                  :src="qrData.qrImage || qrData.qrCode" alt="Bakong QR code"
                  class="mx-auto mt-4 h-56 w-56 rounded-xl border" :style="{ borderColor: 'var(--color-border)' }"
                />
                <p class="mt-4 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  {{ polling ? 'Checking payment status…' : 'Waiting for payment' }}
                </p>
              </div>

              <Transition name="fade">
                <p v-if="paymentError" class="mt-3 text-sm text-red-600">{{ paymentError }}</p>
              </Transition>
            </div>

            <div v-else class="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
              This invoice has been paid in full.
            </div>
          </div>
        </template>
      </Transition>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import invoicesApi from '@/services/invoices'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'

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

function statusStyle(status) {
  switch ((status || '').toUpperCase()) {
    case 'PAID':
      return { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }
    case 'OVERDUE':
      return { backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }
    default:
      return { backgroundColor: 'rgba(234,179,8,0.14)', color: '#CA8A04' }
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
      if (data?.status === 'PAID' || data?.paid === true) {
        clearInterval(pollTimer)
        polling.value = false
        invoice.value.status = 'PAID'
        qrData.value = null
      }
    } catch (err) {
      // Silently retry
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

<style scoped>
@keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-page-in { animation: page-in 0.35s ease-out; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>