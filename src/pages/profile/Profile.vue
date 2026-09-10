<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-[#1A2036]">Profile</h1>

    <!-- Tabs -->
    <div class="mt-6 flex gap-2 border-b border-[#E5E7EB]">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="px-4 py-2.5 text-sm font-semibold transition"
        :class="activeTab === tab.id ? 'border-b-2 border-[#3D5FE0] text-[#3D5FE0]' : 'text-[#6B7280] hover:text-[#1A2036]'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Profile info -->
    <div v-if="activeTab === 'info'" class="mt-6">
      <div v-if="loadingProfile" class="h-48 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
      <form v-else class="space-y-4" @submit.prevent="onSaveProfile">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold uppercase text-[#9CA3AF]">First name</label>
            <input v-model="form.firstName" class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3 text-sm outline-none" />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-[#9CA3AF]">Last name</label>
            <input v-model="form.lastName" class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3 text-sm outline-none" />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-[#9CA3AF]">Phone</label>
            <input v-model="form.phone" class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3 text-sm outline-none" />
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-[#9CA3AF]">Email</label>
            <input :value="form.email" disabled class="mt-1 w-full rounded-full bg-[#F3F4F6] px-5 py-3 text-sm text-[#9CA3AF] outline-none" />
          </div>
        </div>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>
        <p v-if="saveSuccess" class="text-sm text-green-600">Profile updated.</p>

        <button
          type="submit"
          :disabled="saving"
          class="rounded-full bg-[#3D5FE0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:opacity-50"
        >
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </form>
    </div>

    <!-- Login history -->
    <div v-else-if="activeTab === 'history'" class="mt-6">
      <div v-if="loadingHistory" class="space-y-2">
        <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-lg bg-[#F3F4F6]"></div>
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs font-semibold uppercase text-[#9CA3AF]">
            <th class="pb-2">Date</th>
            <th class="pb-2">IP</th>
            <th class="pb-2">Browser</th>
            <th class="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in loginHistory" :key="entry.id" class="border-t border-[#E5E7EB]">
            <td class="py-2 text-[#1A2036]">{{ formatDate(entry.loginTime || entry.createdAt) }}</td>
            <td class="py-2 text-[#6B7280]">{{ entry.ipAddress }}</td>
            <td class="py-2 text-[#6B7280]">{{ entry.userAgent || entry.browser }}</td>
            <td class="py-2">
              <span :class="entry.success ? 'text-green-600' : 'text-red-600'">
                {{ entry.success ? 'Success' : 'Failed' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- My reviews -->
    <div v-else-if="activeTab === 'reviews'" class="mt-6">
      <div v-if="loadingReviews" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-2xl bg-[#F3F4F6]"></div>
      </div>
      <div v-else-if="myReviews.length === 0" class="text-sm text-[#6B7280]">You haven't written any reviews yet.</div>
      <div v-else class="space-y-3">
        <article v-for="r in myReviews" :key="r.id" class="rounded-2xl border border-[#E5E7EB] p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-[#1A2036]">{{ r.vehicleName || `Vehicle #${r.vehicleId}` }}</p>
            <StarRating :model-value="r.rating" />
          </div>
          <p class="mt-1 text-sm text-[#6B7280]">{{ r.comment }}</p>
        </article>
      </div>
    </div>

    <!-- Favorites shortcut -->
    <div v-else-if="activeTab === 'favorites'" class="mt-6 text-center">
      <p class="text-sm text-[#6B7280]">Manage your saved vehicles on the dedicated favorites page.</p>
      <RouterLink to="/favorites" class="mt-3 inline-block rounded-full bg-[#3D5FE0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3350C0]">
        Go to Favorites
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import StarRating from '@/components/reviews/StarRating.vue'
import profileApi from '@/services/profile'
import reviewsApi from '@/services/reviews'

const tabs = [
  { id: 'info', label: 'Profile' },
  { id: 'history', label: 'Login history' },
  { id: 'reviews', label: 'My reviews' },
  { id: 'favorites', label: 'Favorites' },
]
const activeTab = ref('info')

// Profile info
const loadingProfile = ref(true)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)
// NOTE: confirm exact field names (firstName/lastName/phone) against
// UserProfileResponseDTO / UpdateRequestDTO on the backend.
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
    saveError.value = err.response?.data?.message || 'Could not update your profile.'
  } finally {
    saving.value = false
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
async function loadMyReviews() {
  loadingReviews.value = true
  try {
    const { data } = await reviewsApi.myReviews()
    myReviews.value = Array.isArray(data) ? data : data?.content ?? []
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

// Lazy-load each tab's data only once, the first time it's opened
const loaded = { history: false, reviews: false }
watch(activeTab, (tab) => {
  if (tab === 'history' && !loaded.history) { loaded.history = true; loadHistory() }
  if (tab === 'reviews' && !loaded.reviews) { loaded.reviews = true; loadMyReviews() }
})

onMounted(loadProfile)
</script>