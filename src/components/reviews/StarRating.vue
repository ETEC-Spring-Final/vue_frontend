<template>
  <div class="flex items-center gap-1" :aria-label="`${modelValue} out of 5 stars`">
    <svg
      v-for="i in 5"
      :key="i"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      :width="size"
      :height="size"
      :fill="i <= modelValue ? '#F59E0B' : 'none'"
      :stroke="i <= modelValue ? '#F59E0B' : 'var(--color-border)'"
      stroke-width="1.5"
    >
      <path
        d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.8L10 14.9l-5.21 2.74 1-5.8-4.21-4.1 5.82-.85L10 1.5z"
      />
    </svg>
    <span v-if="showValue" class="text-xs font-medium ml-1" style="color: var(--color-text-secondary);">
      {{ Number(modelValue).toFixed(1) }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [Number, String], default: 0 },
  size: { type: Number, default: 16 },
  showValue: { type: Boolean, default: false },
})
</script>