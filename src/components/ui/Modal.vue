<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="$emit('close')">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-[#1A2036]">{{ title }}</h2>
          <button type="button" class="text-[#9CA3AF] hover:text-[#1A2036]" @click="$emit('close')">✕</button>
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