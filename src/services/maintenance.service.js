// src/services/maintenance.service.js
import api from '@/services/api'

/**
 * Maintenance record API calls.
 * Backend reference: MaintenanceRecordController (/api/maintenance-records).
 */
export default {
  // GET /api/maintenance-records — all records
  getAll() {
    return api.get('/maintenance-records')
  },

  // GET /api/maintenance-records/{id}
  getById(id) {
    return api.get(`/maintenance-records/${id}`)
  },

  // POST /api/maintenance-records — { vehicleId, type, description, scheduledDate, completedDate, cost, status }
  create(payload) {
    return api.post('/maintenance-records', payload)
  },

  // PUT /api/maintenance-records/{id} — full replace (no PATCH endpoint)
  update(id, payload) {
    return api.put(`/maintenance-records/${id}`, payload)
  },

  // DELETE /api/maintenance-records/{id} — ADMIN, MANAGER only
  delete(id) {
    return api.delete(`/maintenance-records/${id}`)
  },
}