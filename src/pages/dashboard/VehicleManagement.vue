<template>
  <div class="animate-page-in">
    <!-- Table-level error banner -->
    <Transition name="fade">
      <div
        v-if="tableError"
        class="mb-3 flex items-center justify-between rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/40"
      >
        <span>{{ tableError }}</span>
        <button type="button" class="font-semibold underline underline-offset-2 transition hover:opacity-70" @click="tableError = ''">
          {{ $t('common.dismiss') }}
        </button>
      </div>
    </Transition>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ vehicles.length }} {{ $t('vehicles.count') }}
      </p>
      <button
        type="button"
        class="group flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 active:scale-95"
        style="background-color: var(--color-primary);"
        @click="openCreate"
      >
        <span class="inline-block transition-transform duration-200 group-hover:rotate-90">+</span>
        {{ $t('vehicles.add') }}
      </button>
    </div>

    <div class="mt-4">
      <DataTable :columns="columns" :rows="vehicles" :loading="loading">
        <template #cell-pricePerDay="{ row }">${{ row.pricePerDay }}</template>
        <template #cell-status="{ row }">
          <span :class="statusClass(row.status)">{{ $t(`vehicles.statusValues.${row.status}`, row.status) }}</span>
        </template>
        <template #actions="{ row }">
          <button
            class="text-xs font-semibold transition-all duration-150 hover:opacity-70 hover:underline hover:underline-offset-2"
            style="color: var(--color-primary);"
            @click="openEdit(row)"
          >{{ $t('vehicles.edit') }}</button>
          <button
            class="ml-3 text-xs font-semibold text-red-600 transition-all duration-150 hover:text-red-700 hover:underline hover:underline-offset-2 disabled:opacity-50"
            :disabled="deletingId === row.id"
            @click="onDelete(row)"
          >{{ deletingId === row.id ? $t('vehicles.deleting') : $t('vehicles.delete') }}</button>
        </template>
      </DataTable>
    </div>

    <Modal :open="modalOpen" :title="editing ? $t('vehicles.editTitle') : $t('vehicles.addTitle')" @close="closeModal">
      <form id="vehicle-form" class="space-y-3" @submit.prevent="onSave">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select v-model.number="form.brandId" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('vehicles.brand') }}</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <input v-model="form.model" required :placeholder="$t('vehicles.model')" class="input-field" :style="inputStyle" />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input v-model.number="form.yearOfManufacture" required type="number" :placeholder="$t('vehicles.year')" class="input-field" :style="inputStyle" />
          <input v-model="form.color" required :placeholder="$t('vehicles.color')" class="input-field" :style="inputStyle" />
        </div>

        <input v-model="form.licensePlate" required :placeholder="$t('vehicles.plate')" class="input-field" :style="inputStyle" />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select v-model="form.type" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('vehicles.type') }}</option>
            <option v-for="opt in carTypes" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <select v-model="form.transmission" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('vehicles.transmission') }}</option>
            <option v-for="opt in transmissions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select v-model="form.fuelType" required class="input-field" :style="inputStyle">
            <option value="" disabled>{{ $t('vehicles.fuelType') }}</option>
            <option v-for="opt in fuelTypes" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input v-model.number="form.seats" required type="number" min="1" :placeholder="$t('vehicles.seats')" class="input-field" :style="inputStyle" />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input v-model.number="form.doors" required type="number" min="1" :placeholder="$t('vehicles.doors')" class="input-field" :style="inputStyle" />
          <input v-model.number="form.luggages" required type="number" min="0" :placeholder="$t('vehicles.luggages')" class="input-field" :style="inputStyle" />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input v-model.number="form.pricePerDay" required type="number" step="0.01" :placeholder="$t('vehicles.price')" class="input-field" :style="inputStyle" />
          <input v-model.number="form.mileAge" required type="number" step="0.01" :placeholder="$t('vehicles.mileAge')" class="input-field" :style="inputStyle" />
        </div>

        <select v-model="form.status" required class="input-field" :style="inputStyle">
          <option value="" disabled>{{ $t('vehicles.status') }}</option>
          <option v-for="opt in statuses" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <textarea
          v-model="form.description"
          required
          rows="3"
          :placeholder="$t('vehicles.description')"
          class="input-field resize-none"
          :style="inputStyle"
        ></textarea>

        <Transition name="fade">
          <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>
        </Transition>
        <Transition name="fade">
          <p v-if="justCreated" class="text-sm font-medium" style="color: var(--color-primary);">
            {{ $t('vehicles.gallery.createdHint') }}
          </p>
        </Transition>

        <!-- ================= IMAGE GALLERY ================= -->
        <div class="border-t pt-4" style="border-color: var(--color-border);">
          <h3 class="mb-3 text-sm font-bold" style="color: var(--color-text);">
            {{ $t('vehicles.gallery.title') }}
          </h3>

          <template v-if="editing">
            <!-- Dropzone -->
            <label
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 hover:border-[var(--color-primary)]/60"
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
                class="h-8 w-8 transition-transform duration-200"
                :class="dragOver ? '-translate-y-1' : ''"
                :style="{ color: 'var(--color-text-secondary)' }"
              >
                <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" />
              </svg>
              <span class="text-xs" style="color: var(--color-text-secondary);">
                {{ $t('vehicles.gallery.dropHint') }}
              </span>
              <input type="file" accept="image/*" multiple class="hidden" @change="onFilesSelected" />
            </label>

            <Transition name="fade">
              <p v-if="uploading" class="mt-2 text-xs font-medium animate-pulse" style="color: var(--color-primary);">
                {{ $t('vehicles.gallery.uploading') }}
              </p>
            </Transition>
            <Transition name="fade">
              <p v-if="imageActionError" class="mt-2 text-xs text-red-600">{{ imageActionError }}</p>
            </Transition>

            <!-- Loading skeleton -->
            <div v-if="galleryLoading" class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              <div v-for="n in 4" :key="n" class="aspect-square animate-pulse rounded-xl" style="background-color: var(--color-border);"></div>
            </div>

            <!-- Thumbnails -->
            <TransitionGroup v-else tag="div" name="gallery" class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              <div
                v-for="(img, idx) in galleryImages"
                :key="img.id"
                class="group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 hover:shadow-md"
                :style="{ borderColor: img.attachment.isPrimary ? 'var(--color-primary)' : 'var(--color-border)' }"
              >
                <img
                  :src="img.attachment.fileUrl"
                  :alt="$t('vehicles.gallery.photoAlt')"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                <span
                  v-if="img.attachment.isPrimary"
                  class="absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                  style="background-color: var(--color-primary);"
                >
                  {{ $t('vehicles.gallery.primary') }}
                </span>

                <div class="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    v-if="!img.attachment.isPrimary"
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 transition-transform duration-150 hover:scale-110 active:scale-90"
                    :aria-label="$t('vehicles.gallery.setPrimary')"
                    :title="$t('vehicles.gallery.setPrimary')"
                    @click="setPrimary(img)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" class="h-3.5 w-3.5">
                      <path d="m12 3 2.8 5.9 6.2.9-4.5 4.5 1.1 6.4L12 17.8l-5.6 2.9 1.1-6.4L3 9.8l6.2-.9L12 3Z" />
                    </svg>
                  </button>
                  <button
                    v-if="idx > 0"
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 transition-transform duration-150 hover:scale-110 active:scale-90"
                    :aria-label="$t('vehicles.gallery.moveLeft')"
                    @click="moveImage(idx, -1)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5 text-[#1A2036]">
                      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    v-if="idx < galleryImages.length - 1"
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 transition-transform duration-150 hover:scale-110 active:scale-90"
                    :aria-label="$t('vehicles.gallery.moveRight')"
                    @click="moveImage(idx, 1)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5 text-[#1A2036]">
                      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 transition-transform duration-150 hover:scale-110 hover:bg-red-50 active:scale-90"
                    :aria-label="$t('vehicles.gallery.deletePhoto')"
                    @click="deleteImage(img)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5 text-red-500">
                      <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
                    </svg>
                  </button>
                </div>
              </div>
            </TransitionGroup>

            <p v-if="!galleryLoading && galleryImages.length === 0" class="mt-3 text-xs" style="color: var(--color-text-secondary);">
              {{ $t('vehicles.gallery.empty') }}
            </p>
          </template>

          <p v-else class="text-xs italic" style="color: var(--color-text-secondary);">
            {{ $t('vehicles.gallery.saveFirst') }}
          </p>
        </div>
        <!-- ================= /IMAGE GALLERY ================= -->
      </form>

      <template #footer>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80 active:scale-95"
            style="border-color: var(--color-border); color: var(--color-text);"
            @click="closeModal"
          >{{ editing && justCreated ? $t('vehicles.done') : $t('vehicles.cancel') }}</button>
          <button
            type="submit"
            form="vehicle-form"
            :disabled="saving"
            class="rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:hover:shadow-none"
            style="background-color: var(--color-primary);"
          >
            {{ saving ? $t('vehicles.saving') : $t('vehicles.save') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import api from '@/services/api'
import { uploadToCloudinary } from '@/services/cloudinary'

const { t } = useI18n()

const carTypes = ['SEDAN', 'SUV', 'PICKUP', 'HATCHBACK', 'COUPE', 'TRUCK', 'VAN', 'LUXURY', 'ELECTRIC']
const transmissions = ['AUTOMATIC', 'MANUAL', 'CVT']
const fuelTypes = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']
const statuses = ['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE']

const columns = computed(() => [
  { key: 'brandName', label: t('vehicles.brand') },
  { key: 'model', label: t('vehicles.model') },
  { key: 'licensePlate', label: t('vehicles.plate') },
  { key: 'type', label: t('vehicles.type') },
  { key: 'seats', label: t('vehicles.seats') },
  { key: 'doors', label: t('vehicles.doors') },
  { key: 'pricePerDay', label: t('vehicles.priceDay') },
  { key: 'status', label: t('vehicles.status') },
])

const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
}

const vehicles = ref([])
const brands = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const saveError = ref('')
const justCreated = ref(false)
const deletingId = ref(null)
const tableError = ref('')

// ----- Gallery state -----
const galleryImages = ref([])
const galleryLoading = ref(false)
const uploading = ref(false)
const imageActionError = ref('')
const dragOver = ref(false)

function emptyForm() {
  return {
    brandId: '',
    model: '',
    yearOfManufacture: null,
    licensePlate: '',
    color: '',
    type: '',
    transmission: '',
    fuelType: '',
    seats: null,
    doors: null,
    luggages: null,
    pricePerDay: null,
    mileAge: 0,
    description: '',
    status: '',
  }
}

const form = reactive(emptyForm())

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold transition-transform duration-150 hover:scale-105'
  const map = {
    AVAILABLE: 'bg-green-100 text-green-700',
    RESERVED: 'bg-amber-100 text-amber-700',
    RENTED: 'bg-amber-100 text-amber-700',
    MAINTENANCE: 'bg-red-100 text-red-600',
    UNAVAILABLE: 'bg-gray-200 text-gray-600',
  }
  return `${base} ${map[status] || 'bg-gray-100 text-gray-500'}`
}

