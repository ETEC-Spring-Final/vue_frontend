<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" :style="{ backgroundColor: 'var(--color-bg)' }">
    <template v-if="!error">
      <svg class="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" :style="{ color: 'var(--color-primary)' }">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
      </svg>
      <p :style="{ color: 'var(--color-text-secondary)' }">{{ t('auth.telegramProcessing') }}</p>
    </template>

    <template v-else>
      <p class="text-red-600">{{ error }}</p>
      <RouterLink to="/login" class="text-sm font-semibold" :style="{ color: 'var(--color-primary)' }">
        {{ t('auth.backToLogin') }}
      </RouterLink>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import useAuthStore from '@/stores/auth.store'

const { t } = useI18n()
const router = useRouter()
const { loginWithTelegram, defaultRedirect } = useAuthStore()
const error = ref('')

onMounted(async () => {
  // tgAuthResult comes as a base64-encoded JSON blob in the URL hash,
  // e.g. #tgAuthResult=eyJpZCI6...
  const hashParams = new URLSearchParams(window.location.hash.slice(1))
  const rawResult = hashParams.get('tgAuthResult')

  let telegramUser = null
  if (rawResult) {
    try {
      const decoded = JSON.parse(atob(rawResult))
      telegramUser = {
        id: decoded.id,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        username: decoded.username,
        photo_url: decoded.photo_url,
        auth_date: decoded.auth_date,
        hash: decoded.hash,
      }
    } catch (e) {
      telegramUser = null
    }
  }

  if (!telegramUser || !telegramUser.id || !telegramUser.hash) {
    error.value = t('auth.telegramFailed')
    return
  }

  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')

  try {
    if (mode === 'connect') {
      await api.post('/user-profiles/me/connect-telegram', telegramUser)
      router.replace('/profile')
    } else {
      await loginWithTelegram(telegramUser)
      router.replace(defaultRedirect())
    }
  } catch (err) {
    error.value = err.response?.data?.message || t('auth.telegramFailed')
  }
})
</script>