<template>
  <!-- Page wrapper: full-height background and centered card -->
  <div class="min-h-screen bg-slate-100">
    <div class="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div class="w-full bg-white p-8 shadow-xl rounded-sm">

        <!-- Header: title and subtitle -->
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p class="mt-1 text-sm text-slate-500">Login to continue</p>
        </div>

        <!-- Form: uses @submit.prevent to run `onSubmit` without page reload -->
        <form class="space-y-4" @submit.prevent="onSubmit">

          <!-- Email input group: label + BaseInput bound to `form.email` -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Email</label>
            <BaseInput v-model="form.email" type="email" placeholder="you@example.com" required />
          </div>

          <!-- Password input group: label + BaseInput bound to `form.password` -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Password</label>
            <BaseInput v-model="form.password" type="password" placeholder="Your password" required />
          </div>

          <!-- Submit button: `BaseButton` receives props for text, color and loading state.
               `:disabled` prevents submission when fields are empty. Clicking also calls `onSubmit`. -->
          <BaseButton text="Login" color="primary" :loading="loading" :disabled="!form.email || !form.password" @click="onSubmit" />

        </form>

        <!-- Footer: link to registration page -->
        <p class="mt-6 text-center text-sm text-slate-600">
          Don't have an account?
          <RouterLink class="font-semibold text-blue-600 hover:text-blue-700" to="/register">Create one</RouterLink>
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
// Imports: Vue composition API utilities and shared base components
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

// `loading` indicates an in-flight async request (disables the button and shows spinner)
const loading = ref(false)

// `form` holds the reactive form fields bound via `v-model` to the inputs above
const form = reactive({
  email: '',
  password: ''
})

// `onSubmit` validates the form, toggles loading, performs the submit (simulated here),
// and then clears the loading state. Keep it `async` so real API calls can be awaited.
const onSubmit = async () => {
  // Basic client-side validation: ensure fields are not empty
  if (!form.email || !form.password) return

  loading.value = true

  // Log the payload for debugging (replace with real API call)
  console.log('Login submit', { ...form })

  // simulate API call latency; replace this with an actual request
  await new Promise(r => setTimeout(r, 1000))

  // Reset loading after request completes
  loading.value = false
}
</script>