async function loadVehicles() {
  loading.value = true
  try {
    const { data } = await api.get('/vehicles')
    vehicles.value = Array.isArray(data) ? data : data?.content ?? []
  } catch (err) {
    tableError.value = err.response?.data?.message || t('vehicles.loadError')
  } finally {
    loading.value = false
  }
}

async function loadBrands() {
  try {
    const { data } = await api.get('/brands')
    brands.value = Array.isArray(data) ? data : data?.content ?? []
  } catch {
    brands.value = []
  }
}

// ----- Gallery actions -----
async function loadGallery(vehicleId) {
  if (!vehicleId) return
  galleryLoading.value = true
  try {
    const { data } = await api.get(`/vehicle-images/${vehicleId}`)
    const list = Array.isArray(data) ? data : data?.content ?? []
    galleryImages.value = [...list].sort(
      (a, b) => (a.attachment?.displayOrder ?? 0) - (b.attachment?.displayOrder ?? 0)
    )
  } catch {
    galleryImages.value = []
  } finally {
    galleryLoading.value = false
  }
}

function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  uploadFiles(files)
}

function onDrop(e) {
  dragOver.value = false
  uploadFiles(Array.from(e.dataTransfer?.files || []))
}

async function uploadFiles(files) {
  const MAX_SIZE = 5 * 1024 * 1024
  const candidates = files.filter((f) => f.type.startsWith('image/'))
  if (candidates.length === 0) return

  // Only drop the oversized files — a single large photo in a batch
  // shouldn't block the valid ones from uploading.
  const images = candidates.filter((f) => f.size <= MAX_SIZE)
  const oversizedCount = candidates.length - images.length

  imageActionError.value = oversizedCount > 0 ? t('vehicles.gallery.tooLargeSkipped', { count: oversizedCount }) : ''
  if (images.length === 0) return

  uploading.value = true
  try {
    let isFirst = galleryImages.value.length === 0
    let nextOrder = galleryImages.value.length

    for (const file of images) {
      const cloudRes = await uploadToCloudinary(file, 'vehicle-images')

      const { data: attachment } = await api.post('/attachments', {
        fileUrl: cloudRes.url,
        documentType: 'VEHICLE_IMAGE',
        isPrimary: isFirst,
        displayOrder: nextOrder,
      })

      await api.post('/vehicle-images', {
        vehicleId: editing.value.id,
        attachmentId: attachment.id,
      })

      isFirst = false
      nextOrder += 1
    }
    await loadGallery(editing.value.id)
  } catch (err) {
    imageActionError.value = err.response?.data?.message || err.message || t('vehicles.gallery.uploadError')
  } finally {
    uploading.value = false
  }
}

