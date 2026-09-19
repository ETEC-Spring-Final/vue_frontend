// src/services/invoice.service.js
import api from '@/services/api'

/**
 * Invoice + Bakong payment API calls.
 * Backend reference: InvoiceController (/api/invoices), BakongController (/api/v1/bakong).
 */
export default {
  // ----- Admin / Staff CRUD -----

  // GET /api/invoices — all invoices (ADMIN, MANAGER, STAFF)
  getAll() {
    return api.get('/invoices')
  },

  // GET /api/invoices/{id}
  getById(id) {
    return api.get(`/invoices/${id}`)
  },

  // POST /api/invoices — { rentalId, dueDate, subtotal, discountAmount, taxAmount, lateFee, status }
  create(payload) {
    return api.post('/invoices', payload)
  },

  // PUT /api/invoices/{id} — full replace (no PATCH endpoint on backend)
  update(id, payload) {
    return api.put(`/invoices/${id}`, payload)
  },

  // DELETE /api/invoices/{id}
  delete(id) {
    return api.delete(`/invoices/${id}`)
  },

  // ----- Customer-facing -----

  // GET /api/invoices/my-invoices — current user's invoices
  myInvoices() {
    return api.get('/invoices/my-invoices')
  },

  // ----- Bakong payment (integration pending — see teammate) -----

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