import api from '@/services/api'

export default {
  me() {
    return api.get('/user-profiles/me')
  },
  updateMe(payload) {
    return api.put('/user-profiles/me', payload)
  },
  // GET /api/user-profiles/me/login-history
  loginHistory() {
    return api.get('/user-profiles/me/login-history')
  },
}