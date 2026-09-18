import api from '@/services/api'

/**
 * Invoice + Bakong payment API calls.
 * Backend reference: ../spring_backend/agent_guid_to_do.md §2 — "Invoices" and
 * "Bakong Payments" tables.
 *
 * Bakong flow (all verified against BakongController / InvoiceController):
 *   1. POST /v1/bakong/generate-qr   body BakongRequest -> KHQRResponse<KHQRData>
 *   2. POST /v1/bakong/qr-image      body KHQRData { qr }        -> PNG bytes (blob)
 *   3. POST /v1/bakong/check-transaction  body { md5 }           -> BakongResponse
 *   4. POST /invoices/{id}/confirm-payment body { md5 }          -> InvoiceResponseDTO (PAID)
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
  // Request body: BakongRequest { currency, amount, merchantName, ... , billNumber, storeLabel, ... }
  // Response:    KHQRResponse<KHQRData> -> { KHQRStatus, data: { qr, md5, ... } }
  generateQr(payload) {
    return api.post('/v1/bakong/generate-qr', payload)
  },

  // POST /api/v1/bakong/qr-image
  // Request body: KHQRData { qr } (take the `data` object from generateQr)
  // Response:     image/png binary -> request with responseType 'blob'
  qrImage(qrData) {
    return api.post('/v1/bakong/qr-image', qrData, { responseType: 'blob' })
  },

  // POST /api/v1/bakong/check-transaction
  // Request body: CheckTransactionRequest { md5 }
  // Response:     BakongResponse { responseCode, responseMessage, errorCode, data }; success = responseCode === 0
  checkTransaction(md5) {
    return api.post('/v1/bakong/check-transaction', { md5 })
  },

  // POST /api/invoices/{id}/confirm-payment
  // Verifies the payment (owner-only) and flips the invoice to PAID. Idempotent when already PAID.
  // Request body: InvoicePaymentConfirmDTO { md5 }
  confirmPayment(id, md5) {
    return api.post(`/invoices/${id}/confirm-payment`, { md5 })
  },
}