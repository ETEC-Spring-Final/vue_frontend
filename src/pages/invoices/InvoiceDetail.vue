<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-2xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <RouterLink to="/my-invoices" class="text-sm font-medium transition-opacity hover:opacity-70" :style="{ color: 'var(--color-primary)' }">
        ← {{ $t('invoices.backToInvoices') }}
      </RouterLink>

      <div v-if="loading" class="mt-6 h-64 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>

      <div v-else-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {{ errorMessage }}
      </div>

      <Transition name="fade">
        <template v-if="invoice">
          <div class="mt-6">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('invoices.invoiceNumber') }}{{ invoice.invoiceNumber || invoice.id }}</h1>
              <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold" :style="statusStyle(invoice.status)">{{ invoice.status }}</span>
            </div>

            <article class="mt-6 overflow-hidden rounded-2xl border transition-shadow duration-200 hover:shadow-sm" :style="{ borderColor: 'var(--color-border)' }">
              <div class="space-y-3 p-5">
                <div class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ $t('invoices.subtotal') }}</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.subtotal) }}</span>
                </div>
                <div v-if="Number(invoice.additionalServicesTotal)" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ tr('invoices.additionalServices', 'Additional services') }}</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.additionalServicesTotal) }}</span>
                </div>
                <div v-if="Number(invoice.discountAmount)" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ $t('invoices.discount') }}</span>
                  <span class="text-red-600">−{{ formatCurrency(invoice.discountAmount) }}</span>
                </div>
                <div v-if="Number(invoice.taxAmount)" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ $t('invoices.tax') }}</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.taxAmount) }}</span>
                </div>
                <div v-if="Number(invoice.lateFee)" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ $t('invoices.lateFee') }}</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.lateFee) }}</span>
                </div>
                <div class="flex justify-between border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
                  <span class="font-semibold" :style="{ color: 'var(--color-text)' }">{{ $t('invoices.total') }}</span>
                  <span class="font-bold" :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.totalAmount) }}</span>
                </div>
              </div>
            </article>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button" :disabled="downloading" @click="onDownloadInvoice"
                class="flex-1 rounded-full py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                :style="{ backgroundColor: 'var(--color-primary)' }"
              >
                {{ downloading ? $t('invoices.downloading') : $t('invoices.downloadInvoice') }}
              </button>
              <button
                type="button" @click="printInvoice(invoice)"
                class="flex-1 rounded-full border py-3.5 text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
              >
                {{ tr('invoices.print', 'Print') }}
              </button>
              <button
                type="button" @click="onShareInvoice"
                class="flex-1 rounded-full border py-3.5 text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
              >
                {{ $t('invoices.share') }}
              </button>
            </div>

            <div v-if="invoice.status?.toUpperCase() !== 'PAID'" class="mt-6">
              <RouterLink
                :to="`/payment/${invoice.id}`"
                class="block w-full rounded-full py-3.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
                :style="{ backgroundColor: 'var(--color-primary)' }"
              >
                {{ $t('invoices.payWithBakong') }}
              </RouterLink>
            </div>

            <div v-else class="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
              {{ $t('invoices.paidInFull') }}
            </div>
          </div>
        </template>
      </Transition>
    </div>

    <SiteFooter />

    <!-- Printable A4 sheet (teleported to <body>, only rendered while printing) -->
    <InvoicePrintSheet v-if="printData" :invoice="printData.invoice" :customer="customerDetails" :rental="rentalInfo" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import invoicesApi from '@/services/invoices'
import api from '@/services/api'
import { usePrintInvoice } from '@/composables/usePrintInvoice'
import useAuthStore from '@/stores/auth.store'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import InvoicePrintSheet from '@/components/ui/InvoicePrintSheet.vue'

const route = useRoute()
const { t, te } = useI18n()
const { printData, printInvoice } = usePrintInvoice()

// Translate with a fallback so a missing key never shows "invoices.xxx" on screen.
const tr = (key, fallback) => (te(key) ? t(key) : fallback)

// On this page the logged-in user is the customer. Prefer the customer
// info the backend now returns directly on the invoice; fall back to the
// logged-in user's own profile if it's ever missing.
const { state: authState } = useAuthStore()
const customerDetails = computed(() => {
  const i = invoice.value ?? {}
  const u = authState.user ?? {}
  return {
    name: i.customerName || [u.firstName, u.lastName].filter(Boolean).join(' '),
    email: i.customerEmail || u.email || '',
    phone: i.customerPhone || u.phoneNumber || u.phone || '',
  }
})

const invoice = ref(null)
const rentalInfo = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const downloading = ref(false)

function invoiceLink() {
  return `${window.location.origin}/my-invoices/${invoice.value?.id ?? ''}`
}

async function onDownloadInvoice() {
  if (!invoice.value || downloading.value) return
  downloading.value = true
  errorMessage.value = ''
  try {
    const res = await invoicesApi.downloadPdf(invoice.value.id)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoice.value.invoiceNumber || invoice.value.id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || t('payment.downloadError')
  } finally {
    downloading.value = false
  }
}

async function onShareInvoice() {
  if (!invoice.value) return
  const link = invoiceLink()
  const shareData = {
    title: t('payment.shareTitle', { invoice: invoice.value.invoiceNumber || invoice.value.id }),
    text: t('payment.shareText', { invoice: invoice.value.invoiceNumber || invoice.value.id }),
    url: link,
  }
  try {
    if (navigator.share) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(link)
    errorMessage.value = ''
    window.alert(t('payment.linkCopied'))
  } catch {
    window.prompt(t('payment.copyLink'), link)
  }
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function statusStyle(status) {
  switch ((status || '').toUpperCase()) {
    case 'PAID':
      return { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }
    case 'CANCELLED':
      return { backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }
    default:
      return { backgroundColor: 'rgba(234,179,8,0.14)', color: '#CA8A04' }
  }
}

onMounted(async () => {
  try {
    const { data } = await invoicesApi.getById(route.params.id)
    invoice.value = data

    // Fetch the rental too, just to get pickUpDateTime / expectedReturnDateTime
    // so the printed sheet can show a day count.
    if (data?.rentalId) {
      try {
        const { data: rental } = await api.get(`/rentals/${data.rentalId}`)
        rentalInfo.value = {
          pickUpDateTime: rental.pickUpDateTime,
          expectedReturnDateTime: rental.expectedReturnDateTime,
        }
      } catch {
        rentalInfo.value = null
      }
    }
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>