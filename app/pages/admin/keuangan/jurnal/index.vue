<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { JournalEntry, JournalStatus, SourceType, AccountingPeriod } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganAccountingStore()
const router = useRouter()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const periodFilter = ref<string>('all')
const statusFilter = ref<string>('all')
const sourceTypeFilter = ref<string>('all')

const periods = ref<AccountingPeriod[]>([])

const sourceTypeOptions = [
  { label: 'Semua Sumber', value: 'all' },
  { label: 'Invoice Diterbitkan', value: 'invoice_issued' },
  { label: 'Pembayaran Terverifikasi', value: 'payment_verified' },
  { label: 'Invoice Dibatalkan', value: 'invoice_cancelled' },
  { label: 'Penyesuaian', value: 'adjustment' },
  { label: 'Penutupan', value: 'closing' },
  { label: 'Manual', value: 'manual' },
]

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Diposting', value: 'posted' },
  { label: 'Dibatalkan', value: 'cancelled' },
]

const periodOptions = computed(() => [
  { label: 'Semua Periode', value: 'all' },
  ...periods.value.map(p => ({ label: p.name, value: p.id })),
])

const sourceTypeLabels: Record<SourceType, string> = {
  invoice_issued: 'Invoice Diterbitkan',
  payment_verified: 'Pembayaran',
  invoice_cancelled: 'Invoice Dibatalkan',
  adjustment: 'Penyesuaian',
  closing: 'Penutupan',
  manual: 'Manual',
}

async function loadPeriods() {
  try {
    await store.fetchPeriods({ limit: 100 })
    periods.value = store.periods
  } catch {
    // ignore
  }
}

async function load() {
  try {
    await store.fetchJournalEntries({
      page: page.value,
      limit: limit.value,
      period_id: periodFilter.value === 'all' ? undefined : periodFilter.value,
      status: statusFilter.value === 'all' ? undefined : (statusFilter.value as JournalStatus),
      source_type: sourceTypeFilter.value === 'all' ? undefined : (sourceTypeFilter.value as SourceType),
    })
  } catch {
    // error in store
  }
}

onMounted(async () => {
  await loadPeriods()
  await load()
})

watch([page, limit, periodFilter, statusFilter, sourceTypeFilter], () => load())

const columns: TableColumn<JournalEntry>[] = [
  { accessorKey: 'journal_number', header: 'No. Jurnal' },
  { accessorKey: 'entry_date', header: 'Tanggal' },
  { accessorKey: 'description', header: 'Keterangan' },
  { accessorKey: 'source_type', header: 'Sumber' },
  { accessorKey: 'period', header: 'Periode' },
  { accessorKey: 'total_debit', header: 'Total Debit' },
  { accessorKey: 'total_credit', header: 'Total Kredit' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' },
]

const totalPages = computed(() => store.journalEntriesMeta?.total_pages ?? 1)
const totalItems = computed(() => store.journalEntriesMeta?.total ?? 0)

const cancelModalOpen = ref(false)
const selectedJournal = ref<JournalEntry | null>(null)

function formatDate(v: string) {
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v).replace('Rp', 'Rp ')
}

function rowActions(row: JournalEntry): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    {
      label: 'Lihat Detail',
      icon: 'i-lucide-eye',
      onSelect: () => router.push(`/admin/keuangan/jurnal/${row.id}`),
    },
  ]

  if (can('manage_journal') && row.status === 'posted' && row.source_type === 'manual') {
    items.push({ type: 'separator' })
    items.push({
      label: 'Batalkan',
      icon: 'i-lucide-x-circle',
      color: 'error',
      onSelect: () => {
        selectedJournal.value = row
        cancelModalOpen.value = true
      },
    })
  }

  return items
}

async function handleCancel() {
  if (!selectedJournal.value) return
  try {
    await store.cancelJournalEntry(selectedJournal.value.id)
    toast.add({ title: 'Jurnal berhasil dibatalkan', color: 'success' })
    cancelModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal membatalkan jurnal', description: store.error || undefined, color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Jurnal Umum</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Lihat dan kelola semua jurnal transaksi akuntansi.
        </p>
      </div>
      <UButton
        v-if="can('manage_journal')"
        icon="i-lucide-plus"
        @click="router.push('/admin/keuangan/jurnal/manual')"
      >
        Jurnal Manual
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <USelect
        v-model="periodFilter"
        :items="periodOptions"
        value-key="value"
        placeholder="Semua Periode"
        class="w-full sm:w-48"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        placeholder="Semua Status"
        class="w-full sm:w-48"
      />
      <USelect
        v-model="sourceTypeFilter"
        :items="sourceTypeOptions"
        value-key="value"
        placeholder="Semua Sumber"
        class="w-full sm:w-48"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.journalEntries"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #journal_number-cell="{ row }">
          <code class="text-sm font-medium">{{ row.original.journal_number }}</code>
        </template>

        <template #entry_date-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.entry_date) }}</span>
        </template>

        <template #description-cell="{ row }">
          <span class="line-clamp-1 text-sm text-gray-700 dark:text-gray-300">{{ row.original.description }}</span>
        </template>

        <template #source_type-cell="{ row }">
          <UBadge v-if="row.original.source_type" color="neutral" variant="subtle" size="xs">
            {{ sourceTypeLabels[row.original.source_type as SourceType] || row.original.source_type }}
          </UBadge>
          <span v-else class="text-xs text-gray-400">—</span>
        </template>

        <template #period-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.original.period?.name || '—' }}</span>
        </template>

        <template #total_debit-cell="{ row }">
          <KeuanganAmountDisplay :amount="row.original.total_debit" variant="debit" />
        </template>

        <template #total_credit-cell="{ row }">
          <KeuanganAmountDisplay :amount="row.original.total_credit" variant="credit" />
        </template>

        <template #status-cell="{ row }">
          <KeuanganStatusBadge :status="row.original.status" type="journal" size="sm" />
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} jurnal · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      />
    </div>

    <ConfirmActionModal
      v-model:open="cancelModalOpen"
      title="Batalkan Jurnal"
      message="Apakah Anda yakin ingin membatalkan jurnal ini? Tindakan ini akan membuat jurnal reversalan dan tidak dapat dibatalkan ulang."
      confirm-label="Batalkan"
      confirm-color="error"
      :loading="store.isSubmitting"
      @confirm="handleCancel"
    />
  </div>
</template>
