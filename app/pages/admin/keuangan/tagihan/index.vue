<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { useKesantrianStore } from '~/stores/kesantrian'
import { usePermission } from '~/composables/usePermission'
import type { Invoice, InvoiceStatus } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const santriStore = useKesantrianStore()
const toast = useToast()
const { can } = usePermission()

const santriNameById = computed(() => {
  const map = new Map<string, string>()
  for (const s of santriStore.santriList) {
    map.set(s.id, s.fullname ? `${s.fullname}${s.nis ? ` (${s.nis})` : ''}` : s.nis ?? s.username)
  }
  return map
})

function santriLabel(santriId: string) {
  return santriNameById.value.get(santriId) ?? santriId
}

const matchedSantriId = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return undefined
  const match = santriStore.santriList.find((s) =>
    s.fullname?.toLowerCase().includes(q) || s.nis?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q),
  )
  return match?.id
})

const page = ref(1)
const limit = ref(10)
const search = ref('')
const statusFilter = ref<string>('all')
const periodeFilter = ref('')
const tahunAjaranFilter = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch([page, limit, statusFilter, periodeFilter, tahunAjaranFilter], () => load())

async function load() {
  try {
    await store.fetchInvoices({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value && statusFilter.value !== 'all' ? (statusFilter.value as InvoiceStatus) : undefined,
      periode: periodeFilter.value || undefined,
      tahun_ajaran: tahunAjaranFilter.value || undefined,
      santri_id: matchedSantriId.value,
    })
  } catch {
    /* error in store */
  }
}

onMounted(async () => {
  await Promise.all([load(), santriStore.fetchSantriList({ limit: 100 })])
})

const createInvoiceOpen = ref(false)
const cancelOpen = ref(false)
const cancelTargetId = ref('')
const isCancelling = ref(false)

function openCancel(row: Invoice) {
  cancelTargetId.value = row.id
  cancelOpen.value = true
}

async function confirmCancel() {
  isCancelling.value = true
  try {
    await store.cancelInvoice(cancelTargetId.value)
    toast.add({ title: 'Tagihan berhasil dibatalkan', color: 'success' })
    cancelOpen.value = false
    await load()
  } catch {
    toast.add({
      title: 'Gagal membatalkan tagihan',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isCancelling.value = false
  }
}

function rowActions(row: Invoice): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  items.push({
    label: 'Lihat Detail',
    icon: 'i-lucide-eye',
    onSelect: () => navigateTo(`/admin/keuangan/tagihan/${row.id}`),
  })
  if ((row.status === 'draft' || row.status === 'issued') && can('manage_keuangan')) {
    items.push({
      label: 'Batalkan',
      icon: 'i-lucide-x-circle',
      color: 'error',
      onSelect: () => openCancel(row),
    })
  }
  return items
}

const columns: TableColumn<Invoice>[] = [
  { accessorKey: 'invoice_number', header: 'No. Invoice' },
  { id: 'santri_id', header: 'Santri' },
  { accessorKey: 'fee_component', header: 'Komponen' },
  { accessorKey: 'periode', header: 'Periode' },
  { accessorKey: 'tahun_ajaran', header: 'Tahun Ajaran' },
  { accessorKey: 'amount', header: 'Jumlah' },
  { accessorKey: 'paid_amount', header: 'Terbayar' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'due_date', header: 'Jatuh Tempo' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.invoicesMeta?.total_pages ?? 1)
const totalItems = computed(() => store.invoicesMeta?.total ?? 0)

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

const statusOptions = [
  { label: 'Semua status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Diterbitkan', value: 'issued' },
  { label: 'Sebagian', value: 'partial' },
  { label: 'Lunas', value: 'paid' },
  { label: 'Kadaluarsa', value: 'expired' },
  { label: 'Dibatalkan', value: 'cancelled' },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Tagihan</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Kelola tagihan santri, buat tagihan individual atau massal.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="can('manage_keuangan')"
          color="neutral"
          variant="outline"
          icon="i-lucide-layers"
          @click="navigateTo('/admin/keuangan/tagihan/batch')"
        >
          Generate Massal
        </UButton>
        <UButton
          v-if="can('manage_keuangan')"
          icon="i-lucide-plus"
          class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          @click="createInvoiceOpen = true"
        >
          Buat Tagihan
        </UButton>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari santri…"
        class="w-full sm:w-80"
        :ui="{ base: 'bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500' }"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        class="w-44"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
      <UInput
        v-model="periodeFilter"
        placeholder="Periode"
        class="w-36"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800' }"
      />
      <UInput
        v-model="tahunAjaranFilter"
        placeholder="Tahun Ajaran"
        class="w-40"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800' }"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.invoices"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #invoice_number-cell="{ row }">
          <code class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.invoice_number }}</code>
        </template>

        <template #santri_id-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ santriLabel(row.original.santri_id) }}</span>
        </template>

        <template #fee_component-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.original.fee_component ? `${row.original.fee_component.code} - ${row.original.fee_component.name}` : '-' }}
          </span>
        </template>

        <template #amount-cell="{ row }">
          <span class="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {{ formatRupiah(row.original.amount) }}
          </span>
        </template>

        <template #paid_amount-cell="{ row }">
          <span class="text-sm tabular-nums text-gray-700 dark:text-gray-300">
            {{ formatRupiah(row.original.paid_amount) }}
          </span>
        </template>

        <template #status-cell="{ row }">
          <KeuanganStatusBadge :status="row.original.status" type="invoice" size="sm" />
        </template>

        <template #due_date-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">{{ formatDate(row.original.due_date) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} tagihan · hal. {{ page }} / {{ totalPages }}
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

    <AdminKeuanganAdminInvoiceFormModal
      v-model:open="createInvoiceOpen"
      @success="load"
    />

    <AdminConfirmActionModal
      v-model:open="cancelOpen"
      title="Batalkan Tagihan"
      description="Tagihan yang dibatalkan tidak dapat dipulihkan. Lanjutkan?"
      confirm-label="Batalkan"
      color="error"
      :loading="isCancelling"
      @confirm="confirmCancel"
    />
  </div>
</template>
