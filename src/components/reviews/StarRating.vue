<template>
  <div class="flex items-center gap-1" :class="{ 'cursor-pointer': editable }">
    <svg
      v-for="star in 5"
      :key="star"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="h-5 w-5"
      :class="star <= displayValue ? 'text-yellow-500' : 'text-[#E5E7EB]'"
      :fill="star <= displayValue ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.5"
      @mouseenter="editable && (hover = star)"
      @mouseleave="editable && (hover = 0)"
      @click="editable && $emit('update:modelValue', star)"
    >
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19.6l1-5.8-4.2-4.1 5.9-.9L12 3.5Z"
        stroke-linejoin="round"
      />
    </svg>
    <span v-if="!editable && showValue" class="ml-1 text-xs text-[#6B7280]">{{ modelValue?.toFixed(1) }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  editable: { type: Boolean, default: false },
  showValue: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const hover = ref(0)
const displayValue = computed(() => (props.editable && hover.value ? hover.value : props.modelValue))
</script>