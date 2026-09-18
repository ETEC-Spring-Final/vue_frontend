<template>
  <button
    type="button"
    class="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-90"
    :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
    :aria-label="isDark() ? $t('theme.light') : $t('theme.dark')"
    :title="isDark() ? $t('theme.light') : $t('theme.dark')"
    @click="toggleTheme"
  >
    <!-- Sun / moon cross-fade + rotate, driven purely by CSS so it stays
         snappy even before the click handler resolves. -->
    <span class="relative block h-5 w-5">
      <svg
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        class="absolute inset-0 h-5 w-5 transition-all duration-300"
        :class="isDark() ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'"
      >
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7"/>
        <path stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
          d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        class="absolute inset-0 h-5 w-5 transition-all duration-300"
        :class="isDark() ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'"
      >
        <path fill="currentColor" d="M20.7 14.3a8.6 8.6 0 0 1-10.9-11 9 9 0 1 0 10.9 11Z"/>
      </svg>
    </span>
  </button>
</template>

<script setup>
import useThemeStore from '@/stores/theme.store'

const { isDark, toggleTheme } = useThemeStore()
</script>