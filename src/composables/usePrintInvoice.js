// src/composables/usePrintInvoice.js
//
// Usage in a page:
//   const { printData, printInvoice } = usePrintInvoice()
//   printInvoice(row, { vehicle: 'Honda HR-V' })
//   <InvoicePrintSheet v-if="printData" :invoice="printData.invoice" :vehicle="printData.vehicle" />
//
// The sheet is teleported to <body>. While `body.printing-invoice` is set,
// InvoicePrintSheet.vue's @media print CSS hides everything except the sheet.
import { nextTick, ref } from 'vue'

export function usePrintInvoice() {
  const printData = ref(null)

  async function printInvoice(invoice, extra = {}) {
    if (!invoice) return
    printData.value = { invoice, ...extra }
    await nextTick() // wait for the sheet to be rendered

    const cleanup = () => {
      document.body.classList.remove('printing-invoice')
      printData.value = null
    }
    window.addEventListener('afterprint', cleanup, { once: true })

    document.body.classList.add('printing-invoice')
    window.print()
  }

  return { printData, printInvoice }
}