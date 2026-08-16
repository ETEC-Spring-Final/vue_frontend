<template>
  <!-- Page wrapper: full-height background and centered card -->
  <div class="min-h-screen bg-slate-100">
    <div class="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div class="w-full bg-white p-8 shadow-xl rounded-sm">

        <!-- Header: title and subtitle -->
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-semibold text-slate-900">Create account</h1>
          <p class="mt-1 text-sm text-slate-500">Start your journey</p>
        </div>

        <!-- Form: uses @submit.prevent to run `onSubmit` without reloading the page -->
        <form class="space-y-4" @submit.prevent="onSubmit">

          <!-- Name input group: label + BaseInput bound to `form.name` -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Name</label>
            <BaseInput v-model="form.name" type="text" placeholder="Your name" required />
          </div>

          <!-- Email input group: label + BaseInput bound to `form.email` -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Email</label>
            <BaseInput v-model="form.email" type="email" placeholder="you@example.com" required />
          </div>

          <!-- Password input group: label + BaseInput bound to `form.password` -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Password</label>
            <BaseInput v-model="form.password" type="password" placeholder="Create a password" required />
          </div>

          <!-- Submit button: receives `loading` state and is disabled until all fields are filled -->
          <BaseButton text="Create Account" color="primary" :loading="loading" :disabled="!form.name || !form.email || !form.password" @click="onSubmit" />

        </form>

        <!-- Footer: link to login page -->
        <p class="mt-6 text-center text-sm text-slate-600">
          Already have an account?
          <RouterLink class="font-semibold text-blue-600 hover:text-blue-700" to="/login">Login</RouterLink>
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
// Imports: Vue composition API helpers and base UI components
import { reactive, ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

// `loading` toggles UI state while async requests are ongoing
const loading = ref(false)

// `form` stores user input and is reactive so v-model keeps it in sync
const form = reactive({
  name: '',
  email: '',
  password: ''
})

// `onSubmit` validates inputs, sets loading, performs the submit (simulated here),
// then clears loading. Replace the simulated part with a real API call.
const onSubmit = async () => {
  if (!form.name || !form.email || !form.password) return

  loading.value = true

  console.log('Register submit', { ...form })

  // simulate API latency
  await new Promise(r => setTimeout(r, 1000))

  loading.value = false
}
</script>