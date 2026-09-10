# Agent Instructions — Vue 3 Car Rental Frontend

Standalone guide for AI coding agents working in `vue_frontend/`. Read this before making
changes. The full project guide (backend + frontend) lives in
[`../spring_backend/agent_guid_to_do.md`](../spring_backend/agent_guid_to_do.md).

---

## Quick reference

```bash
npm install       # install dependencies
npm run dev       # run the Vite dev server
npm run build     # production build
npm run preview   # preview the build
```

---

## Tech stack

- **Framework:** Vue 3 (`<script setup>` Composition API)
- **Build:** Vite 8 (`@vitejs/plugin-vue`)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`
- **Routing:** Vue Router (history mode) — `@` alias → `src/`
- **HTTP:** Axios base instance `services/api.js` (`baseURL: "/api"`, Vite proxy → `http://localhost:8080`),
  plus per-feature service files in `services/`
- **State:** reactive store `stores/auth.store.js` (localStorage-backed) — not Pinia yet

---

## Folder structure (current)

```
vue_frontend/src/
├── App.vue                       # <AppHeader /> + <RouterView /> (header is global)
├── main.js                       # createApp + router
├── style.css                     # Tailwind + Google Fonts
├── components/
│   ├── base/                     # BaseButton.vue, BaseInput.vue
│   ├── layout/                   # AppHeader.vue, AppSidebar.vue, NotificationBell.vue
│   ├── ui/                       # DataTable.vue, Modal.vue
│   ├── vehicles/                 # VehicleCard.vue
│   └── reviews/                  # StarRating.vue, ReviewList.vue, ReviewForm.vue
├── layouts/
│   ├── BackLayout.vue            # admin shell: AppSidebar + header(title) + NotificationBell + <RouterView/>
│   ├── FrontLayout.vue           # 🟡 unused placeholder — header is global in App.vue
│   └── AppHeader.vue             # 🟡 duplicate of components/layout/AppHeader.vue — delete it
├── pages/
│   ├── auth/                     # Login, Register, ForgotPassword, ResetPassword, OAuth2Redirect
│   ├── dashboard/                # Dashboard, VehicleManagement, LocationManagement
│   ├── explore/                  # Explore
│   ├── vehicles/                 # VehicleDetail
│   ├── reservations/             # ReservationForm, MyReservations
│   ├── favorites/                # Favorites
│   ├── rentals/                  # RentalHistory
│   ├── invoices/                 # InvoiceList, InvoiceDetail
│   ├── notifications/            # Notifications
│   ├── profile/                  # Profile
│   ├── home/                     # Home (+ home/Card.vue)
│   ├── preview/                  # demo landing (Preview + components)
│   └── NotFound.vue
├── router/index.js               # routes + auth/role guards + /oauth2/redirect
├── services/                     # api.js + feature services (see below)
└── stores/auth.store.js          # login/logout/isAuthenticated/hasRole/defaultRedirect
```

### Services (`src/services/`)

- **api.js** — axios instance, JWT interceptor, `401 → /login` (clears session)
- **vehicles.js** — list/detail/images/reviews + favorites, and normalizers
  (`normalizeVehicle`, `normalizeVehicleDetail`, `normalizeImage`, `normalizeReview`)
- **reservations.js** — create/list/cancel + `calculatePriceBreakdown` + location/service/discount lookups
- **rentals.js** — my rentals, doc upload, inspection + `RENTAL_STATUS_STEPS` / `rentalStatusStepIndex`
- **invoices.js** — myInvoices, getById, generateQr, checkPayment (Bakong shapes TODO)
- **favorites.js** — getFavorites
- **reviews.js** — forVehicle, countByRating, myReviews, create/update/remove
- **notifications.js** — inbox
- **profile.js** — me, updateMe, loginHistory
- **dashboard.js** — fetchDashboardStats (client-side from /vehicles + /reservations + /rentals)

---

## Routes (router/index.js)

