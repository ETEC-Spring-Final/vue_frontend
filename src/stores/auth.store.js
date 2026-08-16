import { reactive } from 'vue'

const state = reactive({ user: null })

function login(user) {
  state.user = user
}

function logout() {
  state.user = null
}

export default function useAuthStore() {
  return { state, login, logout }
}
