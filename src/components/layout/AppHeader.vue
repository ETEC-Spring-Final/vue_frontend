<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import useAuthStore from "@/stores/auth.store";

const router = useRouter();
const { user, isAuthenticated, logout } = useAuthStore();

const navLinkClass =
  "text-sm font-semibold text-[#6B7280] transition hover:text-[#3D5FE0]";
const navLinkActiveClass = "text-[#3D5FE0]";

const menuOpen = ref(false);
const menuRef = ref(null);

const displayName = computed(() => {
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return user?.email || "";
});

const initials = computed(() => {
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

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
  <header class="border-b border-[#E5E7EB] bg-white">
    <div
      class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
    >
      <RouterLink to="/home" class="shrink-0 text-lg font-bold text-[#1A2036]">
        CarRental
      </RouterLink>

      <nav class="hidden sm:flex items-center gap-6">
        <RouterLink
          to="/home"
          :class="navLinkClass"
          :active-class="navLinkActiveClass"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/explore"
          :class="navLinkClass"
          :active-class="navLinkActiveClass"
        >
          Explore
        </RouterLink>

        <template v-if="isAuthenticated()">
          <RouterLink
            to="/favorites"
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
          >
            Favorites
          </RouterLink>
          <RouterLink
            to="/my-reservations"
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
          >
            My Reservations
          </RouterLink>
          <RouterLink
            to="/my-rentals"
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
          >
            My Rentals
          </RouterLink>
        </template>
      </nav>

      <div class="flex shrink-0 items-center gap-3">
        <template v-if="isAuthenticated()">
          <div class="relative" ref="menuRef">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#1A2036] transition hover:opacity-80"
              @click="menuOpen = !menuOpen"
              aria-label="Account menu"
            >
              <img
                v-if="user?.profilePicture"
                :src="user.profilePicture"
                alt=""
                class="h-full w-full object-cover"
              />
              <span v-else>{{ initials }}</span>
            </button>

            <transition name="fade-slide">
              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-52 rounded-xl border border-[#E5E7EB] bg-white py-2 shadow-lg z-50"
              >
                <div class="px-4 py-2 border-b border-[#E5E7EB]">
                  <p class="truncate text-sm font-semibold text-[#1A2036]">{{ displayName }}</p>
                  <p class="truncate text-xs text-[#6B7280]">{{ user?.email }}</p>
                </div>
                <RouterLink
                  to="/profile"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-[#1A2036] transition hover:bg-[#F9FAFB]"
                  @click="menuOpen = false"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Profile
                </RouterLink>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#DC2626] transition hover:bg-[#F9FAFB]"
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
            class="rounded-full bg-[#3D5FE0] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3350C0]"
          >
            Login
          </RouterLink>
        </template>
      </div>
    </div>

    <!-- Mobile nav: simple horizontal scroll row under the main bar -->
    <div
      class="flex sm:hidden items-center gap-4 overflow-x-auto px-4 pb-3 -mt-1"
    >
      <RouterLink to="/home" :class="navLinkClass" :active-class="navLinkActiveClass">Home</RouterLink>
      <RouterLink to="/explore" :class="navLinkClass" :active-class="navLinkActiveClass">Explore</RouterLink>
      <template v-if="isAuthenticated()">
        <RouterLink to="/favorites" :class="navLinkClass" :active-class="navLinkActiveClass">Favorites</RouterLink>
        <RouterLink to="/my-reservations" :class="navLinkClass" :active-class="navLinkActiveClass">Reservations</RouterLink>
        <RouterLink to="/my-rentals" :class="navLinkClass" :active-class="navLinkActiveClass">Rentals</RouterLink>
        <RouterLink to="/profile" :class="navLinkClass" :active-class="navLinkActiveClass">Profile</RouterLink>
      </template>
    </div>
  </header>
</template>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>