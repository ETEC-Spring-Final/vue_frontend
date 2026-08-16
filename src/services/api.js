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
| - Allow extension (interceptors, headers, auth tokens)
|
| Notes:
| - baseURL is set to "/api" (can be proxied in Vite or backend)
| - Add interceptors here for auth, error handling, logging
|
*/

import axios from 'axios'

/**
 * Axios instance
 * Used for all API requests in the application
 */
const api = axios.create({
  baseURL: '/api',
})

export default api