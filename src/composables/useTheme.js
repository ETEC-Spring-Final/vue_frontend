// src/composables/useTheme.js
//
// Thin wrapper over the theme store so there is ONE source of truth.
// (Previously this file kept its own state + localStorage key 'app_theme'
// and fought with stores/theme.store.js, which uses the key 'theme'.)
import { computed } from 'vue'
import useThemeStore from '@/stores/theme.store'

export function useTheme() {
  const { state, toggleTheme, setTheme } = useThemeStore()
  const isDark = computed(() => state.mode === 'dark')
  return { isDark, toggleTheme, setTheme }
}