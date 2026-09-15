<template>
  <div class="w-full">
    <div class="mb-6 flex items-center justify-between anim-header">
      <div>
        <h2 class="text-2xl font-bold" style="color: var(--color-text);">{{ $t('settings.title') }}</h2>
        <p class="mt-1 text-sm" style="color: var(--color-text-secondary);">
          {{ $t('settings.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="h-32 w-full animate-pulse rounded-2xl" style="background-color: var(--color-border);"></div>
      <div class="h-48 w-full animate-pulse rounded-2xl" style="background-color: var(--color-border);"></div>
      <div class="h-40 w-full animate-pulse rounded-2xl" style="background-color: var(--color-border);"></div>
    </div>

    <form v-else class="space-y-5" @submit.prevent="onSubmit">
      <!-- Success / error banner -->
      <transition name="banner">
        <div v-if="successMsg" class="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm anim-pop" style="background-color: #DCFCE7; color: #16A34A;">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          {{ successMsg }}
        </div>
      </transition>
      <transition name="banner">
        <div v-if="errorMsg" class="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm anim-pop" style="background-color: #FEF2F2; color: #B91C1C;">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {{ errorMsg }}
        </div>
      </transition>

      <!-- ===== Branding card ===== -->
      <section
        class="grid grid-cols-1 gap-6 rounded-2xl border p-5 transition-shadow duration-300 hover:shadow-md sm:grid-cols-2 lg:p-6 anim-card"
        style="background-color: var(--color-surface); border-color: var(--color-border); animation-delay: 0.05s;"
      >
        <!-- Logo upload -->
        <div>
          <label class="mb-2 block text-sm font-semibold" style="color: var(--color-text);">{{ $t('settings.logo') }}</label>
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style="border-color: var(--color-border); background-color: var(--color-bg);"
              :disabled="uploadingLogo"
              @click="logoInput?.click()"
            >
              <transition name="crossfade" mode="out-in">
                <img
                  v-if="form.logoUrl && !logoPreviewError"
                  :key="form.logoUrl"
                  :src="form.logoUrl"
                  alt="Logo preview"
                  class="h-full w-full object-cover"
                  @error="logoPreviewError = true"
                />
                <span v-else key="empty" class="text-xs" style="color: var(--color-text-secondary);">{{ $t('settings.noLogo') }}</span>
              </transition>

              <span
                class="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <svg v-if="uploadingLogo" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
                </svg>
                <span v-else>{{ $t('settings.changeImage') }}</span>
              </span>
            </button>

            <div class="flex-1">
              <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="(e) => onPickImage(e, 'logoUrl')" />
              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  class="rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style="border-color: var(--color-border); color: var(--color-text);"
                  :disabled="uploadingLogo"
                  @click="logoInput?.click()"
                >
                  {{ uploadingLogo ? $t('settings.uploading') : $t('settings.uploadLogo') }}
                </button>
                <transition name="fade">
                  <button
                    v-if="form.logoUrl"
                    type="button"
                    class="text-xs font-semibold text-[#DC2626] transition-opacity hover:opacity-70"
                    @click="form.logoUrl = ''; logoPreviewError = false"
                  >
                    {{ $t('settings.remove') }}
                  </button>
                </transition>
              </div>
              <transition name="fade">
                <p v-if="logoUploadError" class="mt-1.5 text-xs text-[#DC2626]">{{ logoUploadError }}</p>
              </transition>
              <p class="mt-1.5 text-xs" style="color: var(--color-text-secondary);">{{ $t('settings.imageHint') }}</p>
            </div>
          </div>
        </div>

        <!-- Favicon upload -->
        <div>
          <label class="mb-2 block text-sm font-semibold" style="color: var(--color-text);">{{ $t('settings.favicon') }}</label>
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style="border-color: var(--color-border); background-color: var(--color-bg);"
              :disabled="uploadingFavicon"
              @click="faviconInput?.click()"
            >
              <transition name="crossfade" mode="out-in">
                <img
                  v-if="form.faviconUrl && !faviconPreviewError"
                  :key="form.faviconUrl"
                  :src="form.faviconUrl"
                  alt="Favicon preview"
                  class="h-full w-full object-cover"
                  @error="faviconPreviewError = true"
                />
                <span v-else key="empty" class="text-[9px]" style="color: var(--color-text-secondary);">{{ $t('settings.none') }}</span>
              </transition>
              <span class="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <svg v-if="uploadingFavicon" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
                </svg>
                <span v-else>{{ $t('settings.editImage') }}</span>
              </span>
            </button>

            <div class="flex-1">
              <input ref="faviconInput" type="file" accept="image/png,image/jpeg,image/webp,image/x-icon" class="hidden" @change="(e) => onPickImage(e, 'faviconUrl')" />
              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  class="rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style="border-color: var(--color-border); color: var(--color-text);"
                  :disabled="uploadingFavicon"
                  @click="faviconInput?.click()"
                >
                  {{ uploadingFavicon ? $t('settings.uploading') : $t('settings.uploadFavicon') }}
                </button>
                <transition name="fade">
                  <button
                    v-if="form.faviconUrl"
                    type="button"
                    class="text-xs font-semibold text-[#DC2626] transition-opacity hover:opacity-70"
                    @click="form.faviconUrl = ''; faviconPreviewError = false"
                  >
                    {{ $t('settings.remove') }}
                  </button>
                </transition>
              </div>
              <transition name="fade">
                <p v-if="faviconUploadError" class="mt-1.5 text-xs text-[#DC2626]">{{ faviconUploadError }}</p>
              </transition>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== General info card ===== -->
      <section
        class="rounded-2xl border p-5 transition-shadow duration-300 hover:shadow-md lg:p-6 anim-card"
        style="background-color: var(--color-surface); border-color: var(--color-border); animation-delay: 0.1s;"
      >
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text-secondary);">
          {{ $t('settings.siteName') }}
        </h3>

        <div class="space-y-4">
          <div class="field-group">
            <label class="mb-1 block text-sm font-medium" style="color: var(--color-text);">{{ $t('settings.siteName') }} *</label>
            <input
              v-model="form.siteName"
              type="text"
              required
              maxlength="100"
              class="field-input"
              style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text);"
            />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="field-group">
              <label class="mb-1 block text-sm font-medium" style="color: var(--color-text);">{{ $t('settings.contactEmail') }}</label>
              <input
                v-model="form.contactEmail"
                type="email"
                class="field-input"
                style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text);"
              />
            </div>
            <div class="field-group">
              <label class="mb-1 block text-sm font-medium" style="color: var(--color-text);">{{ $t('settings.contactPhone') }}</label>
              <input
                v-model="form.contactPhone"
                type="text"
                maxlength="30"
                class="field-input"
                style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text);"
              />
            </div>
          </div>

          <div class="field-group">
            <label class="mb-1 block text-sm font-medium" style="color: var(--color-text);">{{ $t('settings.address') }}</label>
            <input
              v-model="form.address"
              type="text"
              maxlength="255"
              class="field-input"
              style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text);"
            />
          </div>
        </div>
      </section>

      <!-- ===== Social links card ===== -->
      <section
        class="rounded-2xl border p-5 transition-shadow duration-300 hover:shadow-md lg:p-6 anim-card"
        style="background-color: var(--color-surface); border-color: var(--color-border); animation-delay: 0.15s;"
      >
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text-secondary);">
          {{ $t('settings.facebookUrl') }} / {{ $t('settings.telegramUrl') }}
        </h3>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="field-group">
            <label class="mb-1 block text-sm font-medium" style="color: var(--color-text);">{{ $t('settings.facebookUrl') }}</label>
            <div class="flex items-center gap-2 rounded-xl border px-3 transition-all duration-200 focus-within:ring-2" :style="`border-color: var(--color-border); background-color: var(--color-bg); --tw-ring-color: var(--color-primary);`">
              <svg class="h-4 w-4 shrink-0" style="color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></svg>
              <input v-model="form.facebookUrl" type="text" maxlength="255" class="w-full bg-transparent py-2.5 text-sm outline-none" style="color: var(--color-text);" />
            </div>
          </div>
          <div class="field-group">
            <label class="mb-1 block text-sm font-medium" style="color: var(--color-text);">{{ $t('settings.telegramUrl') }}</label>
            <div class="flex items-center gap-2 rounded-xl border px-3 transition-all duration-200 focus-within:ring-2" :style="`border-color: var(--color-border); background-color: var(--color-bg); --tw-ring-color: var(--color-primary);`">
              <svg class="h-4 w-4 shrink-0" style="color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.9.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.3-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 12.2l-5-1.6c-1.1-.3-1.1-1.1.2-1.6L20.6 3c.9-.3 1.7.2 1.3 1.3Z"/></svg>
              <input v-model="form.telegramUrl" type="text" maxlength="255" class="w-full bg-transparent py-2.5 text-sm outline-none" style="color: var(--color-text);" />
            </div>
          </div>
        </div>
      </section>

      <!-- Save button -->
      <div class="flex justify-end anim-card" style="animation-delay: 0.2s;">
        <button
          type="submit"
          :disabled="saving || uploadingLogo || uploadingFavicon"
          class="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          style="background-color: var(--color-primary);"
        >
          <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"/>
          </svg>
          {{ saving ? $t('settings.saving') : $t('settings.save') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateSiteSettings } from '@/services/siteSettings.service'
import useSiteSettingsStore from '@/stores/siteSettings.store'

const { t } = useI18n()
const { state: siteSettings, fetchSettings } = useSiteSettingsStore()

const loading = ref(true)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const form = reactive({
  siteName: '',
  logoUrl: '',
  faviconUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  facebookUrl: '',
  telegramUrl: '',
})

function syncFormFromStore() {
  form.siteName = siteSettings.siteName || ''
  form.logoUrl = siteSettings.logoUrl || ''
  form.faviconUrl = siteSettings.faviconUrl || ''
  form.contactEmail = siteSettings.contactEmail || ''
  form.contactPhone = siteSettings.contactPhone || ''
  form.address = siteSettings.address || ''
  form.facebookUrl = siteSettings.facebookUrl || ''
  form.telegramUrl = siteSettings.telegramUrl || ''
}

onMounted(async () => {
  loading.value = true
  await fetchSettings()
  syncFormFromStore()
  loading.value = false
})

// ===== Image upload (direct-to-Cloudinary, unsigned preset) =====
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const logoInput = ref(null)
const faviconInput = ref(null)
const uploadingLogo = ref(false)
const uploadingFavicon = ref(false)
const logoUploadError = ref('')
const faviconUploadError = ref('')
const logoPreviewError = ref(false)
const faviconPreviewError = ref(false)

async function onPickImage(e, field) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  const isLogo = field === 'logoUrl'
  const uploading = isLogo ? uploadingLogo : uploadingFavicon
  const uploadError = isLogo ? logoUploadError : faviconUploadError
  const previewError = isLogo ? logoPreviewError : faviconPreviewError

  uploadError.value = ''

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    uploadError.value = t('settings.cloudinaryNotConfigured')
    return
  }

  const localPreviewUrl = URL.createObjectURL(file)
  const previousValue = form[field]
  form[field] = localPreviewUrl
  previewError.value = false

  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', UPLOAD_PRESET)
    body.append('folder', 'site-settings')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body,
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => null)
      throw new Error(errBody?.error?.message || `Upload failed (${res.status})`)
    }

    const data = await res.json()
    form[field] = data.secure_url
  } catch (err) {
    console.error(`${field} upload failed:`, err)
    uploadError.value = err.message || t('settings.uploadFailed')
    form[field] = previousValue
  } finally {
    URL.revokeObjectURL(localPreviewUrl)
    uploading.value = false
  }
}

async function onSubmit() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await updateSiteSettings({ ...form })
    await fetchSettings()
    successMsg.value = t('settings.saveSuccess')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.response?.data?.error || t('settings.saveError')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field-input {
  width: 100%;
  border-radius: 0.75rem;
  border-width: 1px;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  outline: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.anim-header {
  animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.anim-card {
  opacity: 0;
  animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.anim-pop {
  animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.banner-enter-active, .banner-leave-active { transition: all 0.25s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-8px); }

.crossfade-enter-active, .crossfade-leave-active { transition: opacity 0.25s ease; }
.crossfade-enter-from, .crossfade-leave-to { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .anim-header, .anim-card, .anim-pop, .field-input {
    animation: none !important;
    opacity: 1 !important;
    transition: none !important;
  }
}
</style>