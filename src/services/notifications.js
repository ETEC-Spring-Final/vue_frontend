import api from '@/services/api'

export default {
  // GET /api/notifications/me/inbox
  inbox() {
    return api.get('/notifications/me/inbox')
  },
}