<template>
  <Teleport to="body">
    <div class="inv-print-sheet" :class="isReceipt ? 'inv-paper-receipt' : 'inv-paper-a4'">
      <!-- ================= 80 mm thermal receipt ================= -->
      <div v-if="isReceipt" class="inv-r">
        <p class="inv-r-shop">{{ siteSettings.siteName || '' }}</p>
        <p class="inv-r-title">{{ tr('invoices.printHeading', 'INVOICE') }}</p>

        <div class="inv-r-double"></div>

        <div class="inv-r-rows">
          <div v-for="row in receiptRows" :key="row.label" class="inv-r-row">
            <span class="inv-r-lbl">{{ row.label }}</span>
            <span class="inv-r-val" :class="{ 'inv-mono': row.mono, 'inv-wrap': row.wrap }">{{ row.value }}</span>
          </div>
        </div>

        <div class="inv-r-dash"></div>

        <table class="inv-r-table">
          <thead>
            <tr>
              <th>{{ tr('invoices.printDescription', 'Description') }}</th>
              <th class="inv-r-amt">{{ tr('invoices.printAmount', 'Amount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span class="inv-r-item">{{ itemTitle }}</span>
                <span v-if="vehicle" class="inv-r-sub">{{ vehicle }}</span>
              </td>
              <td class="inv-r-amt">{{ money(invoice.subtotal) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="inv-r-totals">
          <div v-for="line in chargeLines" :key="line.label" class="inv-r-line">
            <span>{{ line.label }}</span><span>{{ line.value }}</span>
          </div>
          <div class="inv-r-grand">
            <span>{{ tr('invoices.total', 'Total') }}</span><span>{{ money(totalValue) }}</span>
          </div>
          <p v-if="khrText" class="inv-r-khr">{{ khrText }}</p>
        </div>

        <p v-if="statusText" class="inv-r-stamp">{{ statusText }}</p>

        <div class="inv-r-dash"></div>
        <p class="inv-r-foot">{{ tr('invoices.printThanks', 'Thank you for your business.') }}</p>
        <p class="inv-r-foot inv-r-small">{{ tr('invoices.printedOn', 'Printed on') }} {{ printedAt }}</p>
      </div>

      <!-- ================= A4 invoice ================= -->
      <div v-else class="inv-a">
        <div class="inv-a-top">
          <p class="inv-a-brand">{{ siteSettings.siteName || '' }}</p>
          <div class="inv-a-titleblock">
            <p class="inv-a-title">{{ tr('invoices.printHeading', 'INVOICE') }}</p>
            <p class="inv-a-num inv-mono">{{ invoice.invoiceNumber || invoice.id }}</p>
            <span v-if="statusText" class="inv-a-badge">{{ statusText }}</span>
          </div>
        </div>

        <div v-if="hasCustomer" class="inv-a-billto">
          <p class="inv-a-cardtitle">{{ tr('invoices.printBillTo', 'Bill to') }}</p>
          <p v-if="customer.name" class="inv-a-cust-name">{{ customer.name }}</p>
          <p v-if="customer.phone">{{ customer.phone }}</p>
          <p v-if="customer.email">{{ customer.email }}</p>
        </div>

        <div class="inv-a-cols">
          <div class="inv-a-card">
            <p class="inv-a-cardtitle">{{ tr('invoices.printDetails', 'Invoice details') }}</p>
            <div v-for="row in detailRows" :key="row.label" class="inv-a-row">
              <span class="inv-a-lbl">{{ row.label }}</span>
              <span class="inv-a-val">{{ row.value }}</span>
            </div>
          </div>
          <div v-if="rentalRows.length" class="inv-a-card">
            <p class="inv-a-cardtitle">{{ tr('invoices.rentalDetails', 'Rental') }}</p>
            <div v-for="row in rentalRows" :key="row.label" class="inv-a-row">
              <span class="inv-a-lbl">{{ row.label }}</span>
              <span class="inv-a-val">{{ row.value }}</span>
            </div>
          </div>
        </div>

        <table class="inv-a-table">
          <thead>
            <tr>
              <th class="inv-a-no">{{ tr('invoices.printNo', 'No.') }}</th>
              <th>{{ tr('invoices.printDescription', 'Description') }}</th>
              <th class="inv-a-r">{{ tr('invoices.printAmount', 'Amount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="inv-a-no">1</td>
              <td>
                {{ itemTitle }}
                <span v-if="vehicle" class="inv-a-sub">{{ vehicle }}</span>
              </td>
              <td class="inv-a-r">{{ money(invoice.subtotal) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="inv-a-totals">
          <div v-for="line in chargeLines.slice(1)" :key="line.label" class="inv-a-trow">
            <span class="inv-a-lbl">{{ line.label }}</span><span>{{ line.value }}</span>
          </div>
          <div class="inv-a-grand">
            <span>{{ tr('invoices.total', 'Total') }}</span><span>{{ money(totalValue) }}</span>
          </div>
          <p v-if="khrText" class="inv-a-khr">{{ khrText }}</p>
        </div>

        <div class="inv-a-foot">
          <p>{{ tr('invoices.printThanks', 'Thank you for your business.') }}</p>
          <p>{{ tr('invoices.printedOn', 'Printed on') }} {{ printedAt }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useSiteSettingsStore from '@/stores/siteSettings.store'

const props = defineProps({
  invoice: { type: Object, required: true },
  vehicle: { type: String, default: '' },
  cashier: { type: String, default: '' },
  // { name, email, phone } - every field optional
  customer: { type: Object, default: () => ({}) },
  // { pickUpDateTime, expectedReturnDateTime } - optional, enables the day count
  rental: { type: Object, default: () => ({}) },
  // 'a4' (default) or 'receipt' (80 mm thermal printer)
  paper: { type: String, default: 'a4' },
})

// Exchange rate for the "KHR" total line. Set to 0 to hide that line.
// Change it to your shop's real rate.
const KHR_RATE = 4000

const { t, te } = useI18n()
const { state: siteSettings } = useSiteSettingsStore()

// Translate with a fallback so a missing key never prints as "invoices.xxx".
const tr = (key, fallback) => (te(key) ? t(key) : fallback)

const isReceipt = computed(() => props.paper === 'receipt')
const printedAt = fmtDate(new Date())

function money(value) {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// 21-09-2026 11:52 AM
function fmtDate(value) {
  if (!value) return ''
  const d = new Date(value)
  const p = (n) => String(n).padStart(2, '0')
  const h = d.getHours() % 12 || 12
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM'
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(h)}:${p(d.getMinutes())} ${ampm}`
}

const number = computed(() => props.invoice.invoiceNumber || `#${props.invoice.id}`)
const totalValue = computed(() => props.invoice.totalAmount ?? props.invoice.total)

const statusText = computed(() => {
  const s = String(props.invoice.status || '')
  return s ? tr(`invoices.${s.toLowerCase()}`, s) : ''
})

const khrText = computed(() => {
  if (!KHR_RATE) return ''
  const riel = Math.round(((Number(totalValue.value) || 0) * KHR_RATE) / 100) * 100 // nearest 100 riel
  return `KHR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(riel)}`
})

const itemTitle = computed(() => {
  const i = props.invoice
  return i.rentalId ? `${tr('invoices.rental', 'Rental')} #${i.rentalId}` : number.value
})

// Number of rental days from pickUpDateTime -> expectedReturnDateTime (inclusive, min 1)
const rentalDays = computed(() => {
  const start = props.rental?.pickUpDateTime
  const end = props.rental?.expectedReturnDateTime
  if (!start || !end) return null
  const ms = new Date(end) - new Date(start)
  if (!Number.isFinite(ms) || ms <= 0) return null
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
})

const durationText = computed(() =>
  rentalDays.value ? `${rentalDays.value} ${tr('invoices.days', 'days')}` : ''
)

// Subtotal first, then additional services / discount / tax / late fee when not zero.
const chargeLines = computed(() => {
  const i = props.invoice
  const rows = [{ label: tr('invoices.subtotal', 'Subtotal'), value: money(i.subtotal) }]
  if (Number(i.additionalServicesTotal)) {
    rows.push({ label: tr('invoices.additionalServices', 'Additional services'), value: money(i.additionalServicesTotal) })
  }
  if (Number(i.discountAmount)) rows.push({ label: tr('invoices.discount', 'Discount'), value: `−${money(i.discountAmount)}` })
  if (Number(i.taxAmount)) rows.push({ label: tr('invoices.tax', 'Tax'), value: money(i.taxAmount) })
  if (Number(i.lateFee)) rows.push({ label: tr('invoices.lateFee', 'Late fee'), value: money(i.lateFee) })
  return rows
})

// Receipt: one clean label/value list
const receiptRows = computed(() => {
  const i = props.invoice
  return [
    { label: tr('invoices.invoiceNumber', 'Invoice no.'), value: number.value, mono: true },
    { label: tr('invoices.duration', 'Duration'), value: durationText.value },
    { label: tr('invoices.issued', 'Issued'), value: fmtDate(i.issueDate) },
    { label: tr('invoices.due', 'Due'), value: fmtDate(i.dueDate) },
    { label: tr('invoices.printCashier', 'Cashier'), value: props.cashier },
    { label: tr('invoices.printCustomer', 'Customer'), value: props.customer?.name },
    { label: tr('invoices.printPhone', 'Phone'), value: props.customer?.phone },
    { label: tr('invoices.printEmail', 'Email'), value: props.customer?.email, wrap: true },
  ].filter((r) => r.value)
})

const hasCustomer = computed(() => !!(props.customer?.name || props.customer?.phone || props.customer?.email))

// A4: two info cards
const detailRows = computed(() => {
  const i = props.invoice
  return [
    { label: tr('invoices.issued', 'Issued'), value: fmtDate(i.issueDate) },
    { label: tr('invoices.due', 'Due'), value: fmtDate(i.dueDate) },
    { label: tr('invoices.printCashier', 'Cashier'), value: props.cashier },
  ].filter((r) => r.value)
})

const rentalRows = computed(() => {
  const i = props.invoice
  return [
    { label: tr('invoices.rental', 'Rental'), value: i.rentalId ? `#${i.rentalId}` : '' },
    { label: tr('invoices.vehicle', 'Vehicle'), value: props.vehicle },
    { label: tr('invoices.duration', 'Duration'), value: durationText.value },
  ].filter((r) => r.value)
})
</script>

<!-- Not scoped on purpose: the sheet is teleported to <body> and the print rules
     have to hide the rest of the app. Every selector is prefixed with .inv- -->
<style>
.inv-print-sheet { display: none; }

/* Named pages, so these sizes only apply to the invoice sheet */
@page inv-a4 {
  size: A4;
  margin: 14mm;
}
@page inv-receipt {
  margin: 0;
}

@media print {
  body.printing-invoice > *:not(.inv-print-sheet) { display: none !important; }
  body.printing-invoice { background: #fff !important; }

  body.printing-invoice .inv-print-sheet {
    display: block;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .inv-print-sheet p { margin: 0; }
  .inv-mono { font-family: ui-monospace, Menlo, Consolas, monospace; }

  /* =========================================================
     80 mm receipt  (black only, large readable type)
     ========================================================= */
  .inv-paper-receipt {
    page: inv-receipt;
    width: 100%;
    max-width: 80mm;
    margin: 0 auto;
    padding: 5mm 3mm 8mm;
    box-sizing: border-box;
    color: #000;
    font-size: 10.5pt;
    line-height: 1.4;
  }
  .inv-wrap { word-break: break-all; }
  .inv-r-shop { text-align: center; font-size: 16pt; font-weight: 700; line-height: 1.2; }
  .inv-r-title { text-align: center; font-size: 12pt; font-weight: 700; margin-top: 3pt !important; }

  .inv-r-double { border-top: 3px double #000; margin: 8pt 0; }
  .inv-r-dash { border-top: 1px dashed #000; margin: 8pt 0; }

  .inv-r-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8pt; padding: 1.5pt 0; }
  .inv-r-lbl { flex-shrink: 0; }
  .inv-r-val { font-weight: 600; text-align: right; }

  .inv-r-table { width: 100%; border-collapse: collapse; }
  .inv-r-table th {
    text-align: left;
    font-size: 9.5pt;
    font-weight: 700;
    padding: 3pt 0;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .inv-r-table td { padding: 5pt 0; vertical-align: top; }
  .inv-r-amt { text-align: right !important; white-space: nowrap; padding-left: 8pt; }
  .inv-r-item { display: block; font-weight: 600; }
  .inv-r-sub { display: block; font-size: 9.5pt; }

  .inv-r-totals { border-top: 1px solid #000; margin-top: 2pt; padding-top: 4pt; }
  .inv-r-line { display: flex; justify-content: space-between; gap: 8pt; padding: 1.5pt 0; }
  .inv-r-grand {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8pt;
    margin-top: 5pt;
    padding: 5pt 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    font-size: 15pt;
    font-weight: 700;
  }
  .inv-r-khr { text-align: right; margin-top: 3pt !important; font-size: 10.5pt; }

  .inv-r-stamp {
    width: max-content;
    margin: 10pt auto 0 !important;
    padding: 2pt 16pt;
    border: 2px solid #000;
    font-size: 12pt;
    font-weight: 700;
  }
  .inv-r-foot { text-align: center; }
  .inv-r-small { font-size: 8.5pt; margin-top: 2pt !important; }

  /* =========================================================
     A4 invoice
     ========================================================= */
  .inv-paper-a4 {
    page: inv-a4;
    color: #101728;
    font-size: 11pt;
    line-height: 1.5;
  }
  .inv-a-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20pt;
    padding-bottom: 14pt;
    border-bottom: 3px solid #24467E;
  }
  .inv-a-brand { font-size: 22pt; font-weight: 700; color: #24467E; line-height: 1.2; }
  .inv-a-titleblock { text-align: right; }
  .inv-a-title { font-size: 26pt; font-weight: 700; line-height: 1.15; }
  .inv-a-num { margin-top: 4pt !important; font-size: 12pt; font-weight: 600; }
  .inv-a-badge {
    display: inline-block;
    margin-top: 8pt;
    padding: 2pt 14pt;
    border: 1.5px solid #24467E;
    border-radius: 999px;
    color: #24467E;
    font-size: 10pt;
    font-weight: 700;
  }

  .inv-a-billto { margin-top: 16pt; }
  .inv-a-cust-name { font-size: 13pt; font-weight: 700; }

  .inv-a-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14pt; margin-top: 18pt; }
  .inv-a-card { border: 1px solid #DDE2EC; border-radius: 8pt; padding: 10pt 12pt; }
  .inv-a-cardtitle { margin-bottom: 6pt !important; font-size: 10.5pt; font-weight: 700; color: #24467E; }
  .inv-a-row { display: flex; justify-content: space-between; gap: 12pt; padding: 3pt 0; }
  .inv-a-lbl { color: #5B6478; }
  .inv-a-val { font-weight: 600; text-align: right; }

  .inv-a-table { width: 100%; border-collapse: collapse; margin-top: 20pt; }
  .inv-a-table th {
    background: #F1F4FA;
    padding: 8pt 10pt;
    text-align: left;
    font-size: 10.5pt;
    border-bottom: 2px solid #24467E;
  }
  .inv-a-table td { padding: 10pt; vertical-align: top; border-bottom: 1px solid #E3E7EF; }
  .inv-a-no { width: 14mm; }
  .inv-a-r { text-align: right !important; white-space: nowrap; }
  .inv-a-sub { display: block; margin-top: 1pt; font-size: 10pt; color: #5B6478; }

  .inv-a-totals { width: 55%; margin: 16pt 0 0 auto; }
  .inv-a-trow { display: flex; justify-content: space-between; gap: 12pt; padding: 5pt 0; border-bottom: 1px solid #E3E7EF; }
  .inv-a-grand {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 8pt;
    padding: 9pt 12pt;
    border-radius: 6pt;
    background: #24467E;
    color: #fff;
    font-size: 14pt;
    font-weight: 700;
  }
  .inv-a-khr { margin-top: 5pt !important; text-align: right; font-size: 10pt; color: #5B6478; }

  .inv-a-foot {
    margin-top: 40pt;
    padding-top: 10pt;
    border-top: 1px solid #E3E7EF;
    text-align: center;
    font-size: 10pt;
    color: #5B6478;
  }
}

/* Narrow paper (58 mm rolls): slightly smaller type so nothing overflows */
@media print and (max-width: 65mm) {
  .inv-paper-receipt { font-size: 9pt; padding-left: 2mm; padding-right: 2mm; }
  .inv-r-shop { font-size: 13pt; }
  .inv-r-grand { font-size: 13pt; }
  .inv-r-table th { font-size: 8.5pt; }
}
</style>