async function setPrimary(img) {
  imageActionError.value = ''
  try {
    await api.put(`/vehicle-images/${img.id}`, {
      vehicleId: img.vehicleId,
      attachmentId: img.attachment.id,
      isPrimary: true,
      displayOrder: img.attachment.displayOrder,
    })
    await loadGallery(editing.value.id)
  } catch (err) {
    imageActionError.value = err.response?.data?.message || t('vehicles.gallery.actionError')
  }
}

async function moveImage(idx, direction) {
  const otherIdx = idx + direction
  if (otherIdx < 0 || otherIdx >= galleryImages.value.length) return
  const a = galleryImages.value[idx]
  const b = galleryImages.value[otherIdx]
  imageActionError.value = ''
  try {
    await Promise.all([
      api.put(`/vehicle-images/${a.id}`, {
        vehicleId: a.vehicleId,
        attachmentId: a.attachment.id,
        isPrimary: a.attachment.isPrimary,
        displayOrder: b.attachment.displayOrder,
      }),
      api.put(`/vehicle-images/${b.id}`, {
        vehicleId: b.vehicleId,
        attachmentId: b.attachment.id,
        isPrimary: b.attachment.isPrimary,
        displayOrder: a.attachment.displayOrder,
      }),
    ])
    await loadGallery(editing.value.id)
  } catch (err) {
    imageActionError.value = err.response?.data?.message || t('vehicles.gallery.actionError')
  }
}

