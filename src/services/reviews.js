import api from '@/services/api'

export default {
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
  remove(id) {
    return api.delete(`/reviews/${id}`)
  },
}