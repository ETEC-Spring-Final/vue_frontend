<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-5xl animate-page-in px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('profile.title') }}</h1>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

        <!-- ===== Left: profile summary card ===== -->
        <aside class="lg:col-span-1">
          <div
            class="rounded-2xl border p-6 text-center"
            :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
          >
            <!-- Avatar with upload overlay -->
            <div class="relative mx-auto h-24 w-24">
              <img
                v-if="avatarPreview || form.profilePicture"
                :src="avatarPreview || form.profilePicture"
                :alt="$t('profile.avatarAlt')"
                class="h-24 w-24 rounded-full object-cover"
                :class="{ 'opacity-60': avatarUploading }"
              />
              <span
                v-else
                class="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold"
                :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
              >
                {{ initials }}
              </span>

              <div
                v-if="avatarUploading"
                class="absolute inset-0 flex items-center justify-center rounded-full"
                style="background-color: rgba(0,0,0,0.35);"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6 animate-spin text-white">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-opacity="0.25"/>
                  <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M21 12a9 9 0 0 0-9-9"/>
                </svg>
              </div>

              <button
                type="button"
                :disabled="avatarUploading"
                class="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed"
                :style="{ backgroundColor: 'var(--color-primary)', color: '#fff' }"
                :aria-label="$t('profile.changeAvatar')"
                @click="fileInput?.click()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                  <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 8h3l2-3h6l2 3h3v11H4V8Z"/>
                  <circle cx="12" cy="13" r="3.2" stroke="currentColor" stroke-width="1.8"/>
                </svg>
              </button>
              <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onAvatarChange" />
            </div>

            <p class="mt-4 text-base font-bold" :style="{ color: 'var(--color-text)' }">
              {{ [form.firstName, form.lastName].filter(Boolean).join(' ') || $t('profile.unnamed') }}
            </p>
            <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ form.email }}</p>

            <p v-if="memberSince" class="mt-2 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
              {{ $t('profile.memberSince', { date: memberSince }) }}
            </p>

            <p v-if="avatarError" class="mt-2 text-xs text-red-600">{{ avatarError }}</p>

            <!-- Quick stats -->
            <div class="mt-5 grid grid-cols-3 gap-2 border-t pt-4" :style="{ borderColor: 'var(--color-border)' }">
              <div>
                <p class="text-lg font-bold" :style="{ color: 'var(--color-primary)' }">{{ reservationsCount ?? '—' }}</p>
                <p class="text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.stats.reservations') }}</p>
              </div>
              <div>
                <p class="text-lg font-bold" :style="{ color: 'var(--color-primary)' }">{{ favoritesCount ?? '—' }}</p>
                <p class="text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.stats.favorites') }}</p>
              </div>
              <div>
                <p class="text-lg font-bold" :style="{ color: 'var(--color-primary)' }">{{ loaded.reviews ? myReviewsTotal : '—' }}</p>
                <p class="text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.stats.reviews') }}</p>
              </div>
            </div>
          </div>
        </aside>

        <!-- ===== Right: tabs + content ===== -->
        <div class="lg:col-span-2">
          <div class="flex gap-2 border-b" :style="{ borderColor: 'var(--color-border)' }">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="relative px-4 py-2.5 text-sm font-semibold transition-colors duration-200"
              :style="{ color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
              <span
                class="absolute inset-x-4 -bottom-[1px] h-0.5 rounded-full transition-transform duration-200"
                :style="{ backgroundColor: 'var(--color-primary)', transform: activeTab === tab.id ? 'scaleX(1)' : 'scaleX(0)' }"
              />
            </button>
          </div>

          <Transition name="fade" mode="out-in">
            <!-- Profile info -->
            <div v-if="activeTab === 'info'" key="info" class="mt-6">
              <div v-if="loadingProfile" class="h-48 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
              <form v-else class="space-y-4" @submit.prevent="onSaveProfile">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.firstName') }}</label>
                    <input
                      v-model="form.firstName"
                      class="mt-1 w-full rounded-full px-5 py-3 text-sm outline-none transition-shadow focus:shadow-sm"
                      :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.lastName') }}</label>
                    <input
                      v-model="form.lastName"
                      class="mt-1 w-full rounded-full px-5 py-3 text-sm outline-none transition-shadow focus:shadow-sm"
                      :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.phone') }}</label>
                    <input
                      v-model="form.phone"
                      class="mt-1 w-full rounded-full px-5 py-3 text-sm outline-none transition-shadow focus:shadow-sm"
                      :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.email') }}</label>
                    <input
                      :value="form.email" disabled
                      class="mt-1 w-full rounded-full px-5 py-3 text-sm outline-none"
                      :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
                    />
                  </div>
                </div>

                <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>
                <p v-if="saveSuccess" class="text-sm text-green-600">{{ $t('profile.saveSuccess') }}</p>

                <button
                  type="submit"
                  :disabled="saving"
                  class="rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50"
                  :style="{ backgroundColor: 'var(--color-primary)' }"
                >
                  {{ saving ? $t('profile.saving') : $t('profile.save') }}
                </button>
              </form>
            </div>

            <!-- Login history -->
            <div v-else-if="activeTab === 'history'" key="history" class="mt-6">
              <div v-if="loadingHistory" class="space-y-2">
                <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-lg" :style="{ backgroundColor: 'var(--color-border)' }"></div>
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">
                      <th class="pb-2">{{ $t('profile.historyDate') }}</th>
                      <th class="pb-2">{{ $t('profile.historyIp') }}</th>
                      <th class="pb-2">{{ $t('profile.historyBrowser') }}</th>
                      <th class="pb-2">{{ $t('profile.historyStatus') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="entry in loginHistory" :key="entry.id" class="border-t" :style="{ borderColor: 'var(--color-border)' }">
                      <td class="py-2" :style="{ color: 'var(--color-text)' }">{{ formatDate(entry.loginTime || entry.createdAt) }}</td>
                      <td class="py-2" :style="{ color: 'var(--color-text-secondary)' }">{{ entry.ipAddress }}</td>
                      <td class="py-2" :style="{ color: 'var(--color-text-secondary)' }">{{ entry.userAgent || entry.browser }}</td>
                      <td class="py-2">
                        <span :class="entry.success ? 'text-green-600' : 'text-red-600'">
                          {{ entry.success ? $t('profile.historySuccess') : $t('profile.historyFailed') }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- My reviews -->
            <div v-else-if="activeTab === 'reviews'" key="reviews" class="mt-6">
              <div v-if="loadingReviews" class="space-y-3">
                <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-2xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
              </div>
              <div v-else-if="myReviews.length === 0" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
                {{ $t('profile.noReviews') }}
              </div>
              <div v-else class="space-y-3">
                <article v-for="r in myReviews" :key="r.id" class="rounded-2xl border p-4 transition-shadow duration-200 hover:shadow-sm" :style="{ borderColor: 'var(--color-border)' }">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ r.vehicleName || `Vehicle #${r.vehicleId}` }}</p>
                    <StarRating :model-value="r.rating" />
                  </div>
                  <p class="mt-1 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ r.comment }}</p>
                </article>
              </div>
            </div>

            <!-- Favorites shortcut -->
            <div v-else-if="activeTab === 'favorites'" key="favorites" class="mt-6 text-center">
              <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('profile.favoritesHint') }}</p>
              <RouterLink
                to="/favorites"
                class="mt-3 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95"
                :style="{ backgroundColor: 'var(--color-primary)' }"
              >
                {{ $t('profile.goFavorites') }}
              </RouterLink>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import profileApi from '@/services/profile'
