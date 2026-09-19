<template>
  <div class="min-h-screen" :style="{ backgroundColor: 'var(--color-bg)' }">
    <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">

      <!-- Icon -->
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" :style="{ backgroundColor: 'var(--color-primary-light)' }">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9" :style="{ color: 'var(--color-primary)' }">
          <rect width="14" height="10" x="5" y="10" stroke="currentColor" stroke-width="1.6" rx="2"/>
          <path stroke="currentColor" stroke-width="1.6" d="M8 10V7a4 4 0 1 1 8 0v3"/>
        </svg>
      </div>

      <!-- Missing/invalid token (no ?token= in URL) -->
      <template v-if="!token">
        <h1 class="text-center text-3xl font-bold" :style="{ color: 'var(--color-text)' }">{{ t('auth.invalidLink') }}</h1>
        <p class="mt-2 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ t('auth.invalidLinkMsg') }}
        </p>
        <RouterLink
          to="/forgot-password"
          class="mt-8 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          :style="{ backgroundColor: 'var(--color-primary)' }"
        >
          {{ t('auth.requestNewLink') }}
        </RouterLink>
      </template>

      <!-- Success -->
      <template v-else-if="done">
        <h1 class="text-center text-3xl font-bold" :style="{ color: 'var(--color-text)' }">{{ t('auth.passwordUpdated') }}</h1>
        <p class="mt-2 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ t('auth.passwordUpdatedMsg') }}
        </p>
        <RouterLink
          to="/login"
          class="mt-8 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          :style="{ backgroundColor: 'var(--color-primary)' }"
        >
          {{ t('auth.goToLogin') }}
        </RouterLink>
      </template>

      <!-- Form -->
      <template v-else>
        <h1 class="text-center text-3xl font-bold" :style="{ color: 'var(--color-text)' }">{{ t('auth.setNewPassword') }}</h1>
        <p class="mt-2 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ t('auth.chooseNewPassword') }}
        </p>

        <div v-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {{ errorMessage }}
        </div>

        <form class="mt-8 space-y-4" @submit.prevent="onSubmit">

          <!-- New password -->
          <div class="flex items-center gap-3 rounded-full px-5 py-3.5 ring-1 ring-transparent transition-all duration-200 focus-within:shadow-md focus-within:ring-[var(--color-primary)]" :style="{ backgroundColor: 'var(--color-border)' }">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0" :style="{ color: 'var(--color-text-secondary)' }">
              <rect width="14" height="10" x="5" y="10" stroke="currentColor" stroke-width="1.6" rx="2"/>
              <path stroke="currentColor" stroke-width="1.6" d="M8 10V7a4 4 0 1 1 8 0v3"/>
            </svg>
            <input
              v-model="form.newPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              :placeholder="t('auth.newPassword')"
              class="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
              :style="{ color: 'var(--color-text)' }"
            />
            <button type="button" class="shrink-0 text-xs font-medium transition-opacity hover:opacity-70" :style="{ color: 'var(--color-text-secondary)' }" @click="showPassword = !showPassword">
              {{ showPassword ? t('auth.hide') : t('auth.show') }}
            </button>
          </div>

          <!-- Confirm password -->
          <div class="flex items-center gap-3 rounded-full px-5 py-3.5 ring-1 ring-transparent transition-all duration-200 focus-within:shadow-md focus-within:ring-[var(--color-primary)]" :style="{ backgroundColor: 'var(--color-border)' }">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0" :style="{ color: 'var(--color-text-secondary)' }">
              <rect width="14" height="10" x="5" y="10" stroke="currentColor" stroke-width="1.6" rx="2"/>
              <path stroke="currentColor" stroke-width="1.6" d="M8 10V7a4 4 0 1 1 8 0v3"/>
            </svg>
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              :placeholder="t('auth.confirmNewPassword')"
              class="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
              :style="{ color: 'var(--color-text)' }"
            />
          </div>
          <p v-if="confirmPassword && confirmPassword !== form.newPassword" class="px-1 text-xs text-red-600 dark:text-red-400">
            {{ t('auth.passwordsMismatch') }}
          </p>

          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="mt-2 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            :style="{ backgroundColor: 'var(--color-primary)' }"
          >
            <span v-if="!loading">{{ t('auth.resetPassword') }}</span>
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
import { useI18n } from 'vue-i18n'
import api from '@/services/api'

const { t } = useI18n()
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
      t('auth.resetFailed')
  } finally {
    loading.value = false
  }
}
</script>