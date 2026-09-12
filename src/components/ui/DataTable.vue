<template>
  <div class="overflow-hidden rounded-2xl border" style="border-color: var(--color-border); background-color: var(--color-surface);">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead style="background-color: var(--color-bg);">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-semibold uppercase"
              style="color: var(--color-text-secondary);"
            >
              {{ col.label }}
            </th>
            <th
              v-if="$slots.actions"
              class="px-4 py-3 text-right text-xs font-semibold uppercase"
              style="color: var(--color-text-secondary);"
            >
              {{ $t('table.actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + 1" class="px-4 py-8 text-center" style="color: var(--color-text-secondary);">
              {{ $t('table.loading') }}
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length + 1" class="px-4 py-8 text-center" style="color: var(--color-text-secondary);">
              {{ $t('table.empty') }}
            </td>
          </tr>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-t transition hover:opacity-90"
            style="border-color: var(--color-border);"
          >
            <td v-for="col in columns" :key="col.key" class="px-4 py-3" style="color: var(--color-text);">
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