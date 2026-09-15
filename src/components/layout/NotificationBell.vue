<template>
  <div class="relative" ref="rootRef">
    <!-- Bell trigger -->
    <button
      type="button"
      class="relative flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset transition-all duration-200 hover:scale-105 hover:ring-[var(--color-primary)]/40 active:scale-90"
      style="background-color: var(--color-bg); --tw-ring-color: var(--color-border);"
      @click="toggleOpen"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="var(--color-text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="transition-transform duration-200"
        :class="open ? 'rotate-[-8deg]' : ''"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <Transition name="badge-pop">
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 flex items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style="background-color: #EF4444; min-width: 18px; height: 18px;"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </Transition>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown-pop">
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 flex max-h-[28rem] w-96 flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style="background-color: var(--color-surface); border-color: var(--color-border);"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b px-5 py-4" style="border-color: var(--color-border);">
          <div class="flex items-center gap-2">
            <span class="text-base font-bold" style="color: var(--color-text);">{{ t('notifications.title') }}</span>
            <span
              v-if="unreadCount > 0"
              class="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
              style="background-color: var(--color-primary);"
            >{{ unreadCount }}</span>
          </div>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-xs font-semibold transition-opacity duration-150 hover:opacity-70"
            style="color: var(--color-primary);"
            @click="onMarkAllAsRead"
          >{{ t('notifications.markAllRead') }}</button>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="px-5 py-10 text-center text-sm" style="color: var(--color-text-secondary);">
            {{ t('table.loading') }}
          </div>

          <div v-else-if="notifications.length === 0" class="px-5 py-10 text-center text-sm" style="color: var(--color-text-secondary);">
            {{ t('notifications.empty') }}
          </div>

          <TransitionGroup v-else name="list" tag="div">
            <button
              v-for="n in notifications"
              :key="n.id"
              type="button"
              class="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-[var(--color-primary-light)]"
              :style="!n.isRead ? 'background-color: var(--color-bg);' : ''"
              @click="onOpenNotification(n)"
            >
              <!-- Type icon avatar -->
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105"
                :style="`background-color: ${typeMeta(n.type).bg};`"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="typeMeta(n.type).fg" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="typeMeta(n.type).icon"></svg>
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="block truncate text-sm font-semibold" style="color: var(--color-text);">{{ n.title }}</span>
                  <span v-if="!n.isRead" class="h-2 w-2 shrink-0 rounded-full" style="background-color: var(--color-primary);"></span>
                </span>
                <span class="mt-0.5 block line-clamp-2 text-xs" style="color: var(--color-text-secondary);">{{ n.message }}</span>
                <span class="mt-1 block text-[11px]" style="color: var(--color-text-secondary);">{{ formatRelative(n.createdAt) }}</span>
              </span>
            </button>
          </TransitionGroup>
        </div>

        <!-- Footer -->
        <RouterLink
          to="/dashboard/notifications"
          class="block border-t px-5 py-3 text-center text-xs font-semibold transition-colors duration-150 hover:bg-[var(--color-primary-light)]"
          style="color: var(--color-primary); border-color: var(--color-border);"
          @click="open = false"
        >
          {{ t('notifications.viewAll') }}
        </RouterLink>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import notificationsService from '@/services/notifications.service'

const { t } = useI18n()

const rootRef = ref(null)
const open = ref(false)
const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

let pollTimer = null

const TYPE_META = {
  BOOKING_CONFIRMED: { bg: '#DCFCE7', fg: '#16A34A', icon: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>' },
  BOOKING_CANCELLED: { bg: '#FEE2E2', fg: '#DC2626', icon: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>' },
  RENTAL_STARTING_SOON: { bg: '#DBEAFE', fg: '#2563EB', icon: '<path d="M4 16V8a2 2 0 012-2h5l2 3h5a2 2 0 012 2v5"/><path d="M4 16h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"/>' },
  RENTAL_ENDING_SOON: { bg: '#FEF3C7', fg: '#D97706', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>' },
  PAYMENT_SUCCESS: { bg: '#DCFCE7', fg: '#16A34A', icon: '<path d="M6 2h9l3 3v17H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>' },
  PAYMENT_FAILED: { bg: '#FEE2E2', fg: '#DC2626', icon: '<path d="M6 2h9l3 3v17H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>' },
  RETURN_REMINDER: { bg: '#FEF3C7', fg: '#D97706', icon: '<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>' },
  LATE_RETURN: { bg: '#FEE2E2', fg: '#DC2626', icon: '<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>' },
  PROMOTION: { bg: '#EDE9FE', fg: '#7C3AED', icon: '<path d="M20 12l-8 8-9-9V4h7l10 8z"/><circle cx="7.5" cy="7.5" r="1"/>' },
}
const DEFAULT_META = { bg: '#F3F4F6', fg: '#6B7280', icon: '<path d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 004 0"/>' }

function typeMeta(type) {
  return TYPE_META[type] || DEFAULT_META
}

function formatRelative(value) {
  if (!value) return ''
  const diffMs = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t('notifications.justNow')
  if (mins < 60) return t('notifications.minutesAgo', { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('notifications.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  return t('notifications.daysAgo', { n: days })
}

async function loadUnreadCount() {
  try {
    const { data } = await notificationsService.unreadCount()
    unreadCount.value = typeof data === 'number' ? data : data?.count ?? 0
  } catch {
    // Silently ignore — badge just won't update this cycle
  }
}

async function loadInbox() {
  loading.value = true
  try {
    const { data } = await notificationsService.inbox()
    notifications.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    notifications.value = []
  } finally {
    loading.value = false
  }
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    loadInbox()
  }
}

async function onOpenNotification(n) {
  if (!n.isRead) {
    try {
      await notificationsService.markAsRead(n.id)
      n.isRead = true
      await loadUnreadCount()
    } catch {
      // Ignore — user still sees the notification content either way
    }
  }
}

async function onMarkAllAsRead() {
  try {
    await notificationsService.markAllAsRead()
    notifications.value.forEach((n) => (n.isRead = true))
    unreadCount.value = 0
  } catch {
    // Ignore — badge will self-correct on next poll
  }
}

function onClickOutside(event) {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target)) {
    open.value = false
  }
}

onMounted(() => {
  loadUnreadCount()
  document.addEventListener('click', onClickOutside)
  pollTimer = setInterval(loadUnreadCount, 30000)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.dropdown-pop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dropdown-pop-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-6px);
}

.badge-pop-enter-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.badge-pop-enter-from {
  transform: scale(0);
}

.list-enter-active, .list-leave-active { transition: all 0.2s ease; }
.list-enter-from { opacity: 0; transform: translateX(8px); }
.list-leave-to { opacity: 0; }
.list-move { transition: transform 0.2s ease; }
</style>