<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import useAuthStore from "@/stores/auth.store";
import useSiteSettingsStore from "@/stores/siteSettings.store";

const router = useRouter();
const { state: authState, isAuthenticated, logout } = useAuthStore();
const { state: siteSettings } = useSiteSettingsStore();

const navLinkClass =
  "relative text-sm font-semibold text-[#6B7280] transition-colors duration-200 hover:text-[#3D5FE0] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#3D5FE0] after:transition-all after:duration-300 hover:after:w-full";
const navLinkActiveClass = "text-[#3D5FE0] after:w-full";

const menuOpen = ref(false);
const menuRef = ref(null);
const mobileOpen = ref(false);
const scrolled = ref(false);

const displayName = computed(() => {
  const user = authState.user;
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return user?.email || "";
});

const initials = computed(() => {
  const user = authState.user;
  const fromName = (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "");
  return (fromName || user?.email || "U").slice(0, 2).toUpperCase();
});

function handleLogout() {
  menuOpen.value = false;
  logout?.();
  router.push("/login");
}

function onClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false;
  }
}

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b transition-all duration-300"
    :class="scrolled
      ? 'border-[#E5E7EB] bg-white/80 backdrop-blur-lg shadow-sm'
      : 'border-transparent bg-white'"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

      <!-- Logo -->
      <RouterLink
        to="/home"
        class="group shrink-0 flex items-center gap-2 text-lg font-bold text-[#1A2036] transition-transform duration-200 hover:scale-[1.03]"
      >
        <span
          class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#3D5FE0] to-[#6C8CFF] shadow-md shadow-[#3D5FE0]/20 transition-transform duration-300 group-hover:rotate-6"
        >
          <img v-if="siteSettings.logoUrl" :src="siteSettings.logoUrl" alt="Logo" class="h-full w-full object-cover" />
          <svg v-else viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-white">
            <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
          </svg>
        </span>
        <span>{{ siteSettings.siteName || 'CarRental' }}</span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="hidden sm:flex items-center gap-8">
        <RouterLink to="/home" :class="navLinkClass" :active-class="navLinkActiveClass">Home</RouterLink>
        <RouterLink to="/explore" :class="navLinkClass" :active-class="navLinkActiveClass">Explore</RouterLink>
        <template v-if="isAuthenticated()">
          <RouterLink to="/favorites" :class="navLinkClass" :active-class="navLinkActiveClass">Favorites</RouterLink>
          <RouterLink to="/my-reservations" :class="navLinkClass" :active-class="navLinkActiveClass">My Reservations</RouterLink>
          <RouterLink to="/my-rentals" :class="navLinkClass" :active-class="navLinkActiveClass">My Rentals</RouterLink>
        </template>
      </nav>

      <div class="flex shrink-0 items-center gap-3">
        <template v-if="isAuthenticated()">
          <div class="relative" ref="menuRef">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#1A2036] ring-2 ring-transparent transition-all duration-200 hover:ring-[#3D5FE0]/40 active:scale-95"
              @click="menuOpen = !menuOpen"
              aria-label="Account menu"
            >
              <img v-if="authState.user?.profilePicture" :src="authState.user.profilePicture" alt="" class="h-full w-full object-cover" />
              <span v-else>{{ initials }}</span>
            </button>

            <transition name="menu-pop">
              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl border border-[#E5E7EB] bg-white py-2 shadow-xl z-50"
              >
                <div class="px-4 py-2.5 border-b border-[#E5E7EB]">
                  <p class="truncate text-sm font-semibold text-[#1A2036]">{{ displayName }}</p>
                  <p class="truncate text-xs text-[#6B7280]">{{ authState.user?.email }}</p>
                </div>
                <RouterLink
                  to="/profile"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1A2036] transition-colors duration-150 hover:bg-[#F3F4F6]"
                  @click="menuOpen = false"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Profile
                </RouterLink>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#DC2626] transition-colors duration-150 hover:bg-red-50"
                  @click="handleLogout"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                  Logout
                </button>
              </div>
            </transition>
          </div>
        </template>
        <template v-else>
          <RouterLink
            to="/login"
            class="hidden sm:inline-flex rounded-full bg-[#3D5FE0] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-[#3D5FE0]/25 transition-all duration-200 hover:bg-[#3350C0] hover:shadow-lg hover:shadow-[#3D5FE0]/30 active:scale-95"
          >
            Login
          </RouterLink>
        </template>

        <!-- Mobile hamburger -->
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full text-[#1A2036] transition-colors duration-150 hover:bg-[#F3F4F6] sm:hidden"
          @click="mobileOpen = !mobileOpen"
          aria-label="Toggle menu"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path v-if="!mobileOpen" d="M4 7h16M4 12h16M4 17h16"/>
            <path v-else d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu (slide down) -->
    <transition name="mobile-slide">
      <div v-if="mobileOpen" class="sm:hidden border-t border-[#E5E7EB] bg-white px-4 py-4 space-y-1">
        <RouterLink to="/home" class="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#1A2036] transition-colors hover:bg-[#F3F4F6]" @click="mobileOpen = false">Home</RouterLink>
        <RouterLink to="/explore" class="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#1A2036] transition-colors hover:bg-[#F3F4F6]" @click="mobileOpen = false">Explore</RouterLink>
        <template v-if="isAuthenticated()">
          <RouterLink to="/favorites" class="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#1A2036] transition-colors hover:bg-[#F3F4F6]" @click="mobileOpen = false">Favorites</RouterLink>
          <RouterLink to="/my-reservations" class="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#1A2036] transition-colors hover:bg-[#F3F4F6]" @click="mobileOpen = false">My Reservations</RouterLink>
          <RouterLink to="/my-rentals" class="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#1A2036] transition-colors hover:bg-[#F3F4F6]" @click="mobileOpen = false">My Rentals</RouterLink>
          <RouterLink to="/profile" class="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#1A2036] transition-colors hover:bg-[#F3F4F6]" @click="mobileOpen = false">Profile</RouterLink>
        </template>
        <RouterLink v-else to="/login" class="block rounded-xl bg-[#3D5FE0] px-4 py-2.5 text-center text-sm font-semibold text-white" @click="mobileOpen = false">Login</RouterLink>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.menu-pop-enter-active, .menu-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-pop-enter-from, .menu-pop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

.mobile-slide-enter-active, .mobile-slide-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
}
.mobile-slide-enter-from, .mobile-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.mobile-slide-enter-to, .mobile-slide-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>