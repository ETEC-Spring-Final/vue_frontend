<template>
  <div>
    <h1 class="text-3xl py-4 mt-10 font-bold anim-field" :style="{ color: 'var(--color-text)' }" style="animation-delay:0.05s">{{ t('auth.createAccount') }}</h1>
    <p class="mt-2 text-sm anim-field" :style="{ color: 'var(--color-text-secondary)' }" style="animation-delay:0.1s">
      {{ t('auth.registerPrompt') }}
    </p>

    <transition name="shake-fade">
      <div v-if="errorMessage" class="mt-6 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        {{ errorMessage }}
      </div>
    </transition>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div class="anim-field" style="animation-delay:0.12s"><PillInput v-model="form.firstName" :placeholder="t('auth.firstName')" icon="person" required /></div>
      <div class="anim-field" style="animation-delay:0.15s"><PillInput v-model="form.lastName" :placeholder="t('auth.lastName')" icon="person" required /></div>
      <div class="anim-field" style="animation-delay:0.18s"><PillInput v-model="form.email" type="email" :placeholder="t('auth.emailAddress')" icon="mail" required /></div>
      <div class="anim-field" style="animation-delay:0.21s"><PillInput v-model="form.phone" type="tel" :placeholder="t('auth.phoneNumber')" icon="phone" required /></div>

      <div class="flex items-center gap-3 rounded-full px-5 py-3.5 ring-1 ring-transparent transition-all duration-200 focus-within:shadow-md focus-within:ring-[var(--color-primary)] anim-field" :style="{ backgroundColor: 'var(--color-border)' }" style="animation-delay:0.24s">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0" :style="{ color: 'var(--color-text-secondary)' }">
          <circle cx="9" cy="7" r="3" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="16" cy="10" r="3" stroke="currentColor" stroke-width="1.6"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M13 19c0-2.2 1.6-4 4-4s4 1.8 4 4"/>
        </svg>
        <select v-model="form.gender" required class="w-full appearance-none bg-transparent text-sm outline-none [&:invalid]:opacity-60" :style="{ color: 'var(--color-text)' }">
          <option value="" disabled>{{ t('auth.selectGender') }}</option>
          <option value="MALE">{{ t('auth.male') }}</option>
          <option value="FEMALE">{{ t('auth.female') }}</option>
        </select>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 shrink-0" :style="{ color: 'var(--color-text-secondary)' }">
          <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
        </svg>
      </div>

      <div class="anim-field" style="animation-delay:0.27s"><PasswordPillInput v-model="form.password" :placeholder="t('auth.password')" required /></div>
      <div class="anim-field" style="animation-delay:0.3s">
        <PasswordPillInput v-model="confirmPassword" :placeholder="t('auth.confirmPassword')" required />
        <transition name="shake-fade">
          <p v-if="confirmPassword && confirmPassword !== form.password" class="mt-1.5 px-1 text-xs text-red-600 dark:text-red-400">{{ t('auth.passwordsMismatch') }}</p>
        </transition>
      </div>

      <button
        type="submit"
        :disabled="loading || !isFormValid"
        class="mt-2 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none anim-field"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        style="animation-delay:0.33s"
      >
        <span v-if="!loading">{{ t('auth.createAccount') }}</span>
        <svg v-else class="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
        </svg>
      </button>
    </form>

    <div class="mt-6 flex items-center gap-3 anim-field" style="animation-delay:0.36s">
      <div class="h-px flex-1" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      <span class="text-xs font-medium uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ t('auth.orContinueWith') }}</span>
      <div class="h-px flex-1" :style="{ backgroundColor: 'var(--color-border)' }"></div>
    </div>

    <div class="mt-4 space-y-3 anim-field" style="animation-delay:0.39s">
      <a href="http://localhost:8080/oauth2/authorization/google" class="flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.98]" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="h-5 w-5">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.2-5.5l-6.5-5.5C29.6 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C40.9 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
        </svg>
        {{ t('auth.continueWithGoogle') }}
      </a>
    </div>

    <p class="mt-6 text-center text-sm anim-field" :style="{ color: 'var(--color-text-secondary)' }" style="animation-delay:0.42s">
      {{ t('auth.haveAccount') }}
      <RouterLink to="/login" class="font-semibold transition-opacity hover:opacity-70" :style="{ color: 'var(--color-primary)' }">{{ t('auth.login') }}</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { reactive, ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import useAuthStore from '@/stores/auth.store'

const { t } = useI18n()
const router = useRouter()
const { login, defaultRedirect } = useAuthStore()

const loading = ref(false)
const errorMessage = ref('')
const confirmPassword = ref('')
const form = reactive({ firstName: '', lastName: '', email: '', password: '', phone: '', gender: '' })

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
    await login(data) // login() now also fetches the profile — must await
    router.push(defaultRedirect())
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.response?.data?.error || t('auth.registerFailed')
  } finally {
    loading.value = false
  }
}

