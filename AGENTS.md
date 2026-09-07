# Agent Instructions

The full project guide (backend + frontend) lives in
[`../spring_backend/agent_guid_to_do.md`](../spring_backend/agent_guid_to_do.md) — **read that
file before making changes.** It covers the Vue 3 frontend structure, conventions, commands, and
recommended next steps.

Quick reference:

```bash
npm install       # install dependencies
npm run dev       # run the Vite dev server
npm run build     # production build
npm run preview   # preview the build
```

Frontend stack: Vue 3 (`<script setup>`), Vite 8, Tailwind CSS 4, Vue Router, Axios.
The `@` alias points to `src/`. See the guide for the folder layout and conventions.

---

## "To do next" on the frontend

The backend already exposes the auth + CRUD endpoints below (all under the `/api` base URL,
auth via JWT `Authorization: Bearer <token>` for everything except `/api/auth/**`). The frontend
is still an early scaffold — the pages below are **not built yet**, so these are the next steps
in dependency order.

### 0. Foundation (prerequisite)

- [ ] **Vite proxy** in `vite.config.js` → forward `/api` to `http://localhost:8080` so the dev
      server can reach the backend.
- [ ] **Axios wiring** in `services/api.js`: attach the JWT header via an interceptor and handle
      `401` (redirect to login).
- [ ] **Auth guard** in `router/index.js` (`router.beforeEach`) to protect private routes.

### 1. Auth (public endpoints: `POST /api/auth/*`)

Backend ready:
- `register` — `POST /api/auth/register`
- `login` — `POST /api/auth/login` (returns `AuthResponseDTO` with JWT + user)
- `logout` — `POST /api/auth/logout`
- `forgot-password` — `POST /api/auth/forgot-password`
- `reset-password` — `POST /api/auth/reset-password`

Apply to existing `pages/auth/Login.vue` and `pages/auth/Register.vue` (currently static), then
store the token in `stores/auth.store.js` and persist it.

### 2. Vehicle browsing (public GET endpoints)

Backend ready:
- `GET /api/vehicles` — list
- `GET /api/vehicles/{id}` — detail
- `GET /api/vehicle-images/{id}` — images by vehicle id
- `GET /api/locations` — pickup/return branches

Build the customer-facing flow: vehicle list + search/filter on `pages/home/Home.vue` /
`pages/home/home/Card.vue`, a vehicle **detail** page showing images, spec, price, and
availability, and pick-up/return location selectors.

### 3. Booking / reservation (authenticated)

Backend ready:
- `POST /api/reservations` — create
- `GET /api/reservations/my-reservations` — my bookings
- `PATCH /api/reservations/{id}/cancel` — cancel
- `GET /api/favorites` / `POST /api/favorites/{vehicleId}` /
  `DELETE /api/favorites/{vehicleId}` — wishlist

Add a reserve/book dialog, a "My Reservations" page with cancel, and a favorites toggle.

### 4. Rental + documents (authenticated / staff)

Backend ready:
- `GET /api/rentals/my-rentals` — my rentals
- `POST /api/rental-documents/{rentalId}/upload` (multipart) — upload driver docs
- `GET /api/rental-documents/my-rental-document` — my documents
- `GET /api/inspections/rental/{rentalId}` — pickup/return inspection report

Add a "Rental history / current rental" page that shows documents to upload and inspections.

### 5. Payments (authenticated / staff)

Backend ready:
- `GET /api/invoices/my-invoices` — my bills
- `GET /api/discounts` — available coupons
- `POST /api/v1/bakong/**` — Bakong payment (public)

Add a payment/invoice screen that lists invoices, lets the customer apply a discount, and
triggers a Bakong payment for the outstanding amount.

### 6. Reviews & notifications (authenticated)

Backend ready:
- `POST /api/reviews` / `PUT · DELETE /api/reviews/{id}` — rate & review a vehicle
- `GET /api/reviews/vehicle/{vehicleId}` (paginated) — show reviews on vehicle detail
- `GET /api/notifications/me/inbox` — my notification inbox
- `GET /api/user-profiles/me/login-history` — my login history

Add review submission/listing on the vehicle detail page, a notification bell page, and a
profile section showing login history.

### 7. Admin / dashboard (roles: ADMIN, MANAGER, STAFF)

Backend ready:
- `GET /api/admin/login-history` — all users' login history
- CRUD for `vehicles`, `locations`, `rentals`, `reservations`, `discounts`, `services`,
  `maintenance-records`, `inspections`, `attachments`, `vehicle-images`, `rental-documents`

Build the `pages/dashboard/Dashboard.vue` admin screen: management tables (list/create/edit/
delete) per resource, plus staff actions like `PATCH /api/rentals/{id}/status` and
`PATCH /api/reservations/{id}/status` to advance bookings through the lifecycle.

### Conventions to follow while building

- Route public pages through `layouts/FrontLayout.vue`, protected/admin pages through
  `layouts/BackLayout.vue`.
- Put reusable inputs/buttons in `components/base/`; keep features organized per
  `modules/NOTE.md` (feature-based) instead of scattering flat folders.
- Reuse `components/base/BaseButton.vue` / `BaseInput.vue`; add new base components there.
- Keep all HTTP in `services/api.js` (or per-feature service files under `src/modules/`).
- Verify with `npm run build` before considering a change complete.
