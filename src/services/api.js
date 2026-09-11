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
   * redirect to /login so the user can re-authenticate. Other errors are
   * passed through unchanged so callers can handle them (e.g. show a toast).
   */
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('auth_user')
        // Avoid an infinite loop if the 401 came from the login call itself
        if (router.currentRoute.value.path !== '/login') {
          router.push('/login')
        }
      }
      return Promise.reject(error)
    }
  )

  export default api
  export { TOKEN_KEY }