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
const confirmFailed = ref(false);
const paymentError = ref("");
const notice = ref("");
let pollTimer = null;
let redirectTimer = null;

const md5 = computed(() => qrData.value?.md5 || "");
const invoiceStatus = computed(() => (invoice.value?.status || "").toUpperCase());
const isPaid = computed(() => invoiceStatus.value === "PAID");
const isCancelled = computed(() => invoiceStatus.value === "CANCELLED");
const storeName = computed(() => siteSettings.state.siteName || "CarRental");

// ---------- Payment methods ----------
// Active methods first, "coming soon" ones last, so the choices a customer
// can actually use are never buried under disabled rows.
const METHODS = [
  { id: "KHQR", icon: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z" },
  { id: "CASH", icon: "M3 7h18v10H3V7Zm9 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 10v.01M18 14v.01" },
  { id: "VISA", icon: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 3h18M7 15h3" },
  { id: "ABA_PAY", icon: "M3 10 12 4l9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18" },
];
const upcomingOnly = ["VISA", "ABA_PAY"];
const isUpcoming = (id) => upcomingOnly.includes(id);

const paymentMethod = ref("KHQR");
const confirmingCash = ref(false);
const cashConfirmed = ref(false);

function methodStyle(id) {
  return paymentMethod.value === id
    ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }
    : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" };
}

function methodIconStyle(id) {
  return paymentMethod.value === id
    ? { backgroundColor: "var(--color-primary)", color: "#fff" }
    : { backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" };
}

function onSelectMethod(method) {
  if (isUpcoming(method)) return;
  paymentMethod.value = method;
  paymentError.value = "";
  notice.value = "";
  if (method === "CASH") {
    resetQr();
    return;
  }
  cashConfirmed.value = false;
  if (!qrData.value && !generatingQr.value) onGenerateQr();
}

// ---------- Steps ----------
const steps = computed(() => [
  { key: "booking", label: t("payment.steps.booking", "Booking") },
  { key: "payment", label: t("payment.steps.payment", "Payment") },
  { key: "done", label: t("payment.steps.done", "Done") },
]);
const currentStep = computed(() => (isPaid.value ? 3 : 1));

function stepDotStyle(i) {
  if (i < currentStep.value) return { backgroundColor: "var(--color-primary)", color: "#fff" };
  if (i === currentStep.value)
    return { backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", boxShadow: "inset 0 0 0 1.5px var(--color-primary)" };
  return { backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" };
}

// ---------- Formatting ----------
function formatCurrency(value) {
  if (value === undefined || value === null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function statusStyle(status) {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return { backgroundColor: "rgba(34,197,94,0.12)", color: "#16A34A" };
    case "CANCELLED":
      return { backgroundColor: "rgba(239,68,68,0.12)", color: "#DC2626" };
    default:
      return { backgroundColor: "rgba(234,179,8,0.16)", color: "#B45309" };
  }
}

const statusLabel = computed(() => t(`payment.status.${invoiceStatus.value}`, invoice.value?.status || ""));

const lines = computed(() => {
  const inv = invoice.value;
  if (!inv) return [];
  const rows = [{ key: "subtotal", label: t("payment.subtotal"), value: formatCurrency(inv.subtotal) }];
  if (Number(inv.discountAmount))
    rows.push({ key: "discount", label: t("payment.discount"), value: `−${formatCurrency(inv.discountAmount)}`, negative: true });
  if (Number(inv.taxAmount)) rows.push({ key: "tax", label: t("payment.tax"), value: formatCurrency(inv.taxAmount) });
  if (Number(inv.lateFee)) rows.push({ key: "lateFee", label: t("payment.lateFee"), value: formatCurrency(inv.lateFee) });
  return rows;
});

// ---------- KHQR flow ----------
function resetQr() {
  stopPolling();
  if (qrImageUrl.value) URL.revokeObjectURL(qrImageUrl.value);
  qrData.value = null;
  qrImageUrl.value = "";
  confirmFailed.value = false;
}

async function extractErrorMessage(err) {
  const data = err?.response?.data;
  if (data == null) return err?.message || "";
  if (typeof data === "string") return data.trim();
  if (data instanceof Blob) return (await data.text()).trim();
  return data?.message || "";
}

async function onGenerateQr() {
  resetQr();
  generatingQr.value = true;
  paymentError.value = "";
  notice.value = "";
  try {
    const payload = {
      currency: "USD",
      amount: Number(invoice.value.totalAmount ?? 0),
      billNumber: invoice.value.invoiceNumber ?? `INV-${invoice.value.id}`,
      storeLabel: storeName.value,
    };
    const { data } = await invoicesApi.generateQr(payload);
    const qrInfo = data?.data || null;
    if (!qrInfo || !qrInfo.qr) {
      paymentError.value = data?.KHQRStatus?.message || t("payment.qrError");
      return;
    }
    const img = await invoicesApi.qrImage({ qr: qrInfo.qr, md5: qrInfo.md5 });
    if (!(img.data instanceof Blob) || img.data.size === 0) {
      paymentError.value = t("payment.qrError");
      return;
    }
    // Customer may have switched to CASH while the request was in flight.
    if (paymentMethod.value !== "KHQR") return;

    qrImageUrl.value = URL.createObjectURL(img.data);
    qrData.value = qrInfo;
    startPolling();
  } catch (err) {
    paymentError.value = (await extractErrorMessage(err)) || t("payment.qrError");
  } finally {
    generatingQr.value = false;
  }
}

function startPolling() {
  stopPolling();
  polling.value = true;
  pollTimer = setInterval(async () => {
    try {
      const { data } = await invoicesApi.checkTransaction(md5.value);
      if (Number(data?.responseCode) === 0) {
        stopPolling();
        await onConfirmPayment();
      }
    } catch {
      // Transaction not settled yet — keep polling.
    }
  }, 4000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  polling.value = false;
}

async function onConfirmPayment() {
  confirming.value = true;
  confirmFailed.value = false;
  paymentError.value = "";
  try {
    const { data } = await invoicesApi.confirmPayment(invoice.value.id, md5.value);
    invoice.value = data ?? { ...invoice.value, status: "PAID" };
    resetQr();
    redirectTimer = setTimeout(() => router.push({ path: "/my-reservations" }), 1600);
  } catch (err) {
    // The customer may already have paid, so keep the QR on screen and let
    // them retry the confirmation instead of leaving them stuck.
    confirmFailed.value = true;
    paymentError.value = err?.response?.data?.message || t("payment.confirmError");
  } finally {
    confirming.value = false;
  }
}

// Many customers pay from the same phone, so let them save the QR and scan it from the gallery.
function onSaveQr() {
  if (!qrImageUrl.value) return;
  const a = document.createElement("a");
  a.href = qrImageUrl.value;
  a.download = `khqr-${invoice.value.invoiceNumber || invoice.value.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------- CASH flow ----------
// Records the CASH intent on the invoice (stays UNPAID until staff mark it PAID).
async function onConfirmCash() {
  confirmingCash.value = true;
  paymentError.value = "";
  try {
    await invoicesApi.setPaymentMethod(invoice.value.id, "CASH");
    invoice.value = { ...invoice.value, paymentMethod: "CASH" };
    cashConfirmed.value = true;
    redirectTimer = setTimeout(() => router.push("/my-reservations"), 1400);
  } catch (err) {
    paymentError.value = err?.response?.data?.message || t("payment.methodError");
  } finally {
    confirmingCash.value = false;
  }
}

// ---------- Download / share ----------
async function onDownloadInvoice() {
  notice.value = "";
  try {
    const res = await invoicesApi.downloadPdf(invoice.value.id);
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${invoice.value.invoiceNumber || invoice.value.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (err) {
    paymentError.value = err?.response?.data?.message || t("payment.downloadError");
  }
}

function invoiceLink() {
  return `${window.location.origin}/my-invoices/${invoice.value.id}`;
}

async function onShareInvoice() {
  paymentError.value = "";
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
    notice.value = t("payment.linkCopied");
  } catch {
    window.prompt(t("payment.copyLink"), invoiceLink());
  }
}

// ---------- Lifecycle ----------
onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await invoicesApi.getById(route.params.invoiceId);
    invoice.value = data;
    if (data?.paymentMethod && !isUpcoming(data.paymentMethod)) paymentMethod.value = data.paymentMethod;
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || t("payment.loadError");
  } finally {
    loading.value = false;
  }
  // Not awaited: the page shows immediately and the QR panel shows its own skeleton.
  if (invoice.value && !isPaid.value && !isCancelled.value && paymentMethod.value === "KHQR") {
    onGenerateQr();
  }
});

onUnmounted(() => {
  resetQr();
  if (redirectTimer) clearTimeout(redirectTimer);
});
</script>

<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <RouterLink
        to="/my-reservations"
        class="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
        :style="{ color: 'var(--color-primary)' }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
          <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t('payment.backToReservations') }}
      </RouterLink>

      <!-- Title + progress. The steps are a real sequence (booking → pay → done),
           so numbering them is information, not decoration. -->
      <div class="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 class="text-xl font-bold sm:text-2xl" :style="{ color: 'var(--color-text)' }">{{ t('payment.title') }}</h1>

        <ol class="flex items-center gap-2 text-xs">
          <template v-for="(s, i) in steps" :key="s.key">
            <li class="flex items-center gap-2" :aria-current="i === currentStep ? 'step' : undefined">
              <span class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold" :style="stepDotStyle(i)">
                <svg v-if="i < currentStep" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5">
                  <path stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
                </svg>
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span
                class="font-medium"
                :class="i === currentStep ? '' : 'hidden sm:inline'"
                :style="{ color: i <= currentStep ? 'var(--color-text)' : 'var(--color-text-secondary)' }"
              >
                {{ s.label }}
              </span>
            </li>
            <li v-if="i < steps.length - 1" aria-hidden="true" class="h-px w-5 sm:w-9" :style="{ backgroundColor: i < currentStep ? 'var(--color-primary)' : 'var(--color-border)' }"></li>
          </template>
        </ol>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 grid gap-6 lg:grid-cols-5">
        <div class="h-72 animate-pulse rounded-2xl lg:order-2 lg:col-span-2" :style="{ backgroundColor: 'var(--color-border)' }"></div>
        <div class="h-96 animate-pulse rounded-2xl lg:order-1 lg:col-span-3" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <!-- Error loading invoice -->
      <div v-else-if="errorMessage" role="alert" class="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {{ errorMessage }}
      </div>

      <div v-else-if="invoice" class="mt-8 grid gap-6 lg:grid-cols-5 lg:items-start">
        <!-- ============ Receipt (invoice summary) ============ -->
        <aside class="order-1 lg:order-2 lg:col-span-2 lg:sticky lg:top-24">
          <div class="relative overflow-hidden rounded-2xl border" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }">
            <div class="flex items-start justify-between gap-3 p-5">
              <div class="min-w-0">
                <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.invoice') }}</p>
                <p class="mt-0.5 truncate text-sm font-semibold" :style="{ color: 'var(--color-text)' }">#{{ invoice.invoiceNumber || invoice.id }}</p>
              </div>
              <span class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold" :style="statusStyle(invoice.status)">{{ statusLabel }}</span>
            </div>

            <!-- Tear line: dashed rule with a notch cut into each edge, like a paper receipt -->
            <div class="relative" aria-hidden="true">
              <div class="mx-5 border-t border-dashed" :style="{ borderColor: 'var(--color-border)' }"></div>
              <span class="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }"></span>
              <span class="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }"></span>
            </div>

            <dl class="space-y-3 p-5 text-sm">
              <div v-for="row in lines" :key="row.key" class="flex items-baseline justify-between gap-4">
                <dt :style="{ color: 'var(--color-text-secondary)' }">{{ row.label }}</dt>
                <dd class="tabular-nums" :class="row.negative ? 'text-red-600 dark:text-red-400' : ''" :style="row.negative ? {} : { color: 'var(--color-text)' }">{{ row.value }}</dd>
              </div>
            </dl>

            <div class="mx-5 border-t border-dashed" :style="{ borderColor: 'var(--color-border)' }" aria-hidden="true"></div>

            <div class="flex items-baseline justify-between gap-4 p-5">
              <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">
                {{ isPaid ? t('payment.amountPaid', 'Amount paid') : t('payment.total') }}
              </p>
              <p class="text-3xl font-bold tabular-nums" :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.totalAmount) }}</p>
            </div>
          </div>

          <p class="mt-3 flex items-start gap-2 px-1 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="mt-0.5 h-3.5 w-3.5 shrink-0">
              <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" />
            </svg>
            {{ t('payment.secure', 'Payments are confirmed automatically through Bakong.') }}
          </p>
        </aside>

        <!-- ============ Payment area ============ -->
        <section class="order-2 lg:order-1 lg:col-span-3">
          <Transition name="fade" mode="out-in">
            <!-- Paid -->
            <div v-if="isPaid" key="paid" class="rounded-2xl border p-8 text-center" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }">
              <span class="animate-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white" style="background-color: #22C55E;">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <h2 class="mt-4 text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ t('payment.thankYou') }}</h2>
              <p class="mx-auto mt-1 max-w-sm text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.thankYouMsg') }}</p>

              <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  :style="{ backgroundColor: 'var(--color-primary)' }"
                  @click="onDownloadInvoice"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1ZM5 16a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1Z" /></svg>
                  {{ t('payment.downloadInvoice') }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                  :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
                  @click="onShareInvoice"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V7.41l-8.3 8.3a1 1 0 0 1-1.4-1.42L16.58 6H15a1 1 0 0 1-1-1ZM5 7a2 2 0 0 1 2-2h3a1 1 0 0 1 0 2H7v12h12v-3a1 1 0 1 1 2 0v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" /></svg>
                  {{ t('payment.share') }}
                </button>
              </div>
            </div>

            <!-- Cancelled -->
            <div v-else-if="isCancelled" key="cancelled" class="rounded-2xl border p-6 text-center" :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }">
              <p class="text-sm font-semibold text-red-600 dark:text-red-400">
                {{ t('payment.cancelledMsg', 'This invoice was cancelled and can no longer be paid.') }}
              </p>
            </div>

            <!-- Not yet paid -->
            <div v-else key="pay">
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text)' }">{{ t('payment.chooseMethod') }}</h2>

              <div role="radiogroup" :aria-label="t('payment.chooseMethod')" class="mt-3 space-y-2.5">
                <button
                  v-for="m in METHODS"
                  :key="m.id"
                  type="button"
                  role="radio"
                  :aria-checked="paymentMethod === m.id"
                  :disabled="isUpcoming(m.id)"
                  class="flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-55"
                  :style="methodStyle(m.id)"
                  @click="onSelectMethod(m.id)"
                >
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150" :style="methodIconStyle(m.id)">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                      <path :d="m.icon" />
                    </svg>
                  </span>

                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ t(`payment.methods.${m.id}`) }}</span>
                    <span v-if="!isUpcoming(m.id)" class="mt-0.5 block text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ t(`payment.methods.${m.id}Sub`) }}</span>
                  </span>

                  <span
                    v-if="isUpcoming(m.id)"
                    class="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                    :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
                  >
                    {{ t('payment.comingSoon') }}
                  </span>
                  <span
                    v-else
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                    :style="{ borderColor: paymentMethod === m.id ? 'var(--color-primary)' : 'var(--color-border)' }"
                  >
                    <span v-if="paymentMethod === m.id" class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: 'var(--color-primary)' }"></span>
                  </span>
                </button>
              </div>

              <!-- Method panel -->
              <Transition name="fade" mode="out-in">
                <!-- KHQR -->
                <div
                  v-if="paymentMethod === 'KHQR'"
                  key="khqr"
                  class="mt-4 rounded-2xl border px-6 py-7 text-center"
                  :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
                >
                  <div v-if="qrImageUrl">
                    <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ t('payment.scanHint') }}</p>

                    <!-- The QR always sits on white (scanners need the contrast), framed by corner brackets -->
                    <div class="relative mx-auto mt-5 w-fit rounded-xl border bg-white p-6" :style="{ borderColor: 'var(--color-border)' }">
                      <span class="pointer-events-none absolute left-2 top-2 h-6 w-6 rounded-tl-lg border-l-[3px] border-t-[3px]" :style="{ borderColor: 'var(--color-primary)' }"></span>
                      <span class="pointer-events-none absolute right-2 top-2 h-6 w-6 rounded-tr-lg border-r-[3px] border-t-[3px]" :style="{ borderColor: 'var(--color-primary)' }"></span>
                      <span class="pointer-events-none absolute bottom-2 left-2 h-6 w-6 rounded-bl-lg border-b-[3px] border-l-[3px]" :style="{ borderColor: 'var(--color-primary)' }"></span>
                      <span class="pointer-events-none absolute bottom-2 right-2 h-6 w-6 rounded-br-lg border-b-[3px] border-r-[3px]" :style="{ borderColor: 'var(--color-primary)' }"></span>
                      <img :src="qrImageUrl" alt="Bakong KHQR" class="h-52 w-52 sm:h-56 sm:w-56" />
                    </div>

                    <p class="mt-4 text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ storeName }}</p>
                    <p class="text-2xl font-bold tabular-nums" :style="{ color: 'var(--color-text)' }">{{ formatCurrency(invoice.totalAmount) }}</p>

                    <p
                      role="status"
                      class="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
                      :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
                    >
                      <span class="relative flex h-2 w-2">
                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style="background-color: currentColor;"></span>
                        <span class="relative inline-flex h-2 w-2 rounded-full" style="background-color: currentColor;"></span>
                      </span>
                      {{ confirming ? t('payment.confirming') : polling ? t('payment.checking') : t('payment.waiting') }}
                    </p>

                    <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        v-if="confirmFailed"
                        type="button"
                        :disabled="confirming"
                        class="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        :style="{ backgroundColor: 'var(--color-primary)' }"
                        @click="onConfirmPayment"
                      >
                        {{ t('common.tryAgain') }}
                      </button>
                      <button
                        type="button"
                        class="rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                        :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
                        @click="onSaveQr"
                      >
                        {{ t('payment.saveQr', 'Save QR') }}
                      </button>
                      <button
                        type="button"
                        :disabled="generatingQr || confirming"
                        class="rounded-full px-3 py-2.5 text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                        :style="{ color: 'var(--color-text-secondary)' }"
                        @click="onGenerateQr"
                      >
                        {{ t('payment.regenerateQr', 'Get a new QR') }}
                      </button>
                    </div>
                  </div>

                  <!-- QR not ready: skeleton while generating, otherwise a clear way to (re)try -->
                  <div v-else class="py-2">
                    <template v-if="generatingQr">
                      <div class="mx-auto h-56 w-56 animate-pulse rounded-xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
                      <p class="mt-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.generating') }}</p>
                    </template>
                    <button
                      v-else
                      type="button"
                      class="rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                      :style="{ backgroundColor: 'var(--color-primary)' }"
                      @click="onGenerateQr"
                    >
                      {{ t('payment.generateQr') }}
                    </button>
                  </div>
                </div>

                <!-- CASH -->
                <div
                  v-else-if="paymentMethod === 'CASH'"
                  key="cash"
                  class="mt-4 rounded-2xl border px-6 py-7 text-center"
                  :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
                >
                  <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full" :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }">
                    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                      <path :d="METHODS[1].icon" />
                    </svg>
                  </span>
                  <p class="mt-4 text-sm font-semibold" :style="{ color: 'var(--color-text)' }">
                    {{ t('payment.cashConfirmText', { amount: formatCurrency(invoice.totalAmount) }) }}
                  </p>
                  <p class="mx-auto mt-2 max-w-sm text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ t('payment.cashHint') }}</p>
                  <button
                    type="button"
                    :disabled="confirmingCash || cashConfirmed"
                    class="mt-5 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    :style="{ backgroundColor: cashConfirmed ? '#22C55E' : 'var(--color-primary)' }"
                    @click="onConfirmCash"
                  >
                    <svg v-if="cashConfirmed" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    {{ cashConfirmed ? t('payment.cashRecorded') : (confirmingCash ? t('payment.confirming') : t('payment.confirmCash')) }}
                  </button>
                  <p v-if="cashConfirmed" class="mt-3 text-xs text-green-600 dark:text-green-400">{{ t('payment.cashRedirection') }}</p>
                </div>
              </Transition>
            </div>
          </Transition>

          <!-- Feedback (shared by all states) -->
          <Transition name="fade">
            <div v-if="paymentError" role="alert" class="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="mt-0.5 h-4 w-4 shrink-0">
                <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              <span>{{ paymentError }}</span>
            </div>
          </Transition>
          <Transition name="fade">
            <p v-if="notice" role="status" class="mt-4 text-center text-sm text-green-600 dark:text-green-400">{{ notice }}</p>
          </Transition>
        </section>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* The one deliberate moment of motion: the success tick popping in after payment. */
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.animate-pop { animation: pop 0.3s ease-out; }

@media (prefers-reduced-motion: reduce) {
  .animate-pop { animation: none; }
  .fade-enter-active, .fade-leave-active { transition: none; }
}
</style>