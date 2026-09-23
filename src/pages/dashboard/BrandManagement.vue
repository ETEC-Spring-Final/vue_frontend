<template>
  <div class="animate-page-in">
    <!-- Header (the page title itself is rendered by BackLayout's top bar) -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('brandMgmt.subtitle') }}</p>
      <button
        type="button"
        class="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95"
        :style="{ backgroundColor: 'var(--color-primary)' }"
        @click="openCreate"
      >
        + {{ $t('brandMgmt.add') }}
      </button>
    </div>

    <!-- Page-level messages -->
    <p v-if="pageError" class="mt-4 rounded-xl px-4 py-3 text-sm text-red-600" style="background-color: rgba(220,38,38,0.08);">
      {{ pageError }}
    </p>
    <p v-if="pageSuccess" class="mt-4 rounded-xl px-4 py-3 text-sm text-green-600" style="background-color: rgba(22,163,74,0.08);">
      {{ pageSuccess }}
    </p>

    <!-- Table -->
    <div
      class="mt-6 overflow-x-auto rounded-2xl border"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-xl" :style="{ backgroundColor: 'var(--color-border)' }"></div>
      </div>

      <p v-else-if="brands.length === 0" class="p-8 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        {{ $t('brandMgmt.empty') }}
      </p>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">
            <th class="w-24 px-4 py-3">{{ $t('brandMgmt.image') }}</th>
            <th class="px-4 py-3">{{ $t('brandMgmt.name') }}</th>
            <th class="px-4 py-3 text-right">{{ $t('brandMgmt.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in paged"
            :key="b.id"
            class="border-t transition-colors duration-150 hover:bg-[var(--color-primary-light)]"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <td class="px-4 py-3">
              <img
                v-if="imageOf(b)"
                :src="imageOf(b)"
                :alt="b.name"
                class="h-12 w-12 rounded-xl border object-contain p-1"
                :style="{ borderColor: 'var(--color-border)', backgroundColor: '#fff' }"
              />
              <span
                v-else
                class="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold"
                :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }"
              >
                {{ (b.name?.[0] || '?').toUpperCase() }}
              </span>
            </td>
            <td class="px-4 py-3 font-semibold" :style="{ color: 'var(--color-text)' }">{{ b.name }}</td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:shadow-sm active:scale-95"
                  :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
                  @click="openEdit(b)"
                >
                  {{ $t('brandMgmt.edit') }}
                </button>
                <button
                  type="button"
                  :disabled="deletingId === b.id"
                  class="rounded-full border px-4 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white active:scale-95 disabled:opacity-50"
                  style="border-color: #dc2626;"
                  @click="onDelete(b)"
                >
                  {{ $t('brandMgmt.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loading && brands.length > 0"
      class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
      :style="{ color: 'var(--color-text-secondary)' }"
    >
      <div class="flex items-center gap-3">
        <span>{{ rangeFrom }}–{{ rangeTo }} {{ $t('brandMgmt.of', 'of') }} {{ brands.length }}</span>
        <select
          v-model.number="pageSize"
          class="rounded-lg border px-2 py-1.5 text-xs outline-none"
          :style="{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
        >
          <option v-for="n in pageSizes" :key="n" :value="n">{{ n }} / {{ $t('brandMgmt.perPage', 'page') }}</option>
        </select>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
          :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
          :disabled="page === 1"
          @click="page--"
        >{{ $t('brandMgmt.previous', 'Previous') }}</button>

        <template v-for="(b, i) in pageButtons" :key="`${b}-${i}`">
          <span v-if="b === '…'" class="px-1">…</span>
          <button
            v-else
            type="button"
            class="h-8 min-w-8 rounded-full border px-2 text-xs font-semibold transition active:scale-95"
            :style="
              b === page
                ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
                : { borderColor: 'var(--color-border)', color: 'var(--color-text)' }
            "
            @click="page = b"
          >{{ b }}</button>
        </template>

        <button
          type="button"
          class="rounded-full border px-3 py-1.5 transition hover:opacity-80 disabled:opacity-40"
          :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
          :disabled="page >= totalPages"
          @click="page++"
        >{{ $t('brandMgmt.next', 'Next') }}</button>
      </div>
    </div>

    <!-- Create / edit modal -->
    <Transition name="fade">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
        style="background-color: rgba(0,0,0,0.5);"
        @mousedown.self="closeModal"
      >
        <div
          role="dialog"
          aria-modal="true"
          class="w-full max-w-md rounded-2xl border p-6 shadow-xl"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">
            {{ editingId ? $t('brandMgmt.editTitle') : $t('brandMgmt.addTitle') }}
          </h2>

          <div class="mt-5 space-y-4">
            <!-- Name -->
            <div>
              <label class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">
                {{ $t('brandMgmt.name') }}
              </label>
              <input
                v-model.trim="form.name"
                type="text"
                maxlength="100"
                :placeholder="$t('brandMgmt.namePlaceholder')"
                class="mt-1 w-full rounded-full px-5 py-3 text-sm outline-none transition-shadow focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
                @keyup.enter="onSave"
              />
            </div>

            <!-- Image (drag & drop, same pattern as VehicleManagement) -->
            <div>
              <label class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">
                {{ $t('brandMgmt.image') }}
              </label>

              <div class="mt-1 flex items-center gap-4">
                <img
                  v-if="previewUrl || form.currentImage"
                  :src="previewUrl || form.currentImage"
                  alt=""
                  class="h-16 w-16 shrink-0 rounded-xl border object-contain p-1"
                  :style="{ borderColor: 'var(--color-border)', backgroundColor: '#fff' }"
                />

                <label
                  class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 hover:border-[var(--color-primary)]/60"
                  :style="{
                    borderColor: dragOver ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: dragOver ? 'var(--color-bg)' : 'transparent',
                  }"
                  :class="dragOver ? 'scale-[1.01]' : ''"
                  @dragover.prevent="dragOver = true"
                  @dragleave.prevent="dragOver = false"
                  @drop.prevent="onDrop"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    class="h-6 w-6 transition-transform duration-200"
                    :class="dragOver ? '-translate-y-1' : ''"
                    :style="{ color: 'var(--color-text-secondary)' }"
                  >
                    <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" />
                  </svg>
                  <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                    {{ previewUrl || form.currentImage ? $t('brandMgmt.changeImage') : $t('brandMgmt.dropHint') }}
                  </span>
                  <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFileChange" />
                </label>
              </div>
              <p class="mt-2 text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('brandMgmt.imageHint') }}</p>
            </div>

            <p v-if="modalError" class="text-sm text-red-600">{{ modalError }}</p>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              :disabled="saving"
              class="rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50"
              :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
              @click="closeModal"
            >
              {{ $t('brandMgmt.cancel') }}
            </button>
            <button
              type="button"
              :disabled="saving"
              class="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50"
              :style="{ backgroundColor: 'var(--color-primary)' }"
              @click="onSave"
            >
              {{ saving ? $t('brandMgmt.saving') : $t('brandMgmt.save') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  brandImageOf,
  createBrand,
  deleteBrand,
  fetchBrands,
  updateBrand,
  uploadBrandImage,
} from '@/services/brands'

const { t } = useI18n()

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

// ----- List -----
const brands = ref([])
const loading = ref(true)
const pageError = ref('')
const pageSuccess = ref('')
const deletingId = ref(null)

const imageOf = brandImageOf

// ----- Pagination (client-side: the full brand list is loaded at once) -----
const page = ref(1)
const pageSize = ref(10)
const pageSizes = [10, 20, 50]

const totalPages = computed(() => Math.max(1, Math.ceil(brands.value.length / pageSize.value)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return brands.value.slice(start, start + pageSize.value)
})
const rangeFrom = computed(() => (brands.value.length === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeTo = computed(() => Math.min(page.value * pageSize.value, brands.value.length))

// 1 … 4 5 6 … 9
const pageButtons = computed(() => {
  const total = totalPages.value
  const cur = page.value
  const nums = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
})

watch(pageSize, () => {
  page.value = 1
})
// Stay in range after deleting the last row on a page
watch(totalPages, (n) => {
  if (page.value > n) page.value = n
})

function apiMessage(err, fallback) {
  return err?.response?.data?.message || fallback
}

function flash(message) {
  pageSuccess.value = message
  setTimeout(() => { if (pageSuccess.value === message) pageSuccess.value = '' }, 3500)
}

async function loadBrands() {
  loading.value = true
  pageError.value = ''
  try {
    brands.value = await fetchBrands()
  } catch (err) {
    pageError.value = apiMessage(err, t('brandMgmt.loadError'))
  } finally {
    loading.value = false
  }
}

// ----- Modal state -----
const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const modalError = ref('')
const form = reactive({ name: '', currentImage: '' })

const fileInput = ref(null)
const pendingFile = ref(null)
const previewUrl = ref('')
const dragOver = ref(false)

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  pendingFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function openCreate() {
  clearPreview()
  editingId.value = null
  form.name = ''
  form.currentImage = ''
  modalError.value = ''
  modalOpen.value = true
}

function openEdit(brand) {
  clearPreview()
  editingId.value = brand.id
  form.name = brand.name ?? ''
  form.currentImage = imageOf(brand)
  modalError.value = ''
  modalOpen.value = true
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
  clearPreview()
}

/**
 * Shared validation + preview logic for both the file-picker input and
 * drag-and-drop, so the two entry points can never drift out of sync.
 */
function validateAndSetFile(file) {
  modalError.value = ''

  if (!ALLOWED_TYPES.includes(file.type)) {
    modalError.value = t('brandMgmt.imageType')
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    modalError.value = t('brandMgmt.imageTooLarge')
    return
  }

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  pendingFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  validateAndSetFile(file)
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  validateAndSetFile(file)
}

// ----- Save (create/update the name first, then upload the image by id) -----
async function onSave() {
  if (saving.value) return
  modalError.value = ''

  if (!form.name) {
    modalError.value = t('brandMgmt.nameRequired')
    return
  }

  saving.value = true
  try {
    let id = editingId.value

    if (id) {
      await updateBrand(id, form.name)
    } else {
      const created = await createBrand(form.name)
      id = created?.id
      editingId.value = id // if the image upload fails, a retry updates instead of duplicating
    }

    if (pendingFile.value && id) {
      try {
        await uploadBrandImage(id, pendingFile.value)
      } catch (err) {
        // The brand itself was saved — keep the modal open so the image can be retried.
        modalError.value = apiMessage(err, t('brandMgmt.uploadError'))
        await loadBrands()
        return
      }
    }

    modalOpen.value = false
    clearPreview()
    flash(t('brandMgmt.saved'))
    await loadBrands()
  } catch (err) {
    modalError.value = apiMessage(err, t('brandMgmt.saveError'))
  } finally {
    saving.value = false
  }
}

// ----- Delete -----
async function onDelete(brand) {
  if (!window.confirm(`${t('brandMgmt.confirmDelete')} ${brand.name}?`)) return
  deletingId.value = brand.id
  pageError.value = ''
  try {
    await deleteBrand(brand.id)
    flash(t('brandMgmt.deleted'))
    await loadBrands()
  } catch (err) {
    // Usually a foreign-key error: vehicles still reference this brand.
    pageError.value = t('brandMgmt.deleteError')
  } finally {
    deletingId.value = null
  }
}

// Esc closes the modal
function onKeydown(e) {
  if (e.key === 'Escape' && modalOpen.value) closeModal()
}
watch(modalOpen, (open) => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onMounted(loadBrands)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearPreview()
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