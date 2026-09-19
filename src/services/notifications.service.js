import api from '@/services/api'

export default {
  // GET /api/notifications/me/inbox — current user's notifications, newest first
  inbox() {
    return api.get('/notifications/me/inbox')
  },
  // GET /api/notifications/me/unread-count — badge count
  unreadCount() {
    return api.get('/notifications/me/unread-count')
  },
  // PATCH /api/notifications/{id}/read
  markAsRead(id) {
    return api.patch(`/notifications/${id}/read`)
  },
  // PATCH /api/notifications/me/read-all
  markAllAsRead() {
    return api.patch('/notifications/me/read-all')
  },
  // DELETE /api/notifications/{id}
  remove(id) {
    return api.delete(`/notifications/${id}`)
  },
  // POST /api/notifications/{userId}/notify — admin/staff only
  send(userId, payload) {
    return api.post(`/notifications/${userId}/notify`, payload)
  },
  // GET /api/notifications — admin/staff only, all notifications sent
  getAll() {
    return api.get('/notifications')
  },
}