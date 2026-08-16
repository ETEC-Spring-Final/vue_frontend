/*
|--------------------------------------------------------------------------
| File: BaseButton.vue
|--------------------------------------------------------------------------
|
| Description:
| Reusable button component with support for loading, disabled state,
| preset colors, and custom styling.
|
| Responsibilities:
| - Provide consistent button UI across the app
| - Handle loading + disabled states
| - Support preset and custom color styling
| - Allow flexible content via props or slots
|
| Notes:
| - Use slots for complex content (icons, etc.)
| - Loading state automatically disables button
| - Supports native button types (button, submit, reset)
|
*/

<template>
  <!-- Base button -->
  <button
    :type="type"
    :disabled="loading || disabled"
    :aria-disabled="loading || disabled"
    :aria-busy="loading"
    :class="[baseClass, widthClass, colorClass]"
  >
    <!-- Loading spinner -->
    <span v-if="loading" class="animate-spin">⏳</span>

    <!-- Content -->
    <span class="flex items-center gap-2">
      <slot>
        {{ text }}
      </slot>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/
const props = defineProps({
  // Button text fallback
  text: {
    type: String,
    default: 'Button',
  },

  // Button type (important for forms)
  type: {
    type: String,
    default: 'button', // button | submit | reset
  },

  // Color preset or custom Tailwind class
  color: {
    type: String,
    default: 'primary',
  },

  // Loading state
  loading: {
    type: Boolean,
    default: false,
  },

  // Disabled state
  disabled: {
    type: Boolean,
    default: false,
  },

  // Full width or auto width
  block: {
    type: Boolean,
    default: true,
  },
})

/*
|--------------------------------------------------------------------------
| Base Styles
|--------------------------------------------------------------------------
*/
const baseClass =
  'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed'

/*
|--------------------------------------------------------------------------
| Width Control
|--------------------------------------------------------------------------
*/
const widthClass = computed(() => (props.block ? 'w-full' : 'w-auto'))

/*
|--------------------------------------------------------------------------
| Color Logic
|--------------------------------------------------------------------------
*/
const colorClass = computed(() => {
  const preset = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-300',
    warning: 'bg-yellow-500 text-black hover:bg-yellow-600 focus-visible:ring-yellow-300',
  }

  return preset[props.color] || props.color
})
</script>