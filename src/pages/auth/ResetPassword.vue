<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">

      <!-- Icon -->
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E9EDFB]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9 text-[#3D5FE0]">
          <rect width="14" height="10" x="5" y="10" stroke="currentColor" stroke-width="1.6" rx="2"/>
          <path stroke="currentColor" stroke-width="1.6" d="M8 10V7a4 4 0 1 1 8 0v3"/>
        </svg>
      </div>

      <!-- Missing/invalid token (no ?token= in URL) -->
      <template v-if="!token">
        <h1 class="text-center text-3xl font-bold text-[#1A2036]">Invalid link</h1>
        <p class="mt-2 text-center text-sm text-[#6B7280]">
          This reset link is missing or malformed. Request a new one below.
        </p>
        <RouterLink
          to="/forgot-password"
          class="mt-8 flex w-full items-center justify-center rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
        >
          Request new link
        </RouterLink>
      </template>

      <!-- Success -->
      <template v-else-if="done">
        <h1 class="text-center text-3xl font-bold text-[#1A2036]">Password updated</h1>
        <p class="mt-2 text-center text-sm text-[#6B7280]">
          Your password has been reset. You can now log in with your new password.
        </p>
        <RouterLink
          to="/login"
          class="mt-8 flex w-full items-center justify-center rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
        >
          Go to login
        </RouterLink>
      </template>

      <!-- Form -->
      <template v-else>
        <h1 class="text-center text-3xl font-bold text-[#1A2036]">Set new password</h1>
        <p class="mt-2 text-center text-sm text-[#6B7280]">
          Choose a new password for your account.
        </p>

        <div v-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <form class="mt-8 space-y-4" @submit.prevent="onSubmit">

          <!-- New password -->
          <div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-[#9CA3AF]">
              <rect width="14" height="10" x="5" y="10" stroke="currentColor" stroke-width="1.6" rx="2"/>
              <path stroke="currentColor" stroke-width="1.6" d="M8 10V7a4 4 0 1 1 8 0v3"/>
            </svg>
            <input
              v-model="form.newPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              placeholder="New password"
              class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
            />
            <button type="button" class="shrink-0 text-xs font-medium text-[#9CA3AF]" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>

          <!-- Confirm password -->
          <div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-[#9CA3AF]">
              <rect width="14" height="10" x="5" y="10" stroke="currentColor" stroke-width="1.6" rx="2"/>
              <path stroke="currentColor" stroke-width="1.6" d="M8 10V7a4 4 0 1 1 8 0v3"/>
            </svg>
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              placeholder="Confirm new password"
              class="w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
            />
          </div>
          <p v-if="confirmPassword && confirmPassword !== form.newPassword" class="px-1 text-xs text-red-600">
            Passwords don't match.
          </p>

          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="mt-2 flex w-full items-center justify-center rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="!loading">Reset password</span>
            <svg v-else class="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
            </svg>
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()

const token = route.query.token || ''
const loading = ref(false)
const errorMessage = ref('')
const done = ref(false)
const showPassword = ref(false)
const confirmPassword = ref('')

const form = reactive({ newPassword: '' })

const isFormValid = computed(() =>
  form.newPassword.length >= 8 && confirmPassword.value === form.newPassword
)

const onSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await api.post('/auth/reset-password', {
      token,
      newPassword: form.newPassword,
    })
    done.value = true
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'This link may have expired or already been used. Request a new one.'
  } finally {
    loading.value = false
  }
}
</script>