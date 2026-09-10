<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">

      <!-- Icon -->
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E9EDFB]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9 text-[#3D5FE0]">
          <path fill="currentColor" d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4a2 2 0 0 0-2-2M7.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
        </svg>
      </div>

      <!-- Heading -->
      <h1 class="text-center text-3xl font-bold text-[#1A2036]">Welcome back</h1>
      <p class="mt-2 text-center text-sm text-[#6B7280]">
        Sign in to continue renting your perfect vehicle.
      </p>

      <!-- Error banner -->
      <div v-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <!-- Form -->
      <form class="mt-8 space-y-4" @submit.prevent="onSubmit">

        <!-- Email -->
        <div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-[#9CA3AF]">
            <path stroke="currentColor" stroke-width="1.6" d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z"/>
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m4 6 8 6.5L20 6"/>
          </svg>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="Email address"
            class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
          />
        </div>

        <!-- Password -->
        <div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-[#9CA3AF]">
            <rect width="14" height="10" x="5" y="10" stroke="currentColor" stroke-width="1.6" rx="2"/>
            <path stroke="currentColor" stroke-width="1.6" d="M8 10V7a4 4 0 1 1 8 0v3"/>
          </svg>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Password"
            class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
          />
          <button type="button" class="shrink-0 text-[#9CA3AF]" @click="showPassword = !showPassword">
            <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path stroke="currentColor" stroke-width="1.6" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M6.6 6.9C4.5 8.3 3 12 3 12s3.5 7 10 7c1.8 0 3.3-.5 4.6-1.2M17.7 17.6C19.8 16.1 21 12 21 12s-1.1-2.2-3.1-4"/>
            </svg>
          </button>
        </div>

        <!-- Forgot password -->
        <div class="pt-1 text-right">
          <RouterLink to="/forgot-password" class="text-sm font-medium text-[#3D5FE0] hover:text-[#3350C0]">
            Forgot password?
          </RouterLink>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading || !form.email || !form.password"
          class="mt-2 flex w-full items-center justify-center rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="!loading">Login</span>
          <svg v-else class="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
          </svg>
        </button>
      </form>

      <!-- Divider -->
      <div class="mt-6 flex items-center gap-3">
        <div class="h-px flex-1 bg-[#E5E7EB]"></div>
        <span class="text-xs font-medium uppercase text-[#9CA3AF]">or continue with</span>
        <div class="h-px flex-1 bg-[#E5E7EB]"></div>
      </div>

      <!-- OAuth2 providers -->
      <!--
        Plain <a> links (full page navigation), not router-push:
        these hit Spring Security's default OAuth2 authorization endpoints
        directly and must leave the SPA to go to Google/Facebook.
        Replace localhost:8080 with an env var (e.g. import.meta.env.VITE_API_BASE_URL)
        once you have one wired up for production.
      -->
      <div class="mt-4 space-y-3">
        <a
          href="http://localhost:8080/oauth2/authorization/google"
          class="flex w-full items-center justify-center gap-2 rounded-full border border-[#E5E7EB] py-3 text-sm font-semibold text-[#1A2036] hover:bg-[#F9FAFB]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="h-5 w-5">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.2-5.5l-6.5-5.5C29.6 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C40.9 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          Continue with Google
        </a>

        <!--
          TODO: Facebook OAuth pending Meta Developer account verification
          (stuck in an email/phone verification loop on Meta's side as of
          2026-09-10). Backend route /oauth2/authorization/facebook and
          CustomOAuth2UserService already support it — just re-enable this
          block and drop FACEBOOK_CLIENT_ID/SECRET into .env once the Meta
          app is created.

        <a
          href="http://localhost:8080/oauth2/authorization/facebook"
          class="flex w-full items-center justify-center gap-2 rounded-full border border-[#E5E7EB] py-3 text-sm font-semibold text-[#1A2036] hover:bg-[#F9FAFB]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5">
            <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z"/>
          </svg>
          Continue with Facebook
        </a>
        -->
      </div>

      <!-- Footer -->
      <p class="mt-8 text-center text-sm text-[#6B7280]">
        Don't have an account?
        <RouterLink to="/register" class="font-semibold text-[#3D5FE0] hover:text-[#3350C0]">Register</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import useAuthStore from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const { login, defaultRedirect } = useAuthStore()

const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const onSubmit = async () => {
  if (!form.email || !form.password) return

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.post('/auth/login', {
      email: form.email,
      password: form.password,
    })

    // data shape: { id, email, role, token }
    login(data)

    const redirectTo = route.query.redirect || defaultRedirect()
    router.push(redirectTo)
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Login failed. Please check your email and password.'
  } finally {
    loading.value = false
  }
}
</script>