/*
|--------------------------------------------------------------------------
| File: services/api.js
|--------------------------------------------------------------------------
|
| Description:
| Creates a centralized Axios instance for making HTTP requests.
|
| Responsibilities:
| - Define base configuration for API calls
| - Provide a reusable HTTP client across the application
| - Attach the JWT auth header to every outgoing request
| - Redirect to /login on 401 (token missing/expired/invalid)
|
| Notes:
| - baseURL is set to "/api" (proxied to the backend by Vite in dev, see
|   vite.config.js `server.proxy`)
| - Reads/writes the token via the auth store's localStorage key so this
|   file has no circular import on stores/auth.store.js
|
*/

import axios from 'axios'
import router from '@/router'

const TOKEN_KEY = 'auth_token'

/**
 * Axios instance
 * Used for all API requests in the application
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

/**
 * Request interceptor
 * Attaches `Authorization: Bearer <token>` to every request when a token
 * is present in localStorage.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Response interceptor
 * On 401 (unauthenticated/expired token), clear the stored session and
 * redirect to /login so the user can re-authenticate.
 *
 * FIX: previously this fired a full logout on ANY 401 from ANY endpoint.
 * That's dangerous because:
 *   1. If a request fires WITHOUT a token attached yet (race on app boot),
 *      or a newly-added backend endpoint briefly misbehaves, one stray 401
 *      would wipe the token and log the user out — even though the token
 *      itself was still perfectly valid, causing every other in-flight
 *      request (reservations, rentals, etc.) to also fail as a side effect
 *      instead of a root cause.
 *   2. It made debugging confusing: a single bad endpoint looked like
 *      "everything is broken" because of the cascade.
 *
 * Now we only treat this as a real "my session is dead" event when the
 * request that failed actually HAD a token attached (config.headers.
 * Authorization was set). If a 401 comes back for a request that never
 * had a token (e.g. it fired before login finished, or a bug elsewhere),
 * we don't nuke the session — we just let that one call fail so the
 * calling code can handle/display it individually.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const hadToken = Boolean(error.config?.headers?.Authorization)

    if (status === 401 && hadToken) {
      // eslint-disable-next-line no-console
      console.warn(
        `[api] 401 with a token attached on ${error.config?.method?.toUpperCase()} ${error.config?.url} — logging out.`
      )
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('auth_user')
      // Avoid an infinite loop if the 401 came from the login call itself
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    } else if (status === 401) {
      // eslint-disable-next-line no-console
      console.warn(
        `[api] 401 WITHOUT a token attached on ${error.config?.method?.toUpperCase()} ${error.config?.url} — not logging out, likely a race or missing auth header.`
      )
    }
    // 403 (insufficient role/permission) is intentionally NOT handled here —
    // the user IS authenticated, they just lack permission for that one
    // endpoint. Let the calling code show its own error instead of logging
    // the user out of the whole app.

    return Promise.reject(error)
  }
)

export default api
export { TOKEN_KEY }
