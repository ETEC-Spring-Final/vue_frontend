<template>
  <div ref="container" class="flex justify-center"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  botUsername: { type: String, required: true },
})
const emit = defineEmits(['login', 'error'])

const container = ref(null)
const CALLBACK_NAME = 'onTelegramAuthGlobal'

onMounted(() => {
  // Telegram's widget only supports calling a GLOBAL function by name
  // (data-onauth="fnName(user)") — it can't call a Vue closure directly.
  // Safe to reassign on every mount: only one Telegram button (login OR
  // register) is ever on screen at a time.
  window[CALLBACK_NAME] = (user) => emit('login', user)

  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  script.setAttribute('data-telegram-login', props.botUsername)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-radius', '999')
  script.setAttribute('data-onauth', `${CALLBACK_NAME}(user)`)
  script.setAttribute('data-request-access', 'write')
  script.onerror = () => emit('error', new Error('Failed to load Telegram widget script'))

  container.value?.appendChild(script)
})

onBeforeUnmount(() => {
  delete window[CALLBACK_NAME]
})
</script>