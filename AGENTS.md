# Agent Instructions — Vue 3 Car Rental Frontend

Standalone guide for AI coding agents working in `vue_frontend/`. Read this before making
changes. The full project guide (backend + frontend, incl. the API reference) lives in
[`../spring_backend/agent_guid_to_do.md`](../spring_backend/agent_guid_to_do.md) — that file is
the source of truth for endpoints and conventions. **Last verified: 2026-09-17.**

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
- **Build:** Vite (`@vitejs/plugin-vue`)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`
- **Routing:** Vue Router (history mode) — `@` alias → `src/`
- **HTTP:** Axios base instance `services/api.js` (`baseURL: "/api"`, Vite proxy →
  `http://localhost:8080`) + per-feature service files in `services/`
- **I18n:** `vue-i18n` (legacy:false) — `en` / `km` in `src/i18n/locales/`
- **State:** lightweight `reactive()` stores (`auth`, `siteSettings`, `theme`) — **not Pinia**
- **Charts:** `chart.js` + `vue-chartjs` (dashboard)
- **Auth flow (backend):** `POST /api/auth/register|login` return `{ id, email, role, token }`;
  Google OAuth redirects to `/oauth2/redirect?token=...` which decodes the JWT locally.

---

## Folder structure (current)

```
vue_frontend/src/
├── App.vue                       # router-view + page transitions (header is NOT global anymore)
├── main.js                       # router + i18n + fetchSettings() before mount
├── style.css                     # Tailwind + CSS-variable theming (:root / .dark) + Google Fonts
├── components/
│   ├── base/                     # BaseButton.vue, BaseInput.vue
│   ├── common/                   # LanguageSwitcher.vue, ThemeToggle.vue
│   ├── layout/                   # SiteHeader.vue (public, themed), AppHeader.vue (legacy hex),
│   │                              #   AppSidebar.vue (admin), NotificationBell.vue
│   ├── notifications/            # NotificationBell.vue — 🟡 duplicate of layout/ one
│   ├── reviews/                  # StarRating.vue, ReviewList.vue, ReviewForm.vue
│   ├── ui/                       # DataTable.vue, Modal.vue
│   └── vehicles/                 # VehicleCard.vue
├── composables/                  # useFetch.js, useSidebar.js, useTheme.js
├── i18n/                         # index.js (setLocale, persistence) + locales/{en,km}.json
├── layouts/
│   ├── AuthLayout.vue            # login/register split-panel (brand + form cross-slide)
│   └── BackLayout.vue            # admin shell: AppSidebar + header(theme/locale/bell/user) + <RouterView/>
├── pages/
│   ├── auth/                     # LoginForm, RegisterForm, ForgotPassword, ResetPassword, OAuth2Redirect
│   ├── dashboard/                # Dashboard, AdminProfile, + 14 CRUD pages + Settings
│   ├── explore/                  # Explore.vue
│   ├── favorites/                # Favorites.vue
│   ├── home/                     # Home.vue (+ home/home/Card.vue — odd nesting)
│   ├── invoices/                 # InvoiceList.vue, InvoiceDetail.vue
│   ├── notifications/            # Notifications.vue
│   ├── preview/                  # Preview.vue demo landing + components/ (LeftPannel, RightPannel, PreText)
│   ├── profile/                  # Profile.vue
│   ├── rentals/                  # RentalHistory.vue
│   ├── reservations/             # ReservationForm.vue, MyReservations.vue
│   ├── vehicles/                 # VehicleDetail.vue
│   └── NotFound.vue
├── router/index.js               # routes + auth/role guards
├── services/                     # api.js + feature services (see below)
└── stores/                       # auth.store.js, siteSettings.store.js, theme.store.js
```

---

## Services (`src/services/`)

