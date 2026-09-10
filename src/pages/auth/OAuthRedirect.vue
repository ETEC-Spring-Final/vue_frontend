<template>
  <div class="flex min-h-screen items-center justify-center bg-white">
    <div class="mx-auto flex w-full max-w-sm flex-col items-center px-6 py-12 text-center">

      <!-- Success / loading state -->
      <template v-if="!errorMessage">
        <!-- Icon + moving road, echoes the Login page's car icon -->
        <div class="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E9EDFB]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9 text-[#3D5FE0]">
            <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
          </svg>
        </div>

        <div class="mb-6 h-1 w-28 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
          <div class="road-line h-full w-1/3 rounded-full bg-[#3D5FE0]"></div>
        </div>

        <h1 class="text-2xl font-bold text-[#1A2036]">Getting your account ready</h1>
        <p class="mt-2 text-sm text-[#6B7280]">
          Just a moment while we sign you in and pull up your details.
        </p>
      </template>

      <!-- Error state -->
      <template v-else>
        <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9 text-red-500">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M12 8v5"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
        </div>

        <h1 class="text-2xl font-bold text-[#1A2036]">Sign-in didn't go through</h1>
        <p class="mt-2 text-sm text-[#6B7280]">{{ errorMessage }}</p>

        <button
          type="button"
          class="mt-6 w-full rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
          @click="router.push('/login')"
        >
          Back to login
        </button>
        <p class="mt-3 text-xs text-[#9CA3AF]">Redirecting you automatically…</p>
      </template>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useAuthStore from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const { login, defaultRedirect } = useAuthStore()
const errorMessage = ref('')

// Our JWT is a plain HS256 token (see JwtUtil on the backend). We only need
// to READ the payload here (id, sub=email, role) to populate the store —
// verification already happened server-side before this token was issued,
// and every future request still gets independently checked by the backend.
function decodeJwtPayload(token) {
  const payload = token.split('.')[1]
  const json = decodeURIComponent(
    atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  )
  return JSON.parse(json)
}

onMounted(() => {
  const token = route.query.token
  if (!token) {
    errorMessage.value = 'We didn\u2019t receive a login token. Please try again.'
    setTimeout(() => router.push('/login'), 1500)
    return
  }

  try {
    const claims = decodeJwtPayload(token)
    login({ id: claims.id, email: claims.sub, role: claims.role, token })
    router.push(defaultRedirect())
  } catch (e) {
    errorMessage.value = 'Something went wrong finishing sign-in. Please try again.'
    setTimeout(() => router.push('/login'), 1500)
  }
})
</script>

<style scoped>
.road-line {
  animation: drive 1.1s ease-in-out infinite;
}

@keyframes drive {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}

@media (prefers-reduced-motion: reduce) {
  .road-line {
    animation: none;
  }
}
</style>