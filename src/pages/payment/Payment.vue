<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import invoicesApi from "@/services/invoices";
import useSiteSettingsStore from "@/stores/siteSettings.store";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const siteSettings = useSiteSettingsStore();

const invoice = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const qrData = ref(null);
const qrImageUrl = ref("");
const generatingQr = ref(false);
const polling = ref(false);
const confirming = ref(false);
const paymentError = ref("");
let pollTimer = null;

const md5 = computed(() => qrData.value?.md5 || "");

const isPaid = computed(() => (invoice.value?.status || "").toUpperCase() === "PAID");

// B1 — payment method cards (VISA/ABA_PAY "coming soon", KHQR + CASH active).
const paymentMethod = ref("KHQR");
const cashChosen = ref(false);
const confirmingCash = ref(false);
const cashConfirmed = ref(false);
const upcomingOnly = ["VISA", "ABA_PAY"];

function onSelectMethod(method) {
  if (upcomingOnly.includes(method)) return;
  paymentMethod.value = method;
  if (method === "CASH") {
    stopPolling();
    if (qrImageUrl.value) URL.revokeObjectURL(qrImageUrl.value);
    qrData.value = null;
    qrImageUrl.value = "";
    cashChosen.value = true;
    paymentError.value = "";
    return;
  }
  // KHQR -> resume the existing QR flow
  cashChosen.value = false;
  cashConfirmed.value = false;
  if (!qrData.value) onGenerateQr();
}

// Records the CASH intent on the invoice (stays UNPAID until staff mark it PAID).
async function onConfirmCash() {
  confirmingCash.value = true;
  paymentError.value = "";
  try {
    await invoicesApi.setPaymentMethod(invoice.value.id, "CASH");
    invoice.value = { ...invoice.value, paymentMethod: "CASH" };
    cashConfirmed.value = true;
    setTimeout(() => router.push("/my-reservations"), 1400);
  } catch (err) {
    paymentError.value = err?.response?.data?.message || t("payment.methodError");
  } finally {
    confirmingCash.value = false;
  }
}