| File | Endpoints used | Notes |
|------|----------------|-------|
| `api.js` | axios base, `TOKEN_KEY` | JWT interceptor; redirects to `/login` on 401 **only when a token was attached**; 403 left to callers |
| `vehicles.js` | `/vehicles`, `/vehicle-images`, `/reviews/vehicle`, `/favorites` | Normalizers `normalizeVehicle*`, `normalizeImage`, `normalizeReview` — **`brand` vs `brandName` still wrong**, fix |
| `reservations.js` | `/reservations`, `/locations`, `/services`, `/discounts` | `calculatePriceBreakdown` helper; ⚠ `getDiscounts`/`getServices` 403 for customers |
| `rentals.js` | `/rentals`, `/rental-documents`, `/inspections` | ⚠ calls **removed** `POST /rental-documents/{id}/upload`; has `RENTAL_STATUS_STEPS` |
| `invoices.js` | `/invoices`, `/v1/bakong` | ⚠ stale Bakong (`check-payment`) — duplicate of `invoice.service.js` |
| `invoice.service.js` | `/invoices`, `/v1/bakong` | used by InvoiceManagement; same stale Bakong shape |
| `favorites.js` | `/favorites` | tiny; add/remove live in `vehicles.js` |
| `reviews.js` | `/reviews` | duplicate of `reviews.service.js` |
| `reviews.service.js` | `/reviews` (+ `/visibility`) | used by ReviewManagement |
| `notifications.js` | `/notifications/me/inbox` | duplicate of `notifications.service.js` |
| `notifications.service.js` | inbox, unread-count, read, read-all, delete, notify, all | |
| `profile.js` | `/user-profiles/me` (+login-history) | duplicate of `profile.service.js` |
| `profile.service.js` | me, updateMe, change-password, login-history | used by AdminProfile + auth store |
| `dashboard.js` | `/vehicles`, `/reservations`, `/rentals` | **client-side** stats → swap for `/api/admin/stats` when backend adds it |
| `discount.service.js` | `/discounts` | ⚠ calls nonexistent `GET /discounts/active` |
| `maintenance.service.js` | `/maintenance-records` | CRUD |
| `siteSettings.service.js` | `/settings` | `getSiteSettings` / `updateSiteSettings` |

**Cleanup rule:** where a file and its `.service.js` twin both exist, keep exactly one.
Prefers: merge into the plain customer-facing file OR the admin-facing `.service.js`, but never
both.

---

## Routes (router/index.js — verified)

| Path | Component | Guard |
|------|-----------|-------|
| `/` | → `/preview` | — (switch to `/home` for production) |
| `/preview` | Preview (demo landing) | — |
| `/home` | Home | — |
| `/explore` | Explore | — (`?q=` seeds search) |
| `/vehicles/:id` | VehicleDetail | — |
| `/login` | AuthLayout (mode=login) | guestOnly |
| `/register` | AuthLayout (mode=register) | guestOnly |
| `/forgot-password` | ForgotPassword | guestOnly |
| `/reset-password` | ResetPassword | — |
| `/oauth2/redirect` | OAuth2Redirect | — (decodes `?token=`) |
| `/reservations` | ReservationForm | requiresAuth (`?vehicleId=`) |
| `/my-reservations` | MyReservations | requiresAuth |
| `/favorites` | Favorites | requiresAuth |
| `/my-rentals` | RentalHistory | requiresAuth |
| `/my-invoices` | InvoiceList | requiresAuth |
| `/my-invoices/:id` | InvoiceDetail | requiresAuth |
| `/notifications` | Notifications | requiresAuth |
| `/profile` | Profile | requiresAuth |
| `/dashboard` (BackLayout) | children | requiresAuth + roles [ADMIN, MANAGER, STAFF] |
| `/dashboard` | Dashboard (stat cards) | roles |
| `/dashboard/profile` | AdminProfile | roles |
| `/dashboard/vehicles` | VehicleManagement | roles |
| `/dashboard/locations` | LocationManagement | roles |
| `/dashboard/reservations` | ReservationManagement | roles |
| `/dashboard/rentals` | RentalManagement | roles |
| `/dashboard/customers` | CustomerManagement | ADMIN |
| `/dashboard/discounts` | DiscountManagement | ADMIN |
| `/dashboard/invoices` | InvoiceManagement | roles |
| `/dashboard/reviews` | ReviewManagement | roles |
| `/dashboard/notifications` | NotificationManagement | roles |
| `/dashboard/maintenance` | MaintenanceManagement | roles |
| `/dashboard/services` | ServiceManagement | roles |
| `/dashboard/audit-logs` | AuditLogManagement | ADMIN, MANAGER |
| `/dashboard/login-history` | LoginHistoryManagement | ADMIN, MANAGER |
| `/dashboard/settings` | Settings | ADMIN, MANAGER |
| `/:pathMatch(.*)*` | NotFound | — |

