<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">

      <!-- Icon -->
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E9EDFB]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9 text-[#3D5FE0]">
          <path stroke="currentColor" stroke-width="1.6" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m5 6.5 7 5.8 7-5.8"/>
        </svg>
      </div>

      <!-- Success state -->
      <template v-if="sent">
        <h1 class="text-center text-3xl font-bold text-[#1A2036]">Check your email</h1>
        <p class="mt-2 text-center text-sm text-[#6B7280]">
          We sent a password reset link to <span class="font-medium text-[#1A2036]">{{ form.email }}</span>.
          The link expires in 15 minutes.
        </p>
        <RouterLink
          to="/login"
          class="mt-8 flex w-full items-center justify-center rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
        >
          Back to login
        </RouterLink>
      </template>

      <!-- Form state -->
      <template v-else>
        <h1 class="text-center text-3xl font-bold text-[#1A2036]">Forgot password?</h1>
        <p class="mt-2 text-center text-sm text-[#6B7280]">
          Enter your email and we'll send you a link to reset it.
        </p>

        <div v-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
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

          <button
            type="submit"
            :disabled="loading || !form.email"
            class="mt-2 flex w-full items-center justify-center rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="!loading">Send reset link</span>
            <svg v-else class="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
            </svg>
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-[#6B7280]">
          Remembered it?
          <RouterLink to="/login" class="font-semibold text-[#3D5FE0] hover:text-[#3350C0]">Back to login</RouterLink>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import api from '@/services/api'

const loading = ref(false)
const errorMessage = ref('')
const sent = ref(false)

const form = reactive({ email: '' })

const onSubmit = async () => {
  if (!form.email) return

  loading.value = true
  errorMessage.value = ''

  try {
    await api.post('/auth/forgot-password', { email: form.email })
    sent.value = true
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Couldn't send the reset link. Please check the email and try again."
  } finally {
    loading.value = false
  }
}
</script>