<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <h1 class="text-xl font-bold" style="color: var(--color-text);">{{ $t('profile.title') }}</h1>

    <!-- ===== Edit info card ===== -->
    <section
      class="rounded-2xl border p-5 md:p-6"
      style="background-color: var(--color-surface); border-color: var(--color-border);"
    >
      <h2 class="mb-4 text-base font-semibold" style="color: var(--color-text);">{{ $t('profile.editInfo') }}</h2>

      <div v-if="loadingProfile" class="py-8 text-center text-sm" style="color: var(--color-text-secondary);">
        …
      </div>

      <form v-else class="space-y-4" @submit.prevent="onSaveProfile">
        <!-- Avatar (click to pick a local image, uploads to Cloudinary) -->
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold"
            style="background-color: var(--color-primary-light); color: var(--color-primary);"
            :disabled="uploadingAvatar"
            @click="fileInput?.click()"
          >
            <img
              v-if="form.profilePicture && !avatarError"
              :src="form.profilePicture"
              alt=""
              class="h-full w-full object-cover"
              @error="avatarError = true"
            />
            <span v-else>{{ initials }}</span>

            <span
              class="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
            >
              {{ uploadingAvatar ? '…' : 'Change' }}
            </span>
          </button>

          <div class="flex-1">
            <input
              ref="fileInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="onPickAvatar"
            />
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
              style="border-color: var(--color-border); color: var(--color-text);"
              :disabled="uploadingAvatar"
              @click="fileInput?.click()"
            >
              {{ uploadingAvatar ? 'Uploading…' : 'Upload photo' }}
            </button>
            <p v-if="avatarUploadError" class="mt-1 text-xs text-[#DC2626]">{{ avatarUploadError }}</p>
            <p class="mt-1 text-xs" style="color: var(--color-text-secondary);">JPG, PNG or WEBP.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium" style="color: var(--color-text-secondary);">
              {{ $t('profile.firstName') }}
            </label>
            <input
              v-model="form.firstName"
              type="text"
              required
              maxlength="50"
              class="w-full rounded-lg border px-3 py-2 text-sm"
              style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium" style="color: var(--color-text-secondary);">
              {{ $t('profile.lastName') }}
            </label>
            <input
              v-model="form.lastName"
              type="text"
              required
              maxlength="50"
              class="w-full rounded-lg border px-3 py-2 text-sm"
              style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium" style="color: var(--color-text-secondary);">
              {{ $t('profile.phone') }}
            </label>
            <input
              v-model="form.phone"
              type="tel"
              required
              minlength="9"
              maxlength="10"
              class="w-full rounded-lg border px-3 py-2 text-sm"
              style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium" style="color: var(--color-text-secondary);">
              {{ $t('profile.email') }}
            </label>
            <input
              :value="profile?.email"
              type="email"
              disabled
              class="w-full cursor-not-allowed rounded-lg border px-3 py-2 text-sm opacity-60"
              style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
            />
          </div>
        </div>

        <p v-if="profileMessage" class="text-sm" :style="{ color: profileMessageIsError ? '#DC2626' : '#16A34A' }">
          {{ profileMessage }}
        </p>

        <button
          type="submit"
          :disabled="savingProfile || uploadingAvatar"
          class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          style="background-color: var(--color-primary);"
        >
          {{ savingProfile ? $t('profile.saving') : $t('profile.save') }}
        </button>
      </form>
    </section>

    <!-- ===== Change password card (LOCAL accounts only) ===== -->
    <section
      v-if="profile && profile.authProvider === 'LOCAL'"
      class="rounded-2xl border p-5 md:p-6"
      style="background-color: var(--color-surface); border-color: var(--color-border);"
    >
      <h2 class="mb-4 text-base font-semibold" style="color: var(--color-text);">{{ $t('profile.changePassword') }}</h2>

      <form class="space-y-4" @submit.prevent="onChangePassword">
        <div>
          <label class="mb-1 block text-xs font-medium" style="color: var(--color-text-secondary);">
            {{ $t('profile.currentPassword') }}
          </label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            required
            class="w-full rounded-lg border px-3 py-2 text-sm"
            style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium" style="color: var(--color-text-secondary);">
              {{ $t('profile.newPassword') }}
            </label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              required
              minlength="8"
              maxlength="100"
              class="w-full rounded-lg border px-3 py-2 text-sm"
              style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium" style="color: var(--color-text-secondary);">
              {{ $t('profile.confirmPassword') }}
            </label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              class="w-full rounded-lg border px-3 py-2 text-sm"
              style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text);"
            />
          </div>
        </div>

        <p v-if="passwordMessage" class="text-sm" :style="{ color: passwordMessageIsError ? '#DC2626' : '#16A34A' }">
          {{ passwordMessage }}
        </p>

        <button
          type="submit"
          :disabled="savingPassword"
          class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          style="background-color: var(--color-primary);"
        >
          {{ savingPassword ? $t('profile.saving') : $t('profile.updatePassword') }}
        </button>
      </form>
    </section>

    <!-- ===== My login history ===== -->
    <section
      class="rounded-2xl border p-5 md:p-6"
      style="background-color: var(--color-surface); border-color: var(--color-border);"
    >
      <h2 class="mb-4 text-base font-semibold" style="color: var(--color-text);">{{ $t('profile.myLoginHistory') }}</h2>

      <div v-if="loadingHistory" class="py-8 text-center text-sm" style="color: var(--color-text-secondary);">
        …
      </div>

      <div v-else-if="!historyRows.length" class="py-8 text-center text-sm" style="color: var(--color-text-secondary);">
        —
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b" style="border-color: var(--color-border);">
              <th class="px-3 py-2 font-medium" style="color: var(--color-text-secondary);">{{ $t('profile.ip') }}</th>
              <th class="px-3 py-2 font-medium" style="color: var(--color-text-secondary);">{{ $t('profile.device') }}</th>
              <th class="px-3 py-2 font-medium" style="color: var(--color-text-secondary);">{{ $t('profile.status') }}</th>
              <th class="px-3 py-2 font-medium" style="color: var(--color-text-secondary);">{{ $t('profile.loginTime') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in historyRows" :key="row.id" class="border-b last:border-0" style="border-color: var(--color-border);">
              <td class="px-3 py-2" style="color: var(--color-text);">{{ row.ipAddress }}</td>
              <td class="max-w-[220px] truncate px-3 py-2" style="color: var(--color-text);" :title="row.device">{{ row.device }}</td>
              <td class="px-3 py-2">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :style="row.success
                    ? 'background-color: rgba(22,163,74,0.12); color: #16A34A;'
                    : 'background-color: rgba(220,38,38,0.12); color: #DC2626;'"
                >
                  {{ row.success ? $t('profile.success') : $t('profile.failed') }}
                </span>
              </td>
              <td class="px-3 py-2 whitespace-nowrap" style="color: var(--color-text-secondary);">{{ formatDate(row.loggedInAt) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="historyTotalPages > 1" class="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            :disabled="historyPage === 0"
            class="rounded-lg border px-3 py-1.5 disabled:opacity-40"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="historyPage--"
          >
            ‹
          </button>
          <span style="color: var(--color-text-secondary);">{{ historyPage + 1 }} / {{ historyTotalPages }}</span>
          <button
            type="button"
            :disabled="historyPage >= historyTotalPages - 1"
            class="rounded-lg border px-3 py-1.5 disabled:opacity-40"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="historyPage++"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useAuthStore from '@/stores/auth.store'
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getMyLoginHistory,
} from '@/services/profile.service'
import { uploadToCloudinary } from '@/services/cloudinary'

const { t } = useI18n()
const { fetchProfile } = useAuthStore()

// ===== Profile info =====
const profile = ref(null)
const loadingProfile = ref(true)
const savingProfile = ref(false)
const profileMessage = ref('')
const profileMessageIsError = ref(false)
const avatarError = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  profilePicture: '',
})

const initials = ref('') // filled once profile loads

async function loadProfile() {
  loadingProfile.value = true
  try {
    const data = await getMyProfile()
    profile.value = data
    form.firstName = data.firstName || ''
    form.lastName = data.lastName || ''
    form.phone = data.phone || ''
    form.profilePicture = data.profilePicture || ''
    const fromName = (data.firstName?.[0] || '') + (data.lastName?.[0] || '')
    initials.value = (fromName || data.email || 'A').slice(0, 2).toUpperCase()
  } catch (err) {
    console.error('Failed to load profile:', err)
    profileMessage.value = t('profile.saveError')
    profileMessageIsError.value = true
  } finally {
    loadingProfile.value = false
  }
}

// ===== Avatar upload (via backend POST /api/uploads) =====
const fileInput = ref(null)
const uploadingAvatar = ref(false)
const avatarUploadError = ref('')

async function onPickAvatar(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // allow re-selecting the same file later
  if (!file) return

  avatarUploadError.value = ''

  // Instant local preview while the upload is in flight.
  const localPreviewUrl = URL.createObjectURL(file)
  const previousPicture = form.profilePicture
  form.profilePicture = localPreviewUrl
  avatarError.value = false

  uploadingAvatar.value = true
  try {
    const data = await uploadToCloudinary(file, 'admin-profiles')
    form.profilePicture = data.url // real URL replaces the local preview
  } catch (err) {
    console.error('Avatar upload failed:', err)
    avatarUploadError.value = err.message || 'Could not upload the image.'
    form.profilePicture = previousPicture // roll back to the last saved picture
  } finally {
    URL.revokeObjectURL(localPreviewUrl)
    uploadingAvatar.value = false
  }
}

async function onSaveProfile() {
  savingProfile.value = true
  profileMessage.value = ''
  try {
    const updated = await updateMyProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      profilePicture: form.profilePicture || undefined,
    })
    profile.value = updated
    profileMessage.value = t('profile.saveSuccess')
    profileMessageIsError.value = false
    // Refresh the shared auth store (sidebar/header) with the new values.
    await fetchProfile()
  } catch (err) {
    console.error('Failed to update profile:', err)
    profileMessage.value = t('profile.saveError')
    profileMessageIsError.value = true
  } finally {
    savingProfile.value = false
  }
}

