<template>
  <div class="min-h-screen" :style="{ backgroundColor: 'var(--color-bg)' }">
    <div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">

      <!-- Icon -->
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" :style="{ backgroundColor: 'var(--color-primary-light)' }">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-9 w-9" :style="{ color: 'var(--color-primary)' }">
          <path stroke="currentColor" stroke-width="1.6" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/>
          <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m5 6.5 7 5.8 7-5.8"/>
        </svg>
      </div>

      <!-- Success state -->
      <template v-if="sent">
        <h1 class="text-center text-3xl font-bold" :style="{ color: 'var(--color-text)' }">{{ t('auth.checkEmailTitle') }}</h1>
        <p class="mt-2 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ t('auth.resetSentTo', { email: form.email }) }}
          {{ t('auth.resetExpires') }}
        </p>
        <RouterLink
          to="/login"
          class="mt-8 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          :style="{ backgroundColor: 'var(--color-primary)' }"
        >
          {{ t('auth.backToLogin') }}
        </RouterLink>
      </template>

      <!-- Form state -->
      <template v-else>
        <h1 class="text-center text-3xl font-bold" :style="{ color: 'var(--color-text)' }">{{ t('auth.forgotPasswordTitle') }}</h1>
        <p class="mt-2 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ t('auth.forgotPrompt') }}
        </p>

        <div v-if="errorMessage" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {{ errorMessage }}
        </div>

        <form class="mt-8 space-y-4" @submit.prevent="onSubmit">
          <div class="flex items-center gap-3 rounded-full px-5 py-3.5 ring-1 ring-transparent transition-all duration-200 focus-within:shadow-md focus-within:ring-[var(--color-primary)]" :style="{ backgroundColor: 'var(--color-border)' }">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0" :style="{ color: 'var(--color-text-secondary)' }">
              <path stroke="currentColor" stroke-width="1.6" d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z"/>
              <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m4 6 8 6.5L20 6"/>
            </svg>
            <input
              v-model="form.email"
              type="email"
              required
              :placeholder="t('auth.emailAddress')"
              class="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
              :style="{ color: 'var(--color-text)' }"
            />
          </div>

          <button
            type="submit"
            :disabled="loading || !form.email"
            class="mt-2 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            :style="{ backgroundColor: 'var(--color-primary)' }"
          >
            <span v-if="!loading">{{ t('auth.sendResetLink') }}</span>
            <svg v-else class="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
            </svg>
          </button>
        </form>

        <p class="mt-8 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ t('auth.rememberedIt') }}
          <RouterLink to="/login" class="font-semibold transition-opacity hover:opacity-70" :style="{ color: 'var(--color-primary)' }">{{ t('auth.backToLogin') }}</RouterLink>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'

const { t } = useI18n()

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
      t('auth.sendResetFailed')
  } finally {
    loading.value = false
  }
}
</script>