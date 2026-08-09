<script setup lang="ts">
import { useKeuanganReportsStore } from '~/stores/keuanganReports'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { BalanceSheetLine } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const reportsStore = useKeuanganReportsStore()
const accStore = useKeuanganAccountingStore()
const { can } = usePermission()
const { isDownloading, downloadPdf } = usePdfDownload()

const filterPeriodId = useQueryParamRef('period_id', '')
const filterAsOfDate = useQueryParamRef('as_of_date', '')

const periodItems = computed(() =>
  accStore.periods.map((p) => ({
    label: `${p.name} (${p.start_date} s/d ${p.end_date})`,
    value: p.id,
  })),
)

const selectedPeriod = computed(() =>
  accStore.periods.find((p) => p.id === filterPeriodId.value),
)

function effectiveAsOfDate() {
  if (filterAsOfDate.value) return filterAsOfDate.value
  if (selectedPeriod.value) return selectedPeriod.value.end_date
  return ''
}

async function loadData() {
  const asOf = effectiveAsOfDate()
  if (!asOf) return
  try {
    await reportsStore.fetchBalanceSheet({ as_of_date: asOf })
  } catch {
    // error handled in store
  }
}

async function onDownloadPdf() {
  const asOf = effectiveAsOfDate()
  if (!asOf) return
  try {
    await downloadPdf(
      `/api/v1/web/keuangan/admin/reports/balance-sheet/pdf?as_of_date=${encodeURIComponent(asOf)}`,
      `neraca-${asOf}.pdf`,
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
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

onMounted(async () => {
  try {
    await accStore.fetchPeriods({ limit: 100 })
    if (filterPeriodId.value || filterAsOfDate.value) {
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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan Neraca (Balance Sheet)</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Posisi keuangan perusahaan pada tanggal tertentu.</p>
      </div>

      <div class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="w-72">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Periode</label>
          <USelect
            v-model="filterPeriodId"
            :items="periodItems"
            placeholder="Pilih periode"
            class="w-full"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Per Tanggal</label>
          <UInput
            v-model="filterAsOfDate"
            type="date"
            class="w-48"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800' }"
          />
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-search"
          :disabled="!effectiveAsOfDate()"
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
          :disabled="!effectiveAsOfDate()"
          :loading="isDownloading"
          @click="onDownloadPdf"
        >
          Unduh PDF
        </UButton>
      </div>

      <div v-if="reportsStore.balanceSheet">
        <div v-if="reportsStore.isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
          <span class="ml-2 text-sm text-gray-500">Memuat data...</span>
        </div>

        <div v-else class="space-y-6">
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Per tanggal</p>
            <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ formatDate(reportsStore.balanceSheet.as_of_date) }}</p>
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
                <tr class="bg-teal-50 dark:bg-teal-900/20">
                  <td class="px-4 py-3 font-bold text-teal-700 dark:text-teal-300" colspan="2">ASET</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="reportsStore.balanceSheet.total_assets" />
                  </td>
                </tr>
                <tr v-if="reportsStore.balanceSheet.assets.length === 0">
                  <td class="px-4 py-3 text-center text-gray-400" colspan="3">Tidak ada akun</td>
                </tr>
                <tr v-for="line in reportsStore.balanceSheet.assets" :key="line.account_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ line.account_code }}</td>
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ line.account_name }}</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="line.amount" />
                  </td>
                </tr>

                <tr class="bg-orange-50 dark:bg-orange-900/20">
                  <td class="px-4 py-3 font-bold text-orange-700 dark:text-orange-300" colspan="2">KEWAJIBAN</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="reportsStore.balanceSheet.total_liabilities" />
                  </td>
                </tr>
                <tr v-if="reportsStore.balanceSheet.liabilities.length === 0">
                  <td class="px-4 py-3 text-center text-gray-400" colspan="3">Tidak ada akun</td>
                </tr>
                <tr v-for="line in reportsStore.balanceSheet.liabilities" :key="line.account_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ line.account_code }}</td>
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ line.account_name }}</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="line.amount" />
                  </td>
                </tr>

                <tr class="bg-blue-50 dark:bg-blue-900/20">
                  <td class="px-4 py-3 font-bold text-blue-700 dark:text-blue-300" colspan="2">EKUITAS</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="reportsStore.balanceSheet.total_equities" />
                  </td>
                </tr>
                <tr v-if="reportsStore.balanceSheet.equities.length === 0">
                  <td class="px-4 py-3 text-center text-gray-400" colspan="3">Tidak ada akun</td>
                </tr>
                <tr v-for="line in reportsStore.balanceSheet.equities" :key="line.account_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ line.account_code }}</td>
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ line.account_name }}</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="line.amount" />
                  </td>
                </tr>
              </tbody>

              <tfoot class="border-t-2 border-gray-300 bg-gray-50 font-bold dark:border-gray-600 dark:bg-gray-800">
                <tr>
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-100" colspan="2">Total Kewajiban + Ekuitas</td>
                  <td class="px-4 py-3 text-right">
                    <KeuanganAmountDisplay :amount="reportsStore.balanceSheet.total_liabilities + reportsStore.balanceSheet.total_equities" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div v-else-if="!reportsStore.isLoading" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
        <UIcon name="i-lucide-file-bar-chart" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm text-gray-500">Pilih periode atau tanggal, lalu klik Tampilkan.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gray-50 { background: white !important; }
}
</style>
