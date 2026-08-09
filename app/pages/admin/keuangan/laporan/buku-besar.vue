<script setup lang="ts">
import { useKeuanganReportsStore } from '~/stores/keuanganReports'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { LedgerLine } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const reportsStore = useKeuanganReportsStore()
const accStore = useKeuanganAccountingStore()
const { can } = usePermission()
const { isDownloading, downloadPdf } = usePdfDownload()

const filterAccountId = useQueryParamRef<string | null>('account_id', null)
const filterPeriodId = useQueryParamRef('period_id', '')

const accountItems = computed(() =>
  accStore.accounts.map((a) => ({
    label: `${a.code} - ${a.name}`,
    value: a.id,
  })),
)

const periodItems = computed(() =>
  accStore.periods.map((p) => ({
    label: `${p.name} (${p.start_date} s/d ${p.end_date})`,
    value: p.id,
  })),
)

async function loadData() {
  if (!filterAccountId.value || !filterPeriodId.value) return

  try {
    await reportsStore.fetchLedger({
      account_id: filterAccountId.value,
      period_id: filterPeriodId.value,
    })
  } catch {
    // error handled in store
  }
}

function canSubmit() {
  return !!filterAccountId.value && !!filterPeriodId.value
}

async function onDownloadPdf() {
  if (!canSubmit()) return
  try {
    await downloadPdf(
      `/api/v1/web/keuangan/admin/reports/ledger/pdf?account_id=${filterAccountId.value}&period_id=${filterPeriodId.value}`,
      `buku-besar-${filterAccountId.value}.pdf`,
    )
  } catch {
    // handled in composable
  }
}

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

const openingBalance = computed(() => {
  if (!reportsStore.ledger || reportsStore.ledger.lines.length === 0) return 0
  return 0
})

const closingBalance = computed(() => {
  if (!reportsStore.ledger || reportsStore.ledger.lines.length === 0) return 0
  const lines = reportsStore.ledger.lines
  return lines[lines.length - 1].balance
})

onMounted(async () => {
  try {
    await Promise.all([
      accStore.fetchAccounts({ is_active: true, limit: 1000 }),
      accStore.fetchPeriods({ limit: 100 }),
    ])
    if (filterAccountId.value && filterPeriodId.value) {
      await loadData()
    }
  } catch {
    // error handled in store
  }
})
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan Buku Besar</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Rincian transaksi per akun dalam suatu periode.</p>
      </div>

      <div class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="w-72">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Akun <span class="text-red-500">*</span></label>
          <KeuanganAccountPicker v-model="filterAccountId" placeholder="Pilih akun" />
        </div>
        <div class="w-72">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Periode <span class="text-red-500">*</span></label>
          <USelect
            v-model="filterPeriodId"
            :items="periodItems"
            placeholder="Pilih periode"
            class="w-full"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-search"
          :disabled="!canSubmit()"
          @click="loadData"
        >
          Tampilkan
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-printer"
          @click="window.print()"
        >
          Cetak
        </UButton>
        <UButton
          color="teal"
          variant="soft"
          icon="i-lucide-file-down"
          :disabled="!canSubmit()"
          :loading="isDownloading"
          @click="onDownloadPdf"
        >
          Unduh PDF
        </UButton>
      </div>

      <div v-if="reportsStore.ledger" class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div class="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div class="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Kode:</span>
              <span class="ml-1 font-semibold text-gray-900 dark:text-gray-100">{{ reportsStore.ledger.account_code }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Nama:</span>
              <span class="ml-1 font-semibold text-gray-900 dark:text-gray-100">{{ reportsStore.ledger.account_name }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Tipe:</span>
              <UBadge color="neutral" variant="subtle" size="sm">{{ reportsStore.ledger.account_type }}</UBadge>
            </div>
          </div>
        </div>

        <div v-if="reportsStore.isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
          <span class="ml-2 text-sm text-gray-500">Memuat data...</span>
        </div>

        <div v-else-if="reportsStore.ledger.lines.length === 0" class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-lucide-inbox" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="mt-2 text-sm text-gray-500">Tidak ada transaksi pada periode ini.</p>
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <tr>
              <th class="px-4 py-3 font-bold">Tanggal</th>
              <th class="px-4 py-3 font-bold">No. Jurnal</th>
              <th class="px-4 py-3 font-bold">Keterangan</th>
              <th class="px-4 py-3 text-right font-bold">Debit</th>
              <th class="px-4 py-3 text-right font-bold">Kredit</th>
              <th class="px-4 py-3 text-right font-bold">Saldo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr class="bg-gray-50 dark:bg-gray-800/50">
              <td class="px-4 py-3" colspan="5">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Awal</span>
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="openingBalance" />
              </td>
            </tr>
            <tr v-for="(line, idx) in reportsStore.ledger.lines" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ formatDate(line.date) }}</td>
              <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ line.journal_number }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ line.description }}</td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay v-if="line.debit > 0" :amount="line.debit" variant="debit" />
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay v-if="line.credit > 0" :amount="line.credit" variant="credit" />
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="line.balance" />
              </td>
            </tr>
          </tbody>
          <tfoot class="border-t-2 border-gray-300 bg-gray-50 font-bold dark:border-gray-600 dark:bg-gray-800">
            <tr>
              <td class="px-4 py-3" colspan="5">
                <span class="text-gray-900 dark:text-gray-100">Saldo Akhir</span>
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="closingBalance" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-else-if="!reportsStore.isLoading" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
        <UIcon name="i-lucide-book-open" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm text-gray-500">Pilih akun dan periode, lalu klik Tampilkan.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gray-50 { background: white !important; }
}
</style>
