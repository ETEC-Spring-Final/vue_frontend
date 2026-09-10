/*
|--------------------------------------------------------------------------
| File: router/index.js
|--------------------------------------------------------------------------
|
| Description:
| Defines the application routes and navigation behavior using Vue Router.
|
| Responsibilities:
| - Map URL paths to page components
| - Configure default entry route
| - Organize public and feature routes
| - Guard private/role-restricted routes via `router.beforeEach`
|
| Notes:
| - The root path ("/") currently redirects to "/preview" for demo purposes
| - Update the root route to Home when moving to production
| - `meta.requiresAuth` marks a route as needing a logged-in user
| - `meta.roles` (optional) restricts a route to specific roles, e.g.
|   ['ADMIN', 'MANAGER'] — omit it to allow any authenticated role
| - `meta.guestOnly` marks a route that a logged-in user shouldn't see
|   (login/register) — they get redirected to /dashboard instead
| - `/reset-password` is intentionally NOT guestOnly: a user should be able
|   to open a reset link from email even if they (or someone else) happen
|   to be logged in on this browser/session at the time.
|
*/

import { createRouter, createWebHistory } from 'vue-router'
import useAuthStore from '@/stores/auth.store'

// Page components
import Dashboard from '@/pages/dashboard/Dashboard.vue'
import Login from '@/pages/auth/Login.vue'
import Register from '@/pages/auth/Register.vue'
import ForgotPassword from '@/pages/auth/ForgotPassword.vue'
import ResetPassword from '@/pages/auth/ResetPassword.vue'
import Preview from '@/pages/preview/Preview.vue'
import Home from '@/pages/home/Home.vue'
import NotFound from '@/pages/NotFound.vue'
import OAuthRedirect from '@/pages/auth/OAuthRedirect.vue'

/**
 * Route definitions
 * Each route maps a URL path to a specific page component
 */
const routes = [
  /**
   * Default entry route
   * Redirects "/" to "/preview" to showcase the project structure
   */
  { path: '/', redirect: '/preview' },

  /**
   * Preview page (landing/demo screen)
   * Displays project structure and navigation examples
   */
  { path: '/preview', component: Preview },

  /**
   * Main application dashboard
   * Staff-facing area — requires ADMIN, MANAGER, or STAFF role
   */
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  },

  /**
   * Authentication routes
   * `guestOnly`: an already-logged-in user is redirected away
   */
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },
  { path: '/forgot-password', component: ForgotPassword, meta: { guestOnly: true } },

  /**
   * Reset password — NOT guestOnly.
   * A user clicking a reset link from email must be able to reach this
   * page regardless of whether a session happens to be active in this
   * browser. Previously this had `guestOnly: true`, which caused an
   * already-logged-in session to be redirected to /dashboard, then bounced
   * again to /home if the user's role wasn't in /dashboard's allowed roles.
   */
  { path: '/reset-password', component: ResetPassword },
  { path: '/oauth2/redirect', component: OAuthRedirect },

  /**
   * Optional home route (disabled for now)
   * Uncomment when switching from preview to real landing page
   */
  // { path: '/', component: Home },
  { path: '/home', component: Home },

  /**
   * Catch-all route
   * Displays a styled 404 page for unknown paths
   */
  { path: '/:pathMatch(.*)*', component: NotFound },
]

/**
 * Router instance configuration
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * Global navigation guard
 * - Blocks `requiresAuth` routes for logged-out users → redirects to /login
 *   (keeps the intended destination in `?redirect=` so Login can send them
 *   back after a successful sign-in)
 * - Blocks routes whose `meta.roles` doesn't include the user's role →
 *   redirects to /dashboard (or /home if not authenticated at all — should
 *   not normally happen since requiresAuth is checked first)
 * - Blocks `guestOnly` routes (login/register) for already-logged-in users
 */
router.beforeEach((to) => {
  const { isAuthenticated, hasRole } = useAuthStore()

  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !hasRole(...to.meta.roles)) {
    return { path: '/home' }
  }

  if (to.meta.guestOnly && isAuthenticated()) {
    return { path: '/dashboard' }
  }

  return true
})

export default router