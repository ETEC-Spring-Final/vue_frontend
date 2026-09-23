<template>
  <div
    class="flex items-center gap-1"
    :role="editable ? 'radiogroup' : 'img'"
    :aria-label="t('reviews.starsOutOf', { rating: modelValue })"
    @mouseleave="hoverValue = 0"
  >
    <component
      :is="editable ? 'button' : 'span'"
      v-for="i in 5"
      :key="i"
      :type="editable ? 'button' : undefined"
      :role="editable ? 'radio' : undefined"
      :aria-checked="editable ? Number(modelValue) === i : undefined"
      :aria-label="editable ? String(i) : undefined"
      class="inline-flex rounded"
      :class="editable
        ? 'cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]'
        : ''"
      @click="editable && select(i)"
      @mouseenter="editable && (hoverValue = i)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        :width="iconSize"
        :height="iconSize"
        :fill="i <= shownValue ? '#F59E0B' : 'none'"
        :stroke="i <= shownValue ? '#F59E0B' : 'var(--color-border)'"
        stroke-width="1.5"
        stroke-linejoin="round"
      >
        <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.8L10 14.9l-5.21 2.74 1-5.8-4.21-4.1 5.82-.85L10 1.5z" />
      </svg>
    </component>

    <span v-if="showValue" class="ml-1 text-xs font-medium" style="color: var(--color-text-secondary);">
      {{ Number(modelValue).toFixed(1) }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  size: { type: Number, default: 16 },
  showValue: { type: Boolean, default: false },
  // When true the stars become buttons and emit `update:modelValue` (works with v-model).
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const hoverValue = ref(0)

// Editable stars need a comfortable tap target, so they never render smaller than 28px.
const iconSize = computed(() => (props.editable ? Math.max(props.size, 28) : props.size))
const shownValue = computed(() => (props.editable && hoverValue.value) || Number(props.modelValue) || 0)

function select(value) {
  emit('update:modelValue', value)
}
</script>