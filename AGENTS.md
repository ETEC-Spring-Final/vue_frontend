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
- **HTTP:** Axios (central `services/api.js`, `baseURL: "/api"`, proxy → `http://localhost:8080`)
- **State:** reactive store (`stores/auth.store.js`) — not Pinia yet

---

## Folder structure

```
vue_frontend/src/
├── App.vue                      # root, just <RouterView />
├── main.js                      # createApp + router
├── style.css                    # Tailwind + Google Fonts
├── components/
│   ├── base/                    # BaseButton.vue, BaseInput.vue
│   ├── layout/                  # (empty — build AppHeader/AppSidebar/AppFooter/AppNavbar here)
│   └── ui/                      # (empty — build Modal, Toast, Badge, StatCard, DataTable here)
├── composables/                 # useFetch.js
├── layouts/
│   ├── FrontLayout.vue          # public pages wrapper (placeholder — needs real header/footer)
│   └── BackLayout.vue           # admin layout (empty template — needs sidebar + header)
├── modules/                     # recommended feature structure (see modules/NOTE.md)
├── pages/
│   ├── auth/                    # Login, Register, ForgotPassword, ResetPassword (all wired ✅)
│   ├── dashboard/               # Dashboard.vue (placeholder — admin panel)
│   ├── home/                    # Home.vue (mock data), home/Card.vue
│   ├── preview/                 # demo landing (preview/components/LeftPannel, RightPannel, PreText)
│   └── NotFound.vue
├── router/index.js              # routes + auth guard (requiresAuth / roles / guestOnly)
├── services/api.js              # Axios instance + JWT interceptor + 401 handling
└── stores/auth.store.js         # session state, persists to localStorage
```

---

## Design system

### Brand colors (always reuse these)

| Token | Hex | Usage |
|-------|-----|-------|
| primary | `#3D5FE0` | buttons, links, active pills, accents |
| primary-hover | `#3350C0` | hover states |
| primary-light | `#E9EDFB` | avatar circles, icon containers |
| dark | `#1A2036` | headings, card grid backgrounds |
| input-bg | `#F3F4F6` | pill input backgrounds |
| hover-bg | `#F9FAFB` | subtle card/button hover |
| border | `#E5E7EB` | card borders, dividers |
| muted | `#9CA3AF` | placeholder text, muted icons |
| secondary-text | `#6B7280` | descriptions, secondary labels |
| danger | `#EF4444` / `#DC2626` | favorite heart, errors, deletes |
| success | `#22C55E` | paid/success badges |

### Component style recipes

**Pill input** (auth pages use this; reuse the pattern, not duplicated markup):
```html
<div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
  <svg class="h-5 w-5 shrink-0 text-[#9CA3AF]">...</svg>
  <input class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none" />
</div>
```

**Primary pill button**:
```html
<button class="w-full rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white
               transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50">
```

**Card:**
```html
<article class="overflow-hidden rounded-2xl border border-[#E5E7EB]">
  <div class="p-4">...</div>
</article>
```

**Badge:**
```html
<span class="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white bg-[#3D5FE0]">
```

**Error banner:**
```html
<div class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ message }}</div>
```

**Avatar circle:**
```html
<div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#E9EDFB] text-sm font-semibold text-[#3D5FE0]">
  AB
</div>
```

### Layout widths & spacing

- Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`
- Page padding: `py-6` … `py-12`
- Card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`
- Section divider: `mt-6` … `mt-8`

---

## Page design specs

### Home (`/home`) — `pages/home/Home.vue`

Already styled. Replace the **mock `cars` ref** with live data:
- `api.get('/vehicles')` → list
- `api.get('/vehicle-images/{vehicleId}')` → images
- `api.get('/locations')` → pickup/return branches

### Vehicle detail (`/vehicles/:id`) — NEW

- Image gallery (vehicle images API)
- Specs grid: brand, model, year, color, type, transmission, fuel, seats, mileage
- Price/day card, availability badge, "Rent now" + favorite toggle
- Reviews: `GET /api/reviews/vehicle/{id}?page=0&size=8`

### Reservation (`/reservations`) — NEW

