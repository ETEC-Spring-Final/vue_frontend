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

            <!-- Not yet paid -> QR flow -->
            <div v-if="!isPaid" class="mt-6">
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

              <Transition name="fade">
                <p v-if="paymentError" class="mt-3 text-sm text-red-600">{{ paymentError }}</p>
              </Transition>
            </div>

            <!-- Paid -->
            <div v-else class="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
              {{ t('payment.paid') }}
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>