/*
|--------------------------------------------------------------------------
| File: stores/auth.store.js
|--------------------------------------------------------------------------
|
| Description:
| Lightweight reactive auth store (not Pinia yet — see agent guide).
|
| Responsibilities:
| - Hold the current user, JWT token, and role in memory
| - Persist the session to localStorage so it survives a page refresh
| - Restore the session on app load
|
| Notes:
| - `login(payload)` expects the shape returned by the backend auth
|   endpoints: { id, email, role, token } (see /api/auth/register,
|   /api/auth/login)
| - services/api.js reads the token directly from localStorage (key
|   `auth_token`) to avoid a circular import with this file — keep the
|   key in sync with TOKEN_KEY there if you rename it.
|
*/

import { reactive } from 'vue'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function loadPersistedUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const state = reactive({
  user: loadPersistedUser(), // { id, email, role }
  token: localStorage.getItem(TOKEN_KEY) || null,
})

/**
 * Store the session after a successful register/login call.
 * @param {{ id: number, email: string, role: string, token: string }} payload
 */
function login(payload) {
  const { token, ...user } = payload
  state.user = user
  state.token = token

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Clear the session, in memory and in localStorage.
 */
function logout() {
  state.user = null
  state.token = null

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * @returns {boolean} whether a session is currently active
 */
function isAuthenticated() {
  return !!state.token
}

/**
 * @param  {...string} roles
 * @returns {boolean} whether the current user has one of the given roles
 */
function hasRole(...roles) {
  return !!state.user && roles.includes(state.user.role)
}

function defaultRedirect() {
  return hasRole('ADMIN', 'MANAGER', 'STAFF') ? '/dashboard' : '/home'
}

export default function useAuthStore() {
  return { state, login, logout, isAuthenticated, hasRole, defaultRedirect }
}