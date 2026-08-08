<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useKeuanganReportsStore } from '~/stores/keuanganReports'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import type { InvoiceSummary } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganReportsStore()
const keuanganStore = useKeuanganStore()
const { can } = usePermission()

const filterBillingPeriodId = ref('all')

const billingPeriodOptions = computed(() => [
  { label: 'Semua periode', value: 'all' },
  ...keuanganStore.billingPeriods.map((p) => ({ label: p.name, value: p.id })),
])

async function loadData() {
  try {
    await store.fetchSummary({
      billing_period_id: filterBillingPeriodId.value && filterBillingPeriodId.value !== 'all' ? filterBillingPeriodId.value : undefined,
    })
  } catch {
    // error handled in store
  }
}

onMounted(async () => {
  await Promise.all([keuanganStore.fetchBillingPeriods({ limit: 100 }), loadData()])
})

const columns: TableColumn<InvoiceSummary>[] = [
  { accessorKey: 'billing_period_name', header: 'Periode Tagihan' },
  { id: 'total_tagihan', header: 'Total Tagihan' },
  { id: 'total_terbayar', header: 'Total Terbayar' },
  { id: 'total_tunggakan', header: 'Total Tunggakan' },
  { id: 'jumlah_invoice', header: 'Jumlah Invoice' },
  { id: 'jumlah_lunas', header: 'Jumlah Lunas' },
  { id: 'jumlah_belum', header: 'Jumlah Belum' },
]

const totals = computed(() => {
  return store.summary.reduce(
    (acc, row) => {
      acc.total_tagihan += row.total_tagihan
      acc.total_terbayar += row.total_terbayar
      acc.total_tunggakan += row.total_tunggakan
      acc.jumlah_invoice += row.jumlah_invoice
      acc.jumlah_lunas += row.jumlah_lunas
      acc.jumlah_belum += row.jumlah_belum
      return acc
    },
    { total_tagihan: 0, total_terbayar: 0, total_tunggakan: 0, jumlah_invoice: 0, jumlah_lunas: 0, jumlah_belum: 0 },
  )
})

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan Rekap Tagihan & Pembayaran</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Ringkasan tagihan dan pembayaran per periode.</p>
      </div>

      <div class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Periode Tagihan</label>
          <USelect
            v-model="filterBillingPeriodId"
            :items="billingPeriodOptions"
            placeholder="Semua periode"
            class="w-52"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-search" @click="loadData">
          Tampilkan
        </UButton>
        <UButton color="neutral" variant="ghost" icon="i-lucide-printer" @click="window.print()">
          Cetak
        </UButton>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div v-if="store.isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
          <span class="ml-2 text-sm text-gray-500">Memuat data...</span>
        </div>

        <div v-else-if="store.summary.length === 0" class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-lucide-inbox" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="mt-2 text-sm text-gray-500">Belum ada data laporan.</p>
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <tr>
              <th class="px-4 py-3 font-bold">Periode Tagihan</th>
              <th class="px-4 py-3 text-right font-bold">Total Tagihan</th>
              <th class="px-4 py-3 text-right font-bold">Total Terbayar</th>
              <th class="px-4 py-3 text-right font-bold">Total Tunggakan</th>
              <th class="px-4 py-3 text-right font-bold">Jumlah Invoice</th>
              <th class="px-4 py-3 text-right font-bold">Jumlah Lunas</th>
              <th class="px-4 py-3 text-right font-bold">Jumlah Belum</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(row, idx) in store.summary" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ row.billing_period_name }}</td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="row.total_tagihan" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="row.total_terbayar" variant="credit" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="row.total_tunggakan" variant="debit" />
              </td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{{ row.jumlah_invoice }}</td>
              <td class="px-4 py-3 text-right text-green-600 dark:text-green-400">{{ row.jumlah_lunas }}</td>
              <td class="px-4 py-3 text-right text-red-600 dark:text-red-400">{{ row.jumlah_belum }}</td>
            </tr>
          </tbody>
          <tfoot class="border-t-2 border-gray-300 bg-gray-50 font-bold dark:border-gray-600 dark:bg-gray-800">
            <tr>
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100">TOTAL</td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="totals.total_tagihan" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="totals.total_terbayar" variant="credit" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="totals.total_tunggakan" variant="debit" />
              </td>
              <td class="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{{ totals.jumlah_invoice }}</td>
              <td class="px-4 py-3 text-right text-green-600 dark:text-green-400">{{ totals.jumlah_lunas }}</td>
              <td class="px-4 py-3 text-right text-red-600 dark:text-red-400">{{ totals.jumlah_belum }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gray-50 { background: white !important; }
}
</style>
