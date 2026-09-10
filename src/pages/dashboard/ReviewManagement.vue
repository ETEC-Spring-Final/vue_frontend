<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ totalElements }} reviews</p>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="reviews" :loading="loading">
      <template #cell-rating="{ row }">
        <StarRating :model-value="row.rating" />
      </template>
      <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <button class="text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <div class="mt-4 flex items-center justify-between text-sm text-[#6B7280]">
      <button
        class="rounded-full border border-[#E5E7EB] px-3 py-1.5 disabled:opacity-40"
        :disabled="page === 0"
        @click="page--"
      >Previous</button>
      <span>Page {{ page + 1 }} of {{ totalPages || 1 }}</span>
      <button
        class="rounded-full border border-[#E5E7EB] px-3 py-1.5 disabled:opacity-40"
        :disabled="page + 1 >= totalPages"
        @click="page++"
      >Next</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import StarRating from '@/components/reviews/StarRating.vue'
import api from '@/services/api'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'userName', label: 'Customer' },
  { key: 'vehicleId', label: 'Vehicle ID' },
  { key: 'rating', label: 'Rating' },
  { key: 'comment', label: 'Comment' },
  { key: 'createdAt', label: 'Date' },
]

const reviews = ref([])
const loading = ref(true)
const page = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

async function loadReviews() {
  loading.value = true
  try {
    const { data } = await api.get('/reviews', { params: { page: page.value, size: 8 } })
    reviews.value = data?.content ?? []
    totalPages.value = data?.totalPages ?? 0
    totalElements.value = data?.totalElements ?? reviews.value.length
  } finally {
    loading.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`Delete this review by ${row.userName}?`)) return
  await api.delete(`/reviews/${row.id}`)
  loadReviews()
}

watch(page, loadReviews)
onMounted(loadReviews)
</script>