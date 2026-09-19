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
| - The root path ("/") now serves the real marketing landing page (Home).
|   The old demo screen is still reachable at /preview for reference, but it
|   is no longer what a first-time visitor lands on.
| - `meta.requiresAuth` marks a route as needing a logged-in user
| - `meta.roles` (optional) restricts a route to specific roles, e.g.
|   ['ADMIN', 'MANAGER'] — omit it to allow any authenticated role
| - `meta.guestOnly` marks a route that a logged-in user shouldn't see
|   (login/register) — they get redirected to /dashboard instead
| - `/login` and `/register` both render the SAME component (`AuthLayout`),
|   with a `mode` prop distinguishing them. This is intentional: Vue Router
|   does not destroy/recreate a component when navigating between two
|   routes that share the same component, only its props change — that's
|   what makes the cross-slide transition inside AuthLayout.vue smooth.
| - `/reset-password` is intentionally NOT guestOnly: a user should be able
|   to open a reset link from email even if they (or someone else) happen
|   to be logged in on this browser/session at the time.
| - `/vehicles/:id` and `/explore` are intentionally NOT requiresAuth:
|   vehicle browsing is public (GET /api/vehicles has no auth guard on the
|   backend either). Only "Rent now" / favorite actions inside those pages
|   check auth before navigating onward.
| - `/booking`, `/my-reservations`, `/my-invoices`, `/payment`, and
|   `/favorites` ARE requiresAuth: creating/viewing reservations and
|   managing favorites always needs a logged-in user on the backend
|   (POST /api/reservations,
|   GET /api/reservations/my-reservations, GET /api/favorites, and
|   DELETE /api/favorites/{vehicleId} all require a JWT), so the guard
|   bounces logged-out users to /login with ?redirect= back to where they
|   came from.
|
*/

import { createRouter, createWebHistory } from 'vue-router'
import useAuthStore from '@/stores/auth.store'
import AuthLayout from '@/layouts/AuthLayout.vue'  // ✅ ត្រូវនឹងទីតាំងថ្មី

// Page components dashboard-facing (staff/admin) — all require auth and a role in ['ADMIN', 'MANAGER', 'STAFF'] to access. The dashboard layout wraps these.

import BackLayout from '@/layouts/BackLayout.vue'
import Dashboard from '@/pages/dashboard/Dashboard.vue'
import AdminProfile from '@/pages/dashboard/AdminProfile.vue'
import VehicleManagement from '@/pages/dashboard/VehicleManagement.vue'
import LocationManagement from '@/pages/dashboard/LocationManagement.vue'
import ReservationManagement from '@/pages/dashboard/ReservationManagement.vue'
import RentalManagement from '@/pages/dashboard/RentalManagement.vue'
import CustomerManagement from '@/pages/dashboard/CustomerManagement.vue'
import DiscountManagement from '@/pages/dashboard/DiscountManagement.vue'
import InvoiceManagement from '@/pages/dashboard/InvoiceManagement.vue'
import ReviewManagement from '@/pages/dashboard/ReviewManagement.vue'
import NotificationManagement from '@/pages/dashboard/NotificationManagement.vue'
import MaintenanceManagement from '@/pages/dashboard/MaintenanceManagement.vue'
import ServiceManagement from '@/pages/dashboard/ServiceManagement.vue'
import AuditLogManagement from '@/pages/dashboard/AuditLogManagement.vue'
import LoginHistoryManagement from '@/pages/dashboard/LoginHistoryManagement.vue'
import Settings from '@/pages/dashboard/Settings.vue'

// page components client-facing
import ForgotPassword from '@/pages/auth/ForgotPassword.vue'
import ResetPassword from '@/pages/auth/ResetPassword.vue'
import Home from '@/pages/home/Home.vue'
import Explore from '@/pages/explore/Explore.vue'
import VehicleDetail from '@/pages/vehicles/VehicleDetail.vue'
import Booking from '@/pages/booking/Booking.vue'
import MyReservations from '@/pages/reservations/MyReservations.vue'
import Favorites from '@/pages/favorites/Favorites.vue'
import RentalHistory from '@/pages/rentals/RentalHistory.vue'
import InvoiceList from '@/pages/invoices/InvoiceList.vue'
import InvoiceDetail from '@/pages/invoices/InvoiceDetail.vue'
import Payment from '@/pages/payment/Payment.vue'
import Notifications from '@/pages/notifications/Notifications.vue'
import Contact from '@/pages/contact/Contact.vue'
import AboutUs from '@/pages/about/AboutUs.vue'
import Profile from '@/pages/profile/Profile.vue'
import OAuth2Redirect from '@/pages/auth/OAuth2Redirect.vue'
import NotFound from '@/pages/NotFound.vue'

/**
 * Route definitions
 * Each route maps a URL path to a specific page component
 */
