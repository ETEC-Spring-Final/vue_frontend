<template>
  <form class="rounded-2xl border border-[var(--color-border)] p-5" @submit.prevent="onSubmit">
    <p class="text-sm font-semibold" :style="{ color: 'var(--color-text)' }">{{ existingReview ? t('reviews.editTitle') : t('reviews.leaveTitle') }}</p>

    <div class="mt-3">
      <StarRating v-model="rating" editable />
      <p v-if="rating === 0" class="mt-1.5 text-xs" :style="{ color: 'var(--color-text-secondary)' }">
        {{ t('reviews.pickRating', 'Tap a star to rate') }}
      </p>
    </div>

    <textarea
      v-model="comment"
      rows="3"
      :placeholder="t('reviews.placeholder')"
      class="mt-3 w-full rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
      :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
    ></textarea>

    <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>

    <div class="mt-3 flex gap-3">
      <button
        type="submit"
        :disabled="submitting || rating === 0"
        class="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        :style="{ backgroundColor: 'var(--color-primary)' }"
      >
        {{ submitting ? t('reviews.saving') : existingReview ? t('reviews.update') : t('reviews.submit') }}
      </button>
      <button
        v-if="existingReview"
        type="button"
        class="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
        :style="{ color: 'var(--color-text)' }"
        @click="$emit('cancel')"
      >
        {{ t('reviews.cancel') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StarRating from './StarRating.vue'
import reviewsApi from '@/services/reviews'
import { getMyRentals } from '@/services/rentals'

const { t } = useI18n()
const props = defineProps({
  vehicleId: { type: [String, Number], required: true },
  existingReview: { type: Object, default: null },
})
const emit = defineEmits(['submitted', 'cancel'])

const rating = ref(props.existingReview?.rating ?? 0)
const comment = ref(props.existingReview?.comment ?? '')
const submitting = ref(false)
const errorMessage = ref('')

// Find a COMPLETED/RETURNED rental of this vehicle belonging to the current
// user — that's the rentalId the backend requires (see ReviewServiceImpl.createReview).
async function findReviewableRentalId() {
  const rentals = await getMyRentals()
  const match = rentals.find(
    (r) =>
      Number(r.vehicleId) === Number(props.vehicleId) &&
      (r.status === 'COMPLETED' || r.status === 'RETURNED')
  )
  return match?.id ?? null
}

async function onSubmit() {
  submitting.value = true
  errorMessage.value = ''
  try {
    if (props.existingReview) {
      await reviewsApi.update(props.existingReview.id, {
        rating: rating.value,
        comment: comment.value,
      })
    } else {
      const rentalId = await findReviewableRentalId()
      if (!rentalId) {
        errorMessage.value = t(
          'reviews.noCompletedRental',
          'You can only review a vehicle after completing a rental for it.'
        )
        return
      }
      await reviewsApi.create({ rentalId, rating: rating.value, comment: comment.value })
    }
    emit('submitted')
  } catch (err) {
    errorMessage.value = err.response?.data?.message || t('reviews.saveError')
  } finally {
    submitting.value = false
  }
}
</script>