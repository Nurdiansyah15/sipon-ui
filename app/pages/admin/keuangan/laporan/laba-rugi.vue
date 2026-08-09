<script setup lang="ts">
import { useKeuanganReportsStore } from '~/stores/keuanganReports'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { IncomeStatementLine } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const reportsStore = useKeuanganReportsStore()
const accStore = useKeuanganAccountingStore()
const { can } = usePermission()
const { isDownloading, downloadPdf } = usePdfDownload()

const filterPeriodId = useQueryParamRef('period_id', '')

const periodItems = computed(() =>
  accStore.periods.map((p) => ({
    label: `${p.name} (${p.start_date} s/d ${p.end_date})`,
    value: p.id,
  })),
)

async function loadData() {
  if (!filterPeriodId.value) return
  try {
    await reportsStore.fetchIncomeStatement({ period_id: filterPeriodId.value })
  } catch {
    // error handled in store
  }
}

const isProfit = computed(() => {
  if (!reportsStore.incomeStatement) return true
  return reportsStore.incomeStatement.net_income >= 0
})

async function onDownloadPdf() {
  if (!filterPeriodId.value) return
  try {
    await downloadPdf(
      `/api/v1/web/keuangan/admin/reports/income-statement/pdf?period_id=${filterPeriodId.value}`,
      `laba-rugi-${filterPeriodId.value}.pdf`,
    )
  } catch {
    // handled in composable
  }
}

onMounted(async () => {
  try {
    await accStore.fetchPeriods({ limit: 100 })
    if (filterPeriodId.value) {
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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan Laba Rugi</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Pendapatan dan beban selama periode tertentu.</p>
      </div>

      <div class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
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
          :disabled="!filterPeriodId"
          @click="loadData"
        >
          Tampilkan
        </UButton>
        <UButton color="neutral" variant="ghost" icon="i-lucide-printer" @click="window.print()">
          Cetak
        </UButton>
        <UButton
          color="teal"
          variant="soft"
          icon="i-lucide-file-down"
          :disabled="!filterPeriodId"
          :loading="isDownloading"
          @click="onDownloadPdf"
        >
          Unduh PDF
        </UButton>
      </div>

      <div v-if="reportsStore.incomeStatement">
        <div v-if="reportsStore.isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
          <span class="ml-2 text-sm text-gray-500">Memuat data...</span>
        </div>

        <div v-else class="space-y-6">
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Periode</p>
            <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ reportsStore.incomeStatement.period_name }}</p>
          </div>

          <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                <tr>
                  <th class="px-4 py-3 font-bold">Kode</th>
                  <th class="px-4 py-3 font-bold">Nama Akun</th>
                  <th class="px-4 py-3 text-right font-bold">Jumlah</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr class="bg-green-50 dark:bg-green-900/20">
                  <td class="px-4 py-3 font-bold text-green-700 dark:text-green-300" colspan="2">PENDAPATAN</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="reportsStore.incomeStatement.total_revenue" variant="credit" />
                  </td>
                </tr>
                <tr v-if="reportsStore.incomeStatement.revenues.length === 0">
                  <td class="px-4 py-3 text-center text-gray-400" colspan="3">Tidak ada akun</td>
                </tr>
                <tr v-for="line in reportsStore.incomeStatement.revenues" :key="line.account_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ line.account_code }}</td>
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ line.account_name }}</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="line.amount" variant="credit" />
                  </td>
                </tr>

                <tr class="bg-red-50 dark:bg-red-900/20">
                  <td class="px-4 py-3 font-bold text-red-700 dark:text-red-300" colspan="2">BEBAN</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="reportsStore.incomeStatement.total_expense" variant="debit" />
                  </td>
                </tr>
                <tr v-if="reportsStore.incomeStatement.expenses.length === 0">
                  <td class="px-4 py-3 text-center text-gray-400" colspan="3">Tidak ada akun</td>
                </tr>
                <tr v-for="line in reportsStore.incomeStatement.expenses" :key="line.account_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ line.account_code }}</td>
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ line.account_name }}</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="line.amount" variant="debit" />
                  </td>
                </tr>
              </tbody>

              <tfoot class="border-t-2 border-gray-300 bg-gray-50 font-bold dark:border-gray-600 dark:bg-gray-800">
                <tr>
                  <td class="px-4 py-3" colspan="2">
                    <span class="text-gray-900 dark:text-gray-100">Laba (Rugi) Bersih</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span :class="isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-bold tabular-nums">
                      {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(reportsStore.incomeStatement.net_income).replace('Rp', 'Rp ') }}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div v-else-if="!reportsStore.isLoading" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
        <UIcon name="i-lucide-trending-up" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm text-gray-500">Pilih periode, lalu klik Tampilkan.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gray-50 { background: white !important; }
}
</style>