// ===== Change password =====
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const savingPassword = ref(false)
const passwordMessage = ref('')
const passwordMessageIsError = ref(false)

async function onChangePassword() {
  passwordMessage.value = ''

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordMessage.value = t('profile.passwordMismatch')
    passwordMessageIsError.value = true
    return
  }

  savingPassword.value = true
  try {
    await changeMyPassword({ ...passwordForm })
    passwordMessage.value = t('profile.passwordSuccess')
    passwordMessageIsError.value = false
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err) {
    console.error('Failed to change password:', err)
    passwordMessage.value = err?.response?.data?.message || t('profile.passwordError')
    passwordMessageIsError.value = true
  } finally {
    savingPassword.value = false
  }
}

// ===== Login history =====
const historyRows = ref([])
const loadingHistory = ref(true)
const historyPage = ref(0)
const historyTotalPages = ref(1)

async function loadHistory() {
  loadingHistory.value = true
  try {
    const pageData = await getMyLoginHistory({ page: historyPage.value, size: 8 })
    historyRows.value = pageData.content || []
    historyTotalPages.value = pageData.totalPages ?? 1
  } catch (err) {
    console.error('Failed to load login history:', err)
    historyRows.value = []
  } finally {
    loadingHistory.value = false
  }
}

watch(historyPage, loadHistory)

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

onMounted(() => {
  loadProfile()
  loadHistory()
})
</script>