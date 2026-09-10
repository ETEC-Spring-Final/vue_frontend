<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-8">

      <!-- Back button -->
      <button type="button" class="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#1A2036]" @click="router.push('/login')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
          <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Icon -->
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E9EDFB]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9 text-[#3D5FE0]">
          <circle cx="10" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M4 19c0-3.3 2.7-6 6-6s6 2.7 6 6M18 8v4m2-2h-4"/>
        </svg>
      </div>

      <!-- Heading -->
      <h1 class="text-center text-3xl font-bold text-[#1A2036]">Create account</h1>
      <p class="mt-2 text-center text-sm text-[#6B7280]">
        Join us and start renting vehicles with ease.
      </p>

      <!-- Error banner -->
      <div v-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <!-- Form -->
      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">

        <PillInput v-model="form.firstName" placeholder="First name" icon="person" required />
        <PillInput v-model="form.lastName" placeholder="Last name" icon="person" required />
        <PillInput v-model="form.email" type="email" placeholder="Email address" icon="mail" required />
        <PillInput v-model="form.phone" type="tel" placeholder="Phone number" icon="phone" required />

        <!-- Gender -->
        <div class="flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-[#9CA3AF]">
            <circle cx="9" cy="7" r="3" stroke="currentColor" stroke-width="1.6"/>
            <circle cx="16" cy="10" r="3" stroke="currentColor" stroke-width="1.6"/>
            <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M13 19c0-2.2 1.6-4 4-4s4 1.8 4 4"/>
          </svg>
          <select
            v-model="form.gender"
            required
            class="w-full appearance-none bg-transparent text-sm text-[#1A2036] outline-none [&:invalid]:text-[#9CA3AF]"
          >
            <option value="" disabled>Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 shrink-0 text-[#9CA3AF]">
            <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
          </svg>
        </div>

        <PasswordPillInput v-model="form.password" placeholder="Password" required />
        <PasswordPillInput v-model="confirmPassword" placeholder="Confirm password" required />
        <p v-if="confirmPassword && confirmPassword !== form.password" class="px-1 text-xs text-red-600">
          Passwords don't match.
        </p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading || !isFormValid"
          class="mt-2 flex w-full items-center justify-center rounded-full bg-[#3D5FE0] py-3.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span v-if="!loading">Create account</span>
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

      <!-- OAuth2 providers — same Google entry point as Login.vue. Signing up
           and signing in hit the same backend route: CustomOAuth2UserService
           creates the account on first login, so there's no separate
           "OAuth register" endpoint to wire up. -->
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

        <!-- TODO: Facebook OAuth — see Login.vue for why this is commented out.
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
      <p class="mt-6 mb-4 text-center text-sm text-[#6B7280]">
        Already have an account?
        <RouterLink to="/login" class="font-semibold text-[#3D5FE0] hover:text-[#3350C0]">Login</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import useAuthStore from '@/stores/auth.store'

const router = useRouter()
const { login, defaultRedirect } = useAuthStore()

const loading = ref(false)
const errorMessage = ref('')
const confirmPassword = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  gender: '',
})

const isFormValid = computed(() =>
  form.firstName && form.lastName && form.email && form.password &&
  form.phone && form.gender && confirmPassword.value === form.password
)

const onSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.post('/auth/register', { ...form })

    // data shape: { id, email, role, token }
    login(data)
    router.push(defaultRedirect())
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Registration failed. Please check your details and try again.'
  } finally {
    loading.value = false
  }
}

// --- Tiny local components so the pill-input markup isn't repeated 4 times ---
// (kept in this file since they're one-off to this screen's icon set; promote
// to components/base/ if another page needs the same pill style)

const ICONS = {
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5Z',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2 8 6.5L20 7',
  phone: 'M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z',
}

const PillInput = (props, { attrs }) =>
  h('div', { class: 'flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5' }, [
    h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5 shrink-0 text-[#9CA3AF]' }, [
      h('path', { fill: 'currentColor', d: ICONS[props.icon] || ICONS.person }),
    ]),
    h('input', {
      ...attrs,
      value: props.modelValue,
      type: props.type || 'text',
      required: props.required,
      placeholder: props.placeholder,
      class: 'w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none',
      onInput: (e) => attrs['onUpdate:modelValue']?.(e.target.value),
    }),
  ])
PillInput.props = ['modelValue', 'type', 'placeholder', 'icon', 'required']

// Eye-icon toggle, matching Login.vue's password field exactly (was a
// text "Show/Hide" link before — switched for visual consistency between
// the two auth screens).
const PasswordPillInput = {
  props: ['modelValue', 'placeholder', 'required'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(false)
    return () =>
      h('div', { class: 'flex items-center gap-3 rounded-full bg-[#F3F4F6] px-5 py-3.5' }, [
        h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5 shrink-0 text-[#9CA3AF]' }, [
          h('rect', { width: 14, height: 10, x: 5, y: 10, stroke: 'currentColor', 'stroke-width': 1.6, rx: 2 }),
          h('path', { stroke: 'currentColor', 'stroke-width': 1.6, d: 'M8 10V7a4 4 0 1 1 8 0v3' }),
        ]),
        h('input', {
          value: props.modelValue,
          type: show.value ? 'text' : 'password',
          required: props.required,
          placeholder: props.placeholder,
          class: 'w-full bg-transparent text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none',
          onInput: (e) => emit('update:modelValue', e.target.value),
        }),
        h('button', { type: 'button', class: 'shrink-0 text-[#9CA3AF]', onClick: () => (show.value = !show.value) }, [
          show.value
            ? h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5' }, [
                h('path', { stroke: 'currentColor', 'stroke-width': 1.6, d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z' }),
                h('circle', { cx: 12, cy: 12, r: 3, stroke: 'currentColor', 'stroke-width': 1.6 }),
              ])
            : h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5' }, [
                h('path', {
                  stroke: 'currentColor',
                  'stroke-width': 1.6,
                  'stroke-linecap': 'round',
                  d: 'M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M6.6 6.9C4.5 8.3 3 12 3 12s3.5 7 10 7c1.8 0 3.3-.5 4.6-1.2M17.7 17.6C19.8 16.1 21 12 21 12s-1.1-2.2-3.1-4',
                }),
              ]),
        ]),
      ])
  },
}
</script>