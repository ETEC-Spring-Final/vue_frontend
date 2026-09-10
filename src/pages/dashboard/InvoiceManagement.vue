    <template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-sm text-[#6B7280]">{{ invoices.length }} invoices</p>
    </div>

    <DataTable class="mt-4" :columns="columns" :rows="invoices" :loading="loading">
      <template #cell-issueDate="{ row }">{{ formatDate(row.issueDate) }}</template>
      <template #cell-dueDate="{ row }">{{ formatDate(row.dueDate) }}</template>
      <template #cell-totalAmount="{ row }">${{ Number(row.totalAmount ?? 0).toFixed(2) }}</template>
      <template #cell-status="{ row }">
        <span :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #actions="{ row }">
        <select
          class="rounded-lg border border-[#E5E7EB] px-2 py-1 text-xs"
          :value="row.status"
          @change="onStatusChange(row, $event.target.value)"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <button class="ml-3 text-xs font-semibold text-red-600 hover:text-red-700" @click="onDelete(row)">Delete</button>
      </template>
    </DataTable>

    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import api from '@/services/api'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'rentalId', label: 'Rental ID' },
  { key: 'issueDate', label: 'Issued' },
  { key: 'dueDate', label: 'Due' },
  { key: 'totalAmount', label: 'Total' },
  { key: 'status', label: 'Status' },
]

const statusOptions = ['UNPAID', 'PAID', 'CANCELLED']

const invoices = ref([])
const loading = ref(true)
const actionError = ref('')

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function statusClass(status) {
  const base = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold'
  const map = {
    UNPAID: 'bg-amber-100 text-amber-700',
    PAID: 'bg-green-50 text-green-600',
    CANCELLED: 'bg-red-50 text-red-600',
  }
  return `${base} ${map[status] || 'bg-[#F3F4F6] text-[#6B7280]'}`
}

async function loadInvoices() {
  loading.value = true
  try {
    const { data } = await api.get('/invoices')
    invoices.value = Array.isArray(data) ? data : data?.content ?? []
  } finally {
    loading.value = false
  }
}

// No PATCH /status endpoint — InvoiceController only has PUT (full update),
// so we send the existing fields back with just `status` changed.
async function onStatusChange(row, newStatus) {
  actionError.value = ''
  try {
    await api.put(`/invoices/${row.id}`, {
      rentalId: row.rentalId,
      invoiceNumber: row.invoiceNumber,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      subtotal: row.subtotal,
      discountAmount: row.discountAmount,
      taxAmount: row.taxAmount,
      lateFee: row.lateFee,
      totalAmount: row.totalAmount,
      status: newStatus,
    })
    await loadInvoices()
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Could not update status.'
  }
}

async function onDelete(row) {
  if (!confirm(`Delete invoice ${row.invoiceNumber}?`)) return
  await api.delete(`/invoices/${row.id}`)
  loadInvoices()
}

onMounted(loadInvoices)
</script>