const routes = [
  /**
   * Default entry route — the real landing page.
   *
   * "/" and "/home" both render Home so old links, bookmarks and the
   * `defaultRedirect()` in auth.store keep working. Home is the canonical
   * path used in navigation; "/" is what visitors type.
   */
  { path: '/', name: 'home', component: Home },
  { path: '/home', redirect: '/' },

  /**
   * Preview page (structure/demo screen).
   *
   * Kept for reference while the marketing site is being built, but it is
   * no longer served at the root. Lazy-loaded so its components are not
   * bundled into the initial chunk that every real visitor downloads.
   */
  { path: '/preview', component: () => import('@/pages/preview/Preview.vue') },

  /**
   * Main application dashboard
   * Staff-facing area — requires ADMIN, MANAGER, or STAFF role
   */
  {
    path: '/dashboard',
    component: BackLayout,
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'STAFF'], hideGlobalHeader: true },
    children: [
      { path: '', component: Dashboard },
      { path: 'profile', component: AdminProfile },
      { path: 'vehicles', component: VehicleManagement },
      { path: 'locations', component: LocationManagement },
      { path: 'reservations', component: ReservationManagement },
      { path: 'rentals', component: RentalManagement },
      { path: 'customers', component: CustomerManagement, meta: { roles: ['ADMIN'] } },
      { path: 'discounts', component: DiscountManagement, meta: { roles: ['ADMIN'] } },
      { path: 'invoices', component: InvoiceManagement },
      { path: 'reviews', component: ReviewManagement },
      { path: 'notifications', component: NotificationManagement },
      { path: 'maintenance', component: MaintenanceManagement },
      { path: 'services', component: ServiceManagement },
      { path: 'audit-logs', component: AuditLogManagement, meta: { roles: ['ADMIN', 'MANAGER'] } },
      { path: 'login-history', component: LoginHistoryManagement, meta: { roles: ['ADMIN', 'MANAGER'] } },
      { path: 'settings', component: Settings, meta: { roles: ['ADMIN', 'MANAGER'] } },

      // បន្ថែម child route ថ្មីនៅទីនេះ សម្រាប់ locations, reservations, rentals, ...
    ],
  },

  /**
   * Authentication routes
   * `guestOnly`: an already-logged-in user is redirected away
   *
   * Both routes render AuthLayout with a `mode` prop — see the note at the
   * top of this file for why they intentionally share one component.
   */
  { path: '/login', component: AuthLayout, props: { mode: 'login' }, meta: { guestOnly: true } },
  { path: '/register', component: AuthLayout, props: { mode: 'register' }, meta: { guestOnly: true } },
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
   * Browse/search all vehicles — search bar on Home links here with ?q=.
   */
  { path: '/explore', component: Explore },
  { path: '/contact', component: Contact },
  { path: '/about', component: AboutUs },

  /**
   * Vehicle detail — public browsing page. GET /api/vehicles/{id} on the
   * backend has no auth guard, so this route doesn't either; only actions
   * taken from this page (Rent now, favorite) check auth individually.
   */
  { path: '/vehicles/:id', component: VehicleDetail },

  /**
   * Booking form — reached from VehicleDetail's "Rent now" button via
   * /booking/:vehicleId. Requires auth: POST /api/reservations needs a JWT
   * on the backend. The legacy /reservations?vehicleId= path is kept for
   * old bookmarks and renders the same Booking page.
   */
  {
    path: '/booking/:vehicleId',
    component: Booking,
    meta: { requiresAuth: true },
  },
  {
    path: '/reservations',
    component: Booking,
    meta: { requiresAuth: true },
  },

  /**
   * Payment — scanned QR + Bakong polling + confirm-payment for one invoice.
   * Requires auth: POST /api/invoices/{id}/confirm-payment needs a JWT.
   */
  {
    path: '/payment/:invoiceId',
    component: Payment,
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
   * GET /api/rentals/my-rentals and GET /api/rental-documents/my-rental-document
   * both need a JWT. Document upload now goes through the two-step attachment
   * flow (POST /api/attachments then POST /api/rental-documents).
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
   * authStore.login(), and forwards the user to / or /dashboard.
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
 *
 * scrollBehavior matters now that the landing page is long and section-based:
 * a fresh navigation should start at the top, an in-page anchor (#fleet,
 * #how-it-works) should scroll smoothly to that section, and going Back should
 * restore where the visitor was in the fleet grid.
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 }
    return { top: 0 }
  },
})

/**
 * Global navigation guard
 * - Blocks `requiresAuth` routes for logged-out users → redirects to /login
 *   (keeps the intended destination in `?redirect=` so Login can send them
 *   back after a successful sign-in)
 * - Blocks routes whose `meta.roles` doesn't include the user's role →
 *   redirects to / (the landing page)
 * - Blocks `guestOnly` routes (login/register) for already-logged-in users
 */
router.beforeEach((to) => {
  const { isAuthenticated, hasRole } = useAuthStore()

  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !hasRole(...to.meta.roles)) {
    return { path: '/' }
  }

  if (to.meta.guestOnly && isAuthenticated()) {
    return { path: '/dashboard' }
  }

  return true
})

export default router
