<template>
  <button
    type="button"
    class="flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
    :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
    @click="onClick"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#229ED9">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.93c-.23.23-.42.42-.86.42z"/>
    </svg>
    {{ label }}
  </button>
</template>

<script setup>
/**
 * Custom Telegram login button — NOT the official <script> widget.
 * The official widget always renders as a cross-origin <iframe> from
 * oauth.telegram.org, whose internal box-shadow/background cannot be
 * overridden by page CSS (Same-Origin Policy). This button instead does
 * a plain top-level redirect to Telegram's OAuth authorization page —
 * identical mechanism to the "Google" button above it (a plain <a>/click
 * redirect), so both buttons render with the SAME page-controlled styling.
 *
 * Docs: https://core.telegram.org/widgets/login#alternative-ways-to-add-the-widget
 * Requires the bot's domain to be registered via @BotFather /setdomain,
 * same requirement as the widget.
 */
const props = defineProps({
  botId: { type: String, required: true },          // numeric bot id (part before ":" in the bot token)
  returnPath: { type: String, default: '/telegram/redirect' }, // where Telegram redirects back to, with auth data appended as query params
  label: { type: String, default: 'Log in with Telegram' },
})

function onClick() {
  const origin = window.location.origin
  const returnTo = `${origin}${props.returnPath}`
  const url =
    `https://oauth.telegram.org/auth?bot_id=${props.botId}` +
    `&origin=${encodeURIComponent(origin)}` +
    `&request_access=write` +
    `&return_to=${encodeURIComponent(returnTo)}`
  window.location.href = url
}
</script>