> All 16 admin child routes are registered and implemented. New admin pages go under the
> `/dashboard` BackLayout block as children with `meta.roles` when restricted.

---

## Design system — two systems in the codebase

The app is mid-migration from hard-coded hex to **CSS custom properties + dark mode + i18n**.
Match the system of the file you're editing. Don't mix them in one file.

### A. New "themed" system (preferred for public site + admin shell)

Tokens in `style.css` (`:root` = light, `.dark` = dark):

```css
--color-bg; --color-surface; --color-border;
--color-text; --color-text-secondary;
--color-primary; --color-primary-hover; --color-primary-light;
```

- Used inline: `:style="{ color: 'var(--color-text)' }"`, `:style="{ backgroundColor: 'var(--color-surface)' }"`.
  Not via Tailwind color classes (the `.dark` variant is driven by the `<html class="dark">` toggle).
- Dark mode: `useTheme()` composable / `theme.store.js` — toggles `dark` on `<html>`, defaults to
  OS preference.
- I18n: `const { t } = useI18n()` → `t('home.greeting', {...})` or `$t` in template. Keys live in
  `en.json` / `km.json`. `setLocale()` from `@/i18n` updates `<html lang>`.
- Fonts: Inter + Noto Sans Khmer; `:lang(km)` switches to Kantumruy Pro.

Files already themed: `SiteHeader.vue`, `Home.vue`, `BackLayout.vue`, `AppSidebar.vue`,
`NotificationBell.vue`, most `pages/dashboard/*`.

### B. Legacy "hard-hex" system

`AppHeader.vue`, `AuthLayout.vue`, `VehicleDetail`, `VehicleCard`, several customer pages.

| Token | Hex |
|-------|-----|
| primary | `#3D5FE0` |
| primary-hover | `#3350C0` |
| primary-light | `#E9EDFB` |
| dark / headings | `#1A2036` |
| input-bg | `#F3F4F6` |
| hover-bg | `#F9FAFB` |
| border | `#E5E7EB` |
| muted | `#9CA3AF` |
| secondary | `#6B7280` |
| danger | `#DC2626` |
| favorite heart | `#EF4444` |
| success | `#22C55E` |

Migration goal: **move remaining hard-hex customer pages to CSS variables** so dark mode + Khmer
work everywhere.

### Recipes that apply to both