| Path | Component | Guard |
|------|-----------|-------|
| `/` | → `/preview` | — |
| `/preview` | Preview | — |
| `/home` | Home | — (fetches real vehicles) |
| `/explore` | Explore | — (`?q=` seeds search) |
| `/vehicles/:id` | VehicleDetail | — (Rent/favorite check auth) |
| `/login` | Login | guestOnly |
| `/register` | Register | guestOnly |
| `/forgot-password` | ForgotPassword | guestOnly |
| `/reset-password` | ResetPassword | — |
| `/oauth2/redirect` | OAuth2Redirect | — (Google callback, decodes `?token=`) |
| `/reservations` | ReservationForm | requiresAuth (`?vehicleId=`) |
| `/my-reservations` | MyReservations | requiresAuth |
| `/favorites` | Favorites | requiresAuth |
| `/my-rentals` | RentalHistory | requiresAuth |
| `/my-invoices` | InvoiceList | requiresAuth |
| `/my-invoices/:id` | InvoiceDetail | requiresAuth |
| `/notifications` | Notifications | requiresAuth |
| `/profile` | Profile | requiresAuth |
| `/dashboard` (BackLayout) | children below | requiresAuth + roles [ADMIN, MANAGER, STAFF] |
| `/dashboard` | Dashboard (stat cards) | roles |
| `/dashboard/vehicles` | VehicleManagement | roles |
| `/dashboard/locations` | LocationManagement | roles |
| `/:pathMatch(.*)*` | NotFound | — |

**Missing admin children** (sidebar already links to them, but routes aren't registered — they
currently fall to 404): reservations, rentals, customers*(ADMIN)*, discounts*(ADMIN)*, invoices,
reviews, notifications, maintenance, services, audit-logs*(ADMIN/MANAGER)*, login-history*(ADMIN/MANAGER)*.
Add each as a child of the `/dashboard` BackLayout route, copying the VehicleManagement pattern.

---

## Design system

### Brand colors (reuse these — don't invent a new palette)

| Token | Hex | Usage |
|-------|-----|-------|
| primary | `#3D5FE0` | buttons, links, active pill, sidebar active bg text, accents |
| primary-hover | `#3350C0` | hover |
| primary-light | `#E9EDFB` | avatar circles, active sidebar item bg |
| dark | `#1A2036` | headings, card gradient start |
| input-bg | `#F3F4F6` | pill inputs, subtle fills, logout button |
| hover-bg | `#F9FAFB` | card/row hover, table header, admin bg |
| border | `#E5E7EB` | card/borders, dividers |
| muted | `#9CA3AF` | placeholders, uppercase labels, disabled text |
| secondary | `#6B7280` | body descriptions, nav links (inactive) |
| danger | `#DC2626` | errors, delete, notification badge |
| favorite | `#EF4444` | heart fill |
| success | `#22C55E` | positive status |
| white | `#FFFFFF` | cards, admin header, sidebar |

### Reusable components to use (don't rewrite)

- **`components/ui/DataTable.vue`** — admin lists: `columns`, `rows`, `loading`; override cells
  with `#cell-<key>`, add row actions with `#actions`.
- **`components/ui/Modal.vue`** — `open`, `title`, `close` emit; used for create/edit forms.
- **`components/vehicles/VehicleCard.vue`** — vehicle grid card (emits `toggle-favorite`, `rent`).
- **`components/reviews/*`** — `StarRating`, `ReviewList`, `ReviewForm`.
- **`components/base/BaseButton.vue` / `BaseInput.vue`** — primitives.
- **`components/layout/AppHeader.vue` / `AppSidebar.vue` / `NotificationBell.vue`** — shell pieces.

### Style recipes (standard across the app)

```html
<!-- Pill input -->
<div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
  <svg class="h-5 w-5 shrink-0 text-[#9CA3AF]">…</svg>
  <input class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none" />
</div>

<!-- Primary pill button -->
<button class="w-full rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:opacity-50">
  Action
</button>

<!-- Card -->
<article class="overflow-hidden rounded-2xl border border-[#E5E7EB]"><div class="p-4">…</div></article>

<!-- Error banner -->
<div class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ message }}</div>

<!-- Status badge -->
<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E9EDFB] text-[#3D5FE0]">Confirmed</span>

<!-- Loading skeleton -->
<div class="h-28 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
```

