<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="$emit('close')">
      <div class="w-full max-w-lg rounded-2xl p-6 shadow-xl" style="background-color: var(--color-surface);">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold" style="color: var(--color-text);">{{ title }}</h2>
          <button
            type="button"
            class="transition hover:opacity-70"
            style="color: var(--color-text-secondary);"
            @click="$emit('close')"
          >✕</button>
        </div>
        <div class="mt-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ open: Boolean, title: String })
defineEmits(['close'])
</script>