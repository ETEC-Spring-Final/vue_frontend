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
| - Fetch and merge the full profile (firstName/lastName/profilePicture/...)
|   which is NOT returned by /api/auth/login, only by /api/user-profiles/me
|
| Notes:
| - `login(payload)` expects the shape returned by the backend auth
|   endpoints: { id, email, role, token } (see /api/auth/register,
|   /api/auth/login, /api/auth/telegram)
| - services/api.js reads the token directly from localStorage (key
|   `auth_token`) to avoid a circular import with this file — keep the
|   key in sync with TOKEN_KEY there if you rename it.
| - `loginWithTelegram(telegramUser)` posts the Telegram Login Widget's
|   raw callback payload to the backend (which verifies the hash) and
|   then reuses login() for everything else — same pattern as
|   OAuth2Redirect.vue calling login() after decoding a Google JWT.
|
*/

import { reactive } from 'vue'
import { getMyProfile } from '@/services/profile.service'
import { telegramLogin } from '@/services/telegramAuth.service'

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
  user: loadPersistedUser(), // { id, email, role, firstName?, lastName?, profilePicture?, ... }
  token: localStorage.getItem(TOKEN_KEY) || null,
})

/**
 * Store the session after a successful register/login call.
 * @param {{ id: number, email: string, role: string, token: string }} payload
 * @returns {Promise<void>} resolves once the profile fetch settles
 */
async function login(payload) {
  const { token, ...user } = payload
  state.user = user
  state.token = token

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))

  // fetchProfile() catches its own errors, so this never rejects.
  await fetchProfile()
}

/**
 * Verify the Telegram Login Widget payload on the backend, then log the
 * returned session in exactly the same way as email/password or Google
 * OAuth login.
 * @param {object} telegramUser - raw object the widget passes to onauth
 * @returns {Promise<object>} the AuthResponseDTO { id, email, role, token }
 */
async function loginWithTelegram(telegramUser) {
  const authData = await telegramLogin(telegramUser)
  await login(authData)
  return authData
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

/**
 * Fetch the full profile from the backend (firstName, lastName, phone,
 * profilePicture, authProvider, ...) and merge it into state.user, since
 * login() only stores { id, email, role }. Safe to call multiple times
 * (e.g. on every app mount) — it just refreshes the cached fields.
 *
 * @returns {Promise<object|null>} the merged user, or null if not authenticated
 */
async function fetchProfile() {
  if (!isAuthenticated()) return null

  try {
    const profile = await getMyProfile()
    state.user = { ...state.user, ...profile }
    localStorage.setItem(USER_KEY, JSON.stringify(state.user))
    return state.user
  } catch (err) {
    // Token likely expired/invalid — don't crash the app, just leave the
    // cached (possibly stale) user in place. Interceptors in services/api.js
    // should already handle 401 redirects if configured.
    console.error('Failed to fetch profile:', err)
    return null
  }
}

export default function useAuthStore() {
  return {
    state,
    login,
    loginWithTelegram,
    logout,
    isAuthenticated,
    hasRole,
    defaultRedirect,
    fetchProfile,
  }
}