async function deleteImage(img) {
  if (!confirm(t('vehicles.gallery.confirmDelete'))) return
  imageActionError.value = ''
  try {
    await api.delete(`/vehicle-images/${img.id}`)
    await loadGallery(editing.value.id)
  } catch (err) {
    imageActionError.value = err.response?.data?.message || t('vehicles.gallery.actionError')
  }
}

// ----- Modal / form actions -----
function openCreate() {
  editing.value = null
  justCreated.value = false
  Object.assign(form, emptyForm())
  saveError.value = ''
  galleryImages.value = []
  imageActionError.value = ''
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  justCreated.value = false
  Object.assign(form, {
    brandId: row.brandId,
    model: row.model,
    yearOfManufacture: row.yearOfManufacture,
    licensePlate: row.licensePlate,
    color: row.color,
    type: row.type,
    transmission: row.transmission,
    fuelType: row.fuelType,
    seats: row.seats,
    doors: row.doors,
    luggages: row.luggages,
    pricePerDay: row.pricePerDay,
    mileAge: row.mileAge,
    description: row.description,
    status: row.status,
  })
  saveError.value = ''
  imageActionError.value = ''
  modalOpen.value = true
  loadGallery(row.id)
}

function closeModal() {
  modalOpen.value = false
  justCreated.value = false
}

async function onSave() {
  saving.value = true
  saveError.value = ''
  try {
    if (editing.value) {
      await api.put(`/vehicles/${editing.value.id}`, form)
      modalOpen.value = false
    } else {
      const { data } = await api.post('/vehicles', form)
      editing.value = data
      justCreated.value = true
      await loadGallery(data.id)
    }
    await loadVehicles()
  } catch (err) {
    saveError.value = err.response?.data?.message || t('vehicles.saveError')
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`${t('vehicles.confirmDelete')} ${row.brandName} ${row.model}?`)) return
  deletingId.value = row.id
  tableError.value = ''
  try {
    await api.delete(`/vehicles/${row.id}`)
    await loadVehicles()
  } catch (err) {
    tableError.value = err.response?.data?.message || t('vehicles.deleteError')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  loadVehicles()
  loadBrands()
})
</script>

<style scoped>
.input-field {
  width: 100%;
  border-radius: 0.75rem;
  border-width: 1px;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.input-field::placeholder {
  color: var(--color-text-secondary);
}
.input-field:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
}
.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.gallery-enter-active,
.gallery-leave-active {
  transition: all 0.25s ease;
}
.gallery-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.gallery-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
.gallery-move {
  transition: transform 0.25s ease;
}

@keyframes page-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-page-in {
  animation: page-in 0.3s ease-out;
}
</style>