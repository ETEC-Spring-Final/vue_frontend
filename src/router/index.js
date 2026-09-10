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
| - `/vehicles/:id` and `/explore` are intentionally NOT requiresAuth:
|   vehicle browsing is public (GET /api/vehicles has no auth guard on the
|   backend either). Only "Rent now" / favorite actions inside those pages
|   check auth before navigating onward.
| - `/reservations`, `/my-reservations`, and `/favorites` ARE requiresAuth:
|   creating/viewing reservations and managing favorites always needs a
|   logged-in user on the backend (POST /api/reservations,
|   GET /api/reservations/my-reservations, GET /api/favorites, and
|   DELETE /api/favorites/{vehicleId} all require a JWT), so the guard
|   bounces logged-out users to /login with ?redirect= back to where they
|   came from.
|
*/

import { createRouter, createWebHistory } from 'vue-router'
import useAuthStore from '@/stores/auth.store'

// Page components dashboard-facing (staff/admin) — all require auth and a role in ['ADMIN', 'MANAGER', 'STAFF'] to access. The dashboard layout wraps these.

import BackLayout from '@/layouts/BackLayout.vue'
import Dashboard from '@/pages/dashboard/Dashboard.vue'
import VehicleManagement from '@/pages/dashboard/VehicleManagement.vue'


// page components client-facing
import Login from '@/pages/auth/Login.vue'
import Register from '@/pages/auth/Register.vue'
import ForgotPassword from '@/pages/auth/ForgotPassword.vue'
import ResetPassword from '@/pages/auth/ResetPassword.vue'
import Preview from '@/pages/preview/Preview.vue'
import Home from '@/pages/home/Home.vue'
import Explore from '@/pages/explore/Explore.vue'
import VehicleDetail from '@/pages/vehicles/VehicleDetail.vue'
import ReservationForm from '@/pages/reservations/ReservationForm.vue'
import MyReservations from '@/pages/reservations/MyReservations.vue'
import Favorites from '@/pages/favorites/Favorites.vue'
import RentalHistory from '@/pages/rentals/RentalHistory.vue'
import InvoiceList from '@/pages/invoices/InvoiceList.vue'
import InvoiceDetail from '@/pages/invoices/InvoiceDetail.vue'
import Notifications from '@/pages/notifications/Notifications.vue'
import Profile from '@/pages/profile/Profile.vue'
import OAuth2Redirect from '@/pages/auth/OAuth2Redirect.vue'
import NotFound from '@/pages/NotFound.vue'

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
    component: BackLayout,
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    children: [
      { path: '', component: Dashboard },
      { path: 'vehicles', component: VehicleManagement },

      
      // បន្ថែម child route ថ្មីនៅទីនេះ សម្រាប់ locations, reservations, rentals, ...
    ],
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

  /**
   * Optional home route (disabled for now)
   * Uncomment when switching from preview to real landing page
   */
  // { path: '/', component: Home },
  { path: '/home', component: Home },

  /**
   * Browse/search all vehicles — search bar on Home links here with ?q=.
   */
  { path: '/explore', component: Explore },

  /**
   * Vehicle detail — public browsing page. GET /api/vehicles/{id} on the
   * backend has no auth guard, so this route doesn't either; only actions
   * taken from this page (Rent now, favorite) check auth individually.
   */
  { path: '/vehicles/:id', component: VehicleDetail },

  /**
   * Reservation form — reached from VehicleDetail's "Rent now" button via
   * /reservations?vehicleId=123. Requires auth: POST /api/reservations
   * needs a JWT on the backend.
   */
  {
    path: '/reservations',
    component: ReservationForm,
    meta: { requiresAuth: true },
  },

  /**
   * My Reservations — list + cancel. Requires auth: both
   * GET /api/reservations/my-reservations and
   * PATCH /api/reservations/{id}/cancel need a JWT on the backend.
   */
  {
    path: '/my-reservations',
    component: MyReservations,
    meta: { requiresAuth: true },
  },

  /**
   * Favorites — list + remove. Requires auth: GET /api/favorites and
   * DELETE /api/favorites/{vehicleId} both need a JWT on the backend.
   */
  {
    path: '/favorites',
    component: Favorites,
    meta: { requiresAuth: true },
  },

  /**
   * My Rentals — status timeline + document upload. Requires auth:
   * GET /api/rentals/my-rentals, POST /api/rental-documents/{id}/upload,
   * and GET /api/rental-documents/my-rental-document all need a JWT.
   */
  {
    path: '/my-rentals',
    component: RentalHistory,
    meta: { requiresAuth: true },
  },

  {
    path: '/my-invoices',
    component: InvoiceList,
    meta: { requiresAuth: true },
  },
  {
    path: '/my-invoices/:id',
    component: InvoiceDetail,
    meta: { requiresAuth: true },
  },

  {
    path: '/notifications',
    component: Notifications,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    component: Profile,
    meta: { requiresAuth: true },
  },

  /**
   * Google OAuth callback target. The backend's
   * OAuth2AuthenticationSuccessHandler redirects here with ?token=... after
   * a successful Google sign-in; this page decodes the JWT, calls
   * authStore.login(), and forwards the user to /home or /dashboard.
   * No requiresAuth here — the user isn't logged in yet when they land on
   * this page, this route is what logs them in.
   */
  { path: '/oauth2/redirect', component: OAuth2Redirect },

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