import reviewsApi from '@/services/reviews'
import { getMyReservations } from '@/services/reservations'
import { fetchMyFavorites } from '@/services/vehicles'
import { uploadToCloudinary } from '@/services/cloudinary'
import useAuthStore from '@/stores/auth.store'

const { t } = useI18n()
const { fetchProfile } = useAuthStore()

const tabs = [
  { id: 'info', label: t('profile.tabs.info') },
  { id: 'history', label: t('profile.tabs.history') },
  { id: 'reviews', label: t('profile.tabs.reviews') },
  { id: 'favorites', label: t('profile.tabs.favorites') },
]
const activeTab = ref('info')

// Profile info
const loadingProfile = ref(true)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)
// FIX: field is `profilePicture` on UserProfileResponseDTO, confirmed by
// profile.service.js's JSDoc — previously read as `avatarUrl`, which
// doesn't exist on the backend and was always undefined.
const form = reactive({ firstName: '', lastName: '', phone: '', email: '', profilePicture: '', createdAt: null })

const initials = computed(() => {
  const a = (form.firstName?.[0] || '') + (form.lastName?.[0] || '')
  return (a || form.email?.[0] || '?').toUpperCase()
})

const memberSince = computed(() => {
  if (!form.createdAt) return ''
  return new Date(form.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
})

async function loadProfile() {
  loadingProfile.value = true
  try {
    const { data } = await profileApi.me()
    Object.assign(form, {
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      profilePicture: data.profilePicture ?? '',
      createdAt: data.createdAt ?? null,
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
    saveError.value = err.response?.data?.message || t('profile.saveError')
  } finally {
    saving.value = false
  }
}

// ----- Avatar upload -----
// Uploads via the backend (POST /api/uploads, allow-listed folder
// "profile-pictures"), then immediately PUTs the returned URL
// to /user-profiles/me so it persists across refresh — then refreshes
// auth.store's cached user so SiteHeader's avatar updates without a
// full page reload.
const fileInput = ref(null)
const avatarPreview = ref('')
const avatarError = ref('')
const avatarUploading = ref(false)

async function onAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  avatarError.value = ''

  if (file.size > 3 * 1024 * 1024) {
    avatarError.value = t('profile.avatarTooLarge')
    return
  }

  avatarPreview.value = URL.createObjectURL(file)
  avatarUploading.value = true
  try {
    const { url } = await uploadToCloudinary(file, 'profile-pictures')
    await profileApi.updateMe({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      profilePicture: url,
    })
    form.profilePicture = url
    await fetchProfile() // syncs auth.store.state.user.profilePicture -> SiteHeader
  } catch (err) {
    avatarError.value = err.response?.data?.message || err.message || t('profile.avatarUploadError')
  } finally {
    avatarUploading.value = false
    URL.revokeObjectURL(avatarPreview.value)
    avatarPreview.value = ''
  }
}

// Login history
const loadingHistory = ref(true)
const loginHistory = ref([])
async function loadHistory() {
  loadingHistory.value = true
  try {
    const { data } = await profileApi.loginHistory()
    loginHistory.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loadingHistory.value = false
  }
}

// My reviews
const loadingReviews = ref(true)
const myReviews = ref([])
const myReviewsTotal = ref(0)
async function loadMyReviews() {
  loadingReviews.value = true
  try {
    const { data } = await reviewsApi.myReviews()
    myReviews.value = Array.isArray(data) ? data : data?.content ?? []
    myReviewsTotal.value = Array.isArray(data) ? data.length : (data?.totalElements ?? myReviews.value.length)
  } finally {
    loadingReviews.value = false
  }
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const loaded = reactive({ history: false, reviews: false })
watch(activeTab, (tab) => {
  if (tab === 'history' && !loaded.history) { loaded.history = true; loadHistory() }
  if (tab === 'reviews' && !loaded.reviews) { loaded.reviews = true; loadMyReviews() }
})

const reservationsCount = ref(null)
const favoritesCount = ref(null)

async function loadStats() {
  try {
    const list = await getMyReservations()
    reservationsCount.value = Array.isArray(list) ? list.length : 0
  } catch {
    reservationsCount.value = null
  }
  try {
    const { data } = await fetchMyFavorites()
    const list = Array.isArray(data) ? data : data?.content ?? []
    favoritesCount.value = list.length
  } catch {
    favoritesCount.value = null
  }
}

onMounted(() => {
  loadProfile()
  loadStats()
})
</script>

<style scoped>
@keyframes page-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-page-in { animation: page-in 0.35s ease-out; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>