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