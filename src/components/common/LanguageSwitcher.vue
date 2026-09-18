<template>
  <div
    class="relative flex h-10 items-center rounded-full p-1 text-xs font-semibold"
    :style="{ backgroundColor: 'var(--color-border)' }"
    role="group"
    aria-label="Language"
  >
    <!-- Sliding pill behind whichever option is active -->
    <span
      class="absolute inset-y-1 w-8 rounded-full shadow-sm transition-transform duration-250"
      :style="{ backgroundColor: 'var(--color-surface)', transform: locale === 'km' ? 'translateX(2rem)' : 'translateX(0)' }"
    />
    <button
      type="button"
      class="relative z-10 w-8 py-1 text-center transition-colors duration-200"
      :style="{ color: locale === 'en' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
      :aria-pressed="locale === 'en'"
      @click="setLocale('en')"
    >
      EN
    </button>
    <button
      type="button"
      class="relative z-10 w-8 py-1 text-center transition-colors duration-200"
      :style="{ color: locale === 'km' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
      :aria-pressed="locale === 'km'"
      @click="setLocale('km')"
    >
      ខ្មែរ
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const { locale: rawLocale } = useI18n()
const locale = computed(() => rawLocale.value)
</script>