// B4 — Download Invoice (PDF)
async function onDownloadInvoice() {
  try {
    const res = await invoicesApi.downloadPdf(invoice.value.id);
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const name = `invoice-${invoice.value.invoiceNumber || invoice.value.id}.pdf`;
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (err) {
    paymentError.value = err?.response?.data?.message || t("payment.downloadError");
  }
}

// B4 — Share (PDF) with fallback to "Copy link".
function invoiceLink() {
  return `${window.location.origin}/my-invoices/${invoice.value.id}`;
}

async function onShareInvoice() {
  const shareData = {
    title: t("payment.shareTitle"),
    text: t("payment.shareText", { invoice: invoice.value.invoiceNumber || invoice.value.id }),
    url: invoiceLink(),
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (e) {
      if (e?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(invoiceLink());
    paymentError.value = t("payment.linkCopied");
  } catch {
    window.prompt(t("payment.copyLink"), invoiceLink());
  }
}

function formatCurrency(value) {
  if (value === undefined || value === null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function statusStyle(status) {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return { backgroundColor: "rgba(34,197,94,0.12)", color: "#22C55E" };
    case "CANCELLED":
      return { backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444" };
    default:
      return { backgroundColor: "rgba(234,179,8,0.14)", color: "#CA8A04" };
  }
}

async function onGenerateQr() {
  generatingQr.value = true;
  paymentError.value = "";
  try {
    const payload = {
      currency: "USD",
      amount: Number(invoice.value.totalAmount ?? 0),
      billNumber: invoice.value.invoiceNumber ?? `INV-${invoice.value.id}`,
      storeLabel: siteSettings.state.siteName || "CarRental",
    };
    const { data } = await invoicesApi.generateQr(payload);
    const qrInfo = data?.data || null;
    qrData.value = qrInfo;
    if (!qrInfo || !qrInfo.qr) {
      paymentError.value = data?.KHQRStatus?.message || t("payment.qrError");
      return;
    }
    const img = await invoicesApi.qrImage({ qr: qrInfo.qr, md5: qrInfo.md5 });
    if (img.data instanceof Blob && img.data.size > 0) {
      qrImageUrl.value = URL.createObjectURL(img.data);
    } else {
      paymentError.value = t("payment.qrError");
      return;
    }
    startPolling();
  } catch (err) {
    paymentError.value = await extractErrorMessage(err) || t("payment.qrError");
  } finally {
    generatingQr.value = false;
  }
}

async function extractErrorMessage(err) {
  const data = err?.response?.data;
  if (data == null) return err?.message || "";
  if (typeof data === "string") return data.trim();
  if (data instanceof Blob) return (await data.text()).trim();
  return data?.message || "";
}

function startPolling() {
  polling.value = true;
  pollTimer = setInterval(async () => {
    try {
      const { data } = await invoicesApi.checkTransaction(md5.value);
      if (Number(data?.responseCode) === 0) {
        clearInterval(pollTimer);
        pollTimer = null;
        polling.value = false;
        await onConfirmPayment();
      }
    } catch {
      // Transaction not settled yet — keep polling.
    }
  }, 4000);
}

async function onConfirmPayment() {
  confirming.value = true;
  paymentError.value = "";
  try {
    const { data } = await invoicesApi.confirmPayment(invoice.value.id, md5.value);
    invoice.value = data ?? { ...invoice.value, status: "PAID" };
    stopPolling();
    if (qrImageUrl.value) URL.revokeObjectURL(qrImageUrl.value);
    setTimeout(() => router.push({ path: "/my-reservations" }), 1600);
  } catch (err) {
    paymentError.value = err?.response?.data?.message || t("payment.confirmError");
  } finally {
    confirming.value = false;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await invoicesApi.getById(route.params.invoiceId);
    invoice.value = data;
    if (data?.paymentMethod) paymentMethod.value = data.paymentMethod;
    if (paymentMethod.value === "CASH") {
      cashChosen.value = true;
      return;
    }
    if (!isPaid.value) {
      await onGenerateQr();
    }
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || t("payment.loadError");
  } finally {
    loading.value = false;
  }
});

onUnmounted(stopPolling);
</script>

<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-2xl animate-page-in px-4 py-6 sm:px-6 lg:px-8">
      <RouterLink to="/my-reservations" class="text-sm font-medium transition-opacity hover:opacity-70" :style="{ color: 'var(--color-primary)' }">
        ← {{ t('payment.backToReservations') }}
      </RouterLink>

      <h1 class="mt-6 text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ t('payment.title') }}</h1>

      <!-- Loading -->
      <div v-if="loading" class="mt-6 h-64 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>

      <!-- Error loading invoice -->
      <div v-else-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
        {{ errorMessage }}
      </div>

      <Transition name="fade">
        <template v-if="invoice">
          <div class="mt-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-secondary)' }">
                {{ t('payment.invoice') }} #{{ invoice.invoiceNumber || invoice.id }}
              </p>
              <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold" :style="statusStyle(invoice.status)">{{ invoice.status }}</span>
            </div>

            <!-- Summary -->
            <article class="mt-4 overflow-hidden rounded-2xl border transition-shadow duration-200 hover:shadow-sm" :style="{ borderColor: 'var(--color-border)' }">
              <div class="space-y-3 p-5">
                <div class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.subtotal') }}</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.subtotal) }}</span>
                </div>
                <div v-if="Number(invoice.discountAmount)" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.discount') }}</span>
                  <span class="text-red-600">−{{ formatCurrency(invoice.discountAmount) }}</span>
                </div>
                <div v-if="Number(invoice.taxAmount)" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.tax') }}</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.taxAmount) }}</span>
                </div>
                <div v-if="Number(invoice.lateFee)" class="flex justify-between text-sm">
                  <span :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.lateFee') }}</span>
                  <span :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.lateFee) }}</span>
                </div>
                <div class="flex justify-between border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
                  <span class="font-semibold" :style="{ color: 'var(--color-text)' }">{{ t('payment.total') }}</span>
                  <span class="font-bold" :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.totalAmount) }}</span>
                </div>
              </div>
            </article>

            <!-- Not yet paid -> choose payment method -->
            <div v-if="!isPaid" class="mt-6">
              <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ t('payment.chooseMethod') }}</p>

              <!-- Method cards -->
              <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                  v-for="m in ['VISA', 'ABA_PAY', 'KHQR', 'CASH']" :key="m" type="button"
                  class="group rounded-2xl border p-4 text-center transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="upcomingOnly.includes(m)"
                  :style="paymentMethod === m
                    ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' }
                    : { borderColor: 'var(--color-border)' }"
                  @click="onSelectMethod(m)"
                >
                  <span class="mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
                    :style="{ backgroundColor: paymentMethod === m ? 'var(--color-primary)' : 'var(--color-border)', color: paymentMethod === m ? '#fff' : 'var(--color-text-secondary)' }">
                    <svg v-if="m === 'CASH'" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm2 0v12h16V6H4Zm3 8a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H7Zm10-1a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-3-1a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
                    </svg>
                    <svg v-else-if="m === 'KHQR'" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 3h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 3v2h2V6H5Zm4 10h2v2h4v2h-4a2 2 0 0 1-2-2v-2Zm8 0a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v-2h2v-2h-2v-2h2Zm-6 0h2v2h-2v-2ZM9 3v2h2V3h-2Zm6-2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4V9h4V3h-2V1h2ZM3 15h4v2H3v-2Zm0 4h4v2H3v-2Zm16-4h2v2h-2v-2Zm0 4h2v2h-2v-2Z" />
                    </svg>
                    <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a4 4 0 0 1 4 4v2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a4 4 0 0 1 4-4Zm-2 6h4V6a2 2 0 1 0-4 0v2Zm-2 6h8v-2H8v2Zm0 4h8v-2H8v2Z" />
                    </svg>
                  </span>
                  <span class="mt-2 block text-xs font-semibold" :style="{ color: paymentMethod === m ? 'var(--color-primary)' : 'var(--color-text)' }">{{ t(`payment.methods.${m}`) }}</span>
                  <span v-if="upcomingOnly.includes(m)" class="mt-1 block text-[10px] font-medium uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.comingSoon') }}</span>
                  <span v-else class="mt-1 block text-[10px] font-medium" :style="{ color: 'var(--color-text-secondary)' }">{{ t(`payment.methods.${m}Sub`) }}</span>
                </button>
              </div>

              <!-- KHQR -> QR flow -->
              <div v-if="paymentMethod === 'KHQR'" class="mt-6">
                <div v-if="!qrData" class="text-center">
                  <button
                    type="button" :disabled="generatingQr"
                    class="rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    :style="{ backgroundColor: 'var(--color-primary)' }"
                    @click="onGenerateQr"
                  >
                    {{ generatingQr ? t('payment.generating') : t('payment.generateQr') }}
                  </button>
                </div>

                <div v-else class="rounded-2xl border p-6 text-center" :style="{ borderColor: 'var(--color-border)' }">
                  <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ t('payment.scanHint') }}</p>
                  <img
                    v-if="qrImageUrl" :src="qrImageUrl" alt="Bakong QR code"
                    class="mx-auto mt-4 h-56 w-56 rounded-xl border" :style="{ borderColor: 'var(--color-border)' }"
                  />
                  <p class="mt-4 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                    {{ polling ? t('payment.checking') : t('payment.waiting') }}
                  </p>
                </div>
              </div>

              <!-- CASH -> confirmation screen (no QR) -->
              <div v-else-if="paymentMethod === 'CASH'" class="mt-6">
                <div class="rounded-2xl border p-6 text-center" :style="{ borderColor: 'var(--color-border)' }">
                  <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">
                    {{ t('payment.cashConfirmText', { amount: formatCurrency(invoice.totalAmount) }) }}
                  </p>
                  <p class="mt-2 text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.cashHint') }}</p>
                  <button
                    type="button" :disabled="confirmingCash || cashConfirmed"
                    class="mt-5 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    :style="{ backgroundColor: 'var(--color-primary)' }"
                    @click="onConfirmCash"
                  >
                    <span v-if="cashConfirmed" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#22C55E]">✓</span>
                    {{ cashConfirmed ? t('payment.cashRecorded') : (confirmingCash ? t('payment.confirming') : t('payment.confirmCash')) }}
                  </button>
                  <p v-if="cashConfirmed" class="mt-3 text-xs text-green-600">{{ t('payment.cashRedirection') }}</p>
                </div>
              </div>

              <Transition name="fade">
                <p v-if="paymentError" class="mt-3 text-sm text-red-600">{{ paymentError }}</p>
              </Transition>
            </div>

            <!-- Paid -> Thank-you panel -->
            <div v-else class="mt-6">
              <div class="rounded-2xl border p-6 text-center" :style="{ borderColor: 'var(--color-border)' }">
                <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-300 animate-pop"
                  :style="{ backgroundColor: '#22C55E' }">
                  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <h2 class="mt-3 text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ t('payment.thankYou') }}</h2>
                <p class="mt-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.thankYouMsg') }}</p>

                <div class="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
                    :style="{ backgroundColor: 'var(--color-primary)' }"
                    @click="onDownloadInvoice"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1ZM5 16a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1Z" /></svg>
                    {{ t('payment.downloadInvoice') }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                    :style="{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }"
                    @click="onShareInvoice"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V7.41l-8.3 8.3a1 1 0 0 1-1.4-1.42L16.58 6H15a1 1 0 0 1-1-1ZM5 7a2 2 0 0 1 2-2h3a1 1 0 0 1 0 2H7v12h12v-3a1 1 0 1 1 2 0v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" /></svg>
                    {{ t('payment.share') }}
                  </button>
                </div>

                <Transition name="fade">
                  <p v-if="paymentError" class="mt-3 text-sm text-red-600">{{ paymentError }}</p>
                </Transition>
              </div>
            </div>
          </div>
        </template>
      </Transition>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
@keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-page-in { animation: page-in 0.35s ease-out; }
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.animate-pop { animation: pop 0.3s ease-out; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>