```html
<!-- Pill input -->
<div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
  <svg class="h-5 w-5 shrink-0 text-[#9CA3AF]">…</svg>
  <input class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none" />
</div>

<!-- Primary pill button -->
<button class="w-full rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:opacity-50">…</button>

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

- **Public pages** include their own header: `Home.vue` renders `<SiteHeader />`; other public
  pages should do the same (there is **no global header** in `App.vue`).
- **Admin shell (`BackLayout.vue`):** collapsible `AppSidebar` (`w-64`/`w-20`) + header with
  theme toggle, locale toggle (EN/ខ្មែរ), NotificationBell, user menu. Page title is derived from
  the last URL segment (keeps paths that read well).
- Container conventions: public pages `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`; customer pages
  (invoices/profile) `max-w-3xl mx-auto`; admin content in DataTable cards.

---

## Conventions

- **Design language is fixed** — match the file's existing system (§ Design system). Don't invent
  a new palette.
- **HTTP** goes through `services/api.js`; per-feature calls in `services/<feature>.js`. Reuse
  existing functions; don't duplicate.
- **Normalizers** (`vehicles.js`) exist because backend DTO field names were guessed. Real DTO
  shapes are in `../spring_backend/agent_guid_to_do.md` §2.6 (e.g. `VehicleResponseDTO` uses
  `brandName`, not `brand`). If a page breaks, verify the response in Swagger first, then fix the
  normalizer — don't patch templates ad hoc.
- **Page naming:** `pages/<feature>/<Name>.vue` mirrors the route. Route imports must match.
- **Admin CRUD pages:** copy the `VehicleManagement.vue` pattern (DataTable + Modal + api calls +
  error banner + saving states). New pages are children of `/dashboard`.
- **Auth:** `useAuthStore()` → `isAuthenticated()`, `hasRole(...)`, `login`, `logout`,
  `defaultRedirect()`. Hook protected routes to `meta.requiresAuth` / `meta.roles` /
  `meta.guestOnly` — don't hand-roll guards in pages.
- **Brand/site data:** use `useSiteSettingsStore()` (siteName, logoUrl, faviconUrl, contact info)
  — never hardcode the brand (note: `SiteHeader.vue` still hardcodes "Wheelo" — fix when touched).
- **Don't duplicate components** — check `components/` first (`DataTable`, `Modal`, `VehicleCard`,
  reviews components, `ThemeToggle`, `LanguageSwitcher`).
- **New stateful logic** goes in `stores/` or `composables/`; keep the `reactive()` + factory
  pattern used by the existing stores.
- Verify with `npm run build` (or `npm run dev`) before considering a change complete.

---

## 🎯 Public website redesign — where the product is going

Goal: turn the customer-facing site into a polished **marketing + booking website**. The admin
dashboard area is basically done; the next features are all on the public site.

### Must fix before adding features (foundation, do these first)

- [ ] Make `/` redirect to `/home` (stop serving the `/preview` demo at root in production).
- [ ] One public header: `SiteHeader.vue` (themed + i18n) fed from `siteSettings` — remove
      "Wheelo" hardcode; absorb/delete legacy `AppHeader.vue`; keep a single `NotificationBell`.
- [ ] Fix `vehicles.js` `normalizeVehicle` (`brandName`), and `Home.vue` brand chips.
- [ ] Wire real vehicle images into `VehicleCard.vue` via the attachment flow (no SVG placeholder).
- [ ] Fix stale backend contracts in the customer flows: rental-doc upload
      (`rentals.js`), Bakong endpoints (`invoices.js` / `invoice.service.js`), discount/service
      lookups that 403 (`reservations.js`), `discount.service.js` `/active`. See
      `../spring_backend/agent_guid_to_do.md` §2.7 for the matching backend fixes.
- [ ] Migrate remaining hard-hex customer pages (VehicleDetail, VehicleCard, Explore, Profile,
      invoice/reservation/rental lists) to the CSS-variable themed system.

### Landing page (`/home`) — preferred build order

1. Hero (current carousel) + search bar (type, dates) → `/explore` with params.
2. Trust stats (from real counts or siteSettings).
3. Popular fleet grid — `VehicleCard` with real images.
4. "How it works" steps (Search → Reserve → Pick up → Drive).
5. Locations section (`GET /api/locations`).
6. Recent reviews/testimonials (`GET /api/reviews`).
7. Footer with contacts from `siteSettings` (email/phone/address/facebook/telegram).
8. All strings copied into `en.json` + `km.json`.

### Explore & vehicle detail

- Switch Explore to **server-side filtering** once `GET /api/vehicles` accepts query params
  (`type`, `brandId`, `seats`, `price range`, `dates`, `?q=`) — add pagination + sort.
- Vehicle detail: image gallery + lightbox, full spec grid, date/location availability widget,
  add-ons + discount selector, price summary, favorite/share, reviews.

### Booking & account flows

- Multi-step booking wizard with real price data (backend `POST /api/reservations/price` when
  available) instead of client-side math alone.
- Bakong QR + payment polling on invoice/reservation success.
- Rental document upload via the working attachment JSON flow.
- Notification center: read/read-all, types, unread badge.
- Avatar upload + change password on Profile.

### Polish for public site

- SEO/OG tags per route (site name + logo from settings).
- Toasts for mutations (add `composables/useToast.js`), skeleton/empty/error states everywhere.
- Restyle the 404 page to match the marketing look.

---

## "To do next" summary

1. **Phase A foundation** (list above) — unblocks everything else.
2. **Landing page sections** (§ Landing page).
3. **Explore + vehicle detail upgrades**.
4. **Booking wizard + payments + doc upload**.
5. **Cleanup:** duplicate service files, duplicate headers/bells, `home/home/Card.vue` nesting,
   `/` → `/home`, dark-mode migration of legacy-hex pages.