- Date pickers + location selectors (from `/api/locations`)
- Price breakdown: `(price × days) + insurance + services − discount`
- Submit via `POST /api/reservations`
- My Reservations list with cancel → `PATCH /api/reservations/{id}/cancel`

### Rental history (`/my-rentals`) — NEW

- Sections: current / upcoming / completed via `GET /api/rentals/my-rentals`
- Status timeline (Pending → Confirmed → Picked Up → Active Rental → Returned → Completed)
- Document upload → `POST /api/rental-documents/{rentalId}/upload`
- My documents → `GET /api/rental-documents/my-rental-document`

### Payments / invoices (`/my-invoices`) — NEW

- Invoice list → `GET /api/invoices/my-invoices`
- Discount input, Bakong QR → `POST /api/v1/bakong/generate-qr`
- Poll payment → `POST /api/v1/bakong/check-payment`

### Notifications (`/notifications`) — NEW

- Inbox → `GET /api/notifications/me/inbox`
- Bell icon with unread badge on header

### Profile (`/profile`) — NEW

- Edit profile → `GET/PUT /api/user-profiles/me`
- Login history → `GET /api/user-profiles/me/login-history`
- My reviews → `GET /api/reviews/my-reviews`
- Favorites → `GET /api/favorites`, delete → `DELETE /api/favorites/{vehicleId}`

### Admin dashboard (`/dashboard`) — placeholder, build fully

- **BackLayout.vue:** sidebar nav + header (user info, logout)
- Stat cards (total vehicles, available, rented, today's revenue, total customers)
- CRUD management tables per resource (list/create/edit/delete)
- Status PATCH actions for reservations/rentals
- Sidebar items: Dashboard, Vehicles, Locations, Reservations, Rentals, Customers,
  Invoices, Discounts, Reviews, Notifications, Maintenance, Services, Audit Logs,
  Login History

---

## Routing & auth

Current routes in `router/index.js`:

| Path | Component | Guard |
|------|-----------|-------|
| `/` | → `/preview` | — |
| `/preview` | Preview | — |
| `/home` | Home | — |
| `/login` | Login | guestOnly |
| `/register` | Register | guestOnly |
| `/forgot-password` | ForgotPassword | guestOnly |
| `/reset-password` | ResetPassword | — |
| `/dashboard` | Dashboard | requiresAuth + roles ADMIN/MANAGER/STAFF |
| `/:pathMatch(.*)*` | NotFound | — |

**New routes to add** (align naming with existing style):

| Path | Component | Guard |
|------|-----------|-------|
| `/vehicles/:id` | VehicleDetail | — |
| `/explore` | VehicleList | — |
| `/my-reservations` | MyReservations | requiresAuth |
| `/my-rentals` | RentalHistory | requiresAuth |
| `/my-invoices` | InvoiceList | requiresAuth |
| `/notifications` | Notifications | requiresAuth |
| `/profile` | Profile | requiresAuth |
| `/favorites` | Favorites | requiresAuth |

Auth is fully wired: JWT interceptor in `services/api.js`, session in
`stores/auth.store.js`, guards in `router/index.js`. No work needed there unless adding roles.

---

## Conventions

- 💡 **Design language is already established** — `#3D5FE0` primary, pill inputs, rounded-full
  buttons, `rounded-2xl` cards, `#1A2036` headings, `#6B7280` secondary text. Match the
  existing auth / home pages — don't introduce a new look.
- Build all HTTP through `services/api.js` (add per-feature service files under
  `src/modules/<feature>/services/` when features grow).
- Reuse `components/base/BaseButton.vue` / `BaseInput.vue`; add shared pieces to
  `components/ui/` (Modal, Toast, Badge) and `components/layout/` (Header, Sidebar, Footer).
- Group related UI by feature/module per `modules/NOTE.md` — don't dump everything flat under
  `pages/`.
- Route public pages through `layouts/FrontLayout.vue`; protected/admin pages through
  `layouts/BackLayout.vue`. Both currently need real implementations.
- Follow the `page path = route path` naming: e.g. `/my-reservations` → `pages/my-reservations/`;
  keep components local to their page folder unless shared.
- Use `defineProps` / `defineEmits` / `defineModel` explicitly; Composition API only.
- Verify with `npm run build` before considering a change complete.