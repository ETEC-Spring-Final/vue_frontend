/*
|--------------------------------------------------------------------------
| File: stores/theme.store.js
|--------------------------------------------------------------------------
|
| Tiny theme store (light/dark), same "reactive() + factory function"
| pattern as useAuthStore so it feels native to the rest of the codebase.
|
| - Reads a saved choice from localStorage on first load; if there isn't
|   one yet, falls back to the OS/browser color-scheme preference.
| - Toggling flips the `dark` class on <html>, which is exactly what
|   style.css's `@custom-variant dark (&:where(.dark, .dark *))` and the
|   `.dark { --color-*: ... }` block are already wired to react to.
| - Import `useThemeStore` once early (e.g. in main.js or App.vue) so the
|   class is applied before first paint and there's no flash of the wrong
|   theme.
|
*/
import { reactive, readonly } from 'vue'

const STORAGE_KEY = 'theme'

function getInitialMode() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const state = reactive({
  mode: getInitialMode(),
})

function applyToDocument() {
  document.documentElement.classList.toggle('dark', state.mode === 'dark')
}

// Apply immediately on module load (not just on first call), so the very
// first import — however early — already sets the right class.
applyToDocument()

function setTheme(mode) {
  state.mode = mode
  localStorage.setItem(STORAGE_KEY, mode)
  applyToDocument()
}

function toggleTheme() {
  setTheme(state.mode === 'dark' ? 'light' : 'dark')
}

export default function useThemeStore() {
  return {
    state: readonly(state),
    isDark: () => state.mode === 'dark',
    setTheme,
    toggleTheme,
  }
}