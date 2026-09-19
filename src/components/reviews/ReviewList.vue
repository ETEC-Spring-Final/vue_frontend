<template>
  <div>
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ t('reviews.title') }}</h2>
      <button
        v-if="!showForm && !myReview"
        type="button"
        class="text-sm font-semibold transition-opacity hover:opacity-70"
        :style="{ color: 'var(--color-primary)' }"
        @click="showForm = true"
      >
        {{ t('reviews.write') }}
      </button>
    </div>

    <ReviewForm
      v-if="showForm || editingReview"
      :vehicle-id="vehicleId"
      :existing-review="editingReview"
      class="mt-4"
      @submitted="onSubmitted"
      @cancel="editingReview = null; showForm = false"
    />

    <div v-if="loading" class="mt-4 space-y-3">
      <div v-for="i in 2" :key="i" class="h-20 animate-pulse rounded-2xl bg-[var(--color-border)]"></div>
    </div>

    <div v-else-if="reviews.length === 0" class="mt-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ t('reviews.empty') }}</div>

    <div v-else class="mt-4 space-y-4">
      <article v-for="review in reviews" :key="review.id" class="rounded-2xl border border-[var(--color-border)] p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold" :style="{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }">
              {{ initials(review.userName || review.email) }}
            </div>
            <div>
              <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ review.userName || t('reviews.anonymous') }}</p>
              <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ formatDate(review.createdAt) }}</p>
            </div>
          </div>
          <StarRating :model-value="review.rating" />
        </div>
        <p class="mt-2 text-sm" :style="{ color: 'var(--color-text)' }">{{ review.comment }}</p>

        <div v-if="isMine(review)" class="mt-2 flex gap-3 text-xs font-semibold">
          <button class="transition-opacity hover:opacity-70" :style="{ color: 'var(--color-primary)' }" @click="editingReview = review; showForm = false">{{ t('reviews.edit') }}</button>
          <button class="text-red-600 hover:text-red-700 dark:text-red-400" @click="onDelete(review)">{{ t('reviews.delete') }}</button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StarRating from './StarRating.vue'
import ReviewForm from './ReviewForm.vue'
import reviewsApi from '@/services/reviews'
import useAuthStore from '@/stores/auth.store'

const { t } = useI18n()
const props = defineProps({ vehicleId: { type: [String, Number], required: true } })

const { user } = useAuthStore()
const reviews = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingReview = ref(null)

const myReview = computed(() => reviews.value.find((r) => isMine(r)))

function isMine(review) {
  return user?.id && review.userId === user.id
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadReviews() {
  loading.value = true
  try {
    const { data } = await reviewsApi.forVehicle(props.vehicleId)
    reviews.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

function onSubmitted() {
  showForm.value = false
  editingReview.value = null
  loadReviews()
}

async function onDelete(review) {
  if (!confirm(t('reviews.deleteConfirm'))) return
  await reviewsApi.remove(review.id)
  loadReviews()
}

onMounted(loadReviews)
</script>