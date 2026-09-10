<template>
  <div class="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-[#F9FAFB]">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-semibold uppercase text-[#9CA3AF]"
            >
              {{ col.label }}
            </th>
            <th v-if="$slots.actions" class="px-4 py-3 text-right text-xs font-semibold uppercase text-[#9CA3AF]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + 1" class="px-4 py-8 text-center text-[#9CA3AF]">Loading…</td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length + 1" class="px-4 py-8 text-center text-[#9CA3AF]">No records found.</td>
          </tr>
          <tr v-for="row in rows" :key="row.id" class="border-t border-[#E5E7EB] hover:bg-[#F9FAFB]">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-[#1A2036]">
              <slot :name="`cell-${col.key}`" :row="row">{{ resolve(row, col.key) }}</slot>
            </td>
            <td v-if="$slots.actions" class="px-4 py-3 text-right">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true }, // [{ key: 'name', label: 'Name' }]
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

function resolve(row, key) {
  return key.split('.').reduce((acc, part) => acc?.[part], row) ?? '—'
}
</script>