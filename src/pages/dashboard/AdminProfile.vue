<template>
  <div class="max-w-3xl">
    <h2 class="text-2xl font-bold" style="color: var(--color-text);">{{ $t('adminProfile.title') }}</h2>

    <!-- Tabs -->
    <div class="mt-6 flex gap-2 border-b" style="border-color: var(--color-border);">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2.5 text-sm font-semibold transition"
        :style="activeTab === tab.id
          ? `border-bottom: 2px solid var(--color-primary); color: var(--color-primary); margin-bottom: -1px;`
          : `color: var(--color-text-secondary);`"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Profile info -->
    <div v-if="activeTab === 'info'" class="mt-6">
      <div v-if="loadingProfile" class="h-48 animate-pulse rounded-2xl" style="background-color: var(--color-border);"></div>

      <div v-else class="rounded-2xl border p-6" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <!-- Avatar -->
        <div class="flex items-center gap-4 mb-6">
          <span
            class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold"
            style="background-color: var(--color-primary-light); color: var(--color-primary);"
          >
            <img v-if="avatarUrl && !avatarError" :src="avatarUrl" alt="" class="h-full w-full object-cover" @error="avatarError = true" />
            <span v-else>{{ initials }}</span>
          </span>
          <div>
            <p class="text-sm font-semibold" style="color: var(--color-text);">{{ form.firstName }} {{ form.lastName }}</p>
            <p class="text-xs" style="color: var(--color-text-secondary);">{{ roleLabel }}</p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="onSaveProfile">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold uppercase" style="color: var(--color-text-secondary);">{{ $t('adminProfile.firstName') }}</label>
              <input
                v-model="form.firstName"
                class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2"
                style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase" style="color: var(--color-text-secondary);">{{ $t('adminProfile.lastName') }}</label>
              <input
                v-model="form.lastName"
                class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2"
                style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase" style="color: var(--color-text-secondary);">{{ $t('adminProfile.phone') }}</label>
              <input
                v-model="form.phone"
                class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2"
                style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase" style="color: var(--color-text-secondary);">{{ $t('adminProfile.email') }}</label>
              <input
                :value="form.email"
                disabled
                class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                style="background-color: var(--color-border); border-color: var(--color-border); color: var(--color-text-secondary);"
              />
            </div>
          </div>

          <p v-if="saveError" class="text-sm" style="color: #DC2626;">{{ saveError }}</p>
          <p v-if="saveSuccess" class="text-sm" style="color: #16A34A;">{{ $t('adminProfile.saved') }}</p>

          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? $t('adminProfile.saving') : $t('adminProfile.save') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Login history -->
    <div v-else-if="activeTab === 'history'" class="mt-6">
      <div class="rounded-2xl border p-6" style="background-color: var(--color-surface); border-color: var(--color-border);">
        <div v-if="loadingHistory" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-lg" style="background-color: var(--color-border);"></div>
        </div>
        <div v-else-if="loginHistory.length === 0" class="text-sm" style="color: var(--color-text-secondary);">
          {{ $t('adminProfile.noHistory') }}
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs font-semibold uppercase" style="color: var(--color-text-secondary);">
              <th class="pb-2">{{ $t('adminProfile.date') }}</th>
              <th class="pb-2">{{ $t('adminProfile.ip') }}</th>
              <th class="pb-2">{{ $t('adminProfile.browser') }}</th>
              <th class="pb-2">{{ $t('adminProfile.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in loginHistory" :key="entry.id" class="border-t" style="border-color: var(--color-border);">
              <td class="py-2" style="color: var(--color-text);">{{ formatDate(entry.loginTime || entry.createdAt) }}</td>
              <td class="py-2" style="color: var(--color-text-secondary);">{{ entry.ipAddress }}</td>
              <td class="py-2" style="color: var(--color-text-secondary);">{{ entry.userAgent || entry.browser }}</td>
              <td class="py-2">
                <span :style="`color: ${entry.success ? '#16A34A' : '#DC2626'}`">
                  {{ entry.success ? $t('adminProfile.success') : $t('adminProfile.failed') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useAuthStore from '@/stores/auth.store'
import profileApi from '@/services/profile'

const { user } = useAuthStore()
const { t: t_ } = useI18n()

const tabs = computed(() => [
  { id: 'info', label: t_('adminProfile.profileTab') },
  { id: 'history', label: t_('adminProfile.historyTab') },
])

const activeTab = ref('info')

const avatarError = ref(false)
const avatarUrl = computed(() => user?.avatarUrl || '')
const initials = computed(() => (user?.name || user?.email || 'A').slice(0, 2).toUpperCase())
const roleLabel = computed(() => user?.role || '')

// Profile info
const loadingProfile = ref(true)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)
const form = reactive({ firstName: '', lastName: '', phone: '', email: '' })

async function loadProfile() {
  loadingProfile.value = true
  try {
    const { data } = await profileApi.me()
    Object.assign(form, {
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
    })
  } finally {
    loadingProfile.value = false
  }
}

async function onSaveProfile() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await profileApi.updateMe({ firstName: form.firstName, lastName: form.lastName, phone: form.phone })
    saveSuccess.value = true
  } catch (err) {
    saveError.value = err.response?.data?.message || t_('adminProfile.saveError')
  } finally {
    saving.value = false
  }
}

// Login history
const loadingHistory = ref(true)
const loginHistory = ref([])
let historyLoaded = false

async function loadHistory() {
  loadingHistory.value = true
  try {
    const { data } = await profileApi.loginHistory()
    loginHistory.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loadingHistory.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'history' && !historyLoaded) {
    historyLoaded = true
    loadHistory()
  }
})

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(loadProfile)
</script>