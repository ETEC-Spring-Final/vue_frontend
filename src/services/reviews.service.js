import api from '@/services/api'

export default {
  // GET /api/reviews (paginated) — admin/staff only, backed by @PreAuthorize on controller
  getAll(page = 0, size = 8, sort = 'createdAt,desc') {
    return api.get('/reviews', { params: { page, size, sort } })
  },
  // GET /api/reviews/vehicle/{vehicleId}?page=X&size=Y
  forVehicle(vehicleId, page = 0, size = 8) {
    return api.get(`/reviews/vehicle/${vehicleId}`, { params: { page, size } })
  },
  // GET /api/reviews/vehicle/{vehicleId}/count?rating=X
  countByRating(vehicleId, rating) {
    return api.get(`/reviews/vehicle/${vehicleId}/count`, { params: { rating } })
  },
  // GET /api/reviews/my-reviews (paginated)
  myReviews(page = 0, size = 10) {
    return api.get('/reviews/my-reviews', { params: { page, size } })
  },
  getById(id) {
    return api.get(`/reviews/${id}`)
  },
  create(payload) {
    return api.post('/reviews', payload)
  },
  update(id, payload) {
    return api.put(`/reviews/${id}`, payload)
  },
  // PATCH /api/reviews/{id}/visibility — admin/staff moderation (hide/show)
  updateVisibility(id, isVisible) {
    return api.patch(`/reviews/${id}/visibility`, { isVisible })
  },
  remove(id) {
    return api.delete(`/reviews/${id}`)
  },
}