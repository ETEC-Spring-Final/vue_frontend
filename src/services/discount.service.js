// src/services/discount.service.js
import api from './api'

export default {
  // ទាញ discount ទាំងអស់ (មាន filter param ជាជម្រើស)
  getAll(params = {}) {
    return api.get('/discounts', { params })
  },

  // ទាញ discount មួយតាម id
  getById(id) {
    return api.get(`/discounts/${id}`)
  },

  // ទាញតែ discount ដែល active
  getActive() {
    return api.get('/discounts/active')
  },

  // បង្កើត discount ថ្មី
  create(data) {
    return api.post('/discounts', data)
  },

  // កែប្រែ discount (PUT ពេញលេញ)
  update(id, data) {
    return api.put(`/discounts/${id}`, data)
  },

  // លុប discount
  delete(id) {
    return api.delete(`/discounts/${id}`)
  },

  // ផ្អាក/បើក discount វិញ (resend full object ព្រោះមិនមាន PATCH endpoint)
  togglePause(id, data) {
    return api.put(`/discounts/${id}`, data)
  }
}