// src/services/invoice.service.js
import api from '@/services/api'

export default {
  getAll() {
    return api.get('/invoices')
  },

  getById(id) {
    return api.get(`/invoices/${id}`)
  },

  create(payload) {
    return api.post('/invoices', payload)
  },

  update(id, payload) {
    return api.put(`/invoices/${id}`, payload)
  },

  // POST /api/invoices/{id}/mark-paid — sets paidAt, sends notification + Telegram PDF
  markPaid(id) {
    return api.post(`/invoices/${id}/mark-paid`)
  },

  delete(id) {
    return api.delete(`/invoices/${id}`)
  },

  myInvoices() {
    return api.get('/invoices/my-invoices')
  },

  generateQr(invoiceId) {
    return api.post('/v1/bakong/generate-qr', { invoiceId })
  },

  checkPayment(invoiceId) {
    return api.post('/v1/bakong/check-payment', { invoiceId })
  },
}