### Layout notes

- **Global header:** mounted in `App.vue`, so pages don't wrap themselves. Nav: Home / Explore
  (+ Favorites / My Reservations / My Rentals when auth). Invoices & Profile also exist as routes.
- **Admin shell (`BackLayout`):** sidebar (`w-64`) + header (`h-16`, title auto-derived from route
  path) + NotificationBell + `<RouterView />`. Register new admin pages as **children** of the
  `/dashboard` BackLayout route so the shell wraps them automatically.
- Container conventions: public pages `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`;
  customer pages (invoices/profile) `max-w-3xl mx-auto`; admin pages left-padded, content in
  DataTable cards.

---

## Conventions

- **Design language is fixed:** `#3D5FE0` primary, pill inputs, rounded-full buttons,
  `rounded-2xl` cards, `#1A2036` headings. Match existing pages exactly.
- **HTTP** goes through `services/api.js`; feature calls get their own file in `services/`
  instead of scattering `api.*` calls in pages. Reuse existing functions — don't duplicate.
- **Normalizers** (`vehicles.js`) exist because several backend DTO field names were assumed —
  if a page breaks, first check the real response shape in Swagger, then fix the normalizer
  rather than patching templates.
- **Page naming:** `pages/<feature>/<Name>.vue` mirroring the route (`MyReservations.vue` ↔
  `/my-reservations`). Route component imports must match.
- **Admin CRUD pages:** always start from the `VehicleManagement.vue` pattern (DataTable + Modal
  + `api` calls + error banner + saving state). Register the route in the `/dashboard` children.
- **Auth:** read session via `useAuthStore()` — `isAuthenticated()`, `hasRole(...)`, `login`,
  `logout`, `defaultRedirect()`. Hook new protected routes to `meta.requiresAuth` /
  `meta.roles` — don't hand-roll guards in pages.
- **Don't duplicate components:** check `components/` before writing a new one; move reusable
  pieces there instead of inlining.
- Verify with `npm run build` (or `npm run dev`) before considering a change complete.

---

## "To do next" on the frontend

### 1. Admin management pages (biggest gap) — 11 sidebar routes currently 404

Copy the `VehicleManagement.vue` pattern (DataTable + Modal + CRUD) and register each as a child
route under `/dashboard`:

- **Reservations** — `GET /api/reservations` list + `PATCH /{id}/status`
- **Rentals** — `GET /api/rentals` list + `PATCH /{id}/status` (lifecycle)
- **Customers** (ADMIN) — `GET /api/users`, activate/deactivate, roles
- **Discounts** (ADMIN) — CRUD `/api/discounts`
- **Invoices** — `GET /api/invoices` + status management
- **Reviews** — `GET /api/reviews`, delete inappropriate
- **Notifications mgmt** — `POST /api/notifications/{userId}/notify`
- **Maintenance** — CRUD maintenance records
- **Services** — CRUD `/api/services`
- **Audit Logs** (ADMIN/MANAGER) — `GET /api/admin/audit-logs`
- **Login History** (ADMIN/MANAGER) — `GET /api/admin/login-history`

### 2. Cleanup

- Delete duplicate `src/layouts/AppHeader.vue` (unused; `App.vue` uses `components/layout/AppHeader.vue`)
- Delete or implement unused `src/layouts/FrontLayout.vue`
- Finish Bake Kong payment wiring — confirm request/response vs `BakongController`, complete QR +
  polling in InvoiceList/InvoiceDetail
- Wire real vehicle images into `VehicleCard.vue` (currently SVG placeholder) once image DTO confirmed
- Change `/` redirect from `/preview` → `/home` for production

### 3. Polish

- Success feedback (toast) for mutations; currently only inline errors
- Consistent empty/loading/error states across all pages
- Field-level validation + server error mapping