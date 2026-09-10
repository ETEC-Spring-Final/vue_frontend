<template>
  <form class="rounded-2xl border border-[#E5E7EB] p-5" @submit.prevent="onSubmit">
    <p class="text-sm font-semibold text-[#1A2036]">{{ existingReview ? 'Edit your review' : 'Leave a review' }}</p>

    <div class="mt-3">
      <StarRating v-model="rating" editable />
    </div>

    <textarea
      v-model="comment"
      rows="3"
      placeholder="Share your experience with this vehicle…"
      class="mt-3 w-full rounded-2xl bg-[#F3F4F6] px-4 py-3 text-sm text-[#1A2036] placeholder:text-[#9CA3AF] outline-none"
    ></textarea>

    <p v-if="errorMessage" class="mt-2 text-sm text-red-600">{{ errorMessage }}</p>

    <div class="mt-3 flex gap-3">
      <button
        type="submit"
        :disabled="submitting || rating === 0"
        class="rounded-full bg-[#3D5FE0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3350C0] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ submitting ? 'Saving…' : existingReview ? 'Update review' : 'Submit review' }}
      </button>
      <button
        v-if="existingReview"
        type="button"
        class="rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#1A2036] hover:bg-[#F9FAFB]"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'
import reviewsApi from '@/services/reviews'

const props = defineProps({
  vehicleId: { type: [String, Number], required: true },
  existingReview: { type: Object, default: null },
})
const emit = defineEmits(['submitted', 'cancel'])

const rating = ref(props.existingReview?.rating ?? 0)
const comment = ref(props.existingReview?.comment ?? '')
const submitting = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  submitting.value = true
  errorMessage.value = ''
  try {
    // NOTE: confirm exact request field names (rating/comment vs
    // rating/text/description) against ReviewRequestDTO on the backend.
    const payload = { vehicleId: props.vehicleId, rating: rating.value, comment: comment.value }
    if (props.existingReview) {
      await reviewsApi.update(props.existingReview.id, payload)
    } else {
      await reviewsApi.create(payload)
    }
    emit('submitted')
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Could not save your review.'
  } finally {
    submitting.value = false
  }
}
</script>