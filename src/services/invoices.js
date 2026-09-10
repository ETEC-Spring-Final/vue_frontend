import api from '@/services/api'

/**
 * Invoice + Bakong payment API calls.
 * Backend reference: AGENTS.md §2 "Invoices" and "Bakong Payments" tables.
 */
export default {
  // GET /api/invoices/my-invoices — current user's invoices
  myInvoices() {
    return api.get('/invoices/my-invoices')
  },

  // GET /api/invoices/{id}
  getById(id) {
    return api.get(`/invoices/${id}`)
  },

  // POST /api/v1/bakong/generate-qr
  // NOTE: request body shape not confirmed against backend — adjust the
  // payload key (invoiceId vs amount vs reference) once verified.
  generateQr(invoiceId) {
    return api.post('/v1/bakong/generate-qr', { invoiceId })
  },

  // POST /api/v1/bakong/check-payment
  // NOTE: same caveat — confirm the expected body/response shape.
  checkPayment(invoiceId) {
    return api.post('/v1/bakong/check-payment', { invoiceId })
  },
}