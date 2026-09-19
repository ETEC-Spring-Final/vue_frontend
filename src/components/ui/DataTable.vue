<template>
  <div>
    <!-- Desktop / tablet table -->
    <div
      class="hidden overflow-hidden rounded-2xl border sm:block"
      style="border-color: var(--color-border); background-color: var(--color-surface);"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead style="background-color: var(--color-bg);">
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style="color: var(--color-text-secondary);"
              >
                {{ col.label }}
              </th>
              <th
                v-if="$slots.actions"
                class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                style="color: var(--color-text-secondary);"
              >
                {{ $t('table.actions') }}
              </th>
            </tr>
          </thead>
          <TransitionGroup tag="tbody" name="row">
            <tr v-if="loading" key="__loading">
              <td :colspan="columns.length + 1" class="px-4 py-10 text-center" style="color: var(--color-text-secondary);">
                <span class="inline-flex items-center gap-2">
                  <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a10 10 0 100 20" stroke-linecap="round" />
                  </svg>
                  {{ $t('table.loading') }}
                </span>
              </td>
            </tr>
            <tr v-else-if="rows.length === 0" key="__empty">
              <td :colspan="columns.length + 1" class="px-4 py-10 text-center" style="color: var(--color-text-secondary);">
                {{ $t('table.empty') }}
              </td>
            </tr>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-t transition-colors duration-150"
              :style="{
                borderColor: 'var(--color-border)',
                backgroundColor: hoverId === row.id ? 'var(--color-bg)' : 'transparent',
              }"
              @mouseenter="hoverId = row.id"
              @mouseleave="hoverId = null"
            >
              <td v-for="col in columns" :key="col.key" class="px-4 py-3" style="color: var(--color-text);">
                <slot :name="`cell-${col.key}`" :row="row">{{ resolve(row, col.key) }}</slot>
              </td>
              <td v-if="$slots.actions" class="px-4 py-3 text-right">
                <slot name="actions" :row="row" />
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>
    </div>

    <!-- Mobile card list -->
    <div class="space-y-3 sm:hidden">
      <div
        v-if="loading"
        class="rounded-2xl border p-8 text-center text-sm"
        style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text-secondary);"
      >
        {{ $t('table.loading') }}
      </div>
      <div
        v-else-if="rows.length === 0"
        class="rounded-2xl border p-8 text-center text-sm"
        style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text-secondary);"
      >
        {{ $t('table.empty') }}
      </div>
      <TransitionGroup name="row">
        <div
          v-for="row in rows"
          :key="row.id"
          class="rounded-2xl border p-4 shadow-sm transition-transform duration-200 active:scale-[0.98]"
          style="border-color: var(--color-border); background-color: var(--color-surface);"
        >
          <div v-for="col in columns" :key="col.key" class="flex items-center justify-between gap-3 py-1 text-sm">
            <span class="text-xs font-semibold uppercase tracking-wide" style="color: var(--color-text-secondary);">
              {{ col.label }}
            </span>
            <span style="color: var(--color-text);">
              <slot :name="`cell-${col.key}`" :row="row">{{ resolve(row, col.key) }}</slot>
            </span>
          </div>
          <div v-if="$slots.actions" class="mt-3 flex justify-end gap-3 border-t pt-3" style="border-color: var(--color-border);">
            <slot name="actions" :row="row" />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  columns: { type: Array, required: true }, // [{ key: 'name', label: 'Name' }]
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const hoverId = ref(null)

function resolve(row, key) {
  return key.split('.').reduce((acc, part) => acc?.[part], row) ?? '—'
}
</script>

<style scoped>
.row-enter-active,
.row-leave-active {
  transition: all 0.25s ease;
}
.row-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.row-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.row-move {
  transition: transform 0.25s ease;
}
</style>