<script setup>
import { RouterLink, useRouter } from "vue-router";
import useAuthStore from "@/stores/auth.store";

const router = useRouter();
const { isAuthenticated, logout } = useAuthStore();

const navLinkClass =
  "text-sm font-semibold text-[#6B7280] transition hover:text-[#3D5FE0]";
const navLinkActiveClass = "text-[#3D5FE0]";

function handleLogout() {
  logout?.();
  router.push("/login");
}
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
          <button
            type="button"
            @click="handleLogout"
            class="rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-semibold text-[#1A2036] transition hover:bg-[#F9FAFB]"
          >
            Logout
          </button>
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
      </template>
    </div>
  </header>
</template>
