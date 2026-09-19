/*
|--------------------------------------------------------------------------
| File: NotFound.vue
|--------------------------------------------------------------------------
|
| Description:
| Minimal 404 page for unknown routes.
|
| Goals:
| - Keep UI simple and distraction-free
| - Provide clear message + single action
|
*/

<template>
  <!-- Centered container -->
  <div class="flex min-h-screen items-center justify-center px-6" :style="{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }">

    <div class="max-w-md text-center">

      <!-- Code -->
      <h1 class="text-5xl font-semibold" style="color: var(--color-text);">
        404
      </h1>

      <!-- Message -->
      <p class="mt-4 text-sm leading-relaxed" style="color: var(--color-text-secondary);">
        {{ t('notFound.title') }} {{ t('notFound.message') }}
      </p>

      <!-- Action -->
      <div class="mt-6">
        <RouterLink
          to="/home"
          class="text-sm font-medium underline-offset-4 hover:underline"
          style="color: var(--color-text);"
        >
          {{ t('notFound.goHome') }}
        </RouterLink>
      </div>

    </div>

  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>