const ICONS = {
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5Z',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2 8 6.5L20 7',
  phone: 'M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z',
}

const PillInput = (props, { attrs }) =>
  h('div', { class: 'flex items-center gap-3 rounded-full px-5 py-3.5 ring-1 ring-transparent transition-all duration-200 focus-within:shadow-md focus-within:ring-[var(--color-primary)]', style: { backgroundColor: 'var(--color-border)' } }, [
    h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5 shrink-0', style: { color: 'var(--color-text-secondary)' } }, [
      h('path', { fill: 'currentColor', d: ICONS[props.icon] || ICONS.person }),
    ]),
    h('input', {
      ...attrs,
      value: props.modelValue,
      type: props.type || 'text',
      required: props.required,
      placeholder: props.placeholder,
      class: 'w-full bg-transparent text-sm outline-none',
      style: { color: 'var(--color-text)' },
      onInput: (e) => attrs['onUpdate:modelValue']?.(e.target.value),
    }),
  ])
PillInput.props = ['modelValue', 'type', 'placeholder', 'icon', 'required']

const PasswordPillInput = {
  props: ['modelValue', 'placeholder', 'required'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(false)
    return () =>
      h('div', { class: 'flex items-center gap-3 rounded-full px-5 py-3.5 ring-1 ring-transparent transition-all duration-200 focus-within:shadow-md focus-within:ring-[var(--color-primary)]', style: { backgroundColor: 'var(--color-border)' } }, [
        h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5 shrink-0', style: { color: 'var(--color-text-secondary)' } }, [
          h('rect', { width: 14, height: 10, x: 5, y: 10, stroke: 'currentColor', 'stroke-width': 1.6, rx: 2 }),
          h('path', { stroke: 'currentColor', 'stroke-width': 1.6, d: 'M8 10V7a4 4 0 1 1 8 0v3' }),
        ]),
        h('input', {
          value: props.modelValue,
          type: show.value ? 'text' : 'password',
          required: props.required,
          placeholder: props.placeholder,
          class: 'w-full bg-transparent text-sm outline-none',
          style: { color: 'var(--color-text)' },
          onInput: (e) => emit('update:modelValue', e.target.value),
        }),
        h('button', { type: 'button', class: 'shrink-0 transition-colors duration-150 hover:opacity-70', style: { color: 'var(--color-text-secondary)' }, onClick: () => (show.value = !show.value) }, [
          show.value
            ? h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5' }, [
                h('path', { stroke: 'currentColor', 'stroke-width': 1.6, d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z' }),
                h('circle', { cx: 12, cy: 12, r: 3, stroke: 'currentColor', 'stroke-width': 1.6 }),
              ])
            : h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', class: 'h-5 w-5' }, [
                h('path', { stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', d: 'M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M6.6 6.9C4.5 8.3 3 12 3 12s3.5 7 10 7c1.8 0 3.3-.5 4.6-1.2M17.7 17.6C19.8 16.1 21 12 21 12s-1.1-2.2-3.1-4' }),
              ]),
        ]),
      ])
  },
}
</script>

<style scoped>
.anim-field { opacity: 0; animation: fieldIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes fieldIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.shake-fade-enter-active { animation: shakeFade 0.4s ease; }
@keyframes shakeFade {
  0% { opacity: 0; transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); opacity: 1; }
  75% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}
</style>