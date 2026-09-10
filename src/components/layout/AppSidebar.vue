<template>
  <aside class="flex h-screen w-64 shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
    <div class="flex h-16 items-center px-6">
      <RouterLink to="/dashboard" class="text-lg font-bold text-[#1A2036]">CarRental Admin</RouterLink>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#1A2036]"
        active-class="!bg-[#E9EDFB] !text-[#3D5FE0]"
      >
        <span class="h-2 w-2 shrink-0 rounded-full bg-current opacity-40"></span>
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="border-t border-[#E5E7EB] p-4">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9EDFB] text-xs font-semibold text-[#3D5FE0]">
          {{ initials }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-[#1A2036]">{{ user?.email }}</p>
          <p class="text-xs text-[#9CA3AF]">{{ user?.role }}</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-3 w-full rounded-full bg-[#F3F4F6] py-2 text-xs font-semibold text-[#1A2036] hover:bg-[#F9FAFB]"
        @click="onLogout"
      >
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth.store'

const router = useRouter()
const { user, hasRole, logout } = useAuthStore()

// Each item can optionally restrict to specific roles via `roles`.
// Omit `roles` to show to any authenticated admin-area user.
const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/dashboard/vehicles', label: 'Vehicles' },
  { path: '/dashboard/locations', label: 'Locations' },
  { path: '/dashboard/reservations', label: 'Reservations' },
  { path: '/dashboard/rentals', label: 'Rentals' },
  { path: '/dashboard/customers', label: 'Customers', roles: ['ADMIN'] },
  { path: '/dashboard/discounts', label: 'Discounts', roles: ['ADMIN'] },
  { path: '/dashboard/invoices', label: 'Invoices' },
  { path: '/dashboard/reviews', label: 'Reviews' },
  { path: '/dashboard/notifications', label: 'Notifications' },
  { path: '/dashboard/maintenance', label: 'Maintenance' },
  { path: '/dashboard/services', label: 'Services' },
  { path: '/dashboard/audit-logs', label: 'Audit Logs', roles: ['ADMIN', 'MANAGER'] },
  { path: '/dashboard/login-history', label: 'Login History', roles: ['ADMIN', 'MANAGER'] },
]

const visibleItems = computed(() => navItems.filter((item) => !item.roles || hasRole(...item.roles)))

const initials = computed(() => {
  const email = user?.email || ''
  return email.slice(0, 2).toUpperCase()
})

function onLogout() {
  logout()
  router.push('/login')
}
</script>