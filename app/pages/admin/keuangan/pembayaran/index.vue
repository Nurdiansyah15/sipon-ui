<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import type { Payment, PaymentStatus } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('all')
const invoiceSearch = ref('')

watch([page, limit, statusFilter], () => load())

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(invoiceSearch, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})

async function load() {
  try {
    await store.fetchPayments({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value && statusFilter.value !== 'all' ? (statusFilter.value as PaymentStatus) : undefined,
      invoice_id: invoiceSearch.value || undefined,
    })
  } catch {
    /* error in store */
  }
}

onMounted(load)

const verificationOpen = ref(false)
const verificationTarget = ref<any>(null)

function openVerification(row: Payment) {
  verificationTarget.value = {
    id: row.id,
    payment_number: row.payment_number,
    amount: row.amount,
    status: row.status,
    invoice_number: row.invoice?.invoice_number ?? undefined,
  }
  verificationOpen.value = true
}

async function handleDownloadReceipt(id: string) {
  try {
    const res = await store.downloadReceipt(id)
    const blob = new Blob([res as any])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kwitansi-${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch {
    toast.add({
      title: 'Gagal mengunduh kwitansi',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

async function handleViewProof(id: string) {
  try {
    const res = await store.getPaymentProofURL(id)
    window.open(res.url, '_blank')
  } catch {
    toast.add({
      title: 'Gagal memuat bukti transfer',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

function rowActions(row: Payment): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  items.push({
    label: 'Lihat Detail',
    icon: 'i-lucide-eye',
    onSelect: () => navigateTo(`/admin/keuangan/pembayaran/${row.id}`),
  })
  if (row.proof_key) {
    items.push({
      label: 'Lihat Bukti Transfer',
      icon: 'i-lucide-image',
      onSelect: () => handleViewProof(row.id),
    })
  }
  if (row.status === 'pending' && can('manage_keuangan')) {
    items.push({
      label: 'Verifikasi / Tolak',
      icon: 'i-lucide-shield-check',
      onSelect: () => openVerification(row),
    })
  }
  if (row.status === 'verified') {
    items.push({
      label: 'Unduh Kwitansi',
      icon: 'i-lucide-download',
      onSelect: () => handleDownloadReceipt(row.id),
    })
  }
  return items
}

const columns: TableColumn<Payment>[] = [
  { accessorKey: 'payment_number', header: 'No. Pembayaran' },
  { accessorKey: 'invoice', header: 'No. Invoice' },
  { accessorKey: 'amount', header: 'Jumlah' },
  { accessorKey: 'method', header: 'Metode' },
  { accessorKey: 'payment_date', header: 'Tanggal' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.paymentsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.paymentsMeta?.total ?? 0)

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}

const methodLabels: Record<string, string> = {
  transfer: 'Transfer',
  cash: 'Tunai',
  check: 'Cek',
}

const statusOptions = [
  { label: 'Semua status', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Terverifikasi', value: 'verified' },
  { label: 'Ditolak', value: 'rejected' },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Pembayaran</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Kelola pembayaran santri, verifikasi, dan unduh kwitansi.</p>
      </div>
      <UButton
        v-if="can('manage_keuangan')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="navigateTo('/admin/keuangan/pembayaran/manual')"
      >
        Input Pembayaran
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UInput
        v-model="invoiceSearch"
        icon="i-lucide-filter"
        placeholder="Filter berdasarkan ID Invoice (persis)"
        class="w-full sm:w-80"
        :ui="{ base: 'bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500' }"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        class="w-44"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.payments"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #payment_number-cell="{ row }">
          <code class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.payment_number }}</code>
        </template>

        <template #invoice-cell="{ row }">
          <code v-if="row.original.invoice" class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.original.invoice.invoice_number }}
          </code>
          <span v-else class="text-xs text-gray-400">{{ row.original.invoice_id }}</span>
        </template>

        <template #amount-cell="{ row }">
          <span class="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {{ formatRupiah(row.original.amount) }}
          </span>
        </template>

        <template #method-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ methodLabels[row.original.method] || row.original.method }}</span>
        </template>

        <template #payment_date-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">{{ formatDate(row.original.payment_date) }}</span>
        </template>

        <template #status-cell="{ row }">
          <KeuanganStatusBadge :status="row.original.status" type="payment" size="sm" />
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} pembayaran · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      >
        <template #item="{ item, page: curPage }">
          <UButton
            :color="curPage === item.value ? 'teal' : 'neutral'"
            :variant="curPage === item.value ? 'solid' : 'outline'"
            :label="String(item.value)"
            size="sm"
            :class="curPage === item.value ? 'bg-teal-600 text-white dark:bg-teal-500' : ''"
          />
        </template>
      </UPagination>
    </div>

    <AdminKeuanganAdminPaymentVerificationModal
      v-model:open="verificationOpen"
      :payment="verificationTarget"
      @verified="load"
      @rejected="load"
    />
  </div>
</template>
