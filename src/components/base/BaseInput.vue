/*
|--------------------------------------------------------------------------
| File: BaseInput.vue
|--------------------------------------------------------------------------
|
| Description:
| Reusable input component with support for v-model, validation states,
| and optional password visibility toggle.
|
| Responsibilities:
| - Provide consistent input styling across the app
| - Support validation states (normal, error, success)
| - Handle password visibility toggle UX
| - Pass through native input attributes via $attrs
|
| Notes:
| - Designed to be flexible and composable
| - Extendable for labels, icons, and validation messages
|
*/

<template>
  <!-- Wrapper: enables positioning for password toggle -->
  <div class="relative w-full">

    <!-- Input element -->
    <input
      v-model="model"
      v-bind="$attrs"
      :type="inputType"
      :class="[baseClass, stateClass, paddingClass]"
    />

    <!-- Password visibility toggle button -->
    <button
      v-if="isPasswordField"
      type="button"
      @click="togglePassword"
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
      aria-label="Toggle password visibility"
      :aria-pressed="String(showPassword)"
      tabindex="-1"
    >
      <i v-if="!showPassword" class="fa fa-eye text-base" aria-hidden="true"></i>
      <i v-else class="fa fa-eye-slash text-base" aria-hidden="true"></i>
    </button>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
|
| Disable automatic attribute inheritance so we fully control bindings
|
*/
defineOptions({
  inheritAttrs: false
})

/*
|--------------------------------------------------------------------------
| v-model binding
|--------------------------------------------------------------------------
*/
const model = defineModel()

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/
const props = defineProps({
  // Input type (text, password, email, etc.)
  type: {
    type: String,
    default: 'text',
  },

  // Validation state
  state: {
    type: String,
    default: 'normal', // normal | error | success
  },
})

/*
|--------------------------------------------------------------------------
| Password Toggle Logic
|--------------------------------------------------------------------------
*/
const showPassword = ref(false)

// Check if current input is password type
const isPasswordField = computed(() => props.type === 'password')

// Dynamically switch input type
const inputType = computed(() =>
  isPasswordField.value
    ? (showPassword.value ? 'text' : 'password')
    : props.type
)

// Toggle visibility
function togglePassword() {
  showPassword.value = !showPassword.value
}

/*
|--------------------------------------------------------------------------
| Styling
|--------------------------------------------------------------------------
*/

// Base input styles
const baseClass =
  'w-full px-4 py-2 text-sm rounded-md border bg-white text-slate-900 placeholder-slate-400 transition outline-none disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed'

// Add padding if password icon exists
const paddingClass = computed(() =>
  isPasswordField.value ? 'pr-10' : ''
)

// State styles (validation)
const stateClass = computed(() => {
  const map = {
    normal: 'border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200',
    error: 'border-red-500 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-200',
    success: 'border-green-500 focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-200',
  }

  return map[props.state] || map.normal
})
</script>