<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <Transition name="modal-pop" appear>
          <div
            v-if="open"
            class="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
            style="background-color: var(--color-surface); max-height: 90vh;"
          >
            <!-- Header (fixed) -->
            <div
              class="flex shrink-0 items-center justify-between border-b px-6 py-4"
              style="border-color: var(--color-border);"
            >
              <h2 class="text-lg font-bold" style="color: var(--color-text);">{{ title }}</h2>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:rotate-90 hover:bg-[var(--color-primary-light)] active:scale-90"
                style="color: var(--color-text-secondary);"
                :aria-label="t('common.close')"
                @click="$emit('close')"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body (scrollable — this is the actual fix) -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
              <slot />
            </div>

            <!-- Footer (fixed, optional) -->
            <div
              v-if="$slots.footer"
              class="shrink-0 border-t px-6 py-4"
              style="border-color: var(--color-border);"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({ open: Boolean, title: String })
defineEmits(['close'])
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(12px);
}
</style>